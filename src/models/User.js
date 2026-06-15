const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },

    // ── Leveling ───────────────────────────────────────
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 0 },
    totalXP: { type: Number, default: 0 },
    messageCount: { type: Number, default: 0 },
    lastXPGain: { type: Date, default: null },

    // ── Reputation ─────────────────────────────────────
    reputation: { type: Number, default: 0 },
    lastRepGiven: { type: Date, default: null },

    // ── Moderation ─────────────────────────────────────
    warnings: [{
        moderatorId: { type: String },
        reason: { type: String },
        timestamp: { type: Date, default: Date.now },
        caseId: { type: Number },
    }],
    
    mutedUntil: { type: Date, default: null },
    isMuted: { type: Boolean, default: false },

    // ── Activity Tracking ──────────────────────────────
    joinedAt: { type: Date, default: Date.now },
    lastActive: { type: Date, default: Date.now },
    voiceMinutes: { type: Number, default: 0 },

    // ── Economy (Future) ───────────────────────────────
    balance: { type: Number, default: 0 },
    bank: { type: Number, default: 0 },

}, { timestamps: true });

userSchema.index({ userId: 1, guildId: 1 }, { unique: true });
userSchema.index({ guildId: 1, totalXP: -1 }); // For leaderboard queries

module.exports = mongoose.model('User', userSchema);
