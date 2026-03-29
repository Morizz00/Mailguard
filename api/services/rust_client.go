package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"mailguard/api/models"
	"net/http"
	"os"
	"strconv"
	"time"
)

type ParsedRecords struct {
	MX    *models.MXParsed
	SPF   *models.SPFParsed
	DMARC *models.DMARCParsed
}
type parseRequest struct {
	Domain    string            `json:"domain"`
	SpfRaw    string            `json:"spf_raw,omitempty"`
	DmarcRaw  string            `json:"dmarc_raw,omitempty"`
	MxRecords []models.MXRecord `json:"mx_records,omitempty"`
}

func ParseRecords(ctx context.Context, raw models.DomainResult) (*ParsedRecords, error) {
	url := os.Getenv("RUST_PARSER_URL")
	if url == "" {
		return nil, fmt.Errorf("RUST_PARSER_URL not set")
	}

	body, _ := json.Marshal(parseRequest{
		Domain:    raw.Domain,
		SpfRaw:    raw.SPF.RawRecord,
		DmarcRaw:  raw.DMARC.RawRecord,
		MxRecords: raw.MX.Records,
	})

	// Get timeout from env or default to 500ms
	timeoutMs := getEnvInt("RUST_PARSER_TIMEOUT_MS", 500)
	ctx, cancel := context.WithTimeout(ctx, time.Duration(timeoutMs)*time.Millisecond)
	defer cancel()

	req, _ := http.NewRequestWithContext(ctx, http.MethodPost, url+"/parse", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error calling rust parser: %w", err)
	}
	defer resp.Body.Close()

	var res ParsedRecords

	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return nil, fmt.Errorf("error decoding rust parser response: %w", err)
	}
	return &res, nil
}

func getEnvInt(key string, defaultVal int) int {
	val := os.Getenv(key)
	if val == "" {
		return defaultVal
	}
	intVal, err := strconv.Atoi(val)
	if err != nil {
		slog.Warn("invalid integer env var", "key", key, "value", val, "error", err)
		return defaultVal
	}
	return intVal
}
