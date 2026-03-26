/**
 * AQ Authenticated Embed — JWT Token Server (Node/Express)
 *
 * Minimal backend that generates HMAC-signed JWT tokens for authenticated
 * AQ chatbot embeds. Your website's login system calls this endpoint after
 * the user authenticates, then passes the token to the AQ widget.
 *
 * Usage:
 *   npm install
 *   export AQ_HMAC_SECRET="<base64-encoded-secret-from-aq-admin>"
 *   export AQ_TENANT_DOMAIN="your-tenant.example.com"
 *   node server.js
 *
 * Then from your frontend:
 *   POST http://localhost:8000/api/aq-token
 *   Body: {"user_id": "user123", "email": "user@example.com"}
 *   Response: {"token": "eyJ..."}
 */

const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors()); // Restrict to your domain in production

// --- Configuration ---
const HMAC_SECRET_B64 = process.env.AQ_HMAC_SECRET || "";
const TENANT_DOMAIN = process.env.AQ_TENANT_DOMAIN || "";
const TOKEN_EXPIRY_HOURS = parseInt(process.env.AQ_TOKEN_EXPIRY_HOURS || "8", 10);
const PORT = parseInt(process.env.PORT || "8000", 10);

app.post("/api/aq-token", (req, res) => {
  const { user_id, email, roles = [] } = req.body;

  if (!HMAC_SECRET_B64) {
    return res.status(500).json({ error: "AQ_HMAC_SECRET not configured" });
  }
  if (!TENANT_DOMAIN) {
    return res.status(500).json({ error: "AQ_TENANT_DOMAIN not configured" });
  }
  if (!user_id || !email) {
    return res.status(400).json({ error: "user_id and email are required" });
  }

  let secretBytes;
  try {
    secretBytes = Buffer.from(HMAC_SECRET_B64, "base64");
  } catch {
    return res.status(500).json({ error: "AQ_HMAC_SECRET is not valid base64" });
  }

  const now = Math.floor(Date.now() / 1000);
  const claims = {
    sub: user_id,
    email: email,
    tenant: TENANT_DOMAIN,
    iat: now,
    roles: roles,
  };

  const token = jwt.sign(claims, secretBytes, {
    algorithm: "HS256",
    expiresIn: TOKEN_EXPIRY_HOURS * 3600,
  });

  res.json({ token });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", tenant: TENANT_DOMAIN });
});

app.listen(PORT, () => {
  console.log(`AQ token server running on http://localhost:${PORT}`);
});
