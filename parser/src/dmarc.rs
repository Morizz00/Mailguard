
use crate::models::DmarcResult;

pub fn parse_dmarc(raw: &str) -> DmarcResult {
    let mut warnings = Vec::new();

    // Split on semicolons, trim each tag
    let tags: std::collections::HashMap<String, String> = raw
        .split(';')
        .filter_map(|part| {
            let part = part.trim();
            let eq = part.find('=')?;
            Some((
                part[..eq].trim().to_lowercase(),
                part[eq + 1..].trim().to_string(),
            ))
        })
        .collect();

    // v= must be DMARC1
    let version = tags.get("v").cloned().unwrap_or_default();
    if version != "DMARC1" {
        warnings.push("Record does not start with v=DMARC1".into());
    }

    // p= (required)
    let policy = tags.get("p").cloned().unwrap_or_else(|| {
        warnings.push("Missing required tag p= (policy)".into());
        "none".to_string()
    });

    validate_policy(&policy, "p", &mut warnings);

    // sp= (subdomain policy, defaults to same as p=)
    let subdomain_policy = tags.get("sp").cloned().unwrap_or_else(|| policy.clone());
    validate_policy(&subdomain_policy, "sp", &mut warnings);

    // pct= (percentage, default 100)
    let pct = tags.get("pct")
        .and_then(|v| v.parse::<u8>().ok())
        .unwrap_or(100);

    if pct < 100 {
        warnings.push(format!(
            "pct={} — only {}% of mail will have DMARC policy applied",
            pct, pct
        ));
    }

    // rua= (aggregate report URIs, comma-separated)
    let rua = parse_uri_list(tags.get("rua").map(String::as_str).unwrap_or(""));

    if rua.is_empty() {
        warnings.push("No rua= tag — you won't receive DMARC aggregate reports".into());
    }

    // ruf= (forensic report URIs)
    let ruf = parse_uri_list(tags.get("ruf").map(String::as_str).unwrap_or(""));

    // adkim= (DKIM alignment, default "r")
    let adkim = tags.get("adkim").cloned().unwrap_or_else(|| "r".into());
    if adkim == "s" {
        // Strict — worth noting
    }

    // aspf= (SPF alignment, default "r")
    let aspf = tags.get("aspf").cloned().unwrap_or_else(|| "r".into());

    // fo= (failure reporting options, default "0")
    let fo = tags.get("fo").cloned().unwrap_or_else(|| "0".into());

    // Warn if policy is "none" (monitoring only)
    if policy == "none" {
        warnings.push(
            "p=none only monitors — no enforcement. Upgrade to quarantine or reject.".into()
        );
    }

    DmarcResult {
        version,
        policy,
        subdomain_policy,
        pct,
        rua,
        ruf,
        adkim,
        aspf,
        fo,
        is_valid: warnings.is_empty(),
        warnings,
    }
}

fn validate_policy(policy: &str, tag: &str, warnings: &mut Vec<String>) {
    if !["none", "quarantine", "reject"].contains(&policy) {
        warnings.push(format!("Invalid {}= value: '{}' (must be none/quarantine/reject)", tag, policy));
    }
}

fn parse_uri_list(raw: &str) -> Vec<String> {
    raw.split(',')
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect()
}