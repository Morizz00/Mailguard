package models

import "time"

type MXRecord struct {
	Host     string `json:"host"`
	Priority uint16 `json:"priority"`
}

type MXResult struct {
	Present bool       `json:"present"`
	Records []MXRecord `json:"records"`
	Parsed  *MXParsed  `json:"parsed,omitempty"` //SErved by Rust Service
}

type MXParsed struct {
	PrimaryMX             string          `json:"primaryMx"`
	HasMultiplePriorities bool            `json:"hasMultiplePriorities"`
	PriorityGroups        []PriorityGroup `json:"priorityGroups"`
}

type PriorityGroup struct {
	Priority uint16   `json:"priority"`
	Hosts    []string `json:"hosts"`
}

type SPFResult struct {
	Present   bool       `json:"present"`
	RawRecord string     `json:"rawRecord,omitempty"`
	Parsed    *SPFParsed `json:"parsed,omitempty"` //SErved by Rust Service
}

type SPFParsed struct {
	Mechanisms  []SPFMechanism `json:"mechanisms"`
	Version     string         `json:"version"`
	Warnings    []string       `json:"warnings"`
	IsValid     bool           `json:"isValid"`
	LookupCount int            `json:"lookupCount"`
	Qualifier   string         `json:"qualifier"`
}
type SPFMechanism struct {
	Type      string `json:"type"`
	Value     string `json:"value"`
	Qualifier string `json:"qualifier"`
}

type DMARCResult struct {
	Present   bool         `json:"present"`
	RawRecord string       `json:"rawRecord,omitempty"`
	Parsed    *DMARCParsed `json:"parsed,omitempty"` //SErved by Rust Service
}

type DMARCParsed struct {
	Version         string   `json:"version"`
	Policy          string   `json:"policy"`
	SubdomainPolicy string   `json:"subdomainPolicy"`
	Pct             int      `json:"pct"`
	Rua             []string `json:"rua"`
	Adkim           string   `json:"adkim"`
	Aspf            string   `json:"aspf"`
	IsValid         bool     `json:"isValid"`
	Warnings        []string `json:"warnings"`
}

type ScoreBreakdown struct {
	MXScore     int `json:"mxScore"`
	SPFScore    int `json:"spfScore"`
	DMARCScore  int `json:"dmarcScore"`
	MaxPossible int `json:"maxPossible"`
}

type ScoreResult struct {
	Score           int            `json:"score"`
	Grade           string         `json:"grade"`
	Breakdown       ScoreBreakdown `json:"breakdown"`
	RiskLevel       string         `json:"riskLevel"`
	Summary         string         `json:"summary"`
	Recommendations []string       `json:"recommendations"`
	AIGenerated     bool           `json:"aiGenerated"`
}

type DomainResult struct {
	Domain    string       `json:"domain"`
	MX        MXResult     `json:"mx"`
	SPF       SPFResult    `json:"spf"`
	DMARC     DMARCResult  `json:"dmarc"`
	Score     *ScoreResult `json:"score,omitempty"`
	CheckedAt time.Time    `json:"checkedAt"`
}

type HistoryEntry struct {
	Domain    string    `json:"domain"`
	CheckedAt time.Time `json:"checkedAt"`
	Grade     string    `json:"grade"`
	Score     int       `json:"score"`
	HasMX     bool      `json:"hasMX"`
	HasSPF    bool      `json:"hasSPF"`
	HasDMARC  bool      `json:"hasDMARC"`
}
