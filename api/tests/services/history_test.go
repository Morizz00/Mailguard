package services

import (
	"sync"
	"testing"
	"time"

	"mailguard/api/models"
	"mailguard/api/services"
)

func TestHistoryStore_Add(t *testing.T) {
	store := &services.HistoryStore{}

	entry := models.HistoryEntry{
		Domain:    "example.com",
		Grade:     "A",
		Score:     95,
		CheckedAt: time.Now().UTC(),
	}

	store.Add(entry)
	all := store.All()

	if len(all) != 1 {
		t.Fatalf("expected 1 entry, got %d", len(all))
	}

	if all[0].Domain != "example.com" {
		t.Errorf("expected domain example.com, got %s", all[0].Domain)
	}
}

func TestHistoryStore_MaxHistory(t *testing.T) {
	store := &services.HistoryStore{}

	// Add more than maxHistory entries (max is 50)
	for i := 0; i < 55; i++ {
		entry := models.HistoryEntry{
			Domain: "test.com",
			Grade:  "A",
			Score:  95,
		}
		store.Add(entry)
	}

	all := store.All()
	if len(all) != 50 {
		t.Errorf("expected max 50 entries, got %d", len(all))
	}
}

func TestHistoryStore_Concurrent(t *testing.T) {
	store := &services.HistoryStore{}
	const numGoroutines = 10
	const entriesPerGoroutine = 5

	var wg sync.WaitGroup
	for g := 0; g < numGoroutines; g++ {
		wg.Add(1)
		go func(goroutineNum int) {
			defer wg.Done()
			for i := 0; i < entriesPerGoroutine; i++ {
				entry := models.HistoryEntry{
					Domain: "test.com",
					Grade:  "A",
					Score:  95,
				}
				store.Add(entry)
			}
		}(g)
	}
	wg.Wait()

	all := store.All()
	expected := numGoroutines * entriesPerGoroutine
	if len(all) != expected {
		t.Errorf("expected %d entries, got %d", expected, len(all))
	}
}

func TestHistoryStore_All_ReturnsCopy(t *testing.T) {
	store := &services.HistoryStore{}

	entry1 := models.HistoryEntry{Domain: "test1.com", Score: 100}
	entry2 := models.HistoryEntry{Domain: "test2.com", Score: 90}

	store.Add(entry1)
	store.Add(entry2)

	// Get all entries
	all1 := store.All()
	original := make([]models.HistoryEntry, len(all1))
	copy(original, all1)

	// Modify returned slice and return again
	all1[0].Score = 1

	// Should not affect subsequent calls
	all2 := store.All()
	if all2[0].Score != 100 {
		t.Error("modifications to returned slice should not affect internal state")
	}
}
