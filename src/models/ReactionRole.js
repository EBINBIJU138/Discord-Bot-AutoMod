const mongoose = require('mongoose');

const reactionRoleSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    channelId: { type: String, required: true },
    messageId: { type: String, required: true },

    roles: [{
        emoji: { type: String, required: true },
        roleId: { type: String, required: true },
        label: { type: String, default: null },
    }],

    type: { type: String, enum: ['reaction', 'button'], default: 'button' },
    exclusive: { type: Boolean, default: false }, // Only one role at a time

}, { timestamps: true });

reactionRoleSchema.index({ guildId: 1, messageId: 1 });

module.exports = mongoose.model('ReactionRole', reactionRoleSchema);
