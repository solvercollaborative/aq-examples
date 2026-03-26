# Example 01: Public Embed

The simplest AQ chatbot integration. Add a single `<script>` tag to your website — no backend code required.

## Quick Start

1. Get a **product key** from your AQ admin dashboard
2. Add your website domain to the embed key allowlist
3. Paste this snippet before `</body>` on any page:

```html
<script src="https://app.scheduleclass.com/static/aq-widget.js"
        data-api-url="https://app.scheduleclass.com"
        data-product-key="YOUR_PRODUCT_KEY"
        data-welcome-message="Hi! Ask me anything."
        data-position="bottom-right"
        data-theme="light">
</script>
```

## Configuration

| Attribute | Required | Description |
|-----------|----------|-------------|
| `data-api-url` | Yes | Your AQ API endpoint |
| `data-product-key` | Yes | Product key from admin dashboard |
| `data-position` | No | `bottom-right` (default) or `bottom-left` |
| `data-theme` | No | `light` (default) or `dark` |
| `data-welcome-message` | No | Custom greeting shown when chat opens |
| `data-page-name` | No | Override automatic page name detection |
| `data-tenant-domain` | No | Tenant domain (usually auto-resolved from product key) |

## How It Works

- The widget loads as a floating chat button (bottom corner of the page)
- Clicking it opens a chat panel
- Questions are answered using your tenant's **public** knowledge base content (`tenant_public` scope)
- No user authentication is needed — anyone visiting your site can use the chatbot
- Conversation IDs are persisted in `localStorage` for session continuity

## Domain Allowlisting

Your product key is configured with a list of allowed domains. The widget will only work on pages served from those domains. To add a domain:

1. Contact your AQ administrator
2. Provide the domain(s) where you'll embed the widget (e.g., `www.example.com`, `localhost`)
3. The admin updates `AQ_EMBED_KEYS` to include your domain

## Next Steps

- [Example 02](../02-authenticated-embed/) — Add user authentication for member-only content
- [Example 03](../03-web-table-source/) — Connect a live web table as an AQ data source
