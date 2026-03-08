// server.js
const http = require("http");
const fs = require("fs");
const path = require("path");
const { initializeNeuralNetwork, runScan } = require("./src/neuralNetwork");

const host = 'localhost';
const port = 8000;
const MAX_BODY_SIZE = 51200; // 50 KB limit to prevent DoS

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
      const code = parsed.code;

      if (typeof code !== 'string') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'code must be a string' }));
        return;
      }

      const result = runScan(code);
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
