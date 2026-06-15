const Guild = require('../../models/Guild');
const logger = require('../../utils/logger');
const spamDetector = require('./spamDetector');
const linkFilter = require('./linkFilter');
const embedFactory = require('../../utils/embedBuilder');

class AutoModEngine {
    constructor() {
        this.cache = new Map();
    }

    /**
     * Get guild automod config (with caching)
     */
    async getConfig(guildId) {
        if (this.cache.has(guildId)) {
            const cached = this.cache.get(guildId);
            if (Date.now() - cached.timestamp < 60000) return cached.config;
        }

        const guild = await Guild.findOne({ guildId });
        if (!guild) return null;

        this.cache.set(guildId, { config: guild.automod, timestamp: Date.now() });
        return guild.automod;
    }

    /**
     * Process a message through all automod checks
     */
    async processMessage(message, client) {
        if (!message.guild || message.author.bot) return false;
        if (!message.member) return false;

        const config = await this.getConfig(message.guild.id);
        if (!config || !config.enabled) return false;

        // Check whitelisted roles
        if (config.whitelistedRoles && config.whitelistedRoles.length > 0) {
            const hasWhitelistedRole = message.member.roles.cache.some(
                role => config.whitelistedRoles.includes(role.id)
            );
            if (hasWhitelistedRole) return false;
        }

        // Check whitelisted channels
        if (config.whitelistedChannels && config.whitelistedChannels.includes(message.channel.id)) {
            return false;
        }

        // Skip if user has admin permissions
        if (message.member.permissions.has('Administrator')) return false;

        const violations = [];

        // ── Anti-Spam Check ────────────────────────────
        if (config.antiSpam?.enabled) {
            const spamResult = spamDetector.check(message, config.antiSpam);
            if (spamResult) violations.push(spamResult);
        }

        // ── Anti-Link Check ────────────────────────────
        if (config.antiLink?.enabled) {
            const linkResult = linkFilter.checkLinks(message, config.antiLink);
            if (linkResult) violations.push(linkResult);
        }

        // ── Anti-Invite Check ──────────────────────────
        if (config.antiInvite?.enabled) {
            const inviteResult = linkFilter.checkInvites(message, config.antiInvite);
            if (inviteResult) violations.push(inviteResult);
        }

        // ── Anti-Mass Mention ──────────────────────────
        if (config.antiMassMention?.enabled) {
            const mentionCount = message.mentions.users.size + message.mentions.roles.size;
            if (mentionCount >= config.antiMassMention.threshold) {
                violations.push({
                    type: 'mass_mention',
                    action: config.antiMassMention.action,
                    reason: `Mass mention detected (${mentionCount} mentions)`,
                });
            }
        }

        // ── Anti-Caps Lock ─────────────────────────────
        if (config.antiCaps?.enabled) {
            const content = message.content;
            if (content.length >= config.antiCaps.minLength) {
                const upperCount = (content.match(/[A-Z]/g) || []).length;
                const percentage = (upperCount / content.length) * 100;
                if (percentage >= config.antiCaps.threshold) {
                    violations.push({
                        type: 'excessive_caps',
                        action: config.antiCaps.action,
                        reason: `Excessive caps detected (${Math.round(percentage)}%)`,
                    });
                }
            }
        }

        // ── Blacklisted Words ──────────────────────────
        if (config.blacklistedWords && config.blacklistedWords.length > 0) {
            const content = message.content.toLowerCase();
            const found = config.blacklistedWords.find(word => content.includes(word.toLowerCase()));
            if (found) {
                violations.push({
                    type: 'blacklisted_word',
                    action: 'delete',
                    reason: `Blacklisted word detected`,
                });
            }
        }

        // Process violations
        if (violations.length > 0) {
            await this.handleViolation(message, violations[0], client);
            return true;
        }

        return false;
    }

    /**
     * Handle an automod violation
     */
    async handleViolation(message, violation, client) {
        try {
            // Always try to delete the offending message
            await message.delete().catch(() => {});

            // Send notification
            const embed = embedFactory.warning(
                'AutoMod Action',
                `${message.author} — ${violation.reason}`
            ).addFields(
                { name: 'Channel', value: `${message.channel}`, inline: true },
                { name: 'Action', value: violation.action, inline: true }
            );

            await message.channel.send({ embeds: [embed] }).then(msg => {
                setTimeout(() => msg.delete().catch(() => {}), 5000);
            });

            // Execute additional action
            switch (violation.action) {
                case 'warn':
                    // Add warning to user profile
                    const User = require('../../models/User');
                    await User.findOneAndUpdate(
                        { userId: message.author.id, guildId: message.guild.id },
                        {
                            $push: {
                                warnings: {
                                    moderatorId: client.user.id,
                                    reason: `[AutoMod] ${violation.reason}`,
                                    timestamp: new Date(),
                                }
                            }
                        },
                        { upsert: true }
                    );
                    break;

                case 'mute':
                    try {
                        await message.member.timeout(300000, `[AutoMod] ${violation.reason}`);
                    } catch (err) {
                        logger.error('AutoMod mute failed:', err.message);
                    }
                    break;

                case 'kick':
                    try {
                        await message.member.kick(`[AutoMod] ${violation.reason}`);
                    } catch (err) {
                        logger.error('AutoMod kick failed:', err.message);
                    }
                    break;

                case 'ban':
                    try {
                        await message.member.ban({ reason: `[AutoMod] ${violation.reason}` });
                    } catch (err) {
                        logger.error('AutoMod ban failed:', err.message);
                    }
                    break;
            }

            // Log to mod log channel
            const guildConfig = await Guild.findOne({ guildId: message.guild.id });
            if (guildConfig?.logging?.modLogChannel) {
                const logChannel = message.guild.channels.cache.get(guildConfig.logging.modLogChannel);
                if (logChannel) {
                    const logEmbed = embedFactory.auditLog(
                        '🛡️ AutoMod Action',
                        `**Violation:** ${violation.type}\n**Action:** ${violation.action}`,
                        [
                            { name: 'User', value: `${message.author.tag} (${message.author.id})`, inline: true },
                            { name: 'Channel', value: `${message.channel}`, inline: true },
                            { name: 'Content', value: message.content.substring(0, 1024) || 'N/A' },
                        ]
                    );
                    await logChannel.send({ embeds: [logEmbed] });
                }
            }

            // Update analytics
            const Analytics = require('../../models/Analytics');
            const today = new Date().toISOString().split('T')[0];
            await Analytics.findOneAndUpdate(
                { guildId: message.guild.id, date: today },
                { $inc: { 'moderationActions.automod': 1 } },
                { upsert: true }
            );

            logger.system(`AutoMod: ${violation.type} by ${message.author.tag} in ${message.guild.name}`);
        } catch (error) {
            logger.error('AutoMod violation handler error:', error.message);
        }
    }

    /**
     * Clear cache for a guild
     */
    clearCache(guildId) {
        this.cache.delete(guildId);
    }
}

module.exports = new AutoModEngine();
