const mongoose = require('mongoose');

const suggestionSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    suggestionNumber: { type: Number, required: true },
    
    userId: { type: String, required: true },
    userTag: { type: String, required: true },
    
    messageId: { type: String, default: null },
    channelId: { type: String, default: null },
    
    content: { type: String, required: true },
    
    status: { 
        type: String, 
        enum: ['pending', 'approved', 'denied', 'implemented', 'considered'],
        default: 'pending',
    },
    
    statusReason: { type: String, default: null },
    reviewedBy: { type: String, default: null },
    
    upvotes: [{ type: String }],
    downvotes: [{ type: String }],

}, { timestamps: true });

suggestionSchema.index({ guildId: 1, suggestionNumber: 1 }, { unique: true });

module.exports = mongoose.model('Suggestion', suggestionSchema);
