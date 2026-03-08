// BrainScan — vanilla JS frontend
// Mirrors the pricecinerator-ai component structure (landing, input, results)
// but implemented with plain DOM manipulation instead of React.

const state = {
  view: 'landing',   // 'landing' | 'scanner'
  isScanning: false,
  scanResult: null,
  errorMessage: null,
  codeInput: '',     // persists textarea value across re-renders
};

// ---- DOM helpers ----

function el(tag, className, textContent) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (textContent !== undefined) e.textContent = textContent;
  return e;
}

function getRiskBarColor(riskPercent) {
  if (riskPercent < 20) return '#1a7a35';
  if (riskPercent < 50) return '#c47a00';
  if (riskPercent < 75) return '#b83000';
  return '#880000';
}

function getRiskClass(label) {
  const map = {
    'Low Risk':      'risk-low',
    'Medium Risk':   'risk-medium',
    'High Risk':     'risk-high',
    'Critical Risk': 'risk-critical',
  };
  return map[label] || 'risk-low';
}

// ---- Landing page ----

function renderLanding() {
  const panel = el('div', 'panel');

  const introBox = el('div', 'box');
  const introRow = el('div', 'box-row');
  const h2 = el('h2', null, 'Welcome to BrainScan!');
  const p = el(
    'p', null,
    'BrainScan uses a brain.js neural network trained on vulnerability patterns '
    + 'to predict the risk level of your web code.'
  );
  introRow.appendChild(h2);
  introRow.appendChild(p);
  introBox.appendChild(introRow);
  panel.appendChild(introBox);

  const stepsBox = el('ol', 'box');
  [
    'Paste your HTML, JavaScript, or backend server code into the editor.',
    'Click "Start Scanning" to submit the code for analysis.',
    'The neural network detects vulnerability patterns and outputs a risk score.',
    'Review the flagged patterns and adjust your code accordingly.',
  ].forEach((text) => stepsBox.appendChild(el('li', null, text)));
  panel.appendChild(stepsBox);

  const noteBox = el('p', 'box',
    'Patterns detected include: eval(), innerHTML, document.write(), SQL queries, '
    + 'exec()/spawn(), unvalidated request inputs, dynamic imports, and HTTP request patterns.'
  );
  panel.appendChild(noteBox);

  const btn = el('button', null, 'Start Scanning');
  btn.addEventListener('click', () => {
    state.view = 'scanner';
    render();
  });
  panel.appendChild(btn);

  return panel;
}

// ---- Scanner view ----

function renderScanner() {
  const panel = el('div', 'panel');

  // Menu bar
  const menuBox = el('div', 'box');
  const menuRow = el('div', 'box-row');
  const h2 = el('h2', null, 'BrainScan');
  const subtitle = el('p', null, 'brain.js vulnerability scanner for web code');
  const helpBtn = el('button', null, 'Help');
  helpBtn.addEventListener('click', () => {
    state.view = 'landing';
    state.scanResult = null;
    state.errorMessage = null;
    render();
  });
  menuRow.appendChild(h2);
  menuRow.appendChild(subtitle);
  menuRow.appendChild(helpBtn);
  menuBox.appendChild(menuRow);
  panel.appendChild(menuBox);

  // Code input
  const inputBox = el('div', 'box');
  const inputRow = el('div', 'box-row');
  const inputH3 = el('h3', null, 'Code Input');
  const textarea = document.createElement('textarea');
  textarea.id = 'code-input';
  textarea.placeholder = 'Paste your HTML, JavaScript, or backend code here...';
  textarea.value = state.codeInput;
  textarea.addEventListener('input', (e) => { state.codeInput = e.target.value; });
  inputRow.appendChild(inputH3);
  inputRow.appendChild(textarea);
  inputBox.appendChild(inputRow);
  panel.appendChild(inputBox);

  // Scan button
  const scanBtn = el('button', null, 'Scan Code');
  scanBtn.disabled = state.isScanning;
  scanBtn.addEventListener('click', handleScan);
  panel.appendChild(scanBtn);

  // Loader
  if (state.isScanning) {
    panel.appendChild(el('div', 'loader'));
  }

  // Error
  if (state.errorMessage) {
    const errDiv = el('div', 'error-row', state.errorMessage);
    panel.appendChild(errDiv);
  }

  // Results
  if (state.scanResult) {
    panel.appendChild(renderResults(state.scanResult));
  }

  return panel;
}

// ---- Results panel ----

function renderResults(result) {
  const box = el('div', 'sized-box');
  box.appendChild(el('h3', null, 'Scan Results'));

  // Risk score and bar
  const riskRow = el('div', 'box-row');
  const riskLabel = el('h3', getRiskClass(result.label),
    result.label + ' — ' + result.riskPercent + '%'
  );
  riskRow.appendChild(riskLabel);

  const barContainer = el('div', 'risk-bar-container');
  const bar = el('div', 'risk-bar');
  bar.style.width = result.riskPercent + '%';
  bar.style.backgroundColor = getRiskBarColor(result.riskPercent);
  barContainer.appendChild(bar);
  riskRow.appendChild(barContainer);
  box.appendChild(riskRow);

  // Detected feature flags
  const featRow = el('div', 'box-row');
  featRow.appendChild(el('h3', null, 'Detected Patterns:'));

  const featureLabels = {
    has_eval:             'eval() usage',
    has_inner_html:       'innerHTML assignment',
    has_document_write:   'document.write() usage',
    has_sql:              'SQL query patterns',
    has_exec:             'exec() / spawn() usage',
    has_unvalidated_input:'Unvalidated user input (req.body / params / query)',
    has_dynamic_import:   'Dynamic require() / import()',
    has_http_request:     'HTTP request / URL patterns',
  };

  Object.entries(result.features).forEach(([key, val]) => {
    const featureEl = el('div', val ? 'feature-detected' : 'feature-clean');
    featureEl.textContent = (val ? '\u26A0 ' : '\u2713 ') + (featureLabels[key] || key);
    featRow.appendChild(featureEl);
  });

  box.appendChild(featRow);
  return box;
}

// ---- Scan action ----

async function handleScan() {
  const code = state.codeInput.trim();

  if (!code) {
    state.errorMessage = 'Please enter some code to scan.';
    render();
    return;
  }

  state.isScanning = true;
  state.scanResult = null;
  state.errorMessage = null;
  render();

  try {
    const response = await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Scan failed. Please try again.');
    }

    state.scanResult = data;
  } catch (err) {
    state.errorMessage = err.message || 'An unexpected error occurred.';
  } finally {
    state.isScanning = false;
    render();
  }
}

// ---- Root render ----

function render() {
  const root = document.getElementById('root');
  root.innerHTML = '';
  root.appendChild(state.view === 'landing' ? renderLanding() : renderScanner());
}

document.addEventListener('DOMContentLoaded', render);
