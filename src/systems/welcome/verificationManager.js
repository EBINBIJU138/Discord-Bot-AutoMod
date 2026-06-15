const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const Guild = require('../../models/Guild');
const embedFactory = require('../../utils/embedBuilder');
const logger = require('../../utils/logger');

const verificationManager = {
    /**
     * Set up verification panel in a channel
     */
    async setupPanel(channel, guildConfig) {
        const embed = new EmbedBuilder()
            .setColor(0x6C3CE1)
            .setTitle('🛡️ Server Verification')
            .setDescription(
                guildConfig.verification.message ||
                'Click the button below to verify yourself and gain access to the server!'
            )
            .addFields(
                { name: '📋 Instructions', value: '1. Click the **Verify** button below\n2. You will receive the verified role\n3. Enjoy the server!' }
            )
            .setFooter({ text: 'AutoGravity Verification System' })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('verify_member')
                .setLabel('✅ Verify')
                .setStyle(ButtonStyle.Success)
        );

        await channel.send({ embeds: [embed], components: [row] });
    },

    /**
     * Handle verification button click
     */
    async handleVerification(interaction, client) {
        try {
            const guildConfig = await Guild.findOne({ guildId: interaction.guild.id });
            if (!guildConfig?.verification?.enabled) {
                return interaction.reply({
                    content: '❌ Verification is not enabled on this server.',
                    ephemeral: true,
                });
            }

            const roleId = guildConfig.verification.roleId;
            if (!roleId) {
                return interaction.reply({
                    content: '❌ Verification role not configured.',
                    ephemeral: true,
                });
            }

            const role = interaction.guild.roles.cache.get(roleId);
            if (!role) {
                return interaction.reply({
                    content: '❌ Verification role not found.',
                    ephemeral: true,
                });
            }

            // Check if already verified
            if (interaction.member.roles.cache.has(roleId)) {
                return interaction.reply({
                    content: '✅ You are already verified!',
                    ephemeral: true,
                });
            }

            // Check account age
            const accountAge = Date.now() - interaction.user.createdTimestamp;
            const minAgeDays = guildConfig.antiRaid?.accountAgeDays || 0;
            if (minAgeDays > 0 && accountAge < minAgeDays * 24 * 60 * 60 * 1000) {
                return interaction.reply({
                    content: `❌ Your account must be at least **${minAgeDays} days** old to verify.`,
                    ephemeral: true,
                });
            }

            // Assign role
            await interaction.member.roles.add(role, 'Member verification');

            await interaction.reply({
                content: '✅ You have been verified successfully! Welcome to the server!',
                ephemeral: true,
            });

            // Log verification
            if (guildConfig.logging?.memberLogChannel) {
                const logChannel = interaction.guild.channels.cache.get(guildConfig.logging.memberLogChannel);
                if (logChannel) {
                    const embed = embedFactory.auditLog(
                        '✅ Member Verified',
                        `${interaction.user.tag} has been verified.`,
                        [{ name: 'User', value: `${interaction.user} (${interaction.user.id})` }]
                    );
                    await logChannel.send({ embeds: [embed] });
                }
            }

            logger.info(`✅ ${interaction.user.tag} verified in ${interaction.guild.name}`);
        } catch (error) {
            logger.error('Verification error:', error.message);
            await interaction.reply({
                content: '❌ An error occurred during verification. Please contact a moderator.',
                ephemeral: true,
            }).catch(() => {});
        }
    },
};

module.exports = verificationManager;
