package handlers

import (
	"context"
	"encoding/json"
	"mailguard/api/models"
	"mailguard/api/services"
	"net/http"
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
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	result := make([]models.DomainResult, len(req.Domains))
	var wg sync.WaitGroup
	for i, d := range req.Domains {

		wg.Add(1)
		go func(i int, domain string) {
			defer wg.Done()
			cleaned := cleanDomain(domain)
			if cleaned == "" {
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
	json.NewEncoder(w).Encode(map[string]any{
		"results":      result,
		"totalChecked": len(result),
		"durationMs":   time.Since(start).Milliseconds(),
	})
}
