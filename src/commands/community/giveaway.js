const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const giveawayManager = require('../../systems/giveaway/giveawayManager');
const { parseDuration } = require('../../utils/time');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Manage giveaways')
        .addSubcommand(sub => 
            sub.setName('start')
                .setDescription('Start a giveaway')
                .addStringOption(option => option.setName('prize').setDescription('Giveaway prize').setRequired(true))
                .addStringOption(option => option.setName('duration').setDescription('Duration (e.g. 1h, 1d)').setRequired(true))
                .addIntegerOption(option => option.setName('winners').setDescription('Number of winners').setRequired(false))
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction, client) {
        if (interaction.options.getSubcommand() === 'start') {
            const prize = interaction.options.getString('prize');
            const durationStr = interaction.options.getString('duration');
            const winners = interaction.options.getInteger('winners') || 1;

            const durationMs = parseDuration(durationStr);
            if (!durationMs) return interaction.reply({ content: '❌ Invalid duration.', ephemeral: true });

            await interaction.reply({ content: '✅ Starting giveaway...', ephemeral: true });
            await giveawayManager.create(interaction, prize, durationMs, winners, interaction.channel);
        }
    },
};
