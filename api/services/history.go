package services

import (
	"mailguard/api/models"
	"sync"
)

const maxHistory = 50

type HistoryStore struct {
	mu      sync.RWMutex
	entries []models.HistoryEntry
}

var History = &HistoryStore{}

func (h *HistoryStore) Add(e models.HistoryEntry) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if len(h.entries) >= maxHistory {
		h.entries = h.entries[1:]
	}
	h.entries = append(h.entries, e)
}

func (h *HistoryStore) All() []models.HistoryEntry {
	h.mu.RLock()
	defer h.mu.RUnlock()
	out := make([]models.HistoryEntry, len(h.entries))
	copy(out, h.entries)
	return out
}
