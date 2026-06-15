const { Events } = require('discord.js');
const welcomeManager = require('../../systems/welcome/welcomeManager');

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(member, client) {
        await welcomeManager.handleLeave(member, client);
    },
};
