const mongoose = require('mongoose');

const modCaseSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    caseNumber: { type: Number, required: true },
    
    type: { 
        type: String, 
        required: true,
        enum: ['warn', 'mute', 'unmute', 'kick', 'ban', 'unban', 'timeout', 'softban'],
    },

    targetId: { type: String, required: true },
    targetTag: { type: String, required: true },
    
    moderatorId: { type: String, required: true },
    moderatorTag: { type: String, required: true },

    reason: { type: String, default: 'No reason provided' },
    evidence: { type: String, default: null },

    duration: { type: Number, default: null }, // milliseconds
    expiresAt: { type: Date, default: null },

    active: { type: Boolean, default: true },

    // Appeal
    appeal: {
        status: { type: String, enum: ['none', 'pending', 'approved', 'denied'], default: 'none' },
        reason: { type: String, default: null },
        reviewedBy: { type: String, default: null },
        reviewedAt: { type: Date, default: null },
    },

}, { timestamps: true });

modCaseSchema.index({ guildId: 1, caseNumber: 1 }, { unique: true });
modCaseSchema.index({ guildId: 1, targetId: 1 });
modCaseSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL for auto-cleanup

module.exports = mongoose.model('ModCase', modCaseSchema);
