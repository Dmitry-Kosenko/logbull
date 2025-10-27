package users_services

import (
	users_dto "logbull/internal/features/users/dto"

	"golang.org/x/oauth2"
)

func (s *UserService) HandleGitHubOAuthWithMockEndpoint(
	code string,
	endpoint oauth2.Endpoint,
	userAPIURL string,
) (*users_dto.OAuthCallbackResponseDTO, error) {
	return s.handleGitHubOAuthWithEndpoint(code, endpoint, userAPIURL)
}

func (s *UserService) HandleGoogleOAuthWithMockEndpoint(
	code string,
	endpoint oauth2.Endpoint,
	userAPIURL string,
) (*users_dto.OAuthCallbackResponseDTO, error) {
	return s.handleGoogleOAuthWithEndpoint(code, endpoint, userAPIURL)
}
