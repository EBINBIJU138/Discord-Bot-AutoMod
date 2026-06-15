const Guild = require('../../models/Guild');
const Analytics = require('../../models/Analytics');
const embedFactory = require('../../utils/embedBuilder');
const logger = require('../../utils/logger');

const welcomeManager = {
    /**
     * Handle a new member joining
     */
    async handleJoin(member, client) {
        try {
            const guildConfig = await Guild.findOne({ guildId: member.guild.id });
            if (!guildConfig?.welcome?.enabled) return;

            const config = guildConfig.welcome;
            const memberCount = member.guild.memberCount;

            // ── Send Welcome Message ───────────────────
            if (config.channelId) {
                const channel = member.guild.channels.cache.get(config.channelId);
                if (channel) {
                    // Format message
                    const message = this.formatMessage(config.message, member, memberCount);

                    // Create welcome embed
                    const embed = embedFactory.welcome(member, member.guild.name, memberCount);

                    // Send welcome embed
                    await channel.send({ content: message, embeds: [embed] });
                }
            }

            // ── Send DM ───────────────────────────────
            if (config.dmEnabled) {
                try {
                    const dmMessage = this.formatMessage(config.dmMessage, member, memberCount);
                    const dmEmbed = embedFactory.info(
                        `Welcome to ${member.guild.name}!`,
                        dmMessage
                    ).setThumbnail(member.guild.iconURL({ dynamic: true }));

                    await member.send({ embeds: [dmEmbed] });
                } catch (err) {
                    // User has DMs disabled, ignore
                }
            }

            // ── Update Analytics ───────────────────────
            const today = new Date().toISOString().split('T')[0];
            await Analytics.findOneAndUpdate(
                { guildId: member.guild.id, date: today },
                {
                    $inc: { joins: 1 },
                    $set: { memberCount: memberCount },
                },
                { upsert: true }
            );

            logger.info(`👋 ${member.user.tag} joined ${member.guild.name}`);
        } catch (error) {
            logger.error('Welcome handler error:', error.message);
        }
    },

    /**
     * Handle a member leaving
     */
    async handleLeave(member, client) {
        try {
            const guildConfig = await Guild.findOne({ guildId: member.guild.id });
            if (!guildConfig?.welcome?.goodbyeEnabled) return;

            const config = guildConfig.welcome;
            const memberCount = member.guild.memberCount;

            if (config.goodbyeChannelId) {
                const channel = member.guild.channels.cache.get(config.goodbyeChannelId);
                if (channel) {
                    const message = this.formatMessage(config.goodbyeMessage, member, memberCount);
                    const embed = embedFactory.basic(message)
                        .setColor(0x95A5A6)
                        .setTitle(`🚪 ${member.user.tag} has left`)
                        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }));

                    await channel.send({ embeds: [embed] });
                }
            }

            // Update Analytics
            const today = new Date().toISOString().split('T')[0];
            await Analytics.findOneAndUpdate(
                { guildId: member.guild.id, date: today },
                {
                    $inc: { leaves: 1 },
                    $set: { memberCount: memberCount },
                },
                { upsert: true }
            );

            logger.info(`🚪 ${member.user.tag} left ${member.guild.name}`);
        } catch (error) {
            logger.error('Goodbye handler error:', error.message);
        }
    },

    /**
     * Format a welcome/goodbye message with variables
     */
    formatMessage(template, member, memberCount) {
        return template
            .replace(/{user}/g, `${member}`)
            .replace(/{username}/g, member.user.username)
            .replace(/{tag}/g, member.user.tag)
            .replace(/{server}/g, member.guild.name)
            .replace(/{count}/g, memberCount.toString())
            .replace(/{id}/g, member.id);
    },
};

module.exports = welcomeManager;
