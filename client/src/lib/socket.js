import { io } from 'socket.io-client';

const isBrowser = typeof window !== 'undefined';

const hostname = isBrowser
  ? window.location.hostname
  : 'localhost';

const isLocal =
  hostname === 'localhost' ||
  hostname === '127.0.0.1';

export const SERVER_URL = isLocal
  ? 'http://localhost:5000'
  : window.location.origin;

export const SOCKET_PATH = isLocal
  ? '/socket.io'
  : '/api/socket.io';

export const socket = io(SERVER_URL, {
  path: SOCKET_PATH,
  autoConnect: false,
  transports: ['websocket', 'polling'],
  withCredentials: true,
});