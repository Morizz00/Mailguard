package main

import (
	"log"
	"log/slog"
	"mailguard/api/handlers"
	"mailguard/api/middleware"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8082"
	}

	mux := http.NewServeMux()

	// API endpoints
	mux.HandleFunc("/api/v1/check", handlers.CheckHandler)
	mux.HandleFunc("/api/v1/bulk", handlers.BulkHandler)
	mux.HandleFunc("/api/v1/history", handlers.HistoryHandler)
	mux.HandleFunc("/api/v1/export", handlers.ExportHandler)

	// Static files and SPA routing
	if distDir := os.Getenv("STATIC_DIR"); distDir != "" {
		slog.Info("serving static files from", "dir", distDir)
		mux.Handle("/", serveStaticOrIndex(distDir))
	}

	handler := middleware.CORS(mux)

	slog.Info("MailGuard API starting", "port", port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}

// serveStaticOrIndex serves static files, with SPA fallback to index.html
func serveStaticOrIndex(distDir string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Prevent directory traversal
		cleanPath := filepath.Clean(r.URL.Path)
		if strings.Contains(cleanPath, "..") {
			http.Error(w, "Invalid path", http.StatusBadRequest)
			return
		}

		filePath := filepath.Join(distDir, cleanPath)

		// Check if file exists
		if _, err := os.Stat(filePath); err == nil {
			// File exists, serve it
			http.FileServer(http.Dir(distDir)).ServeHTTP(w, r)
			return
		}

		// File doesn't exist - check if it's a request for a route (not a static file)
		// If path doesn't have an extension or starts with /, assume SPA route
		if !strings.Contains(cleanPath, ".") || cleanPath == "/" {
			// Serve index.html for SPA routing
			indexPath := filepath.Join(distDir, "index.html")
			info, err := os.Stat(indexPath)
			if err == nil {
				// Read and serve index.html
				file, err := os.Open(indexPath)
				if err == nil {
					defer file.Close()
					w.Header().Set("Content-Type", "text/html; charset=utf-8")
					http.ServeContent(w, r, "index.html", info.ModTime(), file)
					return
				}
			}
		}

		// Not found
		http.Error(w, "Not found", http.StatusNotFound)
	})
}
