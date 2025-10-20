package users_services

import (
	user_repositories "logbull/internal/features/users/repositories"
)

var secretKeyRepository = &user_repositories.SecretKeyRepository{}
var userRepository = &user_repositories.UserRepository{}
var usersSettingsRepository = &user_repositories.UsersSettingsRepository{}
var userPlanRepository = &user_repositories.UserPlanRepository{}

var userService = &UserService{
	userRepository,
	secretKeyRepository,
	userPlanRepository,
	settingsService,
	nil,
}
var settingsService = &SettingsService{
	usersSettingsRepository,
	nil,
}
var managementService = &UserManagementService{
	userRepository,
	userPlanService,
	nil,
}
var userPlanService = &UserPlanService{
	userPlanRepository,
	nil,
	userService,
}

func GetUserService() *UserService {
	return userService
}

func GetSettingsService() *SettingsService {
	return settingsService
}

func GetManagementService() *UserManagementService {
	return managementService
}

func GetUserPlanService() *UserPlanService {
	return userPlanService
}
