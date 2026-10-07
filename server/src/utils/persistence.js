import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Room from '../models/Room.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../../data');
const file = path.join(dataDir, 'rooms.json');

let mongoEnabled = false;
export const setMongoEnabled = (value) => { mongoEnabled = value; };

async function ensureFile() {
  await fs.mkdir(dataDir, { recursive: true });
  try { await fs.access(file); } catch { await fs.writeFile(file, '{}'); }
}

export async function saveRoom(room) {
  if (mongoEnabled) {
    await Room.findOneAndUpdate({ code: room.code }, { code: room.code, state: room }, { upsert: true });
    return;
  }
  await ensureFile();
  const raw = await fs.readFile(file, 'utf8');
  const all = JSON.parse(raw || '{}');
  all[room.code] = room;
  await fs.writeFile(file, JSON.stringify(all, null, 2));
}

export async function loadRoom(code) {
  if (mongoEnabled) {
    const doc = await Room.findOne({ code }).lean();
    return doc?.state || null;
  }
  await ensureFile();
  const raw = await fs.readFile(file, 'utf8');
  return JSON.parse(raw || '{}')[code] || null;
}
