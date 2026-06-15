const logger = require('../../utils/logger');

const rewardManager = {
    async checkRewards(member, level, guildConfig) {
        try {
            const config = guildConfig.leveling;
            if (!config?.roleRewards || config.roleRewards.length === 0) return;

            const rewards = config.roleRewards.filter(r => r.level <= level);
            if (rewards.length === 0) return;

            for (const reward of rewards) {
                const role = member.guild.roles.cache.get(reward.roleId);
                if (!role) continue;
                if (!member.roles.cache.has(role.id)) {
                    await member.roles.add(role, `Level ${reward.level} reward`);
                }
            }

            if (!config.stackRoles && rewards.length > 1) {
                const highest = rewards.reduce((max, r) => r.level > max.level ? r : max, rewards[0]);
                for (const reward of config.roleRewards) {
                    if (reward.level < highest.level && reward.roleId !== highest.roleId) {
                        const role = member.guild.roles.cache.get(reward.roleId);
                        if (role && member.roles.cache.has(role.id)) {
                            await member.roles.remove(role, 'Level role unstacking');
                        }
                    }
                }
            }
        } catch (error) {
            logger.error('Reward check error:', error.message);
        }
    },
};

module.exports = rewardManager;
