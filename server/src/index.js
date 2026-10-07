import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'node:http';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import { TEAMS, TEAM_MAP } from './data/teams.js';
import { IPL_2026_PLAYERS } from './data/players2026.js';
import { OFFICIAL_EXTRA_2026 } from './data/officialExtra2026.js';
import { MAIN_IPL_STARS_2026 } from './data/mainIplStars2026.js';
import { STARTING_PURSE, DEFAULT_TIMER, nextBid, nextBidIncrement, makeRoomCode, shuffle, calculateTeamStats } from './utils/game.js';
import { saveRoom, loadRoom, setMongoEnabled } from './utils/persistence.js';
import { getAuctionCategory, categoryIndex, AUCTION_CATEGORY_ORDER } from './data/auctionCategories.js';

const PORT = Number(process.env.PORT || 5000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  path: process.env.VERCEL ? '/api/socket.io' : '/socket.io',
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

const rooms = new Map();
const timers = new Map();
const sockets = new Map();
const CUSTOM_2026 = [
  { name:'Devara', role:'Bowler', displayRole:'Fast Bowler', subRole:'Fast Bowler', basePrice:0.30, nationality:'India' },
  { name:'Bharath', role:'Bowler', displayRole:'Fast Bowler', subRole:'Fast Bowler', basePrice:0.30, nationality:'India' },
  { name:'Vinayak', role:'All-Rounder', basePrice:0.30, nationality:'India' },
  { name:'Sujith', role:'All-Rounder', basePrice:0.30, nationality:'India' },
  { name:'Saketh Rao', role:'Batsman', basePrice:0.30, nationality:'India' },
  { name:'Prakyath', role:'Wicket-Keeper', displayRole:'Wicket-Keeper Batsman', subRole:'Wicket-Keeper Batsman', basePrice:0.30, nationality:'India' },
].map((p,i)=>({ ...p, id:`custom26-${p.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`, rating:82, batting:p.role.includes('Batsman')||p.role.includes('All')?82:22, bowling:p.role.includes('Bowler')||p.role.includes('All')?84:12, fielding:80, photo:`https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=07130f&color=fff&bold=true&size=512`, previousTeams:[], category:p.role, auctionYear:2026, custom:true }));
const combined2026 = [...IPL_2026_PLAYERS, ...OFFICIAL_EXTRA_2026, ...MAIN_IPL_STARS_2026.slice(0,71), ...CUSTOM_2026];
const normalizedOfficial = combined2026.filter(p => p.name !== 'Waqar Salamkheil' && p.name !== 'Bevon Jacobs' && p.name !== 'Saurav Chauhan' && p.name !== 'Mujeeb Ur Rahman');
const ALL_PLAYERS = Array.from(new Map(normalizedOfficial.map(p => [p.name.toLowerCase().replace(/[^a-z0-9]/g,''), p])).values());
const CATEGORIZED_PLAYERS = ALL_PLAYERS.map(p => ({ ...p, auctionCategory: getAuctionCategory(p), auctionCategoryIndex: categoryIndex(p) }));
const playerMap = Object.fromEntries(CATEGORIZED_PLAYERS.map(p => [p.id, p]));
const CATEGORY_RANK = new Map(AUCTION_CATEGORY_ORDER.map((name, index) => [name, index]));

function ensurePowerBids(team) {
  if (!team) return 0;
  if (!Number.isFinite(Number(team.powerBidsRemaining))) team.powerBidsRemaining = 2;
  team.powerBidsRemaining = Math.max(0, Math.min(2, Number(team.powerBidsRemaining)));
  return team.powerBidsRemaining;
}

function publicRoom(room) {
  Object.values(room.teams).forEach(ensurePowerBids);
  const selectedTeamIds = [...new Set(room.players.map(p => p.teamId).filter(Boolean))];
  const selectedTeams = Object.fromEntries(selectedTeamIds.map(id => [id, room.teams[id]]));
  const teamAnalysis = Object.fromEntries(selectedTeamIds.map(id => [id, calculateTeamStats(room.teams[id], playerMap)]));
  return {
    code: room.code, status: room.status, hostId: room.hostId,
    players: room.players.map(({ socketId, ...p }) => p),
    teams: room.teams, selectedTeams, selectedTeamIds, teamAnalysis,
    currentAuction: room.currentAuction, history: room.history.slice(-40), settings: room.settings,
    auctionIndex: room.auctionIndex, pool: room.pool, poolSize: room.pool.length,
    auctionCategories: AUCTION_CATEGORY_ORDER,
    currentCategory: room.currentAuction ? playerMap[room.currentAuction.playerId]?.auctionCategory || null : null,
    playerPool: room.pool.map(id => playerMap[id]).filter(Boolean),
  };
}

function createRoomState(code, host, teamId) {
  const players = [{ id: cryptoRandomId(), socketId: host.socketId, name: host.name, teamId, ready: true, connected: true, isHost: true }];
  const teams = Object.fromEntries(TEAMS.map(t => [t.id, { ...t, purse: STARTING_PURSE, spent: 0, players: [], powerBidsRemaining: 2 }]));
  return {
    code, hostId: players[0].id, status: 'WAITING', players, teams,
    pool: ALL_PLAYERS.map(p => p.id).sort((a,b) => { const pa=playerMap[a], pb=playerMap[b]; const ca=CATEGORY_RANK.get(pa?.auctionCategory) ?? 99; const cb=CATEGORY_RANK.get(pb?.auctionCategory) ?? 99; if(ca!==cb) return ca-cb; return (pb?.rating||0)-(pa?.rating||0); }), auctionIndex: -1,
    currentAuction: null, history: [],
    settings: { startingBudget: STARTING_PURSE, timerSeconds: DEFAULT_TIMER, maxPlayers: 15, minPlayers: 1 },
    updatedAt: Date.now(),
  };
}
function cryptoRandomId() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
function roomForSocket(socket) { return sockets.get(socket.id); }
function emitRoom(room) { room.updatedAt = Date.now(); io.to(room.code).emit('room:update', publicRoom(room)); saveRoom(room).catch(console.error); }
function sendError(socket, message) { socket.emit('game:error', { message }); }
function isHost(room, socket) { return room.hostId === socket.userId; }
function teamPlayer(room, socket) { return room.players.find(p => p.id === socket.userId); }
function clearRoomTimer(code) { const t = timers.get(code); if (t) clearInterval(t); timers.delete(code); }

function startCountdown(room) {
  clearRoomTimer(room.code);
  if (!room.currentAuction) return;
  room.currentAuction.endsAt = Date.now() + room.settings.timerSeconds * 1000;
  room.currentAuction.timerSeconds = room.settings.timerSeconds;
  timers.set(room.code, setInterval(() => {
    const a = room.currentAuction;
    if (!a) return;
    const remaining = Math.max(0, (a.endsAt - Date.now()) / 1000);
    io.to(room.code).emit('auction:tick', { remaining: Number(remaining.toFixed(2)), endsAt: a.endsAt });
    if (remaining <= 0) finalizeAuction(room.code);
  }, 100));
}

function beginNextPlayer(room) {
  clearRoomTimer(room.code);
  room.auctionIndex += 1;
  const playerId = room.pool[room.auctionIndex];
  if (!playerId) {
    room.currentAuction = null;
    room.status = 'ENDED';
    emitRoom(room);
    io.to(room.code).emit('auction:complete');
    return;
  }
  const player = playerMap[playerId];
  room.currentAuction = {
    category: player.auctionCategory,
    categoryIndex: player.auctionCategoryIndex,
    playerId, status: 'LIVE', basePrice: player.basePrice, currentBid: player.basePrice,
    highestTeam: null, highestBidder: null, bidCount: 0, endsAt: null, timerSeconds: room.settings.timerSeconds,
    bids: [],
  };
  room.status = 'LIVE';
  emitRoom(room);
  io.to(room.code).emit('auction:new-player', { player });
  startCountdown(room);
}

function finalizeAuction(code) {
  const room = rooms.get(code);
  if (!room || !room.currentAuction || room.currentAuction.status !== 'LIVE') return;
  clearRoomTimer(code);
  const a = room.currentAuction;
  const player = playerMap[a.playerId];
  if (a.highestTeam) {
    const team = room.teams[a.highestTeam];
    const price = a.currentBid;
    team.purse = Number((team.purse - price).toFixed(2));
    team.spent = Number((team.spent + price).toFixed(2));
    team.players.push({ playerId: player.id, price });
    a.status = 'SOLD';
    room.history.push({ playerId: player.id, playerName: player.name, teamId: a.highestTeam, price, status: 'SOLD', time: new Date().toISOString() });
    io.to(room.code).emit('auction:sold', { player, team: TEAM_MAP[a.highestTeam], price });
  } else {
    a.status = 'UNSOLD';
    room.history.push({ playerId: player.id, playerName: player.name, teamId: null, price: 0, status: 'UNSOLD', time: new Date().toISOString() });
    io.to(room.code).emit('auction:unsold', { player });
  }
  emitRoom(room);
  setTimeout(() => {
    const latest = rooms.get(code);
    if (latest && latest.status === 'LIVE' && latest.currentAuction?.playerId === player.id) beginNextPlayer(latest);
  }, 2200);
}

function endAuction(room) {
  clearRoomTimer(room.code);
  room.currentAuction = null;
  room.status = 'ENDED';
  emitRoom(room);
  io.to(room.code).emit('auction:complete');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDist = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDist));

app.get('/api/network', (_req, res) => {
  const nets = os.networkInterfaces();
  const candidates = Object.values(nets).flat().filter(Boolean).filter(n => n.family === 'IPv4' && !n.internal).map(n => n.address);
  const lanIp = candidates.find(ip => /^10\./.test(ip) || /^192\.168\./.test(ip) || /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) || candidates[0] || 'localhost';
  res.json({ lanIp });
});
app.get('/api/health', (_req, res) => res.json({ ok: true, game: 'PADDLE UP', players: ALL_PLAYERS.length, time: new Date().toISOString() }));
app.get('/api/players', (_req, res) => res.json(CATEGORIZED_PLAYERS));
app.get('/api/auction-categories', (_req, res) => res.json(AUCTION_CATEGORY_ORDER.map((name, index) => ({ index: index + 1, name, players: CATEGORIZED_PLAYERS.filter(p => p.auctionCategory === name).map(p => p.id) }))));
app.get('/api/teams', (_req, res) => res.json(TEAMS));
app.get('/api/rooms/:code', async (req, res) => {
  const code = req.params.code.toUpperCase();
  const room = rooms.get(code) || await loadRoom(code);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json(publicRoom(room));
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(clientDist, 'index.html'), err => err && next());
});

io.use((socket, next) => {
  socket.userId = socket.handshake.auth?.userId || cryptoRandomId();
  socket.userName = socket.handshake.auth?.name || 'Player';
  next();
});

io.on('connection', socket => {
  socket.on('room:create', async ({ name, teamId }) => {
    try {
      if (!name?.trim() || !TEAM_MAP[teamId]) return sendError(socket, 'Enter a name and select a team.');
      let code = makeRoomCode();
      while (rooms.has(code)) code = makeRoomCode();
      const host = { socketId: socket.id, name: name.trim().slice(0, 24), teamId };
      const room = createRoomState(code, host, teamId);
      socket.userId = room.players[0].id; socket.userName = host.name;
      rooms.set(code, room); sockets.set(socket.id, code);
      await socket.join(code); emitRoom(room);
      socket.emit('room:joined', { room: publicRoom(room), userId: socket.userId });
    } catch (e) { sendError(socket, e.message); }
  });

  socket.on('room:join', async ({ code, name, teamId }) => {
    try {
      code = code?.trim().toUpperCase();
      let room = rooms.get(code);
      if (!room) room = await loadRoom(code);
      if (!room) return sendError(socket, 'Room not found.');
      if (room.status !== 'WAITING') return sendError(socket, 'This auction has already started.');
      if (!name?.trim() || !TEAM_MAP[teamId]) return sendError(socket, 'Enter a name and select a team.');
      if (room.players.some(p => p.teamId === teamId)) return sendError(socket, 'TEAM ALREADY TAKEN');
      if (room.players.length >= 10) return sendError(socket, 'Room is full.');
      const player = { id: cryptoRandomId(), socketId: socket.id, name: name.trim().slice(0,24), teamId, ready: true, connected: true, isHost: false };
      room.players.push(player); rooms.set(code, room); sockets.set(socket.id, code); socket.userId = player.id; socket.userName = player.name;
      await socket.join(code); emitRoom(room); socket.emit('room:joined', { room: publicRoom(room), userId: socket.userId });
    } catch (e) { sendError(socket, e.message); }
  });

  socket.on('room:reconnect', async ({ code, userId, name }) => {
    try {
      code = code?.trim().toUpperCase();
      const room = rooms.get(code) || await loadRoom(code);
      if (!room) return sendError(socket, 'Room not found.');
      const player = room.players.find(p => p.id === userId);
      if (!player) return sendError(socket, 'Your previous player session was not found. Join the room again.');
      player.socketId = socket.id;
      player.connected = true;
      if (name?.trim()) player.name = name.trim().slice(0, 24);
      socket.userId = player.id; socket.userName = player.name;
      rooms.set(code, room); sockets.set(socket.id, code);
      await socket.join(code);
      emitRoom(room);
      socket.emit('room:joined', { room: publicRoom(room), userId: player.id });
    } catch (e) { sendError(socket, e.message); }
  });

  socket.on('room:sync', async ({ code }) => {
    const room = rooms.get(code?.toUpperCase()) || await loadRoom(code?.toUpperCase());
    if (room) socket.emit('room:update', publicRoom(room));
  });

  socket.on('host:start', () => {
    const room = roomForSocket(socket); const r = rooms.get(room);
    if (!r || !isHost(r, socket)) return sendError(socket, 'Only the host can start the auction.');
    if (r.status !== 'WAITING') return;
    r.auctionIndex = -1; beginNextPlayer(r);
  });
  socket.on('host:pause', () => {
    const r = rooms.get(roomForSocket(socket)); if (!r || !isHost(r, socket)) return sendError(socket, 'Host only.');
    if (r.status === 'LIVE') { clearRoomTimer(r.code); r.status = 'PAUSED'; emitRoom(r); }
  });
  socket.on('host:resume', () => {
    const r = rooms.get(roomForSocket(socket)); if (!r || !isHost(r, socket)) return sendError(socket, 'Host only.');
    if (r.status === 'PAUSED') { r.status = 'LIVE'; startCountdown(r); emitRoom(r); }
  });
  socket.on('host:skip', () => {
    const r = rooms.get(roomForSocket(socket)); if (!r || !isHost(r, socket)) return sendError(socket, 'Host only.');
    if (r.status === 'LIVE') finalizeAuction(r.code);
  });
  socket.on('host:unsold', () => {
    const r = rooms.get(roomForSocket(socket)); if (!r || !isHost(r, socket)) return sendError(socket, 'Host only.');
    if (r.currentAuction?.highestTeam) return sendError(socket, 'A bid already exists. Let the timer finish.');
    finalizeAuction(r.code);
  });
  socket.on('host:next', () => {
    const r = rooms.get(roomForSocket(socket)); if (!r || !isHost(r, socket)) return sendError(socket, 'Host only.');
    if (r.currentAuction?.status === 'LIVE') finalizeAuction(r.code);
  });
  socket.on('host:restart', () => {
    const r = rooms.get(roomForSocket(socket)); if (!r || !isHost(r, socket)) return sendError(socket, 'Host only.');
    const a = r.currentAuction; if (!a) return;
    clearRoomTimer(r.code); a.status='LIVE'; a.currentBid=a.basePrice; a.highestTeam=null; a.highestBidder=null; a.bidCount=0; a.bids=[]; startCountdown(r); emitRoom(r);
  });
  socket.on('host:end', () => {
    const r = rooms.get(roomForSocket(socket)); if (!r || !isHost(r, socket)) return sendError(socket, 'Only the host can end the auction.');
    endAuction(r);
  });

  socket.on('auction:bid', ({ teamId }) => {
    const code = roomForSocket(socket); const r = rooms.get(code); if (!r) return sendError(socket, 'Room not found.');
    if (r.status !== 'LIVE' || !r.currentAuction || r.currentAuction.status !== 'LIVE') return sendError(socket, 'Bidding is not active.');
    const me = teamPlayer(r, socket); if (!me || me.teamId !== teamId) return sendError(socket, 'Invalid team.');
    const team = r.teams[teamId]; if (!team) return sendError(socket, 'Invalid team.');
    ensurePowerBids(team);
    const remaining = (r.currentAuction.endsAt - Date.now()) / 1000;
    if (remaining <= 0) return sendError(socket, 'Timer reached zero.');
    const a = r.currentAuction;
    if (a.highestTeam === teamId) return sendError(socket, 'Your team must wait for another team to bid.');
    const amount = nextBid(a.currentBid);
    if (team.purse < amount) return sendError(socket, 'Insufficient funds for this bid.');
    a.currentBid = amount; a.highestTeam = teamId; a.highestBidder = me.name; a.bidCount += 1;
    a.bids.push({ teamId, amount, bidderName: me.name, kind: 'NORMAL', time: new Date().toISOString() });
    a.endsAt = Date.now() + r.settings.timerSeconds * 1000;
    io.to(r.code).emit('auction:bid', { teamId, teamName: team.short, bidderName: me.name, amount, endsAt: a.endsAt, increment: nextBidIncrement(amount), kind: 'NORMAL' });
    emitRoom(r);
  });

  socket.on('auction:power-bid', ({ teamId, amount: rawAmount }) => {
    const code = roomForSocket(socket); const r = rooms.get(code); if (!r) return sendError(socket, 'Room not found.');
    if (r.status !== 'LIVE' || !r.currentAuction || r.currentAuction.status !== 'LIVE') return sendError(socket, 'Bidding is not active.');
    const me = teamPlayer(r, socket); if (!me || me.teamId !== teamId) return sendError(socket, 'Invalid team.');
    const team = r.teams[teamId]; if (!team) return sendError(socket, 'Invalid team.');
    ensurePowerBids(team);
    if (team.powerBidsRemaining <= 0) return sendError(socket, 'No Power Bids remaining.');
    const remaining = (r.currentAuction.endsAt - Date.now()) / 1000;
    if (remaining <= 0) return sendError(socket, 'Timer reached zero.');
    const a = r.currentAuction;
    if (a.highestTeam === teamId) return sendError(socket, 'Your team must wait for another team to bid.');
    const amount = Number(Number(rawAmount).toFixed(2));
    if (!Number.isFinite(amount) || amount <= 0) return sendError(socket, 'Enter a valid Power Bid amount.');
    const minimum = nextBid(a.currentBid);
    if (amount < minimum) return sendError(socket, `Power Bid must be at least ${minimum.toFixed(2)} Cr.`);
    if (team.purse < amount) return sendError(socket, 'Insufficient funds for this Power Bid.');
    team.powerBidsRemaining -= 1;
    a.currentBid = amount; a.highestTeam = teamId; a.highestBidder = me.name; a.bidCount += 1;
    a.bids.push({ teamId, amount, bidderName: me.name, kind: 'POWER', time: new Date().toISOString() });
    a.endsAt = Date.now() + r.settings.timerSeconds * 1000;
    io.to(r.code).emit('auction:bid', { teamId, teamName: team.short, bidderName: me.name, amount, endsAt: a.endsAt, increment: nextBidIncrement(amount), kind: 'POWER', powerBidsRemaining: team.powerBidsRemaining });
    emitRoom(r);
  });

  socket.on('disconnect', async () => {
    const code = sockets.get(socket.id); if (!code) return; sockets.delete(socket.id);
    const r = rooms.get(code); if (!r) return;
    const me = r.players.find(p => p.socketId === socket.id);
    if (me) { me.connected = false; me.socketId = null; }
    if (r.hostId === me?.id) {
      const nextHost = r.players.find(p => p.connected);
      if (nextHost) { r.players.forEach(p => { p.isHost = false; }); r.hostId = nextHost.id; nextHost.isHost = true; io.to(code).emit('host:transferred', { name: nextHost.name }); }
      else if (r.status === 'LIVE') { clearRoomTimer(code); r.status = 'PAUSED'; }
    }
    emitRoom(r);
  });
});

async function boot() {
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      setMongoEnabled(true);
      console.log('MongoDB connected');
    } catch (e) {
      console.warn(
        'MongoDB unavailable; using JSON persistence:',
        e.message
      );
    }
  }
}

// Local development only
if (!process.env.VERCEL) {
  boot();

  server.listen(PORT, '0.0.0.0', () => {
    console.log(
      `PADDLE UP server running on http://localhost:${PORT}`
    );
  });
}

// Vercel needs the server exported
export default server;