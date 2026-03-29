package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"mailguard/api/middleware"
)

func TestCORSMiddleware(t *testing.T) {
	// Create a simple handler to wrap
	nextHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})

	handler := middleware.CORS(nextHandler)

	tests := []struct {
		name           string
		method         string
		expectedStatus int
		checkHeaders   func(*testing.T, http.Header)
	}{
		{
			name:           "OPTIONS preflight request",
			method:         http.MethodOptions,
			expectedStatus: http.StatusNoContent,
			checkHeaders: func(t *testing.T, h http.Header) {
				if h.Get("Access-Control-Allow-Origin") != "*" {
					t.Error("Access-Control-Allow-Origin header missing")
				}
				if h.Get("Access-Control-Allow-Methods") != "GET, POST, OPTIONS" {
					t.Error("Access-Control-Allow-Methods header incorrect")
				}
			},
		},
		{
			name:           "POST request",
			method:         http.MethodPost,
			expectedStatus: http.StatusOK,
			checkHeaders: func(t *testing.T, h http.Header) {
				if h.Get("Access-Control-Allow-Origin") != "*" {
					t.Error("CORS headers should be set for POST")
				}
			},
		},
		{
			name:           "GET request",
			method:         http.MethodGet,
			expectedStatus: http.StatusOK,
			checkHeaders: func(t *testing.T, h http.Header) {
				if h.Get("Access-Control-Allow-Origin") != "*" {
					t.Error("CORS headers should be set for GET")
				}
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(tt.method, "/test", nil)
			w := httptest.NewRecorder()

			handler.ServeHTTP(w, req)

			if w.Code != tt.expectedStatus {
				t.Errorf("expected status %d, got %d", tt.expectedStatus, w.Code)
			}

			tt.checkHeaders(t, w.Header())
		})
	}
}
