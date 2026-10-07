# 🏏 PADDLE UP

Real-time multiplayer IPL auction game.

## Stack

- React 19 + Vite
- Tailwind-style custom CSS UI
- Framer Motion
- Node.js + Express
- Socket.IO
- Optional MongoDB/Mongoose
- JSON persistence by default

## Quick start

### Backend

```powershell
cd server
npm install
npm run dev
```

### Frontend

Open a second terminal:

```powershell
cd client
npm install
npm run dev
```

Open `http://localhost:5173`.

See `RUN_COMMANDS.txt` for the full Windows, multiplayer, phone, and health-check instructions.

## Local persistence

MongoDB is optional. Without `MONGODB_URI`, rooms are stored in `server/data/rooms.json`.

## Environment

Copy `server/.env.example` to `server/.env` if you want custom server settings. Copy `client/.env.example` to `client/.env` if the frontend needs a non-default backend URL.

## Latest auction upgrades

### Power Bids
- Every team starts each room with **2 Power Bids**.
- A Power Bid can jump directly to a chosen amount instead of using the normal increment.
- The amount must be above the current valid next bid and within the team's remaining purse.
- Power Bids still obey the alternating-team rule: the current leading team cannot Power Bid again until another team bids.
- Power Bid count and validation are enforced by the server.

### SOLD / UNSOLD notifications
- SOLD and UNSOLD now appear as a compact in-window notification toast.
- The auction player, timer, squads and controls remain visible underneath.
- SOLD shows the player, winning team and final price.
- UNSOLD shows the player and no-successful-bid status.
- Notifications auto-dismiss after a few seconds and use the existing sound toggle for short SOLD/UNSOLD sound effects.

## Auction audio
- SOLD: browser-preloaded auction voice cue (“SOLD!”) followed by a short gavel hit.
- UNSOLD: short game-show style buzzer.
- Audio is played once per auction outcome event and respects the in-game mute button.
- Reference used for the sound design target: https://freesound.org/people/watchthatfilms/sounds/692529/
- UNSOLD reference: https://pixabay.com/sound-effects/film-special-effects-buzzerwav-14908/
- The packaged local audio files are short, self-contained fallback assets so the game does not depend on an external CDN at auction time.
