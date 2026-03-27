package handlers

import (
	"context"
	"encoding/json"
	"log/slog"
	"mailguard/api/models"
	"mailguard/api/services"
	"net/http"
	"strings"
	"time"
)

func CheckHandler(w http.ResponseWriter, r *http.Request) {

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req struct {
		Domain string `json:"domain"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	domain := cleanDomain(req.Domain)
	if domain == "" {
		http.Error(w, "Invalid domain", http.StatusBadRequest)
		return
	}
	result := buildResult(r.Context(), domain)

	services.History.Add(models.HistoryEntry{
		Domain:    result.Domain,
		CheckedAt: result.CheckedAt,
		Grade:     gradeFromScore(result.Score),
		Score:     scoreInt(result.Score),
		HasMX:     result.MX.Present,
		HasSPF:    result.SPF.Present,
		HasDMARC:  result.DMARC.Present,
	})
	slog.Info("domain checked", "domain", domain)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func buildResult(ctx context.Context, domain string) models.DomainResult {
	raw := services.LookupDomain(domain)
	res := models.DomainResult{
		Domain:    domain,
		CheckedAt: time.Now().UTC(),
		MX:        raw.MX,
		SPF:       raw.SPF,
		DMARC:     raw.DMARC,
	}
	if parsed, err := services.ParseRecords(ctx, raw); err == nil {
		res.MX.Parsed = parsed.MX
		res.SPF.Parsed = parsed.SPF
		res.DMARC.Parsed = parsed.DMARC
	}
	if score, err := services.ScoreDomain(ctx, res); err == nil {
		res.Score = score
	}

	return res

}

func cleanDomain(domain string) string {
	domain = strings.TrimSpace(strings.ToLower(domain))
	domain = strings.TrimPrefix(domain, "http://")
	domain = strings.TrimPrefix(domain, "https://")
	domain = strings.TrimSuffix(domain, "/")
	if domain == "" || strings.Contains(domain, "/") || strings.Contains(domain, " ") {
		return ""
	}
	return domain
}

func gradeFromScore(score *models.ScoreResult) string {
	if score == nil {
		return ""
	}
	return score.Grade
}

func scoreInt(score *models.ScoreResult) int {
	if score == nil {
		return 0
	}
	return score.Score
}
