# Web Table Source Guide

Configure AQ to fetch and query live HTML tables from any web page. Unlike knowledge base ingestion (which creates a static snapshot), web table sources fetch data on-demand with caching, keeping the chatbot's answers fresh.

## When to Use

Web table sources are ideal for **structured data that changes frequently**:
- Member directories
- Event schedules and calendars
- Product inventories and pricing
- Staff rosters and contact lists

For static content (policies, FAQs, documentation), use standard KB ingestion instead.

## Setup

### 1. Identify the table

Find the web page URL and note:
- Which table on the page (if multiple, count from 0)
- The column order and what each column contains
- Whether the page requires authentication

### 2. Create the source config

Use the AQ admin API to register the web table source:

```bash
curl -X POST "$AQ_API/answerquestions/admin/web-table-sources" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_domain": "engagewith.ai",
    "name": "Staff Directory",
    "source_url": "https://intranet.engagewith.ai/staff",
    "table_selector": { "index": 0 },
    "columns": {
      "0": { "field": "first_name", "type": "text" },
      "1": { "field": "last_name", "type": "text" },
      "2": { "field": "email", "type": "text" },
      "3": { "field": "department", "type": "text" },
      "4": { "field": "title", "type": "text" }
    },
    "lookup_fields": ["email", "first_name", "last_name"],
    "cache_ttl_seconds": 300,
    "intent_id": "member.query"
  }'
```

### 3. Test it

```bash
curl -X POST "$AQ_API/answerquestions/admin/web-table-sources/{id}/test" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tenant_domain": "engagewith.ai"}'
```

The test endpoint fetches the page, parses the table, and returns sample rows so you can verify column mapping.

### 4. Try it in the chatbot

Ask the chatbot a question that triggers the linked intent:
- "Is Jane Smith a member?"
- "What department is john@engagewith.ai in?"
- "Look up Maria Chen"

## Configuration Reference

### Core fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Display name for this source |
| `source_url` | string | Yes | URL of the page with the HTML table |
| `table_selector` | object | Yes | Which table to extract |
| `table_selector.index` | integer | Yes | Table index (0 = first table on page) |
| `columns` | object | Yes | Column index → field mapping |
| `lookup_fields` | string[] | Yes | Fields available for search |

### Column mapping

Each entry in `columns` maps a zero-based column index to a field definition:

```json
{
  "0": { "field": "first_name", "type": "text" },
  "1": { "field": "last_name", "type": "text" },
  "2": { "field": "email", "type": "text" }
}
```

Use `"type": "text"` for all fields currently. Future versions may support `"type": "date"` and `"type": "number"` for richer parsing.

Columns not included in the mapping are ignored.

### Optional fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `cache_ttl_seconds` | integer | 600 | How long to cache fetched data (seconds). Set to 0 for no caching. |
| `intent_id` | string | `member.query` | AQ intent that triggers this source |
| `auth_profile_ref` | string | null | Auth profile for pages behind login |
| `enabled` | boolean | true | Whether this source is active |

### Authentication

For pages behind a login, first create an auth profile, then reference it:

**Form login** (username/password):
```json
{
  "auth_profile_ref": "my-intranet-auth",
  "credential_type": "form_login",
  "login_url": "https://intranet.engagewith.ai/login",
  "username_field": "Email",
  "password_field": "Password"
}
```

**Cookie-based:**
```json
{
  "auth_profile_ref": "my-cookie-auth",
  "credential_type": "cookie",
  "cookies": { "session_id": "..." }
}
```

**Bearer token:**
```json
{
  "auth_profile_ref": "my-api-auth",
  "credential_type": "bearer",
  "token_env": "MY_API_TOKEN"
}
```

## Caching Behavior

- First request after cache expiry fetches the page live (adds ~1-3 seconds)
- Subsequent requests within the TTL use cached data (instant)
- Cache is per-source, stored in-memory on the AQ server
- Restarting the AQ server clears all caches
- Set `cache_ttl_seconds: 0` to disable caching (every lookup fetches live)

## Troubleshooting

**"No tables found on page"**
- Verify the URL loads an HTML page with `<table>` elements
- Check if the page requires JavaScript rendering (AQ fetches raw HTML only)
- Try the URL in a browser and view page source to confirm tables are in the HTML

**Auth failures (HTTP 401/403)**
- Verify the auth profile credentials are correct
- Check that the login URL and form field names match the target site
- Test the auth profile via the ingestion credentials validation endpoint

**Wrong data in results**
- Use the `/test` endpoint to inspect parsed rows
- Verify column indices match the actual table structure
- Check if the page has multiple tables and adjust `table_selector.index`

**Stale data**
- Reduce `cache_ttl_seconds` for more frequent refreshes
- Use the admin UI to manually clear the cache
