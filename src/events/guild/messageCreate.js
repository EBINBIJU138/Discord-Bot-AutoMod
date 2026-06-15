const { Events } = require('discord.js');
const automodEngine = require('../../systems/automod/automodEngine');
const levelManager = require('../../systems/leveling/levelManager');
const analyticsCollector = require('../../systems/analytics/analyticsCollector');

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        if (message.author.bot) return;

        // AutoMod check (returns true if message was deleted/handled)
        const isViolator = await automodEngine.processMessage(message, client);
        if (isViolator) return;

        // Leveling
        await levelManager.processMessage(message);

        // Analytics
        await analyticsCollector.trackMessage(message);
    },
};
