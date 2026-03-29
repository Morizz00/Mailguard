use crate::models::{SpfMechanism, SpfResult};

const LOOKUP_MECHANISMS: &[&str] = &["include", "a", "mx", "ptr", "exists", "redirect"];

pub fn parse_spf(raw: &str) -> SpfResult {
    let mut mechanisms = Vec::new();
    let mut warnings   = Vec::new();
    let mut lookup_count = 0usize;
    let mut all_qualifier = String::from("+"); 

    let parts: Vec<&str> = raw.split_whitespace().collect();

    // first token must be "v=spf1"
    if parts.first().map(|s| *s) != Some("v=spf1") {
        return SpfResult {
            version: String::new(),
            mechanisms: vec![],
            all_qualifier,
            lookup_count: 0,
            is_valid: false,
            warnings: vec!["Record does not start with v=spf1".into()],
        };
    }

    for token in &parts[1..] {
        let (qualifier, rest) = extract_qualifier(token);

        // split mechanism type from value (colon or slash separator)
        let (mtype, value) = if let Some(idx) = rest.find(':') {
            (&rest[..idx], Some(rest[idx + 1..].to_string()))
        } else if let Some(idx) = rest.find('/') {
            (&rest[..idx], Some(rest[idx + 1..].to_string()))
        } else {
            (rest, None)
        };

        // count DNS-lookup mechanisms (RFC 7208 §4.6.4: max 10)
        let mtype_lower = mtype.to_lowercase();
        if LOOKUP_MECHANISMS.contains(&mtype_lower.as_str()) {
            lookup_count += 1;
        }

        if mtype_lower == "all" {
            all_qualifier = qualifier.to_string();
        }

        mechanisms.push(SpfMechanism {
            r#type:    mtype_lower,
            value,
            qualifier: qualifier.to_string(),
        });
    }

    // rfc 7208: more than 10 DNS lookups is a permerror
    if lookup_count > 10 {
        warnings.push(format!(
            "Too many DNS lookup mechanisms ({}/10 max) — RFC 7208 §4.6.4",
            lookup_count
        ));
    }

    // Warn on permissive all
    if all_qualifier == "+" {
        warnings.push("+all makes SPF useless — any server can send as this domain".into());
    }

    // Warn if all is missing
    if !mechanisms.iter().any(|m| m.r#type == "all") {
        warnings.push("No 'all' mechanism found — record has no default action".into());
    }

    SpfResult {
        version: "spf1".into(),
        mechanisms,
        all_qualifier,
        lookup_count,
        is_valid: warnings.is_empty(),
        warnings,
    }
}

/// extract RFC 7208 qualifier prefix: +, -, ~, ?
/// returns (qualifier,rest_of_token)
fn extract_qualifier(token: &str) -> (&str, &str) {
    match token.chars().next() {
        Some('+') => ("+", &token[1..]),
        Some('-') => ("-", &token[1..]),
        Some('~') => ("~", &token[1..]),
        Some('?') => ("?", &token[1..]),
        _         => ("+", token), 
    }
}
