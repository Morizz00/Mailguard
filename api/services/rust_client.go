package services

import (
	"context"
	"fmt"
	"mailguard/api/models"
	"os"
)

type ParsedRecords struct {
	MX    *models.MXParsed
	SPF   *models.SPFParsed
	DMARC *models.DMARCParsed
}

func ParseRecords(ctx context.Context, raw models.DomainResult) (*ParsedRecords, error) {
	url := os.Getenv("RUST_PARSER_URL")
	if url == "" {
		return nil, fmt.Errorf("RUST_PARSER_URL not set")
	}
	//todo after rust parser is implemented, make a request to it with the raw records and parse the response into ParsedRecords struct
	return nil, fmt.Errorf("not implemented")
}
