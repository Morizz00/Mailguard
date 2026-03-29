
use std::collections::BTreeMap;
use crate::models::{MxResult, PriorityGroup, RawMX};

pub fn analyze_mx(records: &[RawMX]) -> MxResult {
    if records.is_empty() {
        return MxResult {
            primary_mx: String::new(),
            has_multiple_priorities: false,
            priority_groups: vec![],
            total_records: 0,
        };
    }

    // Group by priority (BTreeMap keeps keys sorted)
    let mut groups: BTreeMap<u16, Vec<String>> = BTreeMap::new();
    for rec in records {
        groups
            .entry(rec.priority)
            .or_default()
            .push(rec.host.trim_end_matches('.').to_string());
    }

    let priority_groups: Vec<PriorityGroup> = groups
        .iter()
        .map(|(&priority, hosts)| PriorityGroup {
            priority,
            hosts: hosts.clone(),
        })
        .collect();

    let primary_mx = priority_groups
        .first()
        .and_then(|g| g.hosts.first())
        .cloned()
        .unwrap_or_default();

    MxResult {
        primary_mx,
        has_multiple_priorities: priority_groups.len() > 1,
        priority_groups,
        total_records: records.len(),
    }
}