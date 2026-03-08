// server.js
const http = require("http");
const fs = require("fs");
const path = require("path");
const { initializeNeuralNetwork, retrainNeuralNetwork, runScan } = require("./src/neuralNetwork");

const host = 'localhost';
const port = 8000;
const MAX_BODY_SIZE = 51200; // 50 KB limit to prevent DoS

// Files the scanner is allowed to read (relative to project root)
const SCAN_INCLUDE_EXTS = new Set(['.js', '.html', '.css', '.json']);
const SCAN_EXCLUDE_DIRS = new Set(['node_modules', '.git', '.github']);
const SCAN_EXCLUDE_FILES = new Set(['package-lock.json']);

function walkProjectFiles(dir, baseDir, results) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return; }
  for (const entry of entries) {
    if (SCAN_EXCLUDE_DIRS.has(entry.name)) continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkProjectFiles(abs, baseDir, results);
    } else if (
      SCAN_INCLUDE_EXTS.has(path.extname(entry.name)) &&
      !SCAN_EXCLUDE_FILES.has(entry.name)
    ) {
      results.push(path.relative(baseDir, abs).replace(/\\/g, '/'));
    }
  }
}

console.log("Initializing BrainScan...");
console.log("Training neural network (this may take a moment)...");
initializeNeuralNetwork();
console.log("Neural network ready.");

function serveFile(res, filePath, contentType) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

function handleApiFiles(res) {
  const files = [];
  walkProjectFiles(__dirname, __dirname, files);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(files));
}

function handleApiScan(req, res) {
  let body = '';
  let size = 0;

  req.on('data', (chunk) => {
    size += chunk.length;
    if (size > MAX_BODY_SIZE) {
      if (!res.headersSent) {
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Request body too large' }));
      }
      req.destroy();
      return;
    }
    body += chunk;
  });

  req.on('end', () => {
    if (res.headersSent) return;
    try {
      const parsed = JSON.parse(body);
      const filePath = parsed.filePath;

      if (typeof filePath !== 'string') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'filePath must be a string' }));
        return;
      }

      // Path traversal protection: resolved path must stay inside project root
      const absPath = path.resolve(__dirname, filePath);
      const projectRoot = __dirname + path.sep;
      if (!absPath.startsWith(projectRoot)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid file path' }));
        return;
      }

      // Only allow whitelisted extensions
      if (!SCAN_INCLUDE_EXTS.has(path.extname(absPath))) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'File type not scannable' }));
        return;
      }

      let code;
      try {
        code = fs.readFileSync(absPath, 'utf8');
      } catch {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'File not found' }));
        return;
      }

      const result = runScan(code);
      result.filePath = filePath;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid request body' }));
    }
  });
}

const routes = {
  '/':           { file: path.join(__dirname, 'index.html'),       type: 'text/html' },
  '/index.html': { file: path.join(__dirname, 'index.html'),       type: 'text/html' },
  '/style.css':  { file: path.join(__dirname, 'public', 'style.css'), type: 'text/css' },
  '/app.js':     { file: path.join(__dirname, 'public', 'app.js'),    type: 'application/javascript' },
};

const requestListener = function (req, res) {
  const url = req.url.split('?')[0];

  if (req.method === 'POST' && url === '/api/retrain') {
    try {
      retrainNeuralNetwork();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Retrain failed' }));
    }
    return;
  }

  if (req.method === 'GET' && url === '/api/files') {
    handleApiFiles(res);
    return;
  }

  if (req.method === 'POST' && url === '/api/scan') {
    handleApiScan(req, res);
    return;
  }

  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
    return;
  }

  const route = routes[url];
  if (route) {
    serveFile(res, route.file, route.type);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
};

const server = http.createServer(requestListener);

server.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
});
