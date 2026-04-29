/**
 * AQ Demo — Environment Configuration
 *
 * Detects the current hostname and sets the correct API and token server URLs.
 * Include this script before the AQ widget script tag on every demo page.
 *
 * Environments:
 *   lakeside.answerquestions.ai          →  app.answerquestions.ai (token via same-origin path)
 *   staging-lakeside.answerquestions.ai  →  app-staging.answerquestions.ai (token via same-origin path)
 *   localhost                            →  app-staging.answerquestions.ai (token via same-origin path)
 *
 * The token endpoint is served by the AQ container itself via Cloudflare's wildcard
 * route to *.answerquestions.ai. No separate token-server host required.
 */
(function () {
  'use strict';

  var host = location.hostname.toLowerCase();
  var isStaging = host.indexOf('staging-lakeside') === 0 || host === 'localhost' || host.indexOf('scschedstgweb') !== -1;
  var isProd = !isStaging && (host === 'lakeside.answerquestions.ai' || host.indexOf('scschedprodweb') !== -1);

  // Default to staging for safety
  var apiUrl = 'https://app-staging.answerquestions.ai';

  if (isProd) {
    apiUrl = 'https://app.answerquestions.ai';
  }

  // Token endpoint is same-origin under the demo subdomain — Cloudflare routes to AQ.
  // For localhost development, fall back to the staging API origin.
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
