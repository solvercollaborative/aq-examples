/**
 * AQ Demo — Environment Configuration
 *
 * Detects the current hostname and sets the correct API and token server URLs.
 * Include this script before the AQ widget script tag on every demo page.
 *
 * Environments:
 *   staging-demo.engagewith.ai  →  app-staging.answerquestions.ai
 *   demo.engagewith.ai          →  app.answerquestions.ai (token via server.engagewith.ai)
 *   demo.answerquestions.ai     →  app.answerquestions.ai (token via server.engagewith.ai)
 *   localhost                   →  app-staging.answerquestions.ai
 */
(function () {
  'use strict';

  var host = location.hostname.toLowerCase();
  var isStaging = host.includes('staging-demo') || host === 'localhost' || host.includes('scschedstgweb');
  var isProd = !isStaging && (host.includes('demo.engagewith.ai') || host.includes('demo.answerquestions.ai') || host.includes('scschedprodweb'));

  // Default to staging for safety
  var apiUrl = 'https://app-staging.answerquestions.ai';
  var tokenServerUrl = 'https://app-staging.answerquestions.ai';

  if (isProd) {
    apiUrl = 'https://app.answerquestions.ai';
    tokenServerUrl = 'https://server.engagewith.ai';
  }

  window.__aqDemoConfig = {
    apiUrl: apiUrl,
    tokenServerUrl: tokenServerUrl,
    widgetScriptUrl: apiUrl + '/static/aq-widget.js',
    isStaging: isStaging,
    isProd: isProd,
  };
})();
