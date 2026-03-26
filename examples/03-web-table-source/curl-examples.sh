#!/usr/bin/env bash
# AQ Web Table Source — Admin API examples
#
# Prerequisites:
#   - An AQ admin account with root access
#   - A Clerk JWT token (get from browser dev tools or AQ admin UI)
#
# Usage:
#   export AQ_API="https://app.answerquestions.ai"
#   export AQ_TOKEN="your-clerk-admin-jwt"
#   export AQ_TENANT="your-tenant.example.com"
#   bash curl-examples.sh

set -euo pipefail

AQ_API="${AQ_API:?Set AQ_API to your AQ endpoint (e.g., https://app.answerquestions.ai)}"
AQ_TOKEN="${AQ_TOKEN:?Set AQ_TOKEN to your Clerk admin JWT}"
AQ_TENANT="${AQ_TENANT:?Set AQ_TENANT to your tenant domain}"

echo "=== Create a web table source ==="
SOURCE_RESP=$(curl -s -X POST "$AQ_API/answerquestions/admin/web-table-sources" \
  -H "Authorization: Bearer $AQ_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"tenant_domain\": \"$AQ_TENANT\",
    \"name\": \"Member Directory\",
    \"source_url\": \"https://demo.answerquestions.ai/directory.html\",
    \"table_selector\": { \"index\": 0 },
    \"columns\": {
      \"0\": { \"field\": \"first_name\", \"type\": \"text\" },
      \"1\": { \"field\": \"last_name\", \"type\": \"text\" },
      \"2\": { \"field\": \"email\", \"type\": \"text\" },
      \"3\": { \"field\": \"phone\", \"type\": \"text\" },
      \"4\": { \"field\": \"role\", \"type\": \"text\" },
      \"5\": { \"field\": \"member_since\", \"type\": \"text\" }
    },
    \"lookup_fields\": [\"email\", \"first_name\", \"last_name\"],
    \"cache_ttl_seconds\": 600,
    \"intent_id\": \"member.query\"
  }")

echo "$SOURCE_RESP" | python3 -m json.tool 2>/dev/null || echo "$SOURCE_RESP"
SOURCE_ID=$(echo "$SOURCE_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null || echo "")

if [ -n "$SOURCE_ID" ]; then
    echo ""
    echo "=== Test the source (fetch + parse) ==="
    curl -s -X POST "$AQ_API/answerquestions/admin/web-table-sources/$SOURCE_ID/test" \
      -H "Authorization: Bearer $AQ_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"tenant_domain\": \"$AQ_TENANT\"}" | python3 -m json.tool 2>/dev/null
fi

echo ""
echo "=== List all web table sources ==="
curl -s "$AQ_API/answerquestions/admin/web-table-sources?tenant_domain=$AQ_TENANT" \
  -H "Authorization: Bearer $AQ_TOKEN" | python3 -m json.tool 2>/dev/null
