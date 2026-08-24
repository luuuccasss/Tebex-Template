const http = require('http');
const fs   = require('fs');
const path = require('path');
const zlib = require('zlib');

const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const PORT = process.env.SERVER_PORT || 8080;
const ROOT = __dirname;
const CONFIG_PATH = '/assets/js/config.js';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.webp': 'image/webp',
  '.ico':  'image/x-icon',
  '.woff2':'font/woff2',
};

const injectEnv = (src) => src
  .replace(/webstoreIdent:\s*'[^']*'/, `webstoreIdent: '${process.env.TEBEX_WEBSTORE_IDENT || 'YOUR-TEBEX-WEBSTORE-IDENT'}'`)
  .replace(/storeDomain:\s*'[^']*'/,   `storeDomain:   '${process.env.TEBEX_STORE_DOMAIN   || 'yourstore.tebex.store'}'`);

const send = (res, mime, data, accept) => {
  if (accept.includes('gzip') && data.length > 1024) {
    res.writeHead(200, { 'Content-Type': mime, 'Content-Encoding': 'gzip', 'Cache-Control': 'no-cache' });
    zlib.gzip(data, (_, gz) => res.end(gz));
  } else {
    res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-cache' });
    res.end(data);
  }
};

const server = http.createServer((req, res) => {
  let url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/') url = '/index.html';

  const file = path.join(ROOT, url);
  if (!file.startsWith(ROOT)) return res.writeHead(403).end();

  fs.readFile(file, (err, data) => {
    if (err) return res.writeHead(404).end('404');

    const mime = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
    const accept = req.headers['accept-encoding'] || '';

    if (url === CONFIG_PATH) data = Buffer.from(injectEnv(data.toString('utf8')));

    send(res, mime, data, accept);
  });
});

server.listen(PORT, '0.0.0.0', () => console.log(`Server on :${PORT}`));
