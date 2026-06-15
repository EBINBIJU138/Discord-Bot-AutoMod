const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ModCase = require('../../models/ModCase');
const User = require('../../models/User');
const Guild = require('../../models/Guild');
const embedFactory = require('../../utils/embedBuilder');
const { canUserModerate } = require('../../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a user')
        .addUserOption(option => option.setName('user').setDescription('User to warn').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Reason').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction, client) {
        const target = interaction.options.getMember('user') || interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');

        if (target.id === interaction.user.id) return interaction.reply({ content: '❌ You cannot warn yourself.', ephemeral: true });
        if (target.bot) return interaction.reply({ content: '❌ Cannot warn bots.', ephemeral: true });

        if (interaction.guild.members.cache.has(target.id)) {
            const member = interaction.guild.members.cache.get(target.id);
            if (!canUserModerate(interaction.member, member)) return interaction.reply({ content: '❌ Cannot warn.', ephemeral: true });
        }

        try {
            const guildConfig = await Guild.findOne({ guildId: interaction.guild.id }) || await Guild.create({ guildId: interaction.guild.id });
            const caseNumber = (guildConfig.modCaseCount || 0) + 1;

            const targetUser = target.user || target;
            await targetUser.send({ embeds: [embedFactory.moderationDM('Warned', interaction.guild.name, reason, null, caseNumber)] }).catch(() => {});

            await User.findOneAndUpdate(
                { userId: target.id, guildId: interaction.guild.id },
                { $push: { warnings: { moderatorId: interaction.user.id, reason, timestamp: new Date(), caseId: caseNumber } } },
                { upsert: true }
            );

            await ModCase.create({
                guildId: interaction.guild.id, caseNumber, type: 'warn', targetId: target.id,
                targetTag: targetUser.tag, moderatorId: interaction.user.id, moderatorTag: interaction.user.tag, reason
            });

            await Guild.updateOne({ guildId: interaction.guild.id }, { $inc: { modCaseCount: 1 } });
            await interaction.reply({ embeds: [embedFactory.moderation('Warn', interaction.user, targetUser, reason, caseNumber)] });
        } catch (error) {
            await interaction.reply({ content: '❌ Error warning user.', ephemeral: true });
        }
    },
};
