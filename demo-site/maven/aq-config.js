/**
 * AQ Demo — Environment Configuration (Maven AI Guide)
 *
 * Detects the current hostname and sets the correct AQ API origin. Include
 * this script before the AQ widget script tag on every demo page.
 *
 * Environments:
 *   staging-maven.answerquestions.ai  →  app-staging.answerquestions.ai (staging lane)
 *   maven.answerquestions.ai          →  app.answerquestions.ai (prod lane)
 *   localhost                         →  app-staging.answerquestions.ai (local dev)
 *
 * The staging-<tenant> subdomain is routed to the staging container by the
 * Cloudflare worker, and the embedded widget calls the staging AQ API — so the
 * whole demo (shell, tenant, crawled content) lives on the staging lane until
 * the tenant is promoted to prod. The token endpoint is same-origin under the
 * demo subdomain; Cloudflare's wildcard route delivers it to the AQ container.
 */
(function () {
  'use strict';

  var host = location.hostname.toLowerCase();
  var isStaging = host.indexOf('staging-maven') === 0 || host === 'localhost';
  var isProd = !isStaging && host === 'maven.answerquestions.ai';

  // Default to staging for safety (matches the staging-only rollout posture).
  var apiUrl = 'https://app-staging.answerquestions.ai';

  if (isProd) {
    apiUrl = 'https://app.answerquestions.ai';
  }

  // Token endpoint is same-origin under the demo subdomain — Cloudflare routes
  // it to AQ. For localhost development, fall back to the staging API origin.
  var tokenServerUrl = (host === 'localhost')
    ? apiUrl
    : location.origin;

  window.__aqDemoConfig = {
    apiUrl: apiUrl,
    tokenServerUrl: tokenServerUrl,
    widgetScriptUrl: apiUrl + '/static/aq-widget.js',
    isStaging: isStaging,
    isProd: isProd,
  };
})();
