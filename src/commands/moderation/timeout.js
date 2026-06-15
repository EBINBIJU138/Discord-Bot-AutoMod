const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ModCase = require('../../models/ModCase');
const Guild = require('../../models/Guild');
const embedFactory = require('../../utils/embedBuilder');
const { parseDuration, formatDuration } = require('../../utils/time');
const { canUserModerate, canModerate } = require('../../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeout a user')
        .addUserOption(option => option.setName('user').setDescription('User to timeout').setRequired(true))
        .addStringOption(option => option.setName('duration').setDescription('Duration (e.g. 1h, 1d)').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Reason').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction, client) {
        const target = interaction.options.getMember('user');
        const durationStr = interaction.options.getString('duration');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        if (!target) return interaction.reply({ content: '❌ User not found.', ephemeral: true });
        if (!canUserModerate(interaction.member, target)) return interaction.reply({ content: '❌ Cannot moderate.', ephemeral: true });
        if (!canModerate(interaction.guild.members.me, target)) return interaction.reply({ content: '❌ I cannot moderate.', ephemeral: true });

        const durationMs = parseDuration(durationStr);
        if (!durationMs || durationMs > 2419200000) return interaction.reply({ content: '❌ Invalid duration. Max 28 days.', ephemeral: true });

        try {
            const guildConfig = await Guild.findOne({ guildId: interaction.guild.id }) || await Guild.create({ guildId: interaction.guild.id });
            const caseNumber = (guildConfig.modCaseCount || 0) + 1;

            await target.timeout(durationMs, `[Case #${caseNumber}] ${reason}`);
            await target.send({ embeds: [embedFactory.moderationDM('Timed out', interaction.guild.name, reason, formatDuration(durationMs), caseNumber)] }).catch(() => {});

            await ModCase.create({
                guildId: interaction.guild.id, caseNumber, type: 'timeout', targetId: target.user.id,
                targetTag: target.user.tag, moderatorId: interaction.user.id, moderatorTag: interaction.user.tag,
                reason, duration: durationMs, expiresAt: new Date(Date.now() + durationMs)
            });

            await Guild.updateOne({ guildId: interaction.guild.id }, { $inc: { modCaseCount: 1 } });
            await interaction.reply({ embeds: [embedFactory.moderation('Timeout', interaction.user, target.user, reason, caseNumber).addFields({ name: 'Duration', value: formatDuration(durationMs) })] });
        } catch (error) {
            await interaction.reply({ content: '❌ Error applying timeout.', ephemeral: true });
        }
    },
};
