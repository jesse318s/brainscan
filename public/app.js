// BrainScan — vanilla JS frontend
// Scans the source files of the project itself.

const state = {
  view: 'landing',    // 'landing' | 'scanner'
  isLoadingFiles: false,
  isScanning: false,
  isRetraining: false,
  files: null,        // null = not loaded, string[] = loaded
  selectedFile: null, // relative path string
  scanResults: {},    // { [filePath]: result } — persists across selections
  errorMessage: null,
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
    'Click "Start Scanning" to load the project\'s source files.',
    'Select any file from the file browser to analyse it.',
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
    loadFiles();
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
    state.errorMessage = null;
    render();
  });
  const retrainBtn = el('button', null, state.isRetraining ? 'Retraining…' : 'Retrain NN');
  retrainBtn.disabled = state.isRetraining || state.isScanning;
  retrainBtn.style.marginLeft = '8px';
  retrainBtn.addEventListener('click', handleRetrain);
  menuRow.appendChild(h2);
  menuRow.appendChild(subtitle);
  menuRow.appendChild(helpBtn);
  menuRow.appendChild(retrainBtn);
  menuBox.appendChild(menuRow);
  panel.appendChild(menuBox);

  // File browser
  const browserBox = el('div', 'box');
  const browserRow = el('div', 'box-row');
  browserRow.appendChild(el('h3', null, 'Project Files'));

  if (state.isLoadingFiles) {
    browserRow.appendChild(el('div', 'loader'));
  } else if (state.files && state.files.length > 0) {
    const fileList = el('div', 'file-list');
    state.files.forEach((filePath) => {
      const row = el('div', 'file-row');
      const cached = state.scanResults[filePath];

      // File name
      const nameSpan = el('span', 'file-name', filePath);
      row.appendChild(nameSpan);

      // Mini risk badge if already scanned
      if (cached) {
        const badge = el('span', 'risk-badge ' + getRiskClass(cached.label),
          cached.riskPercent + '% ' + cached.label);
        row.appendChild(badge);
      }

      if (state.selectedFile === filePath) {
        row.classList.add('file-row-selected');
      }

      if (state.isScanning && state.selectedFile === filePath) {
        row.classList.add('file-row-scanning');
      }

      row.addEventListener('click', () => {
        if (state.isScanning) return;
        handleScanFile(filePath);
      });

      fileList.appendChild(row);
    });
    browserRow.appendChild(fileList);
  } else if (state.errorMessage && !state.files) {
    // error during file load shown below
  } else {
    browserRow.appendChild(el('p', null, 'No scannable files found.'));
  }

  browserBox.appendChild(browserRow);
  panel.appendChild(browserBox);

  // Loader during retrain
  if (state.isRetraining) {
    const loaderDiv = el('div', null);
    loaderDiv.appendChild(el('p', null, 'Retraining neural network and saving snapshot…'));
    loaderDiv.appendChild(el('div', 'loader'));
    panel.appendChild(loaderDiv);
  }

  // Loader during scan
  if (state.isScanning) {
    const loaderDiv = el('div', null);
    loaderDiv.appendChild(el('p', null, 'Scanning ' + state.selectedFile + '…'));
    loaderDiv.appendChild(el('div', 'loader'));
    panel.appendChild(loaderDiv);
  }

  // Error
  if (state.errorMessage) {
    panel.appendChild(el('div', 'error-row', state.errorMessage));
  }

  // Results for selected file
  const result = state.selectedFile && state.scanResults[state.selectedFile];
  if (result) {
    panel.appendChild(renderResults(result));
  }

  return panel;
}

// ---- Results panel ----

function renderResults(result) {
  const box = el('div', 'sized-box');

  const heading = el('h3', null, 'Scan Results — ' + result.filePath);
  box.appendChild(heading);

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

// ---- Actions ----

async function handleRetrain() {
  state.isRetraining = true;
  state.errorMessage = null;
  state.scanResults = {}; // clear cached results — network weights are changing
  render();

  try {
    const res = await fetch('/api/retrain', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Retrain failed');
  } catch (err) {
    state.errorMessage = err.message || 'Retrain failed.';
  } finally {
    state.isRetraining = false;
    render();
  }
}

async function loadFiles() {
  state.isLoadingFiles = true;
  state.errorMessage = null;
  render();

  try {
    const res = await fetch('/api/files');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load files');
    state.files = data;
  } catch (err) {
    state.errorMessage = err.message || 'Could not load project files.';
  } finally {
    state.isLoadingFiles = false;
    render();
  }
}

async function handleScanFile(filePath) {
  state.isScanning = true;
  state.selectedFile = filePath;
  state.errorMessage = null;
  render();

  try {
    const response = await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Scan failed. Please try again.');
    }

    state.scanResults[filePath] = data;
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
