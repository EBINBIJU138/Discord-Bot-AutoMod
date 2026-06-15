const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    ticketNumber: { type: Number, required: true },
    
    userId: { type: String, required: true },
    userTag: { type: String, required: true },
    
    channelId: { type: String, required: true },
    
    category: { type: String, default: 'general' },
    topic: { type: String, default: null },
    
    status: { 
        type: String, 
        enum: ['open', 'claimed', 'closed', 'archived'],
        default: 'open',
    },
    
    claimedBy: { type: String, default: null },
    closedBy: { type: String, default: null },
    
    participants: [{ type: String }],
    
    transcript: { type: String, default: null },
    
    lastActivity: { type: Date, default: Date.now },

}, { timestamps: true });

ticketSchema.index({ guildId: 1, ticketNumber: 1 }, { unique: true });
ticketSchema.index({ guildId: 1, userId: 1, status: 1 });
ticketSchema.index({ channelId: 1 });

module.exports = mongoose.model('Ticket', ticketSchema);
