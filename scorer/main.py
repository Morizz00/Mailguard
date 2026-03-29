import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
from dotenv import load_dotenv
from services.openrouter_client import score_with_openrouter


load_dotenv()

app = FastAPI(title="Mailguard Scorer", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)


class MXRecord(BaseModel):
    host: str
    priority: int


class MXParsed(BaseModel):
    primaryMx: str
    hasMultiplePriorities: bool
    priorityGroups: List[Dict] = []


class MXResult(BaseModel):
    present: bool
    records: List[MXRecord] = []
    parsed: Optional[MXParsed] = None


class SPFParsed(BaseModel):
    version: str
    mechanisms: List[Dict] = []
    allQualifier: Optional[str] = None
    lookupCount: int = 0
    isValid: bool
    warnings: List[str] = []


class SPFResult(BaseModel):
    present: bool
    rawRecord: Optional[str] = None
    parsed: Optional[SPFParsed] = None


class DMARCParsed(BaseModel):
    version: str
    policy: str
    subdomainPolicy: str
    pct: int
    rua: List[str] = []
    adkim: str
    aspf: str
    isValid: bool
    warnings: List[str] = []


class DMARCResult(BaseModel):
    present: bool
    rawRecord: Optional[str] = None
    parsed: Optional[DMARCParsed] = None


class ScoreRequest(BaseModel):
    domain: str
    mx: MXResult
    spf: SPFResult
    dmarc: DMARCResult


class ScoreBreakdown(BaseModel):
    mxScore: int
    spfScore: int
    dmarcScore: int
    maxPossible: int = 100


class ScoreResponse(BaseModel):
    score: int
    grade: str
    riskLevel: str
    summary: str
    recommendations: List[str]
    breakdown: ScoreBreakdown
    aiGenerated: bool = False


def _score_mx(req: ScoreRequest) -> int:
    """Score MX record configuration."""
    if not req.mx.present:
        return 0
    score = 25
    if req.mx.parsed and req.mx.parsed.hasMultiplePriorities:
        score += 5
    return score


def _score_spf(req: ScoreRequest) -> int:
    """Score SPF record configuration."""
    if not req.spf.present:
        return 0
    score = 20
    if p := req.spf.parsed:
        q = p.allQualifier or "~"
        score += {"-": 10, "~": 5, "?": 0, "+": -10}.get(q, 0)
        if not p.isValid:
            score -= 5
        if p.lookupCount > 10:
            score -= 5
    else:
        score += 5
    return max(0, min(35, score)) 


def _score_dmarc(req: ScoreRequest) -> int:
    """Score DMARC record configuration."""
    if not req.dmarc.present:
        return 0
    score = 15
    if p := req.dmarc.parsed:
        score += {"reject": 15, "quarantine": 8, "none": 0}.get(p.policy, 0)
        if p.pct == 100:
            score += 5
        elif p.pct >= 50:
            score += 2
        if p.rua:
            score += 2
        if not p.isValid:
            score -= 5
    else:
        score += 5
    return max(0, score)


def _grade(score: int) -> str:
    """Generate letter grade from score."""
    if score >= 90:
        return "A"
    elif score >= 75:
        return "B"
    elif score >= 50:
        return "C"
    elif score >= 25:
        return "D"
    else:
        return "F"


def _risk(s: int) -> str:
    """Map score to risk level."""
    if s >= 75:
        return "low"
    elif s >= 50:
        return "medium"
    elif s >= 25:
        return "high"
    else:
        return "critical"


def _recommendations(req: ScoreRequest) -> List[str]:
    """Generate security recommendations based on record analysis."""
    recs: List[str] = []

    if not req.mx.present:
        recs.append("Add MX records — without them no email can be delivered to this domain.")

    if not req.spf.present:
        recs.append("Add an SPF record (v=spf1 ... -all) to authorise your sending servers.")
    elif req.spf.parsed:
        q = req.spf.parsed.allQualifier or "~"
        if q == "+":
            recs.append("Change SPF from +all to -all — +all lets any server send as your domain.")
        elif q == "~":
            recs.append("Upgrade SPF soft-fail (~all) to hard-fail (-all) for stricter enforcement.")

    if not req.dmarc.present:
        recs.append("Add a DMARC record (_dmarc.yourdomain.com) to define a policy for failed auth.")
    elif req.dmarc.parsed:
        if req.dmarc.parsed.policy == "none":
            recs.append("Upgrade DMARC from p=none to p=quarantine or p=reject to enforce policy.")
        elif req.dmarc.parsed.policy == "quarantine":
            recs.append("Upgrade DMARC from p=quarantine to p=reject to fully block spoofed emails.")
        if req.dmarc.parsed.pct < 100:
            recs.append(f"Increase DMARC pct= from {req.dmarc.parsed.pct} to 100 to apply policy to all mail.")
        if not req.dmarc.parsed.rua:
            recs.append("Add rua= to your DMARC record to receive aggregate failure reports.")

    if req.mx.parsed and not req.mx.parsed.hasMultiplePriorities:
        recs.append("Add a backup MX record with a higher priority number for delivery redundancy.")

    while len(recs) < 3:
        recs.append("Monitor DMARC aggregate reports regularly to detect phishing using your domain.")

    return recs[:3]


def _summary(score: int, req: ScoreRequest) -> str:
    """Generate human-readable summary of email security posture."""
    missing = [
        k
        for k, v in [
            ("MX", req.mx.present),
            ("SPF", req.spf.present),
            ("DMARC", req.dmarc.present),
        ]
        if not v
    ]
    if score >= 90:
        return f"{req.domain} has excellent email security with all records properly configured."
    if missing:
        return f"{req.domain} is missing {', '.join(missing)} — email security is incomplete."
    return f"{req.domain} has basic email security configured but policies could be stricter."


def fallback_score(req: ScoreRequest) -> ScoreResponse:
    """Generate score using rule-based fallback when AI is unavailable."""
    mx = _score_mx(req)
    spf = _score_spf(req)
    dmarc = _score_dmarc(req)
    total = mx + spf + dmarc
    return ScoreResponse(
        score=total,
        grade=_grade(total),
        riskLevel=_risk(total),
        summary=_summary(total, req),
        recommendations=_recommendations(req),
        breakdown=ScoreBreakdown(mxScore=mx, spfScore=spf, dmarcScore=dmarc),
        aiGenerated=False,
    )


@app.get("/health")
def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "ai_available": bool(os.getenv("OPENROUTER_API_KEY")),
        "model": os.getenv("MODEL", "meta-llama/llama-3.3-70b-instruct:free"),
    }


@app.post("/score", response_model=ScoreResponse)
def score(req: ScoreRequest) -> ScoreResponse:
    """Score domain email security configuration. Uses AI if available, falls back to rule-based scoring."""
    data = score_with_openrouter(req)
    if data:
        try:
            return ScoreResponse(
                score=int(data["score"]),
                grade=data["grade"],
                riskLevel=data["riskLevel"],
                summary=data["summary"],
                recommendations=data["recommendations"][:3],
                breakdown=ScoreBreakdown(**data["breakdown"]),
                aiGenerated=True,
            )
        except Exception as e:
            print(f"Failed to parse AI response for {req.domain}: {e}")
    return fallback_score(req)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8080)))
