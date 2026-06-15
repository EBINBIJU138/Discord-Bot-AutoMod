const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ModCase = require('../../models/ModCase');
const Guild = require('../../models/Guild');
const embedFactory = require('../../utils/embedBuilder');
const { canUserModerate, canModerate } = require('../../utils/permissions');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user from the server')
        .addUserOption(option => option.setName('user').setDescription('The user to ban').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Reason for the ban').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction, client) {
        const target = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        if (!target) {
            return interaction.reply({ content: '❌ User not found.', ephemeral: true });
        }

        if (!canUserModerate(interaction.member, target)) {
            return interaction.reply({ content: '❌ You cannot ban a user with equal or higher roles than you.', ephemeral: true });
        }

        if (!canModerate(interaction.guild.members.me, target)) {
            return interaction.reply({ content: '❌ I cannot ban this user. Check my role hierarchy.', ephemeral: true });
        }

        try {
            const guildConfig = await Guild.findOne({ guildId: interaction.guild.id }) || await Guild.create({ guildId: interaction.guild.id });
            const caseNumber = (guildConfig.modCaseCount || 0) + 1;

            await target.send({ embeds: [embedFactory.moderationDM('Banned', interaction.guild.name, reason, null, caseNumber)] }).catch(() => {});

            await target.ban({ reason: `[Case #${caseNumber}] ${reason}` });

            await ModCase.create({
                guildId: interaction.guild.id,
                caseNumber,
                type: 'ban',
                targetId: target.user.id,
                targetTag: target.user.tag,
                moderatorId: interaction.user.id,
                moderatorTag: interaction.user.tag,
                reason
            });

            await Guild.updateOne({ guildId: interaction.guild.id }, { $inc: { modCaseCount: 1 } });

            await interaction.reply({ embeds: [embedFactory.moderation('Ban', interaction.user, target.user, reason, caseNumber)] });

            if (guildConfig.logging?.modLogChannel) {
                const logChannel = interaction.guild.channels.cache.get(guildConfig.logging.modLogChannel);
                if (logChannel) {
                    await logChannel.send({ embeds: [embedFactory.moderation('Ban', interaction.user, target.user, reason, caseNumber)] });
                }
            }
        } catch (error) {
            logger.error('Ban error:', error.message);
            await interaction.reply({ content: '❌ An error occurred while banning the user.', ephemeral: true });
        }
    },
};
