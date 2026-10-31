/**
 * ShopLedger V2 - Render Free Tier Uptime Ping Service
 * 
 * Render spins down free web services after 15 minutes of inactivity.
 * This service issues periodic GET requests to /api/health to keep
 * the server warm and prevent 30-60s cold-start delays during demos and evaluation.
 * 
 * Usage:
 *   node scripts/uptimePing.js
 *   node scripts/uptimePing.js --url=https://shopledger-api.onrender.com/api/health
 *   node scripts/uptimePing.js --url=https://shopledger-api.onrender.com/api/health --interval=10
 *   node scripts/uptimePing.js --url=https://shopledger-api.onrender.com/api/health --once
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// Parse CLI arguments
const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const match = args.find((a) => a.startsWith(`--${name}=`));
  if (match) return match.split('=')[1];
  return fallback;
};

const isOnce = args.includes('--once');
const rawUrl = getArg('url', process.env.PING_URL || process.env.RENDER_URL || process.env.BACKEND_URL || 'http://localhost:5000/api/health');
const intervalMinutes = parseFloat(getArg('interval', process.env.PING_INTERVAL_MINUTES || '10'));
const intervalMs = Math.max(1, intervalMinutes) * 60 * 1000;

// Normalize URL to target /api/health if user provides bare origin or root
let targetUrl = rawUrl;
try {
  const testParsed = new URL(rawUrl);
  if (!testParsed.pathname || testParsed.pathname === '/' || testParsed.pathname === '') {
    testParsed.pathname = '/api/health';
    targetUrl = testParsed.toString();
  }
} catch (e) {
  if (!targetUrl.includes('/health')) {
    targetUrl = targetUrl.replace(/\/+$/, '') + '/api/health';
  }
}

function log(level, message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
}

function pingEndpoint(url) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let parsed;
    try {
      parsed = new URL(url);
    } catch (err) {
      log('ERROR', `Invalid target URL: ${url} (${err.message})`);
      return resolve({ success: false, error: err.message });
    }

    const client = parsed.protocol === 'https:' ? https : http;
    const reqOptions = {
      method: 'GET',
      timeout: 65000, // 65s timeout allows for cold-start spinning up on Render
      headers: {
        'User-Agent': 'ShopLedger-Uptime-Monitor/2.0'
      }
    };

    log('INFO', `Sending heartbeat ping to: ${url}`);

    const req = client.request(parsed, reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        const duration = Date.now() - startTime;
        if (res.statusCode >= 200 && res.statusCode < 400) {
          log('SUCCESS', `HTTP ${res.statusCode} OK - Backend active (Latency: ${duration}ms)`);
          resolve({ success: true, statusCode: res.statusCode, duration });
        } else {
          log('WARN', `HTTP ${res.statusCode} - Response: ${body.slice(0, 150)} (Latency: ${duration}ms)`);
          resolve({ success: false, statusCode: res.statusCode, duration });
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      const duration = Date.now() - startTime;
      log('WARN', `Heartbeat ping timed out after ${duration}ms (Backend may be initiating cold start)`);
      resolve({ success: false, error: 'Request timed out' });
    });

    req.on('error', (err) => {
      const duration = Date.now() - startTime;
      log('ERROR', `Connection failed: ${err.message} (${duration}ms)`);
      resolve({ success: false, error: err.message });
    });

    req.end();
  });
}

async function run() {
  console.log('====================================================');
  console.log('  ShopLedger V2 - Render Uptime Heartbeat Monitor');
  console.log('====================================================');
  log('INFO', `Target: ${targetUrl}`);
  log('INFO', `Mode: ${isOnce ? 'Single-check (--once)' : `Recurring every ${intervalMinutes} minute(s)`}`);

  // Initial execution
  await pingEndpoint(targetUrl);

  if (isOnce) {
    process.exit(0);
  }

  // Recurring loop
  const intervalId = setInterval(async () => {
    await pingEndpoint(targetUrl);
  }, intervalMs);

  const cleanup = () => {
    log('INFO', 'Stopping uptime monitor service.');
    clearInterval(intervalId);
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

run();
