# BrainScan

A brain.js neural network that scans the vulnerability risk of your web project's source files. No build step, no bundler — just Node.js and a vanilla HTTP server.

## Getting Started

```bash
node index.js
# → http://localhost:8000
```

No `npm install` required. The only dependency (brain.js) is vendored in `vendor/`.

On first run the network trains from scratch (~20s) and saves a snapshot to `data/trained-network.json`. Subsequent starts load the snapshot instantly.

## How It Works

1. **Open** `http://localhost:8000` and click **Start Scanning**.
2. **Select a file** from the project file browser — the server reads it from disk and runs it through the neural network.
3. **Results** show a risk score (0–100%), a label (Low / Medium / High / Critical), and a breakdown of detected patterns.
4. Click **Retrain NN** to force a full retrain and overwrite the snapshot.

## Detected Patterns

| Feature | Vulnerability |
|---|---|
| `eval()` | Arbitrary code execution |
| `.innerHTML =` | DOM-based XSS |
| `document.write()` | Legacy XSS vector |
| SQL keywords | SQL injection |
| `exec()` / `spawn()` | OS command injection |
| `req.body` / `req.query` / `req.params` | Unvalidated user input |
| Dynamic `require()` / `import()` | Supply-chain / code injection |
| HTTP request patterns | SSRF |

## Project Structure

```
brainscan/
├── index.js                   # HTTP server + API routes
├── index.html                 # HTML shell
├── public/
│   ├── app.js                 # Vanilla JS frontend
│   └── style.css
├── src/
│   ├── neuralNetwork.js       # Train, load snapshot, run scans
│   ├── constants/
│   │   ├── settings.js        # Network config & risk thresholds
│   │   └── trainingData.js    # Labeled vulnerability examples
│   └── utils/
│       └── utils.js           # Feature extraction & data augmentation
├── vendor/
│   └── brain.js/              # Vendored brain.js (CPU-only, no node-gyp)
│       └── node_modules/
│           └── thaw.js/       # brain.js runtime dependency
└── data/
    └── trained-network.json   # Snapshot (gitignored, auto-generated)
```

## Security Notes

- File access is restricted to the project root (path traversal protection).
- Request bodies are capped at 50 KB.
- Only `.js`, `.html`, `.css`, and `.json` files are scannable.
- The GPU backend of brain.js is intentionally excluded; the vendored copy uses CPU-only inference, avoiding native compilation (`node-gyp`/`gl`).
