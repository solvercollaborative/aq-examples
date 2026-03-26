# AQ Examples

Integration examples and tools for [AnswerQuestions (AQ)](https://answerquestions.ai) — an AI chatbot that answers questions using your organization's knowledge base.

**Live demo:** [demo.answerquestions.ai](https://demo.answerquestions.ai)

## Examples

### [01 — Public Embed](examples/01-public-embed/)
Embed the AQ chatbot on any website with a single `<script>` tag. No backend required.

### [02 — Authenticated Embed](examples/02-authenticated-embed/)
Add user authentication so members can access private content. Includes backend JWT token servers in **Python** (FastAPI) and **Node** (Express).

### [03 — Web Table Source](examples/03-web-table-source/)
Connect a live web page table as an AQ data source. AQ fetches and caches the table on-demand, so the chatbot always uses fresh data.

## Demo Site

The `demo-site/` directory contains a fictional business website (Lakeside Sailing Academy) that demonstrates all three integration patterns:

| Page | What it shows |
|------|---------------|
| [Home](demo-site/index.html) | Public chatbot embed |
| [Courses](demo-site/services.html) | Course catalog the chatbot can answer about |
| [About](demo-site/about.html) | Team and contact info |
| [Members](demo-site/members.html) | Auth toggle: public vs. authenticated chatbot modes |
| [Directory](demo-site/directory.html) | HTML table used by the web table source adapter |

## Quick Start

### Embed the chatbot (2 minutes)

Add this before `</body>` on your page:

```html
<script src="https://app.answerquestions.ai/static/aq-widget.js"
        data-api-url="https://app.answerquestions.ai"
        data-product-key="YOUR_PRODUCT_KEY"
        data-welcome-message="Ask me anything!"
        data-position="bottom-right">
</script>
```

### Add authentication (15 minutes)

1. Run the token server ([Python](examples/02-authenticated-embed/python/) or [Node](examples/02-authenticated-embed/node/))
2. After user login, call `POST /api/aq-token` to get a JWT
3. Pass it to the widget: `window.AQWidget.setAuthToken(token)`

See [Example 02](examples/02-authenticated-embed/) for complete code.

### Connect a web table (10 minutes)

Configure a web table source via the AQ admin API — no code to deploy. AQ fetches and caches the table on-demand.

See [Example 03](examples/03-web-table-source/) for API examples.

## Documentation

- [JWT Reference](docs/jwt-reference.md) — Token claims, signing, and troubleshooting
- [Web Table Source Guide](docs/web-table-source-guide.md) — Configuration and setup
- [Course Guide](docs/course-guide.md) — Maven cohort walkthrough

## Maven Cohort Course

This repo serves as the hands-on material for the AQ setup course:

1. **Understanding AQ** — Architecture, RAG pipeline, tenant model
2. **Public Embed** — Get a product key, embed the widget
3. **Authenticated Embed** — Generate JWTs, test with validate-token
4. **Data Integration** — Configure web table sources
5. **Knowledge Base Setup** — Ingest content via web crawl, PDF, manual entry
6. **Going to Production** — Domain setup, security checklist, monitoring

## License

MIT
