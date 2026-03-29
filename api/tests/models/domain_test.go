package models

import (
	"testing"
	"time"

	"mailguard/api/models"
)

func TestDomainResult_Basic(t *testing.T) {
	now := time.Now().UTC()
	result := models.DomainResult{
		Domain:    "example.com",
		CheckedAt: now,
		MX: models.MXResult{
			Present: true,
			Records: []models.MXRecord{
				{Host: "mail.example.com", Priority: 10},
			},
		},
		SPF: models.SPFResult{
			Present:   true,
			RawRecord: "v=spf1 include:_spf.google.com ~all",
		},
		DMARC: models.DMARCResult{
			Present:   true,
			RawRecord: "v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com",
		},
	}

	if result.Domain != "example.com" {
		t.Errorf("expected domain example.com, got %s", result.Domain)
	}

	if !result.MX.Present {
		t.Error("expected MX to be present")
	}

	if len(result.MX.Records) != 1 {
		t.Errorf("expected 1 MX record, got %d", len(result.MX.Records))
	}

	if !result.SPF.Present {
		t.Error("expected SPF to be present")
	}

	if !result.DMARC.Present {
		t.Error("expected DMARC to be present")
	}
}

func TestHistoryEntry_Valid(t *testing.T) {
	now := time.Now().UTC()
	entry := models.HistoryEntry{
		Domain:    "test.com",
		CheckedAt: now,
		Grade:     "A",
		Score:     95,
		HasMX:     true,
		HasSPF:    true,
		HasDMARC:  true,
	}

	if entry.Domain != "test.com" {
		t.Errorf("expected domain test.com, got %s", entry.Domain)
	}

	if entry.Grade != "A" {
		t.Errorf("expected grade A, got %s", entry.Grade)
	}

	if entry.Score != 95 {
		t.Errorf("expected score 95, got %d", entry.Score)
	}
}

func TestScoreResult_WithBreakdown(t *testing.T) {
	score := models.ScoreResult{
		Score:     88,
		Grade:     "B",
		RiskLevel: "medium",
		Breakdown: models.ScoreBreakdown{
			MXScore:     30,
			SPFScore:    28,
			DMARCScore:  30,
			MaxPossible: 100,
		},
	}

	if score.Score != 88 {
		t.Errorf("expected score 88, got %d", score.Score)
	}

	totalBreakdown := score.Breakdown.MXScore + score.Breakdown.SPFScore + score.Breakdown.DMARCScore
	if totalBreakdown != score.Score {
		t.Errorf("breakdown total %d doesn't match score %d", totalBreakdown, score.Score)
	}
}
