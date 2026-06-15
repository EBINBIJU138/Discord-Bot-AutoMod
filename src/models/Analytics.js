const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD format

    // Member stats
    memberCount: { type: Number, default: 0 },
    joins: { type: Number, default: 0 },
    leaves: { type: Number, default: 0 },
    bans: { type: Number, default: 0 },

    // Message stats
    messageCount: { type: Number, default: 0 },
    activeUsers: { type: Number, default: 0 },

    // Channel activity
    channelActivity: [{
        channelId: { type: String },
        messages: { type: Number, default: 0 },
    }],

    // Moderation stats
    moderationActions: {
        warns: { type: Number, default: 0 },
        mutes: { type: Number, default: 0 },
        kicks: { type: Number, default: 0 },
        bans: { type: Number, default: 0 },
        automod: { type: Number, default: 0 },
    },

    // Ticket stats
    ticketsOpened: { type: Number, default: 0 },
    ticketsClosed: { type: Number, default: 0 },

}, { timestamps: true });

analyticsSchema.index({ guildId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Analytics', analyticsSchema);
