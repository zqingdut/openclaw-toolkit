const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync, exec } = require('child_process');
const url = require('url');

const PORT = 3366;
const CONFIG_PATH = path.join(os.homedir(), '.openclaw', 'openclaw.json');
const BACKUP_PATH = path.join(os.homedir(), '.openclaw', 'openclaw.json.bak');

// MIME types
const MIMES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json'
};

// Colors
const C = {
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(msg) {
  console.log(`${C.cyan}[WebUI]${C.reset} ${msg}`);
}

const server = http.createServer(async (req, res) => {
  // CORS for local dev if needed
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // --- API Routes ---

  // 1. GET /api/config - Read current config
  if (pathname === '/api/config' && req.method === 'GET') {
    try {
      if (fs.existsSync(CONFIG_PATH)) {
        const data = fs.readFileSync(CONFIG_PATH, 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(data);
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({}));
      }
    } catch (e) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // 2. POST /api/config - Save config
  if (pathname === '/api/config' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const config = JSON.parse(body);
        
        // Backup
        if (fs.existsSync(CONFIG_PATH)) {
          fs.copyFileSync(CONFIG_PATH, BACKUP_PATH);
        }
        
        // Ensure dir
        const dir = path.dirname(CONFIG_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
        log(`Config saved to ${CONFIG_PATH}`);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, path: CONFIG_PATH }));
      } catch (e) {
        res.writeHead(500);
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // 3. POST /api/verify - Verify API Key (Proxy)
  if (pathname === '/api/verify' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { provider, apiKey, baseUrl } = JSON.parse(body);
        let targetUrl = '';
        let headers = {};

        if (provider === 'openai' || provider === 'custom') {
          targetUrl = `${baseUrl.replace(/\/$/, '')}/models`;
          headers = { 'Authorization': `Bearer ${apiKey}` };
        } else if (provider === 'anthropic') {
          targetUrl = 'https://api.anthropic.com/v1/models';
          headers = { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' };
        } else if (provider === 'google') {
          targetUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        }

        log(`Verifying ${provider} at ${targetUrl}...`);

        // Use fetch (Node 18+)
        const apiRes = await fetch(targetUrl, { headers });
        const data = await apiRes.json();

        if (apiRes.ok) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, data }));
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: data }));
        }
      } catch (e) {
        res.writeHead(500);
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // --- Static Files ---
  let filePath = path.join(__dirname, 'public', pathname === '/' ? 'index.html' : pathname);
  const ext = path.extname(filePath);
  
  if (fs.existsSync(filePath)) {
    res.writeHead(200, { 'Content-Type': MIMES[ext] || 'text/plain' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`\n${C.green}🚀 OpenClaw Web Configurator running at: ${url}${C.reset}`);
  console.log('Press Ctrl+C to stop.\n');
  
  // Auto open browser
  const start = (process.platform == 'darwin' ? 'open' : process.platform == 'win32' ? 'start' : 'xdg-open');
  exec(`${start} ${url}`);
});
