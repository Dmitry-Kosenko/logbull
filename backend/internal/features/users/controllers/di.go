package users_controllers

import (
	users_services "logbull/internal/features/users/services"

	"golang.org/x/time/rate"
)

var userController = &UserController{
	users_services.GetUserService(),
	rate.NewLimiter(rate.Limit(3), 3), // 3 rps with 3 burst
}

var settingsController = &SettingsController{
	users_services.GetSettingsService(),
}

var managementController = &ManagementController{
	users_services.GetManagementService(),
}

var userPlanController = &UserPlanController{
	users_services.GetUserPlanService(),
}

func GetUserController() *UserController {
	return userController
}

func GetSettingsController() *SettingsController {
	return settingsController
}

func GetManagementController() *ManagementController {
	return managementController
}

func GetUserPlanController() *UserPlanController {
	return userPlanController
}
