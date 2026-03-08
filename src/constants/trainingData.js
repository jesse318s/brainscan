// Vulnerability training data for BrainScan
// Each entry maps binary code feature flags to a normalized risk score (0 = safe, 1 = critical).
// Features correspond to patterns commonly associated with OWASP Top 10 vulnerabilities.

const scanTrainingData = [
  // --- No dangerous patterns (clean code) ---
  {
    input: { has_eval: 0, has_inner_html: 0, has_document_write: 0, has_sql: 0, has_exec: 0, has_unvalidated_input: 0, has_dynamic_import: 0, has_http_request: 0 },
    output: { risk: 0.02 },
  },

  // --- Single-pattern detections ---

  // eval() — arbitrary code execution risk
  {
    input: { has_eval: 1, has_inner_html: 0, has_document_write: 0, has_sql: 0, has_exec: 0, has_unvalidated_input: 0, has_dynamic_import: 0, has_http_request: 0 },
    output: { risk: 0.55 },
  },
  // .innerHTML assignment — DOM-based XSS vector
  {
    input: { has_eval: 0, has_inner_html: 1, has_document_write: 0, has_sql: 0, has_exec: 0, has_unvalidated_input: 0, has_dynamic_import: 0, has_http_request: 0 },
    output: { risk: 0.35 },
  },
  // document.write() — legacy XSS vector
  {
    input: { has_eval: 0, has_inner_html: 0, has_document_write: 1, has_sql: 0, has_exec: 0, has_unvalidated_input: 0, has_dynamic_import: 0, has_http_request: 0 },
    output: { risk: 0.30 },
  },
  // SQL query patterns — SQL injection risk
  {
    input: { has_eval: 0, has_inner_html: 0, has_document_write: 0, has_sql: 1, has_exec: 0, has_unvalidated_input: 0, has_dynamic_import: 0, has_http_request: 0 },
    output: { risk: 0.40 },
  },
  // exec() / spawn() — OS command injection risk
  {
    input: { has_eval: 0, has_inner_html: 0, has_document_write: 0, has_sql: 0, has_exec: 1, has_unvalidated_input: 0, has_dynamic_import: 0, has_http_request: 0 },
    output: { risk: 0.60 },
  },
  // Unvalidated user input access only
  {
    input: { has_eval: 0, has_inner_html: 0, has_document_write: 0, has_sql: 0, has_exec: 0, has_unvalidated_input: 1, has_dynamic_import: 0, has_http_request: 0 },
    output: { risk: 0.20 },
  },
  // Dynamic require/import — supply chain / code injection risk
  {
    input: { has_eval: 0, has_inner_html: 0, has_document_write: 0, has_sql: 0, has_exec: 0, has_unvalidated_input: 0, has_dynamic_import: 1, has_http_request: 0 },
    output: { risk: 0.25 },
  },
  // HTTP request patterns — potential SSRF vector
  {
    input: { has_eval: 0, has_inner_html: 0, has_document_write: 0, has_sql: 0, has_exec: 0, has_unvalidated_input: 0, has_dynamic_import: 0, has_http_request: 1 },
    output: { risk: 0.15 },
  },

  // --- Compound patterns ---

  // eval + unvalidated input — code injected from user (critical)
  {
    input: { has_eval: 1, has_inner_html: 0, has_document_write: 0, has_sql: 0, has_exec: 0, has_unvalidated_input: 1, has_dynamic_import: 0, has_http_request: 0 },
    output: { risk: 0.90 },
  },
  // innerHTML + unvalidated input — reflected/stored XSS
  {
    input: { has_eval: 0, has_inner_html: 1, has_document_write: 0, has_sql: 0, has_exec: 0, has_unvalidated_input: 1, has_dynamic_import: 0, has_http_request: 0 },
    output: { risk: 0.85 },
  },
  // SQL + unvalidated input — SQL injection
  {
    input: { has_eval: 0, has_inner_html: 0, has_document_write: 0, has_sql: 1, has_exec: 0, has_unvalidated_input: 1, has_dynamic_import: 0, has_http_request: 0 },
    output: { risk: 0.92 },
  },
  // exec + unvalidated input — OS command injection
  {
    input: { has_eval: 0, has_inner_html: 0, has_document_write: 0, has_sql: 0, has_exec: 1, has_unvalidated_input: 1, has_dynamic_import: 0, has_http_request: 0 },
    output: { risk: 0.95 },
  },
  // http_request + unvalidated input — SSRF
  {
    input: { has_eval: 0, has_inner_html: 0, has_document_write: 0, has_sql: 0, has_exec: 0, has_unvalidated_input: 1, has_dynamic_import: 0, has_http_request: 1 },
    output: { risk: 0.75 },
  },
  // document.write + unvalidated input
  {
    input: { has_eval: 0, has_inner_html: 0, has_document_write: 1, has_sql: 0, has_exec: 0, has_unvalidated_input: 1, has_dynamic_import: 0, has_http_request: 0 },
    output: { risk: 0.70 },
  },
  // eval + dynamic import — runtime code loading
  {
    input: { has_eval: 1, has_inner_html: 0, has_document_write: 0, has_sql: 0, has_exec: 0, has_unvalidated_input: 0, has_dynamic_import: 1, has_http_request: 0 },
    output: { risk: 0.65 },
  },
  // innerHTML + document.write — multiple XSS vectors
  {
    input: { has_eval: 0, has_inner_html: 1, has_document_write: 1, has_sql: 0, has_exec: 0, has_unvalidated_input: 0, has_dynamic_import: 0, has_http_request: 0 },
    output: { risk: 0.55 },
  },
  // SQL + exec — database command execution
  {
    input: { has_eval: 0, has_inner_html: 0, has_document_write: 0, has_sql: 1, has_exec: 1, has_unvalidated_input: 0, has_dynamic_import: 0, has_http_request: 0 },
    output: { risk: 0.72 },
  },
  // dynamic_import + http_request — remote supply chain risk
  {
    input: { has_eval: 0, has_inner_html: 0, has_document_write: 0, has_sql: 0, has_exec: 0, has_unvalidated_input: 0, has_dynamic_import: 1, has_http_request: 1 },
    output: { risk: 0.40 },
  },
  // exec + http_request + unvalidated — severe multi-vector
  {
    input: { has_eval: 0, has_inner_html: 0, has_document_write: 0, has_sql: 0, has_exec: 1, has_unvalidated_input: 1, has_dynamic_import: 0, has_http_request: 1 },
    output: { risk: 0.97 },
  },
  // eval + innerHTML + unvalidated — web shell-like pattern
  {
    input: { has_eval: 1, has_inner_html: 1, has_document_write: 0, has_sql: 0, has_exec: 0, has_unvalidated_input: 1, has_dynamic_import: 0, has_http_request: 0 },
    output: { risk: 0.93 },
  },
  // SQL + innerHTML + unvalidated — data exfil via DOM
  {
    input: { has_eval: 0, has_inner_html: 1, has_document_write: 0, has_sql: 1, has_exec: 0, has_unvalidated_input: 1, has_dynamic_import: 0, has_http_request: 0 },
    output: { risk: 0.94 },
  },
  // eval + exec — dual code/command injection
  {
    input: { has_eval: 1, has_inner_html: 0, has_document_write: 0, has_sql: 0, has_exec: 1, has_unvalidated_input: 0, has_dynamic_import: 0, has_http_request: 0 },
    output: { risk: 0.80 },
  },
  // innerHTML + SQL — DB data rendered directly
  {
    input: { has_eval: 0, has_inner_html: 1, has_document_write: 0, has_sql: 1, has_exec: 0, has_unvalidated_input: 0, has_dynamic_import: 0, has_http_request: 0 },
    output: { risk: 0.60 },
  },

  // --- Every pattern flagged (maximum risk) ---
  {
    input: { has_eval: 1, has_inner_html: 1, has_document_write: 1, has_sql: 1, has_exec: 1, has_unvalidated_input: 1, has_dynamic_import: 1, has_http_request: 1 },
    output: { risk: 0.99 },
  },
];

module.exports = { scanTrainingData };
