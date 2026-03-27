package services

import (
	"context"
	"fmt"
	"mailguard/api/models"
	"os"
)

func ScoreDomain(ctx context.Context, res models.DomainResult) (*models.ScoreResult, error) {
	url := os.Getenv("SCORER_URL")
	if url == "" {
		return nil, fmt.Errorf("SCORER_URL not set")
	}
	//todo after scorer is implemented, make a request to it with the parsed records and parse the response into ScoreResult struct
	return nil, fmt.Errorf("not implemented")
}
