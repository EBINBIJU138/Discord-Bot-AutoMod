const Guild = require('../../models/Guild');
const logger = require('../../utils/logger');
const embedFactory = require('../../utils/embedBuilder');

// Track join rates per guild
const joinTracker = new Map();

const raidDetector = {
    /**
     * Track a new member join and check for raid
     */
    async checkJoin(member) {
        const guildId = member.guild.id;
        const now = Date.now();

        const guildConfig = await Guild.findOne({ guildId });
        if (!guildConfig?.antiRaid?.enabled) return { isRaid: false };

        const config = guildConfig.antiRaid;

        // Track joins
        if (!joinTracker.has(guildId)) {
            joinTracker.set(guildId, []);
        }

        const joins = joinTracker.get(guildId);
        joins.push({ userId: member.id, timestamp: now });

        // Remove old entries
        const recentJoins = joins.filter(j => now - j.timestamp < config.joinInterval);
        joinTracker.set(guildId, recentJoins);

        // Check if raid threshold reached
        if (recentJoins.length >= config.joinThreshold) {
            logger.warn(`🚨 RAID DETECTED in ${member.guild.name}! (${recentJoins.length} joins in ${config.joinInterval / 1000}s)`);
            return { isRaid: true, joinCount: recentJoins.length, config };
        }

        // Check account age
        const accountAge = now - member.user.createdTimestamp;
        const minAge = config.accountAgeDays * 24 * 60 * 60 * 1000;
        if (accountAge < minAge) {
            return { isRaid: false, suspiciousAccount: true, accountAge };
        }

        return { isRaid: false };
    },

    /**
     * Execute raid protection measures
     */
    async handleRaid(guild, config, client) {
        try {
            // Log the raid alert
            const guildConfig = await Guild.findOne({ guildId: guild.id });
            if (guildConfig?.logging?.modLogChannel) {
                const logChannel = guild.channels.cache.get(guildConfig.logging.modLogChannel);
                if (logChannel) {
                    const embed = embedFactory.security(
                        'RAID DETECTED',
                        `⚡ A potential raid has been detected!\n\n` +
                        `Multiple accounts are joining rapidly.\n` +
                        `Auto-lockdown has been ${config.autoLockdown ? 'ENABLED' : 'skipped'}.`
                    );
                    await logChannel.send({ embeds: [embed] });
                }
            }

            // Auto-lockdown if enabled
            if (config.autoLockdown) {
                const lockdownManager = require('../security/lockdownManager');
                await lockdownManager.lockdown(
                    guild,
                    client.user,
                    '[AutoMod] Raid detected — emergency lockdown',
                    config.lockdownDuration || 600000
                );
            }

            // Take action on recent joins based on config
            const recentJoins = joinTracker.get(guild.id) || [];
            for (const join of recentJoins) {
                const member = guild.members.cache.get(join.userId);
                if (!member) continue;

                switch (config.action) {
                    case 'kick':
                        await member.kick('[AutoMod] Anti-raid protection').catch(() => {});
                        break;
                    case 'ban':
                        await member.ban({ reason: '[AutoMod] Anti-raid protection' }).catch(() => {});
                        break;
                }
            }

            // Clear join tracker
            joinTracker.delete(guild.id);
        } catch (error) {
            logger.error('Raid handler error:', error.message);
        }
    },

    /**
     * Check if an account is suspicious
     */
    isSuspicious(member) {
        const flags = [];
        const now = Date.now();

        // New account (less than 7 days)
        const accountAge = now - member.user.createdTimestamp;
        if (accountAge < 7 * 24 * 60 * 60 * 1000) {
            flags.push('new_account');
        }

        // No avatar
        if (!member.user.avatar) {
            flags.push('no_avatar');
        }

        // Username with lots of numbers (bot-like)
        const numberRatio = (member.user.username.match(/\d/g) || []).length / member.user.username.length;
        if (numberRatio > 0.5) {
            flags.push('bot_like_name');
        }

        return flags;
    },
};

// Cleanup old join data every 30 seconds
setInterval(() => {
    const now = Date.now();
    for (const [guildId, joins] of joinTracker.entries()) {
        const filtered = joins.filter(j => now - j.timestamp < 60000);
        if (filtered.length === 0) joinTracker.delete(guildId);
        else joinTracker.set(guildId, filtered);
    }
}, 30000);

module.exports = raidDetector;
