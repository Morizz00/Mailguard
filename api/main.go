package main

import (
	"log"
	"log/slog"
	"mailguard/api/handlers"
	"mailguard/api/middleware"
	"net/http"
	"os"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8082"
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/api/v1/check", handlers.CheckHandler)
	mux.HandleFunc("/api/v1/bulk", handlers.BulkHandler)
	mux.HandleFunc("/api/v1/history", handlers.HistoryHandler)
	mux.HandleFunc("/api/v1/export", handlers.ExportHandler)

	handler := middleware.CORS(mux)

	slog.Info("MailGuard API starting", "port", port)
	log.Fatal(http.ListenAndServe(":"+port, handler))

}
