package users_interfaces

import (
	"github.com/google/uuid"
)

type AuditLogWriter interface {
	WriteAuditLog(message string, userID *uuid.UUID, projectID *uuid.UUID)
}

type PlanChangeListener interface {
	OnPlanChanged(planID uuid.UUID) error
}

type UserPlanChangeListener interface {
	OnUserPlanChanged(userID uuid.UUID, previousPlanID *uuid.UUID, newPlanID *uuid.UUID) error
}

type PlanDeletionListener interface {
	OnBeforePlanDeletion(planID uuid.UUID) error
}
