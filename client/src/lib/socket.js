import { io } from 'socket.io-client';

// Works on desktop and phones connected to the same Wi-Fi.
// The browser's current hostname is reused, so a phone opened at
// http://192.168.x.x:5173 automatically connects to port 5000 on the
// same machine instead of trying to use localhost.
const isBrowser = typeof window !== 'undefined';
const host = isBrowser ? window.location.hostname : 'localhost';
const port = import.meta.env.VITE_SERVER_PORT || '5000';

export const SERVER_URL = import.meta.env.VITE_SERVER_URL || `http://${host}:${port}`;

// Start with polling so mobile devices/networks that block WebSocket
// handshakes can still join. Socket.IO upgrades to WebSocket when possible.
export const socket = io(SERVER_URL, {
  autoConnect: false,
  transports: ['polling', 'websocket'],
  upgrade: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 500,
  timeout: 10000,
});
