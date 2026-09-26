const crypto = require('crypto');
const http = require('http');

const appSecret = 'my_test_secret';
process.env.META_APP_SECRET = appSecret;
process.env.NODE_ENV = 'test';

const express = require('express');
const app = express();
const controller = require('./src/api/controllers/notificationWebhook.controller');

app.use(express.json({ 
  limit: '50mb',
  verify: (req, res, buf) => {
    req.rawBody = Buffer.from(buf);
  }
}));

app.post('/api/webhooks/whatsapp', controller.handleIncoming);

const server = app.listen(0, async () => {
  const port = server.address().port;
  console.log(`Test server running on port ${port}`);

  const runTest = async (name, payloadStr, headers, expectedStatus) => {
    return new Promise((resolve) => {
      const options = {
        hostname: 'localhost',
        port,
        path: '/api/webhooks/whatsapp',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payloadStr),
          ...headers
        }
      };

      const req = http.request(options, (res) => {
        let result = res.statusCode === expectedStatus ? 'PASS' : `FAIL (Got ${res.statusCode})`;
        console.log(`[${result}] ${name}`);
        resolve(res.statusCode);
      });

      req.on('error', (e) => {
        console.log(`[FAIL] ${name} - Request error: ${e.message}`);
        resolve(0);
      });

      req.write(payloadStr);
      req.end();
    });
  };

  const originalPayload = JSON.stringify({ object: 'whatsapp_business_account', entry: [] }, null, 2);
  const validSignature = 'sha256=' + crypto.createHmac('sha256', appSecret).update(Buffer.from(originalPayload)).digest('hex');

  // Test A: Valid raw body + valid signature -> 200
  await runTest('Test A: Valid signature', originalPayload, { 'x-hub-signature-256': validSignature }, 200);

  // Test B: Valid raw body + invalid signature -> 403
  await runTest('Test B: Invalid signature', originalPayload, { 'x-hub-signature-256': 'sha256=abcdef123456' }, 403);

  // Test C: Missing signature -> 403
  await runTest('Test C: Missing signature', originalPayload, {}, 403);

  // Test D: Missing META_APP_SECRET -> 403
  delete process.env.META_APP_SECRET;
  await runTest('Test D: Missing META_APP_SECRET', originalPayload, { 'x-hub-signature-256': validSignature }, 403);
  process.env.META_APP_SECRET = appSecret; // Restore for next tests

  // Test E: Missing req.rawBody
  await runTest('Test E: Missing req.rawBody (sent as text/plain)', originalPayload, { 'Content-Type': 'text/plain', 'x-hub-signature-256': validSignature }, 403);

  // Test F: Reordered JSON body with original Meta signature -> 403
  const reorderedPayload = JSON.stringify({ entry: [], object: 'whatsapp_business_account' }, null, 2);
  await runTest('Test F: Reordered JSON body', reorderedPayload, { 'x-hub-signature-256': validSignature }, 403);

  server.close();
});
