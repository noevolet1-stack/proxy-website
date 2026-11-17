import http from 'node:http';
import express from 'express';
import { server as wisp } from '@mercuryworkshop/wisp-js/server';

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static frontend and worker files from public/
app.use(express.static('public'));

const server = http.createServer(app);

// Handle Wisp WebSocket connections on the exact same port (3000)
server.on('upgrade', (req, socket, head) => {
  if (req.url && req.url.startsWith('/wisp')) {
    wisp.routeRequest(req, socket, head);
  } else {
    socket.destroy();
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Krillion portal running on http://0.0.0:${PORT}`);
});