// Minimal static server with an API endpoint for /api/get-posts
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname);
const mime = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp'
};

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const type = mime[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.statusCode = 404;
      res.end('Not found');
      return;
    }
    res.setHeader('Content-Type', type + '; charset=utf-8');
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);

  if (url === '/api/get-posts' || url === '/api/get-posts/') {
    const dataPath = path.join(root, 'data.json');
    fs.readFile(dataPath, 'utf8', (err, data) => {
      if (err) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'failed to read data' }));
        return;
      }
      res.setHeader('Content-Type', 'application/json');
      res.end(data);
    });
    return;
  }

  // Serve static files
  let filePath = path.join(root, url);
  // If directory, serve index.html
  if (filePath.endsWith(path.sep)) filePath = path.join(filePath, 'index.html');
  // If root request, serve index.html
  if (url === '/' || url === '') filePath = path.join(root, 'index.html');

  // Protect path traversal
  if (!filePath.startsWith(root)) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err) {
      res.statusCode = 404;
      res.end('Not found');
      return;
    }
    if (stat.isDirectory()) {
      sendFile(res, path.join(filePath, 'index.html'));
    } else {
      sendFile(res, filePath);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`FoxGram server running at http://localhost:${PORT}`);
});
