
mod models;
mod spf;
mod dmarc;
mod mx;

use axum::{extract::Json, response::Json as RJson, routing::post, Router};
use models::{Email, ParseResponse};
use std::net::SocketAddr;
use tracing::info;


#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter("info")
        .init();

    let app = Router::new()
        .route("/parse", post(parse_handler))
        .route("/health", axum::routing::get(|| async { "ok" }));

    let addr: SocketAddr = "0.0.0.0:7070".parse().unwrap();
    info!("Rust parser listening on {addr}");

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn parse_handler(Json(req): Json<Email>) -> RJson<ParseResponse> {
    info!("Parsing records for {}", req.domain);

    let spf = req.spf_raw.as_deref().map(spf::parse_spf);
    let dmarc = req.dmarc_raw.as_deref().map(dmarc::parse_dmarc);
    let mx = req.mx_records.as_deref().map(mx::analyze_mx);

    RJson(ParseResponse { spf, dmarc, mx })
}