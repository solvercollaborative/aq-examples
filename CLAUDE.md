# Claude Code Project Instructions — AQ Examples

Integration examples and a worked demo site for [AnswerQuestions (AQ)](https://answerquestions.ai). This repo is for developers adding AQ to their own website — the examples are reference implementations to adapt, not a product to fork in place.

## Repo Structure

```
demo-site/       — Worked example: a fictional business site wiring all three patterns together
examples/
  01-public-embed/         — Minimal public chatbot embed
  02-authenticated-embed/  — JWT auth backend (Node + Python examples)
  03-web-table-source/     — Web table data source integration
docs/                      — JWT reference, web table guide
```

## Using these examples

Pick the pattern that matches what you're building:

| You want to… | Start with |
|--------------|-----------|
| Drop a chatbot onto a public page | [`examples/01-public-embed/`](examples/01-public-embed/) |
| Gate the chatbot behind your own user login | [`examples/02-authenticated-embed/`](examples/02-authenticated-embed/) (Python or Node JWT server) |
| Feed live HTML-table data into AQ | [`examples/03-web-table-source/`](examples/03-web-table-source/) |

See [`README.md`](README.md) for the Quick Start, and [`docs/`](docs/) for the JWT and web-table-source references.

## Demo site

The `demo-site/` directory is a fictional "Lakeside Sailing Academy" site that wires all three integration patterns together end-to-end. Treat it as a worked example to read — adapt individual pieces into your own site rather than copying `demo-site/` wholesale.

### Hostname-aware config (pattern to copy)

`demo-site/aq-config.js` detects the page's hostname at runtime and selects the matching AQ API URL. This is the pattern most integrators will want: keep one config file, point it at your staging API on a staging host and your production API on a production host. All demo HTML pages include `aq-config.js` and load the AQ widget dynamically based on what it returns.

### Authenticated-mode toggle

`demo-site/members.html` has a "Simulate Member Login" toggle that demonstrates switching the widget between public and authenticated modes:

1. Fetches a short-lived JWT from a token endpoint (`POST /answerquestions/demo/token`)
2. Calls `window.AQWidget.setAuthToken(token)` to switch the widget to authenticated mode
3. On toggle off, calls `window.AQWidget.setAuthToken(null)` to return to public mode

In your own site, replace step 1 with your own token endpoint backed by your existing user-auth system. The token-server code in [`examples/02-authenticated-embed/`](examples/02-authenticated-embed/) shows both Python and Node implementations.
