const Guild = require('../../models/Guild');
const embedFactory = require('../../utils/embedBuilder');
const logger = require('../../utils/logger');

const securityMonitor = {
    async checkMember(member) {
        try {
            const guildConfig = await Guild.findOne({ guildId: member.guild.id });
            const flags = [];
            const now = Date.now();
            const accountAge = now - member.user.createdTimestamp;
            const minAgeDays = guildConfig?.antiRaid?.accountAgeDays || 0;

            if (minAgeDays > 0 && accountAge < minAgeDays * 24 * 60 * 60 * 1000) {
                flags.push({ type: 'new_account', detail: `Account is ${Math.floor(accountAge / 86400000)} days old (min: ${minAgeDays})` });
            }
            if (!member.user.avatar) flags.push({ type: 'no_avatar', detail: 'User has no profile picture' });
            
            const numRatio = (member.user.username.match(/\d/g) || []).length / member.user.username.length;
            if (numRatio > 0.5) flags.push({ type: 'suspicious_name', detail: 'Username contains mostly numbers' });

            if (flags.length > 0 && guildConfig?.logging?.memberLogChannel) {
                const logChannel = member.guild.channels.cache.get(guildConfig.logging.memberLogChannel);
                if (logChannel) {
                    const embed = embedFactory.security('Suspicious Account Detected',
                        `**User:** ${member.user.tag} (${member.id})\n**Flags:**\n${flags.map(f => `• ${f.detail}`).join('\n')}`
                    ).setThumbnail(member.user.displayAvatarURL({ dynamic: true }));
                    await logChannel.send({ embeds: [embed] });
                }
            }
            return flags;
        } catch (error) {
            logger.error('Security check error:', error.message);
            return [];
        }
    },
};

module.exports = securityMonitor;
