"""AQ Authenticated Embed — JWT Token Server (Python/FastAPI)

Minimal backend that generates HMAC-signed JWT tokens for authenticated
AQ chatbot embeds. Your website's login system calls this endpoint after
the user authenticates, then passes the token to the AQ widget.

Usage:
    pip install -r requirements.txt
    export AQ_HMAC_SECRET="<base64-encoded-secret-from-aq-admin>"
    export AQ_TENANT_DOMAIN="engagewith.ai"
    uvicorn server:app --port 8000

Then from your frontend:
    POST http://localhost:8000/api/aq-token
    Body: {"user_id": "user123", "email": "user@engagewith.ai"}
    Response: {"token": "eyJ..."}
"""

import base64
import os
import time

import jwt
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="AQ Token Server")

# Allow requests from your frontend during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict to your domain in production
    allow_methods=["POST"],
    allow_headers=["*"],
)

# --- Configuration ---
# These must match what's configured in AQ for your product key.
HMAC_SECRET_B64 = os.environ.get("AQ_HMAC_SECRET", "")
TENANT_DOMAIN = os.environ.get("AQ_TENANT_DOMAIN", "")
TOKEN_EXPIRY_HOURS = int(os.environ.get("AQ_TOKEN_EXPIRY_HOURS", "8"))


class TokenRequest(BaseModel):
    user_id: str
    email: str
    roles: list[str] = []


@app.post("/api/aq-token")
def create_aq_token(req: TokenRequest):
    """Generate an HMAC-signed JWT for AQ authenticated embed."""
    if not HMAC_SECRET_B64:
        raise HTTPException(status_code=500, detail="AQ_HMAC_SECRET not configured")
    if not TENANT_DOMAIN:
        raise HTTPException(status_code=500, detail="AQ_TENANT_DOMAIN not configured")

    try:
        secret_bytes = base64.b64decode(HMAC_SECRET_B64)
    except Exception:
        raise HTTPException(status_code=500, detail="AQ_HMAC_SECRET is not valid base64")

    now = int(time.time())
    claims = {
        # Required claims
        "sub": req.user_id,
        "email": req.email,
        "tenant": TENANT_DOMAIN,
        "level": 3,  # Authorization level (0-6). 3 = tenant member with tool access.
        "exp": now + (TOKEN_EXPIRY_HOURS * 3600),
        "iat": now,
        # Optional claims
        "roles": req.roles,  # Pass-through: returned to your APIs if AQ calls back
    }

    token = jwt.encode(claims, secret_bytes, algorithm="HS256")
    return {"token": token}


@app.get("/health")
def health():
    return {"status": "ok", "tenant": TENANT_DOMAIN}
