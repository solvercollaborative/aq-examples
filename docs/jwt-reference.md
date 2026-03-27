# JWT Reference

Complete specification for AQ customer JWT tokens used in authenticated chatbot embeds.

## Overview

When you embed the AQ chatbot on your website with user authentication, your backend generates a signed JWT token. The widget sends this token with every request via the `X-AQ-Auth-Token` header. AQ validates the signature and uses the claims to determine what content and tools the user can access.

## Token Format

- **Algorithm:** HS256 (HMAC-SHA256)
- **Secret:** Base64-encoded key provided by your AQ administrator
- **Transport:** `X-AQ-Auth-Token` HTTP header (set automatically by the widget)

## Claims

### Required

| Claim | Type | Description |
|-------|------|-------------|
| `sub` | string | Unique user identifier in your system |
| `email` | string | User's email address |
| `tenant` | string | Your tenant domain (e.g., `engagewith.ai`). Must match the tenant configured for your product key. |
| `exp` | integer | Expiration time as Unix timestamp. Recommended: 8 hours from issue time. |

### Optional

| Claim | Type | Description |
|-------|------|-------------|
| `iat` | integer | Issued-at timestamp (recommended for debugging) |
| `roles` | string[] | User roles (e.g., `["admin", "instructor"]`) |
| `level` | integer | Authorization level (0-5). Higher levels access more content. |
| `user_areas` | string[] | Area/group IDs the user belongs to |
| `leader_areas` | string[] | Area/group IDs the user leads/manages |

## Content Scoping

The presence and validity of a JWT determines what content the chatbot can access:

| Scenario | Content Scope | Intent Routing |
|----------|--------------|----------------|
| No JWT (product key only) | `tenant_public` | RAG-only (no LLM intent classifier) |
| Valid JWT | `tenant_public` + `tenant_private` | Full LLM classifier with tool access |
| Expired or invalid JWT | `tenant_public` (graceful fallback) | RAG-only |

## Validation

### Test endpoint

Verify your token before deploying:

```bash
curl -X POST https://app.answerquestions.ai/answerquestions/validate-token \
  -H "Content-Type: application/json" \
  -d '{
    "productKey": "YOUR_PRODUCT_KEY",
    "token": "eyJhbGciOiJIUzI1NiJ9..."
  }'
```

**Success response:**
```json
{
  "valid": true,
  "claims": {
    "sub": "user-123",
    "email": "user@engagewith.ai",
    "tenant": "engagewith.ai",
    "exp": 1711929600
  }
}
```

### Validation rules

AQ checks the following when validating a customer JWT:

1. **Signature** — Token must be signed with the correct HMAC secret for the product key
2. **Expiration** — `exp` claim must be in the future
3. **Subject** — `sub` claim must be present and non-empty
4. **Tenant match** — `tenant` claim must match the tenant configured for the product key

If any check fails, the request silently falls back to public-only mode. No error is returned to the user.

## Example Tokens

### Python (PyJWT)

```python
import base64, time, jwt

secret = base64.b64decode("your-base64-secret")
token = jwt.encode({
    "sub": "user-123",
    "email": "user@engagewith.ai",
    "tenant": "engagewith.ai",
    "exp": int(time.time()) + 8 * 3600,
    "iat": int(time.time()),
    "roles": ["member"],
}, secret, algorithm="HS256")
```

### Node (jsonwebtoken)

```javascript
const jwt = require('jsonwebtoken');
const secret = Buffer.from('your-base64-secret', 'base64');
const token = jwt.sign(
  { sub: 'user-123', email: 'user@engagewith.ai', tenant: 'engagewith.ai' },
  secret,
  { algorithm: 'HS256', expiresIn: '8h' }
);
```

## Security Best Practices

- **Server-side only:** Never expose the HMAC secret in frontend code
- **Short expiry:** Use 8-hour tokens for session-based access
- **HTTPS only:** Always serve your site over HTTPS when using authenticated embeds
- **Rotate secrets:** Coordinate with your AQ administrator to rotate secrets periodically
- **Restrict CORS:** In production, limit your token server's CORS origins to your specific domain
