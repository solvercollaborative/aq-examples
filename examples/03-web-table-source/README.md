# Example 03: Web Table Source

Connect a live web page table as an AQ data source. Instead of manually ingesting data into the knowledge base, AQ fetches the table on-demand with caching — so the chatbot always uses relatively fresh content.

## How It Works

AQ includes a native **Web Table Source** adapter. You configure it with:
- The URL of a web page containing an HTML table
- A column mapping (which columns map to which fields)
- An optional auth profile (for pages behind a login)
- A cache TTL (how long to cache fetched data before refreshing)

When a user asks a question that triggers the linked intent (e.g., "Is Maria Chen a member?"), AQ fetches the table, parses it, and uses the structured data to answer.

```
User question → AQ intent classifier → Web Table Source adapter
                                         ↓
                                     Fetch page (cached)
                                         ↓
                                     Extract HTML table
                                         ↓
                                     Apply column mapping
                                         ↓
                                     Lookup matching rows
                                         ↓
                                     LLM synthesizes answer
```

## Setup via Admin API

### 1. Create a web table source

```bash
# Replace with your AQ API URL and admin bearer token
AQ_API="https://app.answerquestions.ai"
TOKEN="your-clerk-admin-jwt"

curl -X POST "$AQ_API/answerquestions/admin/web-table-sources" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_domain": "engagewith.ai",
    "name": "Member Directory",
    "source_url": "https://demo.answerquestions.ai/directory.html",
    "table_selector": { "index": 0 },
    "columns": {
      "0": { "field": "first_name", "type": "text" },
      "1": { "field": "last_name", "type": "text" },
      "2": { "field": "email", "type": "text" },
      "3": { "field": "phone", "type": "text" },
      "4": { "field": "role", "type": "text" },
      "5": { "field": "member_since", "type": "text" }
    },
    "lookup_fields": ["email", "first_name", "last_name"],
    "cache_ttl_seconds": 600,
    "intent_id": "member.query"
  }'
```

### 2. Test the source

```bash
curl -X POST "$AQ_API/answerquestions/admin/web-table-sources/{source_id}/test" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tenant_domain": "engagewith.ai"}'
```

This fetches the page, parses the table, and returns sample rows so you can verify the column mapping is correct.

### 3. List configured sources

```bash
curl "$AQ_API/answerquestions/admin/web-table-sources?tenant_domain=engagewith.ai" \
  -H "Authorization: Bearer $TOKEN"
```

## Configuration Reference

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Human-readable name for this source |
| `source_url` | Yes | URL of the page containing the HTML table |
| `table_selector.index` | Yes | Which table on the page (0 = first table) |
| `columns` | Yes | Map of column index → `{field, type}` |
| `lookup_fields` | Yes | Which fields can be searched (e.g., `["email", "first_name"]`) |
| `cache_ttl_seconds` | No | How long to cache (default: 600 = 10 min) |
| `intent_id` | No | AQ intent that triggers this source (default: `member.query`) |
| `auth_profile_ref` | No | Reference to an auth profile for pages behind login |
| `enabled` | No | Whether this source is active (default: `true`) |

## Sample Table Page

The `sample-page/directory.html` file contains an example HTML table you can use for testing. If you're running the demo site, the table is at `https://demo.answerquestions.ai/directory.html`.

## Auth Profile (for pages behind login)

If the web page requires authentication, configure an auth profile first, then reference it:

```bash
# Create auth profile (stored securely in AQ)
curl -X POST "$AQ_API/answerquestions/admin/ingestion/credentials" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_domain": "engagewith.ai",
    "profile_ref": "my-directory-auth",
    "credential_type": "form_login",
    "login_url": "https://members.engagewith.ai/login",
    "username": "bot@engagewith.ai",
    "password": "...",
    "username_field": "Email",
    "password_field": "Password"
  }'

# Then reference it in the web table source config:
# "auth_profile_ref": "my-directory-auth"
```

## When to Use Web Table Sources vs. Knowledge Base Ingestion

| | Web Table Source | KB Ingestion |
|---|---|---|
| **Data freshness** | Near real-time (cached with TTL) | Snapshot at ingestion time |
| **Best for** | Structured data that changes frequently (directories, schedules, inventories) | Static content (policies, documentation, FAQs) |
| **Query style** | Lookup by field (email, name) | Semantic search (natural language) |
| **Setup** | Configure URL + column mapping | Crawl and ingest pages |

## Next Steps

- [Web Table Source Guide](../../docs/web-table-source-guide.md) — Detailed configuration reference
- [Example 01](../01-public-embed/) — Basic chatbot embed
- [Example 02](../02-authenticated-embed/) — Add user authentication
