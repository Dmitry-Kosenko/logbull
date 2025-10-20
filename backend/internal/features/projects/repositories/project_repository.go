package projects_repositories

import (
	"time"

	projects_models "logbull/internal/features/projects/models"
	"logbull/internal/storage"

	"github.com/google/uuid"
)

type ProjectRepository struct{}

func (r *ProjectRepository) CreateProject(project *projects_models.Project) error {
	if project.ID == uuid.Nil {
		project.ID = uuid.New()
	}
	if project.CreatedAt.IsZero() {
		project.CreatedAt = time.Now().UTC()
	}

	return storage.GetDb().Create(project).Error
}

func (r *ProjectRepository) GetProjectByID(projectID uuid.UUID) (*projects_models.Project, error) {
	var project projects_models.Project

	if err := storage.GetDb().Preload("Plan").Where("id = ?", projectID).First(&project).Error; err != nil {
		return nil, err
	}

	return &project, nil
}

func (r *ProjectRepository) UpdateProject(project *projects_models.Project) error {
	return storage.GetDb().Save(project).Error
}

func (r *ProjectRepository) DeleteProject(projectID uuid.UUID) error {
	return storage.GetDb().Delete(&projects_models.Project{}, projectID).Error
}

func (r *ProjectRepository) GetAllProjects() ([]*projects_models.Project, error) {
	var projects []*projects_models.Project

	err := storage.GetDb().Preload("Plan").Order("created_at DESC").Find(&projects).Error

	return projects, err
}

func (r *ProjectRepository) GetProjectsCountByOwnerIDAndPlanID(ownerID uuid.UUID, planID uuid.UUID) (int64, error) {
	var count int64

	err := storage.GetDb().
		Table("projects").
		Joins("INNER JOIN project_memberships ON projects.id = project_memberships.project_id").
		Where("project_memberships.user_id = ? AND project_memberships.role = 'OWNER' AND projects.plan_id = ?", ownerID, planID).
		Count(&count).
		Error

	return count, err
}
