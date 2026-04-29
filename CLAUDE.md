# Claude Code Project Instructions — AQ Examples

Public-facing integration examples and demo site for [AnswerQuestions (AQ)](https://answerquestions.ai).

## Repo Structure

```
demo-site/       — Lakeside Sailing Academy demo (source of truth for deployed demo)
examples/
  01-public-embed/         — Minimal public chatbot embed
  02-authenticated-embed/  — JWT auth backend (Node + Python examples)
  03-web-table-source/     — Web table data source integration
docs/                      — JWT reference, web table guide
```

## Demo Site — Source of Truth

The `demo-site/` directory is the **authoritative source** for the demo content deployed to:

- **Production**: `lakeside.answerquestions.ai`
- **Staging**: `staging-lakeside.answerquestions.ai`

### How deployment works

The **saas repo** (`../saas/`) deploys demo files via `scripts/deploy_public_site.sh`, which reads from `../aq-examples/demo-site/` — not from a copy inside saas. Both repos must be checked out as siblings:

```
Solver_Collaborative_Mac/
  saas/            — main SaaS repo (deployment scripts, backend, UI)
  aq-examples/     — this repo (demo site source of truth)
```

### Domain architecture

A single Cloudflare wildcard rule (`*.answerquestions.ai`) routes every tenant subdomain to one AQ container. New tenants are provisioned by adding a Cosmos `directory` doc — no DNS, Cloudflare, or Clerk changes per tenant. The container resolves the tenant from the Host header and treats `<x>.answerquestions.ai` as equivalent to `<x>.com` (e.g., `lakeside.answerquestions.ai` ≡ `lakeside.com`).

### Environment-aware configuration

`demo-site/aq-config.js` detects the hostname at runtime and sets the correct API URLs:

| Hostname | AQ API | Token endpoint |
|----------|--------|----------------|
| `staging-lakeside.answerquestions.ai`, `localhost` | `app-staging.answerquestions.ai` | same-origin (Cloudflare → AQ container) |
| `lakeside.answerquestions.ai` | `app.answerquestions.ai` | same-origin (Cloudflare → AQ container) |

The token endpoint is reached on the demo subdomain itself — Cloudflare routes `<demo-subdomain>/answerquestions/demo/token` to the AQ container, which folds in what used to be a separate token server. No CORS preflight, no separate hostname.

All demo HTML pages include `aq-config.js` and load the AQ widget dynamically based on these URLs.

### Members page — authenticated mode

`demo-site/members.html` has a "Simulate Member Login" toggle that:
1. Fetches a short-lived demo JWT from the token server (`POST /answerquestions/demo/token`)
2. Calls `window.AQWidget.setAuthToken(token)` to switch the widget to authenticated mode
3. On toggle off, calls `window.AQWidget.setAuthToken(null)` to return to public mode

This demonstrates the PRD Section 10.6.2 authenticated embed security model end-to-end.

## Making changes

1. Edit files in `demo-site/`
2. Commit and push to this repo
3. Deploy via the saas repo: `source ../cr_sch_env_staging && ./scripts/deploy_public_site.sh` (or prod)

The saas repo's deploy script reads from `../aq-examples/demo-site/` at deploy time — no need to copy files between repos.
