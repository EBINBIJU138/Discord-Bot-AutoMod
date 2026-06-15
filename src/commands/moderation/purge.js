const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embedFactory = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Purge messages')
        .addIntegerOption(option => option.setName('amount').setDescription('Number of messages').setRequired(true).setMinValue(1).setMaxValue(100))
        .addUserOption(option => option.setName('user').setDescription('Filter by user').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction, client) {
        const amount = interaction.options.getInteger('amount');
        const user = interaction.options.getUser('user');

        try {
            const messages = await interaction.channel.messages.fetch({ limit: amount });
            let filtered = messages;
            if (user) {
                filtered = messages.filter(m => m.author.id === user.id);
            }

            await interaction.channel.bulkDelete(filtered, true);
            const reply = await interaction.reply({ embeds: [embedFactory.success('Purged', `Deleted ${filtered.size} messages.`)], fetchReply: true });
            setTimeout(() => reply.delete().catch(() => {}), 3000);
        } catch (error) {
            await interaction.reply({ content: '❌ Error purging.', ephemeral: true });
        }
    },
};
