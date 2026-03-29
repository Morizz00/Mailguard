use serde::{Deserialize, Serialize};

#[derive(Debug,Deserialize)]
pub struct Email{
    pub domain: String,
    pub spf_raw: Option<String>,
    pub dmarc_raw: Option<String>,
    pub mx_records: Option<Vec<RawMX>>,
}

#[derive(Debug, Deserialize)]
pub struct RawMX {
    pub host:     String,
    pub priority: u16,
}

#[derive(Debug, Serialize)]
pub struct ParseResponse {
    pub spf:   Option<SpfResult>,
    pub dmarc: Option<DmarcResult>,
    pub mx:    Option<MxResult>,
}

#[derive(Debug, Serialize)]
pub struct SpfResult {
    pub version:      String,
    pub mechanisms:   Vec<SpfMechanism>,
    pub all_qualifier: String,  
    pub lookup_count: usize,
    pub is_valid:     bool,
    pub warnings:     Vec<String>,
}

#[derive(Debug, Serialize)]
pub struct SpfMechanism {
    pub r#type:    String,    
    pub value:     Option<String>,
    pub qualifier: String,       
}


#[derive(Debug, Serialize)]
pub struct DmarcResult {
    pub version:          String,
    pub policy:           String,  
    pub subdomain_policy: String,
    pub pct:              u8,
    pub rua:              Vec<String>,
    pub ruf:              Vec<String>,
    pub adkim:            String,   
    pub aspf:             String,
    pub fo:               String,
    pub is_valid:         bool,
    pub warnings:         Vec<String>,
}


#[derive(Debug, Serialize)]
pub struct MxResult {
    pub primary_mx:             String,
    pub has_multiple_priorities: bool,
    pub priority_groups:        Vec<PriorityGroup>,
    pub total_records:          usize,
}

#[derive(Debug, Serialize)]
pub struct PriorityGroup {
    pub priority: u16,
    pub hosts:    Vec<String>,
}