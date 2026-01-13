import * as http from 'http';
import * as dotenv from 'dotenv';
import { initDatabase } from './storage/db.js';
import { seedDatabase } from './storage/seed.js';
import { createMCPServer, createTransport } from './mcp.js';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3000', 10);
const DATABASE_PATH = process.env.DATABASE_PATH || './data/deals.db';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',').map((s) => s.trim()) || [];
const API_KEY = process.env.API_KEY;

// Rate limiting (optional, memory-based)
const RATE_LIMIT_ENABLED = process.env.RATE_LIMIT_ENABLED === 'true';
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '60', 10);
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Initialize database
console.log('Initializing database...');
initDatabase(DATABASE_PATH);
seedDatabase();

// Create MCP server and transport
const mcpServer = createMCPServer();
const transport = createTransport();

// Connect server to transport
mcpServer.connect(transport);

// Helper to send response
function sendResponse(
  res: http.ServerResponse,
  statusCode: number,
  body: string,
  contentType = 'text/plain'
): void {
  res.writeHead(statusCode, { 'Content-Type': contentType });
  res.end(body);
}

// Health check start time
const startTime = Date.now();

// Create HTTP server
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);

  // CORS headers
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Origin validation
  if (ALLOWED_ORIGINS.length > 0 && origin && !ALLOWED_ORIGINS.includes(origin)) {
    sendResponse(res, 403, 'Forbidden: Origin not allowed');
    return;
  }

  // Health check endpoint
  if (url.pathname === '/health') {
    const uptimeSec = Math.floor((Date.now() - startTime) / 1000);
    sendResponse(res, 200, JSON.stringify({ status: 'ok', uptimeSec }), 'application/json');
    return;
  }

  // MCP endpoint
  if (url.pathname === '/mcp') {
    // API Key authentication
    if (API_KEY) {
      const providedKey = req.headers['x-api-key'];
      if (providedKey !== API_KEY) {
        sendResponse(res, 401, 'Unauthorized');
        return;
      }
    }

    // Rate limiting
    if (RATE_LIMIT_ENABLED) {
      const ip =
        (req.headers['x-forwarded-for'] as string) ||
        (req.headers['x-real-ip'] as string) ||
        req.socket.remoteAddress ||
        'unknown';
      const now = Date.now();

      let entry = rateLimitMap.get(ip);
      if (!entry || now > entry.resetAt) {
        entry = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
        rateLimitMap.set(ip, entry);
      }

      entry.count++;

      if (entry.count > RATE_LIMIT_MAX) {
        sendResponse(res, 429, 'Too Many Requests');
        return;
      }
    }

    // Delegate to MCP transport
    try {
      await transport.handleRequest(req, res);
    } catch (error) {
      console.error('MCP request error:', error);
      sendResponse(res, 500, 'Internal Server Error');
    }
    return;
  }

  // 404 for other paths
  sendResponse(res, 404, 'Not Found');
});

// Start server
server.listen(PORT, () => {
  console.log(`Starting DealSense MCP server on port ${PORT}...`);
  console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
  console.log(`Health check: http://localhost:${PORT}/health`);

  if (API_KEY) {
    console.log('API key authentication enabled');
  }

  if (ALLOWED_ORIGINS.length > 0) {
    console.log('Origin allowlist:', ALLOWED_ORIGINS);
  }

  if (RATE_LIMIT_ENABLED) {
    console.log(`Rate limiting: ${RATE_LIMIT_MAX} requests per ${RATE_LIMIT_WINDOW_MS}ms`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
