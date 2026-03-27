package services

import (
	"log/slog"
	"mailguard/api/models"
	"net"
	"strings"
)

func LookupDomain(domain string) models.DomainResult {
	res := models.DomainResult{
		Domain: domain,
	}
	mxRecords, err := net.LookupMX(domain)
	if err != nil {
		slog.Debug("Error looking up MX records", "domain", domain, "error", err)
	} else if len(mxRecords) > 0 {
		res.MX.Present = true
		for _, mx := range mxRecords {
			res.MX.Records = append(res.MX.Records, models.MXRecord{
				Host:     mx.Host,
				Priority: mx.Pref,
			})
		}
	}

	txtRecords, err := net.LookupTXT(domain)
	if err != nil {
		slog.Debug("Error looking up TXT records", "domain", domain, "error", err)
	} else {
		for _, txt := range txtRecords {
			if strings.HasPrefix(txt, "v=spf1") {
				res.SPF.Present = true
				res.SPF.RawRecord = txt
				break
			}
		}
	}

	dmarcRecords, err := net.LookupTXT("_dmarc." + domain)
	if err != nil {
		slog.Debug("Error looking up DMARC records", "domain", domain, "error", err)
	} else {
		for _, d := range dmarcRecords {
			if strings.HasPrefix(d, "v=DMARC1") {
				res.DMARC.Present = true
				res.DMARC.RawRecord = d
				break
			}
		}
	}

	return res
}
