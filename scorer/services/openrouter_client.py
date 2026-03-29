import json, os, httpx
from typing import Optional, Dict


OPENROUTER_URL="https://openrouter.ai/api/v1/chat/completions"
MODEL=os.getenv("MODEL", "meta-llama/llama-3.3-70b-instruct:free")

SYSTEM_PROMPT="""You are an expert email security auditor.
You will receive DNS data for a domain in JSON format.
Respond with ONLY a valid JSON object — no explanation, no markdown, no code blocks.

Response schema (all fields required):
{
  "score": <integer 0-100>,
  "grade": <"A"|"B"|"C"|"D"|"F">,
  "riskLevel": <"low"|"medium"|"high"|"critical">,
  "summary": <one sentence describing the overall security posture>,
  "recommendations": [<exactly 3 specific, actionable strings>],
  "breakdown": {
    "mxScore": <0-30>,
    "spfScore": <0-35>,
    "dmarcScore": <0-35>,
    "maxPossible": 100
  }
}

Scoring rubric:
MX (0-30): present=25pts, multiple priority groups=+5pts
SPF (0-35): present=20pts, -all=+10, ~all=+5, ?all=0, +all=-10, lookups>10=-5, invalid=-5
DMARC (0-35): present=15pts, reject=+15, quarantine=+8, none=+0, pct=100=+5, pct>=50=+2, rua present=+2, invalid=-5

Grades: A=90+, B=75-89, C=50-74, D=25-49, F=0-24
Risk:   low=75+, medium=50-74, high=25-49, critical=0-24

Be specific in recommendations — use actual values from the data.
Example: "Upgrade DMARC from p=quarantine to p=reject" not "improve DMARC policy"."""


def score_with_openrouter(req) -> Optional[Dict]:
    api_key=os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        print("OPENROUTER_API_KEY not set")
        return None
    dns_data={
        "domain": req.domain,
        "mx":{
            "present": req.mx.present,
            "recordCount": len(req.mx.records),
            "parsed":req.mx.parsed.model_dump() if req.mx.parsed else None,
        },
        "spf":{
            "present": req.spf.present,
            "rawRecord": len(req.spf.rawRecord),
            "parsed":req.spf.parsed.model_dump() if req.spf.parsed else None,
        },
        "dmarc":{
            "present": req.dmarc.present,
            "rawRecord": len(req.dmarc.rawRecord),
            "parsed":req.dmarc.parsed.model_dump() if req.dmarc.parsed else None,
        },
    }
    try:
        response=httpx.post(
            headers={
            "Authorization": f"Bearer {api_key}",
            "content-type":"application/json",
            "HTTP-Referer":"https:mailguard.local" ,
            },
            json={
                
                "model": MODEL,
                "max_tokens": 512,
                "messages":[
                    {"role":"system","content": SYSTEM_PROMPT},
                    {"role":"user","content": f"Analyze this domain's email security:\n\n{json.dumps(dns_data,indent=2)}"},
                ],
                "temperature": 0.2,
                "max_tokens": 500,
            },
            timeout=10.0,
        )
        response.raise_for_status()
        raw=response.json()["choices"][0]["message"]["content"].strip()
        
        if raw.startswith("```"):
            raw=raw.split("```")[1]  # handle markdown code block
            if raw.startswith("json"):
                raw=raw[4:]
        return json.loads(raw)
    except Exception as e:
        print(f"Error scoring with OpenRouter for domain {req.domain}: {e}")
        return None   