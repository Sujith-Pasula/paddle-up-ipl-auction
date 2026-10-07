import mongoose from 'mongoose';
const SquadSchema = new mongoose.Schema({
  roomCode: String, teamId: String, players: [{ playerId: String, price: Number }], purse: Number,
}, { timestamps: true });
export default mongoose.models.Squad || mongoose.model('Squad', SquadSchema);
