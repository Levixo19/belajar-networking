import mongoose from 'mongoose'

const ProfileSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 40 },
  avatar: { type: String, default: '🧑‍💻' },
  progress: { type: mongoose.Schema.Types.Mixed, default: {} }, // {moduleId: 'reading'|'done'}
  srs: { type: mongoose.Schema.Types.Mixed, default: {} },      // {cardId: SrsState}
  xp: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  bestStreak: { type: Number, default: 0 },
  lastActive: { type: String, default: '' },
  scroll: { type: mongoose.Schema.Types.Mixed, default: {} },
  quiz: { type: mongoose.Schema.Types.Mixed, default: {} },   // {quizId: benar?}
  games: { type: mongoose.Schema.Types.Mixed, default: {} },  // {gameSlug: skor terbaik}
}, { timestamps: true, minimize: false })

ProfileSchema.methods.summary = function () {
  const p = this.progress || {}
  const done = Object.values(p).filter(v => v === 'done').length
  return { id: this._id, name: this.name, avatar: this.avatar, xp: this.xp, streak: this.streak, done, updatedAt: this.updatedAt }
}

export const Profile = mongoose.model('Profile', ProfileSchema)
