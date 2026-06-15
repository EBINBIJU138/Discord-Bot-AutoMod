const User = require('../../models/User');
const Guild = require('../../models/Guild');
const { xpForLevel, levelFromXP } = require('../../utils/constants');
const embedFactory = require('../../utils/embedBuilder');
const logger = require('../../utils/logger');

// XP cooldown tracking
const xpCooldowns = new Map();

const levelManager = {
    /**
     * Process XP gain from a message
     */
    async processMessage(message) {
        try {
            if (!message.guild || message.author.bot) return;

            const guildConfig = await Guild.findOne({ guildId: message.guild.id });
            if (!guildConfig?.leveling?.enabled) return;

            const config = guildConfig.leveling;

            // Check no-XP roles
            if (config.noXPRoles?.length > 0) {
                const hasNoXPRole = message.member.roles.cache.some(
                    role => config.noXPRoles.includes(role.id)
                );
                if (hasNoXPRole) return;
            }

            // Check no-XP channels
            if (config.noXPChannels?.includes(message.channel.id)) return;

            // Check cooldown
            const cooldownKey = `${message.guild.id}-${message.author.id}`;
            const cooldown = config.xpCooldown || 60000;

            if (xpCooldowns.has(cooldownKey)) {
                const lastGain = xpCooldowns.get(cooldownKey);
                if (Date.now() - lastGain < cooldown) return;
            }

            // Calculate XP
            const minXP = config.xpPerMessage?.min || 15;
            const maxXP = config.xpPerMessage?.max || 25;
            const xpGain = Math.floor(Math.random() * (maxXP - minXP + 1)) + minXP;

            // Update user
            const user = await User.findOneAndUpdate(
                { userId: message.author.id, guildId: message.guild.id },
                {
                    $inc: { xp: xpGain, totalXP: xpGain, messageCount: 1 },
                    $set: { lastXPGain: new Date(), lastActive: new Date() },
                },
                { upsert: true, new: true }
            );

            // Set cooldown
            xpCooldowns.set(cooldownKey, Date.now());

            // Check for level up
            const currentLevel = user.level;
            const newLevel = levelFromXP(user.totalXP);

            if (newLevel > currentLevel) {
                // Update level
                await User.updateOne(
                    { userId: message.author.id, guildId: message.guild.id },
                    { $set: { level: newLevel, xp: user.totalXP - xpForLevel(newLevel) } }
                );

                // Send level up notification
                await this.handleLevelUp(message, newLevel, guildConfig);

                // Check role rewards
                const rewardManager = require('./rewardManager');
                await rewardManager.checkRewards(message.member, newLevel, guildConfig);
            }
        } catch (error) {
            logger.error('Level processing error:', error.message);
        }
    },

    /**
     * Handle level up notification
     */
    async handleLevelUp(message, newLevel, guildConfig) {
        const config = guildConfig.leveling;
        const levelUpMsg = (config.levelUpMessage || '🎉 Congratulations {user}! You reached **Level {level}**!')
            .replace(/{user}/g, `${message.author}`)
            .replace(/{level}/g, newLevel);

        const embed = embedFactory.levelUp(message.author, newLevel);

        // Send to level-up channel or current channel
        const channelId = config.channelId || message.channel.id;
        const channel = message.guild.channels.cache.get(channelId);

        if (channel) {
            await channel.send({ content: levelUpMsg, embeds: [embed] });
        }
    },

    /**
     * Get a user's level info
     */
    async getUserLevel(userId, guildId) {
        let user = await User.findOne({ userId, guildId });
        if (!user) {
            user = { xp: 0, totalXP: 0, level: 0, messageCount: 0 };
        }

        const level = user.level || levelFromXP(user.totalXP);
        const currentLevelXP = xpForLevel(level);
        const nextLevelXP = xpForLevel(level + 1);
        const progress = user.totalXP - currentLevelXP;
        const needed = nextLevelXP - currentLevelXP;
        const percentage = Math.min(100, Math.floor((progress / needed) * 100));

        return {
            level,
            xp: user.totalXP,
            currentXP: progress,
            neededXP: needed,
            percentage,
            messageCount: user.messageCount,
            totalXP: user.totalXP,
        };
    },

    /**
     * Get leaderboard
     */
    async getLeaderboard(guildId, limit = 10) {
        return User.find({ guildId })
            .sort({ totalXP: -1 })
            .limit(limit)
            .lean();
    },

    /**
     * Create a progress bar string
     */
    createProgressBar(percentage, length = 20) {
        const filled = Math.round((percentage / 100) * length);
        const empty = length - filled;
        return '█'.repeat(filled) + '░'.repeat(empty);
    },
};

// Cleanup cooldowns every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, timestamp] of xpCooldowns.entries()) {
        if (now - timestamp > 120000) xpCooldowns.delete(key);
    }
}, 300000);

module.exports = levelManager;
