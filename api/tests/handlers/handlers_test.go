package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"mailguard/api/handlers"
)

func TestCleanDomain(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "valid domain",
			input:    "example.com",
			expected: "example.com",
		},
		{
			name:     "uppercase domain",
			input:    "EXAMPLE.COM",
			expected: "example.com",
		},
		{
			name:     "domain with http prefix",
			input:    "http://example.com",
			expected: "example.com",
		},
		{
			name:     "domain with https prefix",
			input:    "https://example.com",
			expected: "example.com",
		},
		{
			name:     "domain with trailing slash",
			input:    "example.com/",
			expected: "example.com",
		},
		{
			name:     "domain with spaces",
			input:    "example .com",
			expected: "",
		},
		{
			name:     "domain with path",
			input:    "example.com/path",
			expected: "",
		},
		{
			name:     "empty domain",
			input:    "",
			expected: "",
		},
		{
			name:     "whitespace only",
			input:    "  ",
			expected: "",
		},
		{
			name:     "subdomain",
			input:    "mail.example.com",
			expected: "mail.example.com",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := handlers.CleanDomain(tt.input)
			if result != tt.expected {
				t.Errorf("cleanDomain(%q) = %q, expected %q", tt.input, result, tt.expected)
			}
		})
	}
}

func TestCheckHandler_InvalidMethod(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/v1/check", nil)
	w := httptest.NewRecorder()

	handlers.CheckHandler(w, req)

	if w.Code != http.StatusMethodNotAllowed {
		t.Errorf("expected status %d, got %d", http.StatusMethodNotAllowed, w.Code)
	}
}

func TestCheckHandler_InvalidBody(t *testing.T) {
	body := bytes.NewBufferString("invalid json")
	req := httptest.NewRequest(http.MethodPost, "/api/v1/check", body)
	w := httptest.NewRecorder()

	handlers.CheckHandler(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}

func TestCheckHandler_InvalidDomain(t *testing.T) {
	payload := map[string]string{"domain": "invalid domain with spaces"}
	body, _ := json.Marshal(payload)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/check", bytes.NewReader(body))
	w := httptest.NewRecorder()

	handlers.CheckHandler(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}

func TestHistoryHandler_GetRequest(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/v1/history", nil)
	w := httptest.NewRecorder()

	handlers.HistoryHandler(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, w.Code)
	}

	if ct := w.Header().Get("Content-Type"); ct != "application/json" {
		t.Errorf("expected content-type application/json, got %s", ct)
	}
}

func TestHistoryHandler_InvalidMethod(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/api/v1/history", nil)
	w := httptest.NewRecorder()

	handlers.HistoryHandler(w, req)

	if w.Code != http.StatusMethodNotAllowed {
		t.Errorf("expected status %d, got %d", http.StatusMethodNotAllowed, w.Code)
	}
}

func TestExportHandler_GetRequest(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/v1/export", nil)
	w := httptest.NewRecorder()

	handlers.ExportHandler(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, w.Code)
	}

	if ct := w.Header().Get("Content-Type"); ct != "text/csv" {
		t.Errorf("expected content-type text/csv, got %s", ct)
	}

	// Should have CSV header
	if !bytes.Contains(w.Body.Bytes(), []byte("domain,checkedAt,grade")) {
		t.Error("expected CSV header in response")
	}
}

func TestExportHandler_InvalidMethod(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/api/v1/export", nil)
	w := httptest.NewRecorder()

	handlers.ExportHandler(w, req)

	if w.Code != http.StatusMethodNotAllowed {
		t.Errorf("expected status %d, got %d", http.StatusMethodNotAllowed, w.Code)
	}
}

func TestBulkHandler_InvalidMethod(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/v1/bulk", nil)
	w := httptest.NewRecorder()

	handlers.BulkHandler(w, req)

	if w.Code != http.StatusMethodNotAllowed {
		t.Errorf("expected status %d, got %d", http.StatusMethodNotAllowed, w.Code)
	}
}

func TestBulkHandler_TooManyDomains(t *testing.T) {
	domains := make([]string, 25) // max is 20
	for i := range domains {
		domains[i] = "test.com"
	}

	payload := map[string][]string{"domains": domains}
	body, _ := json.Marshal(payload)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/bulk", bytes.NewReader(body))
	w := httptest.NewRecorder()

	handlers.BulkHandler(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}

func TestBulkHandler_InvalidJSON(t *testing.T) {
	body := bytes.NewBufferString("invalid json")
	req := httptest.NewRequest(http.MethodPost, "/api/v1/bulk", body)
	w := httptest.NewRecorder()

	handlers.BulkHandler(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}
