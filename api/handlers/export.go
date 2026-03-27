//CSV EXPortation

package handlers

import (
	"encoding/csv"
	"mailguard/api/services"
	"net/http"
	"strconv"
	"time"
)

func ExportHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	entries := services.History.All()
	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", `attachment; filename="mailguard-export.csv"`)

	writer := csv.NewWriter(w)

	writer.Write([]string{"domain", "checkedAt", "grade", "score", "hasMX", "hasSPF", "hasDMARC"})

	for _, e := range entries {
		writer.Write([]string{
			e.Domain,
			e.CheckedAt.Format(time.RFC3339),
			e.Grade,
			strconv.Itoa(e.Score),
			strconv.FormatBool(e.HasMX),
			strconv.FormatBool(e.HasSPF),
			strconv.FormatBool(e.HasDMARC),
		})
	}
	writer.Flush()
}
