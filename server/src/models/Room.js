import mongoose from 'mongoose';
const RoomSchema = new mongoose.Schema({
  code: { type: String, unique: true, index: true }, state: mongoose.Schema.Types.Mixed,
}, { timestamps: true });
export default mongoose.models.Room || mongoose.model('Room', RoomSchema);
