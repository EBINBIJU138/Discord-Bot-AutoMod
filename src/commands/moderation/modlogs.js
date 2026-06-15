const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ModCase = require('../../models/ModCase');
const embedFactory = require('../../utils/embedBuilder');
const { paginate } = require('../../utils/pagination');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('modlogs')
        .setDescription('View moderation logs for a user')
        .addUserOption(option => option.setName('user').setDescription('The user to view logs for').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction, client) {
        const user = interaction.options.getUser('user');

        try {
            const cases = await ModCase.find({ guildId: interaction.guild.id, targetId: user.id }).sort({ createdAt: -1 });

            if (cases.length === 0) {
                return interaction.reply({ content: `✅ No moderation logs found for ${user.tag}.`, ephemeral: true });
            }

            const pages = [];
            let currentDescription = '';
            
            for (let i = 0; i < cases.length; i++) {
                const c = cases[i];
                const date = `<t:${Math.floor(c.createdAt.getTime() / 1000)}:R>`;
                const str = `**Case #${c.caseNumber}** | ${c.type.toUpperCase()}\nModerator: <@${c.moderatorId}>\nReason: ${c.reason}\nDate: ${date}\n\n`;
                
                if (currentDescription.length + str.length > 2000) {
                    pages.push(embedFactory.basic(currentDescription).setTitle(`📋 Mod Logs: ${user.tag}`));
                    currentDescription = str;
                } else {
                    currentDescription += str;
                }
            }

            if (currentDescription.length > 0) {
                pages.push(embedFactory.basic(currentDescription).setTitle(`📋 Mod Logs: ${user.tag}`));
            }

            await interaction.deferReply();
            await paginate(interaction, pages);
        } catch (error) {
            await interaction.reply({ content: '❌ Error fetching mod logs.', ephemeral: true });
        }
    },
};
