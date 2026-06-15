const mongoose = require('mongoose');

const giveawaySchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    channelId: { type: String, required: true },
    messageId: { type: String, required: true },
    
    hostId: { type: String, required: true },
    
    prize: { type: String, required: true },
    description: { type: String, default: null },
    
    winnersCount: { type: Number, default: 1 },
    
    entries: [{ type: String }], // Array of user IDs
    
    endsAt: { type: Date, required: true },
    ended: { type: Boolean, default: false },
    
    winners: [{ type: String }], // Array of winner user IDs
    
    requirements: {
        roleId: { type: String, default: null },
        minLevel: { type: Number, default: 0 },
    },

}, { timestamps: true });

giveawaySchema.index({ guildId: 1, messageId: 1 });
giveawaySchema.index({ endsAt: 1, ended: 1 });

module.exports = mongoose.model('Giveaway', giveawaySchema);
