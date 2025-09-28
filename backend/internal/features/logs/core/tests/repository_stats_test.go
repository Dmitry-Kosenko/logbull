package logs_core_tests

import (
	"math"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"

	logs_core "logbull/internal/features/logs/core"
)

func Test_GetProjectLogStats_WithMultipleLogs_ReturnsCorrectStats(t *testing.T) {
	t.Parallel()
	repository := logs_core.GetLogCoreRepository()
	projectID := uuid.New()
	uniqueTestSession := uuid.New().String()[:8]
	baseTime := time.Now().UTC()

	// Create logs at different timestamps
	oldTime := baseTime.Add(-2 * time.Hour)
	recentTime := baseTime.Add(-1 * time.Hour)
	newestTime := baseTime.Add(-30 * time.Minute)

	oldLogEntries := CreateTestLogEntriesWithUniqueFields(projectID, oldTime,
		"Old log for stats test", map[string]any{
			"test_session": uniqueTestSession,
			"log_order":    1,
		})

	recentLogEntries := CreateTestLogEntriesWithUniqueFields(projectID, recentTime,
		"Recent log for stats test", map[string]any{
			"test_session": uniqueTestSession,
			"log_order":    2,
		})

	newestLogEntries := CreateTestLogEntriesWithUniqueFields(projectID, newestTime,
		"Newest log for stats test", map[string]any{
			"test_session": uniqueTestSession,
			"log_order":    3,
		})

	allEntries := MergeLogEntries(oldLogEntries, recentLogEntries)
	allEntries = MergeLogEntries(allEntries, newestLogEntries)
	StoreTestLogsAndFlush(t, repository, allEntries)

	stats, err := repository.GetProjectLogStats(projectID)
	assert.NoError(t, err)
	assert.NotNil(t, stats)

	assert.Equal(t, int64(3), stats.TotalLogs, "Should have 3 total logs")
	assert.Equal(t, float64(0), math.Round(stats.TotalSizeMB*100)/100, "TotalSizeMB should be 0")

	// Verify oldest and newest timestamps (allow some tolerance for timestamp precision)
	timeTolerance := 10 * time.Second
	assert.WithinDuration(t, oldTime, stats.OldestLogTime, timeTolerance,
		"Oldest log time should match the earliest log timestamp")
	assert.WithinDuration(t, newestTime, stats.NewestLogTime, timeTolerance,
		"Newest log time should match the latest log timestamp")
}

func Test_GetProjectLogStats_WithNoLogs_ReturnsZeroStats(t *testing.T) {
	t.Parallel()
	repository := logs_core.GetLogCoreRepository()
	projectID := uuid.New() // Empty project with no logs

	stats, err := repository.GetProjectLogStats(projectID)
	assert.NoError(t, err)
	assert.NotNil(t, stats)

	assert.Equal(t, int64(0), stats.TotalLogs, "Should have 0 total logs for empty project")
	assert.Equal(t, float64(0), stats.TotalSizeMB, "TotalSizeMB should be 0")
	assert.True(t, stats.OldestLogTime.IsZero(), "OldestLogTime should be zero time for empty project")
	assert.True(t, stats.NewestLogTime.IsZero(), "NewestLogTime should be zero time for empty project")
}

func Test_GetProjectLogStats_WithSingleLog_ReturnsCorrectStats(t *testing.T) {
	t.Parallel()
	repository := logs_core.GetLogCoreRepository()
	projectID := uuid.New()
	uniqueTestSession := uuid.New().String()[:8]
	logTime := time.Now().UTC()

	singleLogEntries := CreateTestLogEntriesWithUniqueFields(projectID, logTime,
		"Single log for stats test", map[string]any{
			"test_session": uniqueTestSession,
			"single_log":   true,
		})

	StoreTestLogsAndFlush(t, repository, singleLogEntries)

	stats, err := repository.GetProjectLogStats(projectID)
	assert.NoError(t, err)
	assert.NotNil(t, stats)

	assert.Equal(t, int64(1), stats.TotalLogs, "Should have 1 total log")
	assert.Equal(t, float64(0), math.Round(stats.TotalSizeMB*100)/100, "TotalSizeMB should be 0")

	// For single log, oldest and newest should be the same
	timeTolerance := 10 * time.Second
	assert.WithinDuration(t, logTime, stats.OldestLogTime, timeTolerance,
		"Oldest log time should match the single log timestamp")
	assert.WithinDuration(t, logTime, stats.NewestLogTime, timeTolerance,
		"Newest log time should match the single log timestamp")
}

func Test_GetProjectLogStats_WithTwelveHourTimeGap_ReturnsCorrectTimestamps(t *testing.T) {
	t.Parallel()
	repository := logs_core.GetLogCoreRepository()
	projectID := uuid.New()
	uniqueTestSession := uuid.New().String()[:8]

	// Create logs with 12-hour gap
	now := time.Now().UTC()
	twelveHoursAgo := now.Add(-12 * time.Hour)

	// First log (oldest) - 12 hours ago
	oldLogEntries := CreateTestLogEntriesWithUniqueFields(projectID, twelveHoursAgo,
		"Log from 12 hours ago", map[string]any{
			"test_session":   uniqueTestSession,
			"timestamp_test": "twelve_hours_ago",
		})

	// Second log (newest) - now
	newLogEntries := CreateTestLogEntriesWithUniqueFields(projectID, now,
		"Log from now", map[string]any{
			"test_session":   uniqueTestSession,
			"timestamp_test": "now",
		})

	allEntries := MergeLogEntries(oldLogEntries, newLogEntries)
	StoreTestLogsAndFlush(t, repository, allEntries)

	stats, err := repository.GetProjectLogStats(projectID)
	assert.NoError(t, err)
	assert.NotNil(t, stats)

	assert.Equal(t, int64(2), stats.TotalLogs, "Should have 2 total logs")
	assert.Greater(t, stats.TotalSizeMB, float64(0), "TotalSizeMB should be greater than 0")

	// Verify timestamps with tolerance for precision
	timeTolerance := 10 * time.Second
	assert.WithinDuration(t, twelveHoursAgo, stats.OldestLogTime, timeTolerance,
		"Oldest log time should match the 12-hour-ago timestamp")
	assert.WithinDuration(t, now, stats.NewestLogTime, timeTolerance,
		"Newest log time should match the current timestamp")

	// Verify the time gap is approximately 12 hours
	actualGap := stats.NewestLogTime.Sub(stats.OldestLogTime)
	expectedGap := 12 * time.Hour
	gapTolerance := 1 * time.Minute

	assert.InDelta(t, expectedGap.Seconds(), actualGap.Seconds(), gapTolerance.Seconds(),
		"Time gap between oldest and newest log should be approximately 12 hours")
}
