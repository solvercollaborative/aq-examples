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
| `level` | integer | Authorization level (0-6). Determines tool and content access. See **Authorization Levels** below. |
| `exp` | integer | Expiration time as Unix timestamp. Recommended: 8 hours from issue time. |

### Optional

| Claim | Type | Description |
|-------|------|-------------|
| `iat` | integer | Issued-at timestamp (recommended for debugging) |
| `roles` | string[] | Pass-through roles (e.g., `["admin", "instructor"]`). Not used for AQ authorization — included in callbacks if AQ calls your APIs. |
| `user_areas` | string[] | Area/group IDs the user belongs to. Limits which content the user can see. Empty or omitted = tenant-wide (no restriction). |
| `leader_areas` | string[] | Area/group IDs the user leads/manages. Limits which users the leader can view. Empty or omitted = tenant-wide (no restriction). |

## Authorization Levels

The `level` claim controls what the user can do inside AQ:

| Level | Role | Tool Access | Content Scope |
|-------|------|-------------|---------------|
| 0 | None | No tools | Public only |
| 3 | Member | Read-only tenant tools (programs, schedules, instructors) | Public + private |
| 4 | Leader | Member tools + area-scoped management views | Public + private |
| 5 | Admin | All tenant tools including configuration and user management | Public + private |
| 6 | System | Cross-tenant access (internal use only) | All |

Set `level` to the highest role the user holds in your system. If a JWT is missing the `level` claim or it is not a valid integer, the token is rejected and the request falls back to public-only mode.

## Area Scoping

`user_areas` and `leader_areas` optionally restrict what a user can see within a tenant:

- **`user_areas`** — list of area/group IDs (e.g., program IDs) the user is enrolled in. When set, content queries are filtered to these areas. When empty or omitted, the user can see all tenant content appropriate for their level.
- **`leader_areas`** — list of area/group IDs the user manages. When set, management views (e.g., instructor lists) are scoped to these areas. When empty or omitted, the leader can see all users in the tenant.

Both fields accept `["*"]` as a wildcard meaning "all areas."

## Content Scoping

The presence and validity of a JWT determines what content the chatbot can access:

| Scenario | Content Scope | Intent Routing |
|----------|--------------|----------------|
| No JWT (product key only) | `tenant_public` | RAG-only (no LLM intent classifier) |
| Valid JWT | `tenant_public` + `tenant_private` | Full LLM classifier with tool access |
| Valid JWT with `level` >= 3 | `tenant_public` + `tenant_private` + `authorized` | Full access |
| Expired, invalid, or missing-level JWT | `tenant_public` (graceful fallback) | RAG-only |

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
    "level": 3,
    "exp": 1711929600
  }
}
```

### Validation rules

AQ checks the following when validating a customer JWT:

1. **Signature** — Token must be signed with the correct HMAC secret for the product key
2. **Expiration** — `exp` claim must be in the future
3. **Subject** — `sub` claim must be present and non-empty
4. **Level** — `level` claim must be present and a valid integer
5. **Tenant match** — `tenant` claim must match the tenant configured for the product key

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
    "level": 3,
    "exp": int(time.time()) + 8 * 3600,
    "iat": int(time.time()),
    "roles": ["member"],  # pass-through for your callbacks
}, secret, algorithm="HS256")
```

### Node (jsonwebtoken)

```javascript
const jwt = require('jsonwebtoken');
const secret = Buffer.from('your-base64-secret', 'base64');
const token = jwt.sign(
  {
    sub: 'user-123',
    email: 'user@engagewith.ai',
    tenant: 'engagewith.ai',
    level: 3,
    roles: ['member'],  // pass-through for your callbacks
  },
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
