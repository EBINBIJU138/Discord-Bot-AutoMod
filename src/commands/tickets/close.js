const { SlashCommandBuilder } = require('discord.js');
const ticketManager = require('../../systems/tickets/ticketManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('close')
        .setDescription('Close the current ticket'),

    async execute(interaction, client) {
        await ticketManager.closeTicket(interaction, client);
    },
};
