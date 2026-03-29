package services

import (
	"testing"

	"mailguard/api/models"
	"mailguard/api/services"
)

// TestLookupDomain_EmptyDomain tests behavior with empty domain
func TestLookupDomain_EmptyDomain(t *testing.T) {
	result := services.LookupDomain("")

	if result.Domain != "" {
		t.Errorf("expected empty domain, got %s", result.Domain)
	}

	if result.MX.Present {
		t.Error("expected MX.Present to be false for empty domain")
	}
}

func TestLookupDomain_Structure(t *testing.T) {
	result := services.LookupDomain("example.com")

	if result.Domain != "example.com" {
		t.Errorf("expected domain example.com, got %s", result.Domain)
	}

	if result.MX.Records == nil {
		result.MX.Records = []models.MXRecord{} // Initialize
	}

	if result.SPF.RawRecord == "" && result.SPF.Present {
		t.Error("SPF.Present should be false if RawRecord is empty")
	}
}
