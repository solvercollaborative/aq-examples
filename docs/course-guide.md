# AQ Setup Course Guide

Hands-on course for setting up an AQ-powered chatbot for your business. Each module builds on the previous one.

## Prerequisites

- A website where you want to embed the chatbot (or use the demo site)
- An AQ tenant (provided during the course)
- Basic familiarity with HTML and REST APIs
- Python 3.9+ or Node.js 18+ (for the JWT backend example)

## Module 1: Understanding AQ

**Goal:** Understand what AQ does and how it works.

### Key Concepts

- **Tenant** — Your organization's isolated space in AQ. Identified by your domain (e.g., `example.com`).
- **Knowledge Base** — The content AQ uses to answer questions. Built from your website, documents, and data sources.
- **RAG Pipeline** — Retrieval-Augmented Generation. AQ searches your knowledge base for relevant content, then uses an LLM to compose a natural-language answer with citations.
- **Product Key** — An API key that identifies your chatbot embed and scopes it to your tenant.
- **Intent** — The type of question a user is asking (e.g., "schedule query", "member lookup"). Determines how AQ routes the question.

### Architecture Overview

```
Your Website                    AQ Platform
┌─────────────┐                ┌──────────────────┐
│ aq-widget.js │───HTTP───────▶│ Intent Classifier │
│ (chat UI)    │               │        │          │
└─────────────┘               │        ▼          │
                               │  ┌───────────┐   │
                               │  │ RAG Search │   │
                               │  │ (pgvector) │   │
                               │  └─────┬─────┘   │
                               │        │          │
                               │        ▼          │
                               │  ┌───────────┐   │
                               │  │ LLM Answer │   │
                               │  │ Generation │   │
                               │  └───────────┘   │
                               └──────────────────┘
```

### Hands-On

1. Visit the [demo site](https://demo.answerquestions.ai)
2. Open the chatbot and ask a question about courses or the team
3. Notice how answers cite specific content from the knowledge base

---

## Module 2: Public Embed

**Goal:** Embed the AQ chatbot on a web page.

### Steps

1. Open [Example 01](../examples/01-public-embed/)
2. Replace `YOUR_PRODUCT_KEY` with the key provided for the course
3. Open `index.html` in a browser
4. Try asking questions in the chatbot

### What to observe

- The widget appears as a floating button in the bottom-right corner
- Answers come from the tenant's public knowledge base content
- No login is required — this is the simplest integration

### Configuration exercise

Try changing:
- `data-position` to `bottom-left`
- `data-theme` to `dark`
- `data-welcome-message` to a custom greeting

---

## Module 3: Authenticated Embed

**Goal:** Add user authentication so the chatbot can answer member-specific questions.

### Steps

1. Open [Example 02](../examples/02-authenticated-embed/)
2. Start the token server:
   ```bash
   cd examples/02-authenticated-embed/python
   pip install -r requirements.txt
   export AQ_HMAC_SECRET="<provided-during-course>"
   export AQ_TENANT_DOMAIN="<your-tenant>"
   uvicorn server:app --port 8000
   ```
3. Open `frontend/index.html` in a browser
4. Click "Login" to generate a JWT and set it on the widget
5. Ask a member-specific question (e.g., "Is Priya Patel a member?")

### What to observe

- Before login: chatbot answers general questions only
- After login: chatbot can access member directory and private content
- The JWT is sent with every request via `X-AQ-Auth-Token` header

### Token validation exercise

Test your token:
```bash
curl -X POST https://app.answerquestions.ai/answerquestions/validate-token \
  -H "Content-Type: application/json" \
  -d '{"productKey": "YOUR_KEY", "token": "YOUR_TOKEN"}'
```

---

## Module 4: Data Integration

**Goal:** Connect a live web table as an AQ data source.

### Steps

1. Open [Example 03](../examples/03-web-table-source/)
2. Review the sample directory table at `sample-page/directory.html`
3. Use the admin API to create a web table source config (see curl-examples.sh)
4. Test the source to verify table extraction
5. Ask the chatbot to look up a member from the table

### What to observe

- AQ fetches the table live (with caching) — no manual ingestion needed
- Changes to the source table are reflected after the cache TTL expires
- The column mapping determines which fields are searchable

---

## Module 5: Knowledge Base Setup

**Goal:** Ingest your own content into the AQ knowledge base.

### Content types

| Source | Method | Best for |
|--------|--------|----------|
| Website | Web crawl | Public pages, documentation |
| PDF files | Upload | Manuals, policies, handbooks |
| Manual entry | Admin UI | FAQs, custom Q&A pairs |
| Web tables | Table source | Directories, schedules (live) |

### Steps

1. Log into the AQ admin UI
2. Navigate to Knowledge > Sites
3. Add your website URL as a new ingestion job
4. Run a discovery to find all pages
5. Review and approve discovered pages
6. Run the ingestion to build the knowledge base
7. Test by asking the chatbot questions about your content

---

## Module 6: Going to Production

**Goal:** Deploy your AQ chatbot to your live website.

### Checklist

- [ ] Knowledge base content reviewed and complete
- [ ] Product key configured with your production domain(s)
- [ ] HMAC secret generated and stored securely (if using authenticated embed)
- [ ] Widget script tag added to your production pages
- [ ] CORS origins restricted to your domain
- [ ] JWT token expiry set appropriately (8 hours recommended)
- [ ] Web table sources configured (if applicable)
- [ ] Tested on mobile and desktop
- [ ] Team trained on the AQ admin UI for content updates

### Domain setup

To use a custom domain for the chatbot widget, contact your AQ administrator to configure:
- Domain allowlisting for your product key
- CORS origins for your domain
- SSL certificate (if using a custom widget hosting domain)
