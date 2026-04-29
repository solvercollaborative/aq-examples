# Plan: Retire engagewith.ai, move to *.answerquestions.ai subdomains

## Context

`aq-examples` currently uses `engagewith.ai` as both the demo site's hostname (`demo.engagewith.ai`) and the canonical tenant domain across every integration example, doc, and embedded sample data record (~70 references in 14+ files). We're retiring `engagewith.ai` entirely and moving to subdomains under `answerquestions.ai`. The demo will live at `lakeside.answerquestions.ai` with a fictional canonical tenant_id of `lakeside.com`.

The deeper objective is a marketing strategy where Solver can mint "AI Guide" tenants en masse for arbitrary companies — canonical tenant_id `acme.com`, served at `acme.answerquestions.ai` — without touching the company's DNS, Clerk, or website. For that to work, two non-negotiables fall out:

1. **AQ recognizes `<x>.com` ≡ `<x>.answerquestions.ai`** as the same tenant. A user's email `john@acme.com` and `john@acme.answerquestions.ai` both resolve to the same person under the same tenant. This lets Solver hand out real `*.answerquestions.ai` mailboxes to demo recipients without forging the customer's domain.
2. **Per-tenant config approaches zero.** Clerk: zero changes per tenant (single env-wide app). Cloudflare: a single wildcard rule covers all future tenants. New tenant = a Cosmos doc.

The marketing rollout itself is a separate session; this plan only delivers the technical foundation that makes it possible.

## Architecture Target

| Layer | Mechanism |
|---|---|
| DNS | Wildcard `*.answerquestions.ai` CNAME → Cloudflare |
| Edge routing | Cloudflare wildcard route → single AQ container |
| TLS | Cloudflare-managed wildcard cert covers `*.answerquestions.ai` |
| Container | Single AQ controller serves AQ APIs, demo site HTML, demo token endpoint — dispatched by Host header |
| Auth | Single Clerk app per env (no change); tenant identity from JWT claims + Host-based resolution |
| Tenant resolution | `<x>.answerquestions.ai` → tenant whose canonical id is `<x>.com` (or whose `embed_allowed_domains` list contains either form) |
| Provisioning | New tenant = new Cosmos `directory` doc with both domain forms in `embed_allowed_domains`. No DNS, Cloudflare, or Clerk work. |

## Part A — aq-examples changes

Repo: `/Users/alanstreet/Solver_Collaborative_Mac/aq-examples/`

### A1. Demo site config
- [demo-site/aq-config.js](demo-site/aq-config.js) — rewrite hostname detection table:
  - `lakeside.answerquestions.ai` → `app.answerquestions.ai`
  - `staging.lakeside.answerquestions.ai` (or `staging-lakeside.answerquestions.ai`) → `app-staging.answerquestions.ai`
  - `localhost` → `app-staging.answerquestions.ai`
- Token server URL: drop `server.engagewith.ai`. Use the same-origin path on the demo subdomain (e.g., `lakeside.answerquestions.ai/answerquestions/demo/token`) — Cloudflare routes it to the AQ container, no CORS preflight needed.

### A2. Demo HTML — staff emails and embedded sample data
- `demo-site/about.html:68` — contact email
- `demo-site/directory.html:54-126` — 10 staff records
- `demo-site/members.html:86-213` — staff list + hardcoded demo user `maria@engagewith.ai`
- Replace majority with `@lakeside.com` (mirrors the real-customer-domain canonical model). Deliberately seed 1–2 staff with `@lakeside.answerquestions.ai` so the demo itself exercises the domain equivalence.

### A3. Integration examples
- [examples/01-public-embed/README.md:46](examples/01-public-embed/README.md) — example domain
- [examples/02-authenticated-embed/](examples/02-authenticated-embed/):
  - `README.md:20,29` — `AQ_TENANT_DOMAIN="lakeside.com"`
  - `node/server.js:11,16` — comment example tenant + sample email
  - `frontend/index.html:91` — hardcoded demo email default
  - **No structural change.** Example 02 keeps its own local Node/Python server so downloaded code runs out of the box with no hosted dependency.
- [examples/03-web-table-source/](examples/03-web-table-source/):
  - `README.md:42,66,74,106-110` — `tenant_domain` values, curl examples, login creds, bot account email
  - `sample-page/directory.html:41-50` — 10 staff rows

### A4. Docs
- [docs/jwt-reference.md](docs/jwt-reference.md) lines 23, 91-92, 121-122, 138-139 — tenant field examples
- [docs/course-guide.md](docs/course-guide.md) lines 18, 47 — tenant definition + demo site link
- [docs/web-table-source-guide.md](docs/web-table-source-guide.md) lines 33, 35, 56, 65, 115 — `tenant_domain` examples + sample emails

### A5. Root-level
- [README.md](README.md) lines 5, 37-38 — live demo link + widget script src/API URLs
- [CLAUDE.md](CLAUDE.md) lines 20-21, 39-40 — rewrite the hostname routing table; document the wildcard-to-single-container architecture so future contributors don't add per-host hacks

### A6. Deployment
- [.github/workflows/deploy-demo.yml](.github/workflows/deploy-demo.yml) — retire if demo HTML now serves from the AQ container; otherwise update target hostname. Decide during B5 below.

## Part B — AQ backend domain equivalence

Repo: `/Users/alanstreet/Solver_Collaborative_Mac/saas/`

### B1. Domain equivalence helper (new)
- New module `ui/controller/app/services/domain_equivalence.py`:
  - `equivalent_tenant_keys(host: str) -> list[str]` — given any incoming host, return all candidate tenant identifiers. E.g., `lakeside.answerquestions.ai` → `["lakeside.answerquestions.ai", "lakeside.com"]`; `acme.com` → `["acme.com", "acme.answerquestions.ai"]`.
  - `canonical_tenant_key(host: str) -> str` — the `.com` form if applicable, else input.
  - Strips `www.` first (consolidate with existing `_bare_hostname` from [aq_web_ingestion.py:414](ui/controller/app/services/aq_web_ingestion.py)).
  - Pure function, unit-testable.

### B2. Tenant resolver — Host-based lookup
- [ui/controller/app/routes/answerquestions.py:325](ui/controller/app/routes/answerquestions.py) (`_resolve_tenant`) — extend the priority chain:
  1. JWT `tenant` claim (existing)
  2. `pageContext.tenantDomain` (existing)
  3. **NEW**: Host header → `equivalent_tenant_keys()` → first match against `embed_allowed_domains` or `tenant_id` in directory cache
  4. Email-domain fallback (existing)
- [ui/controller/app/services/directory_store.py:514](ui/controller/app/services/directory_store.py) (`_refresh_tenant_cache`) — add an alias index: `domain → tenant_id` built from each tenant's `embed_allowed_domains`. `O(1)` lookup at request time.

### B3. Tenant doc shape
- Reuse existing `embed_allowed_domains: string[]` as the alias source. No new field.
- Lakeside tenant doc:
  ```json
  {
    "id": "tenant:lakeside.com",
    "tenant_id": "lakeside.com",
    "display_name": "Lakeside Sailing Academy",
    "embed_allowed_domains": [
      "lakeside.com",
      "lakeside.answerquestions.ai",
      "staging.lakeside.answerquestions.ai",
      "localhost"
    ],
    "demo_token_enabled": true,
    ...
  }
  ```

### B4. Demo token endpoint (folded in)
- New route `POST /answerquestions/demo/token` in [ui/controller/app/routes/answerquestions.py](ui/controller/app/routes/answerquestions.py).
- Accepts: `email` (required); tenant resolved from Host header via B2 chain.
- **Gate**: signs only when target tenant doc has `demo_token_enabled: true`. Real customer tenants stay opt-in for this surface.
- Reuses existing JWT signing material; emits the same claim shape example 02 produces locally so the widget can't tell the difference.

### B5. Static demo serving — pick one
- **Option (a)**: AQ container serves `aq-examples/demo-site/` static files when Host matches a tenant with `serves_demo_site: true`. Demo content baked into container image at deploy time. Single-origin, no separate static host. Retires `deploy-demo.yml`.
- **Option (b)**: Cloudflare Pages serves `demo-site/` (auto-deploy from this repo). Cloudflare wildcard routes everything else to the AQ container. Two origins, but cleaner separation and the existing `deploy-demo.yml` keeps working.

Recommendation: **(a)** — aligns with "coerce everything to the single container" goal and removes a deploy surface. The trade-off is that demo content updates require an AQ container build; given how rarely the Lakeside HTML changes that's acceptable.

### B6. CORS
- [ui/controller/app/main.py](ui/controller/app/main.py) — confirm middleware accepts `*.answerquestions.ai` Origin pattern. If not, extend the matcher to allow wildcard subdomain origins.

### B7. Person knowledge, PII keying — verify invariant
- Person knowledge ([aq_person_knowledge_store.py](ui/controller/app/services/aq_person_knowledge_store.py)) is partitioned by `/tenant_id`. As long as B2 resolves both domain forms to the same canonical `tenant_id` at request entry, downstream stores need no change.
- PII tokenizer scope is person-scoped, so already insensitive to which domain form arrived.
- **Action**: add a regression test that fires two requests, one to `lakeside.com` and one to `lakeside.answerquestions.ai`, and confirms they hit the same person knowledge partition. Document the invariant: "alias resolution is at the edge; downstream code may assume canonical tenant_id."

## Part C — Infrastructure

### C1. Cloudflare
- DNS: wildcard `*.answerquestions.ai` CNAME → AQ container origin (or worker route).
- TLS: confirm Cloudflare's universal cert covers `*.answerquestions.ai`. If not, provision wildcard.
- One route rule: `*.answerquestions.ai/*` → AQ origin. Existing explicit rules for `app.answerquestions.ai` and `app-staging.answerquestions.ai` either stay (more specific, takes precedence) or are absorbed into the wildcard.

### C2. Clerk
- No change. Confirmed: single env-wide app per env (`AQ_CLERK_PUBLISHABLE_KEY`); tenant identity comes from JWT custom claims, not Clerk app config.

### C3. DNS sunset for engagewith.ai
- Retire `demo.engagewith.ai`, `staging-demo.engagewith.ai`, `server.engagewith.ai`. Add 301 redirects to the new equivalents for at least 30 days to catch bookmarks and inbound links from past course materials.
- Domain registration itself stays for now (separate decision; out of scope).

## Part D — Tenant data migration

Existing `engagewith.ai` tenant in Cosmos has accumulated person knowledge, KG nodes, chunks, claims, and (on staging) classifier lineage. Two paths:

1. **In-place rename** — `tenant_id: engagewith.ai` → `lakeside.com`, update partition keys on every dependent record. Preserves data but is a destructive cross-container operation.
2. **New tenant + migration** — provision fresh `lakeside.com` tenant; copy/relink derivative records via the existing `cosmos_sor_promote.py` flow. Slower but reversible.

Recommendation: **(2)**. Snapshot first (`prod_data/cosmos_snapshots/`), then promote `lakeside.com` from staging using `cosmos_sor_promote.py --replace-all`. Retire `engagewith.ai` tenant doc only after parity verified end-to-end (intent eval + journey+person eval show no regression).

## Critical files

aq-examples (mechanical replace + reconfig):
- `demo-site/aq-config.js`, `demo-site/{about,directory,members}.html`
- `examples/01-public-embed/README.md`
- `examples/02-authenticated-embed/{README.md,node/server.js,frontend/index.html}`
- `examples/03-web-table-source/{README.md,sample-page/directory.html}`
- `docs/{jwt-reference,course-guide,web-table-source-guide}.md`
- `CLAUDE.md`, `README.md`, `.github/workflows/deploy-demo.yml`

saas (architectural):
- **NEW** `ui/controller/app/services/domain_equivalence.py`
- `ui/controller/app/routes/answerquestions.py` — `_resolve_tenant`, new `/answerquestions/demo/token` route
- `ui/controller/app/services/directory_store.py` — alias index in tenant cache
- `ui/controller/app/services/aq_web_ingestion.py` — consolidate `_bare_hostname` into new helper
- `ui/controller/app/main.py` — CORS wildcard subdomain matcher
- (option a) container build wiring to bake `aq-examples/demo-site/` static files

## Verification

### Local
- `examples/02-authenticated-embed/` runs as before (`npm start` / `python server.py`) and signs JWTs for `lakeside.com`. **No hosted dependency.**
- `examples/03-web-table-source/` curl examples succeed against staging with `tenant_domain=lakeside.com`.
- Unit tests on new `domain_equivalence.py`: round-trip both directions, `www.` stripping, leave non-equivalent domains alone (`acme.org` ≠ `acme.com`).

### Staging
- `lakeside.answerquestions.ai` resolves through wildcard → AQ container, serves Lakeside demo HTML.
- "Simulate Member Login" toggle on `members.html` fetches a JWT from same-origin `/answerquestions/demo/token`, widget switches to authenticated mode.
- AQ widget queries succeed regardless of whether the calling page is `lakeside.com` or `lakeside.answerquestions.ai`. JWT-only requests with `tenant_domain=lakeside.com` and `tenant_domain=lakeside.answerquestions.ai` both resolve to the same Cosmos partition (verified via log assertion).
- **En-masse smoke test**: provision a fresh `acme.com` tenant doc by hand; browse `acme.answerquestions.ai`. Confirm tenant resolves with **zero** Cloudflare/Clerk/DNS work — only the Cosmos doc.

### Prod
- Run intent eval + journey+person eval against `lakeside.com` post-migration. Compare to `engagewith.ai` baseline. Bar: zero regression.
- Grep deployed demo pages and downloaded example READMEs for `engagewith` — must be zero hits.

## Open questions / follow-ups

- Plan-file location: per repo convention this should live at `aq-examples/.claude/plans/`. The plan-mode harness wrote it to `~/.claude/plans/`; the first implementation step is to move it.
- Static demo serving option (a) vs (b) — recommended (a), but defer the final call until the saas team weighs in on container build size impact.
- Marketing en-masse minting tooling (CLI to provision a tenant doc + bake a "company-aware" demo) — separate session.
- Engagewith.ai domain registration sunset — separate decision; the registration may be kept defensively even after all DNS records are retired.
- Per-tenant demo content customization — out of scope for this plan; the demo at every `<x>.answerquestions.ai` shows the same Lakeside content until a future plan introduces per-tenant skinning.
