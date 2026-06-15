const { Events } = require('discord.js');
const welcomeManager = require('../../systems/welcome/welcomeManager');
const raidDetector = require('../../systems/automod/raidDetector');
const securityMonitor = require('../../systems/security/securityMonitor');
const lockdownManager = require('../../systems/security/lockdownManager');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member, client) {
        // Stop execution if server is locked down
        if (lockdownManager.isLocked(member.guild.id)) {
            // Optional: Auto-kick if locked
            // await member.kick('Server is currently locked down.').catch(() => {});
            return;
        }

        // Anti-Raid check
        const raidResult = await raidDetector.checkJoin(member);
        if (raidResult.isRaid) {
            await raidDetector.handleRaid(member.guild, raidResult.config, client);
            return;
        }

        // Security monitoring
        await securityMonitor.checkMember(member);

        // Welcome System
        await welcomeManager.handleJoin(member, client);

        // Auto Roles
        const Guild = require('../../models/Guild');
        const guildConfig = await Guild.findOne({ guildId: member.guild.id });
        if (guildConfig?.autoRoles?.enabled && guildConfig.autoRoles.roles?.length > 0) {
            for (const roleId of guildConfig.autoRoles.roles) {
                const role = member.guild.roles.cache.get(roleId);
                if (role) await member.roles.add(role, 'Auto-role on join').catch(() => {});
            }
        }
    },
};
