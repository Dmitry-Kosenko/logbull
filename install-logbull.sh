#!/bin/bash
set -euo pipefail

# Check if script is run as root
if [ "$(id -u)" -ne 0 ]; then
    echo "Error: This script must be run as root (sudo ./install-logbull.sh)" >&2
    exit 1
fi

# Set up logging and install paths
LOG_FILE="/var/log/logbull-install.log"
INSTALL_DIR="/opt/logbull"
APP_DIR="$INSTALL_DIR/app"
DATA_DIR="$INSTALL_DIR/logbull-data"
REPO_URL="${REPO_URL:-https://github.com/Dmitry-Kosenko/logbull.git}"
REPO_BRANCH="${REPO_BRANCH:-main}"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Create log file if it does not exist
touch "$LOG_FILE"
log "Starting Log Bull installation..."

# Create installation directories
log "Creating installation directory..."
if [ ! -d "$INSTALL_DIR" ]; then
    mkdir -p "$INSTALL_DIR"
    log "Created directory: $INSTALL_DIR"
else
    log "Directory already exists: $INSTALL_DIR"
fi
mkdir -p "$DATA_DIR"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    log "Docker not found. Installing Docker..."

    apt-get update
    apt-get remove -y docker docker-engine docker.io containerd runc
    apt-get install -y ca-certificates curl gnupg lsb-release
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    log "Docker installed successfully"
else
    log "Docker already installed"
fi

# Check if docker compose is installed
if ! docker compose version &> /dev/null; then
    log "Docker Compose not found. Installing Docker Compose..."
    apt-get update
    apt-get install -y docker-compose-plugin
    log "Docker Compose installed successfully"
else
    log "Docker Compose already installed"
fi

# Check if git is installed
if ! command -v git &> /dev/null; then
    log "Git not found. Installing Git..."
    apt-get update
    apt-get install -y git
    log "Git installed successfully"
else
    log "Git already installed"
fi

# Clone or update the application source
if [ -d "$APP_DIR/.git" ]; then
    log "Updating existing repository in $APP_DIR"

    if ! git -C "$APP_DIR" diff --quiet || ! git -C "$APP_DIR" diff --cached --quiet; then
        log "Error: Local changes detected in $APP_DIR. Please commit or discard them before rerunning the installer."
        exit 1
    fi

    git -C "$APP_DIR" fetch origin "$REPO_BRANCH"
    git -C "$APP_DIR" checkout "$REPO_BRANCH"
    git -C "$APP_DIR" pull --ff-only origin "$REPO_BRANCH"
elif [ -d "$APP_DIR" ] && [ -n "$(ls -A "$APP_DIR" 2>/dev/null)" ]; then
    log "Error: $APP_DIR exists and is not an empty git repository."
    exit 1
else
    log "Cloning repository $REPO_URL (branch: $REPO_BRANCH) into $APP_DIR"
    if [ -d "$APP_DIR" ]; then
        rmdir "$APP_DIR"
    fi
    git clone --branch "$REPO_BRANCH" --single-branch "$REPO_URL" "$APP_DIR"
fi

# Write docker-compose.yml
log "Writing docker-compose.yml to $INSTALL_DIR"
cat > "$INSTALL_DIR/docker-compose.yml" << 'EOF'
services:
  logbull:
    container_name: logbull
    build:
      context: ./app
      dockerfile: Dockerfile
    ports:
      - "4005:4005"
    volumes:
      - ./logbull-data:/logbull-data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4005/api/v1/system/health"]
      interval: 5s
      timeout: 5s
      retries: 30
      start_period: 60s
EOF
log "docker-compose.yml created successfully"

# Build and start Log Bull
log "Building and starting Log Bull from local source..."
cd "$INSTALL_DIR"
docker compose up -d --build

# Quick health check
log "Waiting for container to be ready..."
for i in {1..30}; do
    if docker ps --filter "name=logbull" --filter "health=healthy" -q | grep -q .; then
        log "Log Bull is healthy and ready!"
        break
    fi
    sleep 5
done

log "Log Bull installation completed successfully!"
log "-------------------------------------------"
log "To launch:"
log "> cd $INSTALL_DIR && docker compose up -d --build"
log "Source repository: $REPO_URL (branch: $REPO_BRANCH)"
log "Access Log Bull at: http://localhost:4005"
