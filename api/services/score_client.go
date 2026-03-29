package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"mailguard/api/models"
	"net/http"
	"os"
	"time"
)

// ScoreRequest matches Python scorer's expected request format
type ScoreRequest struct {
	Domain string             `json:"domain"`
	MX     models.MXResult    `json:"mx"`
	SPF    models.SPFResult   `json:"spf"`
	DMARC  models.DMARCResult `json:"dmarc"`
}

// ScoreResponse matches Python scorer's response format
type ScoreResponse struct {
	Score           int                   `json:"score"`
	Grade           string                `json:"grade"`
	RiskLevel       string                `json:"riskLevel"`
	Summary         string                `json:"summary"`
	Recommendations []string              `json:"recommendations"`
	Breakdown       models.ScoreBreakdown `json:"breakdown"`
	AIGenerated     bool                  `json:"aiGenerated"`
}

func ScoreDomain(ctx context.Context, res models.DomainResult) (*models.ScoreResult, error) {
	scorerURL := os.Getenv("SCORER_URL")
	if scorerURL == "" {
		return nil, fmt.Errorf("SCORER_URL not set")
	}

	// Build request payload
	scoreReq := ScoreRequest{
		Domain: res.Domain,
		MX:     res.MX,
		SPF:    res.SPF,
		DMARC:  res.DMARC,
	}

	// Marshal to JSON
	payload, err := json.Marshal(scoreReq)
	if err != nil {
		slog.Error("failed to marshal score request", "domain", res.Domain, "error", err)
		return nil, fmt.Errorf("failed to marshal score request: %w", err)
	}

	// Create HTTP request with context
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, scorerURL+"/score", bytes.NewReader(payload))
	if err != nil {
		slog.Error("failed to create score request", "domain", res.Domain, "url", scorerURL, "error", err)
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")

	// Get timeout from environment or default to 5 seconds
	timeoutMs := getEnvInt("SCORER_TIMEOUT_MS", 5000)
	client := &http.Client{
		Timeout: time.Duration(timeoutMs) * time.Millisecond,
	}

	// Make request
	resp, err := client.Do(httpReq)
	if err != nil {
		slog.Error("scorer service request failed", "domain", res.Domain, "url", scorerURL, "error", err)
		return nil, fmt.Errorf("scorer service request failed: %w", err)
	}
	defer resp.Body.Close()

	// Check response status
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		slog.Error("scorer service error", "domain", res.Domain, "status", resp.StatusCode, "response", string(body))
		return nil, fmt.Errorf("scorer returned status %d: %s", resp.StatusCode, string(body))
	}

	// Parse response
	var scoreResp ScoreResponse
	if err := json.NewDecoder(resp.Body).Decode(&scoreResp); err != nil {
		slog.Error("failed to parse score response", "domain", res.Domain, "error", err)
		return nil, fmt.Errorf("failed to parse scorer response: %w", err)
	}

	// Convert to models.ScoreResult
	result := &models.ScoreResult{
		Score:           scoreResp.Score,
		Grade:           scoreResp.Grade,
		RiskLevel:       scoreResp.RiskLevel,
		Summary:         scoreResp.Summary,
		Recommendations: scoreResp.Recommendations,
		Breakdown:       scoreResp.Breakdown,
		AIGenerated:     scoreResp.AIGenerated,
	}

	slog.Info("domain scored successfully", "domain", res.Domain, "score", result.Score, "grade", result.Grade)
	return result, nil
}
