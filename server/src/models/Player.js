import mongoose from 'mongoose';
const PlayerSchema = new mongoose.Schema({
  id: { type: String, unique: true }, name: String, role: String, basePrice: Number, rating: Number,
  nationality: String, batting: Number, bowling: Number, fielding: Number, photo: String,
  previousTeams: [String], custom: Boolean, attributes: mongoose.Schema.Types.Mixed,
}, { timestamps: true });
export default mongoose.models.Player || mongoose.model('Player', PlayerSchema);
