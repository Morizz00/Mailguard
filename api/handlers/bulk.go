package handlers

import (
	"context"
	"encoding/json"
	"log/slog"
	"mailguard/api/models"
	"mailguard/api/services"
	"net/http"
	"os"
	"strconv"
	"sync"
	"time"
)

const maxBulkDomains = 20

func BulkHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req struct {
		Domains []string `json:"domains"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	if len(req.Domains) > maxBulkDomains {
		http.Error(w, "too many domains, max is "+strconv.Itoa(maxBulkDomains), http.StatusBadRequest)
		return
	}
	start := time.Now()

	// Get timeout from env or default to 10s
	timeoutSec := getEnvInt("BULK_TIMEOUT_SEC", 10)
	ctx, cancel := context.WithTimeout(r.Context(), time.Duration(timeoutSec)*time.Second)
	defer cancel()

	result := make([]models.DomainResult, len(req.Domains))
	var wg sync.WaitGroup
	for i, d := range req.Domains {

		wg.Add(1)
		go func(i int, domain string) {
			defer wg.Done()
			cleaned := CleanDomain(domain)
			if cleaned == "" {
				slog.Warn("invalid domain skipped", "original", domain, "index", i)
				return
			}
			result[i] = buildResult(ctx, cleaned)
			services.History.Add(models.HistoryEntry{
				Domain:    result[i].Domain,
				CheckedAt: result[i].CheckedAt,
				Grade:     gradeFromScore(result[i].Score),
				Score:     scoreInt(result[i].Score),
				HasMX:     result[i].MX.Present,
				HasSPF:    result[i].SPF.Present,
				HasDMARC:  result[i].DMARC.Present,
			})
		}(i, d)
	}
	wg.Wait()

	w.Header().Set("Content-Type", "application/json")
	// Filter out empty results (invalid domains)
	validResults := make([]models.DomainResult, 0, len(result))
	for _, r := range result {
		if r.Domain != "" {
			validResults = append(validResults, r)
		}
	}
	json.NewEncoder(w).Encode(map[string]any{
		"results":      validResults,
		"totalDomains": len(req.Domains),
		"totalValid":   len(validResults),
		"durationMs":   time.Since(start).Milliseconds(),
	})
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
