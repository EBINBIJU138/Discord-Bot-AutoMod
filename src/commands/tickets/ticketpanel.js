const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ticketManager = require('../../systems/tickets/ticketManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticketpanel')
        .setDescription('Create a ticket panel in the current channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction, client) {
        const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
        const Guild = require('../../models/Guild');

        const guildConfig = await Guild.findOne({ guildId: interaction.guild.id });
        if (!guildConfig?.tickets?.enabled) {
            return interaction.reply({ content: '❌ Ticket system is not enabled.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('🎫 Support Tickets')
            .setDescription('Please select a category below to open a ticket.')
            .setFooter({ text: 'AutoGravity Support' });

        let categories = guildConfig.tickets.categories || [];
        if (categories.length === 0) {
            categories = [{ name: 'General', emoji: '🎫', description: 'General support' }];
        }

        const select = new StringSelectMenuBuilder()
            .setCustomId('ticketcategory_select')
            .setPlaceholder('Select a category')
            .addOptions(categories.map(c => ({ label: c.name, description: c.description, value: c.name.toLowerCase(), emoji: c.emoji })));

        const row = new ActionRowBuilder().addComponents(select);

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: '✅ Ticket panel created.', ephemeral: true });
    },
};
