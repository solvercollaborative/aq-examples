# Example 02: Authenticated Embed

Add user authentication to the AQ chatbot so members can access private content. Your backend generates a signed JWT token that the widget sends with every request.

## Architecture

```
User logs in → Your backend generates JWT → Frontend sets token on widget → AQ validates
```

## Quick Start

### 1. Start the token server

**Python:**
```bash
cd python
pip install -r requirements.txt
export AQ_HMAC_SECRET="<base64-encoded-secret>"
export AQ_TENANT_DOMAIN="your-tenant.example.com"
uvicorn server:app --port 8000
```

**Node:**
```bash
cd node
npm install
export AQ_HMAC_SECRET="<base64-encoded-secret>"
export AQ_TENANT_DOMAIN="your-tenant.example.com"
node server.js
```

### 2. Open the frontend

Open `frontend/index.html` in a browser. Click "Login" to get a JWT token from your local server and set it on the widget.

### 3. Test the token

Verify your token against AQ's validation endpoint:

```bash
curl -X POST https://app.answerquestions.ai/answerquestions/validate-token \
  -H "Content-Type: application/json" \
  -d '{"productKey": "YOUR_PRODUCT_KEY", "token": "eyJ..."}'
```

## JWT Specification

| Claim | Required | Description |
|-------|----------|-------------|
| `sub` | Yes | User ID (unique identifier in your system) |
| `email` | Yes | User's email address |
| `tenant` | Yes | Tenant domain (must match product key config) |
| `exp` | Yes | Expiration timestamp (Unix epoch) |
| `roles` | No | List of role strings (e.g., `["admin", "instructor"]`) |
| `level` | No | Authorization level integer (0-5) |
| `user_areas` | No | List of area IDs the user belongs to |
| `leader_areas` | No | List of area IDs the user leads |

**Algorithm:** HS256 (HMAC-SHA256)
**Header:** `X-AQ-Auth-Token`
**Secret:** Base64-encoded, provided by your AQ administrator

## How Content Scoping Works

| Auth Mode | Content Scope | Intent Routing |
|-----------|--------------|----------------|
| No auth (product key only) | `tenant_public` | RAG only (no LLM classifier) |
| Valid JWT | `tenant_public` + `tenant_private` | Full LLM classifier + tools |
| Invalid/expired JWT | Falls back to public | RAG only (graceful degradation) |

## Frontend Integration

After your user logs in, get a token and pass it to the widget:

```javascript
// After user authenticates with your auth system
const resp = await fetch('/api/aq-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        user_id: currentUser.id,
        email: currentUser.email,
        roles: currentUser.roles
    })
});
const { token } = await resp.json();

// Set on the AQ widget
window.AQWidget.setAuthToken(token);
```

On logout:
```javascript
window.AQWidget.setAuthToken(null);
```

## Security Notes

- Never expose `AQ_HMAC_SECRET` in frontend code — token generation must happen server-side
- Set reasonable expiry times (8 hours recommended for session tokens)
- The `tenant` claim in the JWT must match the tenant configured for your product key
- Invalid or expired tokens silently fall back to public-only mode (no error shown to user)
- Restrict CORS origins in production to your specific domain

## Next Steps

- [Example 03](../03-web-table-source/) — Connect a live web table as an AQ data source
- [JWT Reference](../../docs/jwt-reference.md) — Full JWT claims documentation
