import mongoose from 'mongoose';
const AuctionSchema = new mongoose.Schema({
  roomCode: String, playerId: String, currentBid: Number, highestTeam: String, status: String,
  startedAt: Date, endedAt: Date,
}, { timestamps: true });
export default mongoose.models.Auction || mongoose.model('Auction', AuctionSchema);
