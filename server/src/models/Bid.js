import mongoose from 'mongoose';
const BidSchema = new mongoose.Schema({
  roomCode: String, playerId: String, teamId: String, bidderName: String, amount: Number,
  createdAt: { type: Date, default: Date.now },
});
export default mongoose.models.Bid || mongoose.model('Bid', BidSchema);
