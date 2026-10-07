import mongoose from 'mongoose';
const TransactionSchema = new mongoose.Schema({
  roomCode: String, teamId: String, playerId: String, price: Number, type: { type: String, default: 'PURCHASE' },
}, { timestamps: true });
export default mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
