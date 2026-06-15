const { Events, ActivityType } = require('discord.js');
const logger = require('../../utils/logger');
const config = require('../../config');
const giveawayManager = require('../../systems/giveaway/giveawayManager');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        logger.success(`🚀 Logged in as ${client.user.tag}`);
        
        client.user.setPresence({
            activities: [{ name: config.botStatus, type: ActivityType.Watching }],
            status: 'online',
        });

        // Start systems
        await giveawayManager.startTimers(client);

        logger.info(`✨ AutoGravity is ready to protect ${client.guilds.cache.size} servers!`);
    },
};
