// Known phishing/scam domains (partial list, extendable)
const KNOWN_SCAM_DOMAINS = [
    'discord-nitro.com', 'discordgift.com', 'steamcommunlty.com',
    'stearncommunnity.com', 'dlscord.com', 'dlscord-gift.com',
    'disc0rd.com', 'discorde.com', 'discordapp.co',
];

const URL_REGEX = /https?:\/\/[^\s<]+/gi;
const DISCORD_INVITE_REGEX = /(discord\.gg|discord\.com\/invite|discordapp\.com\/invite)\/[\w-]+/gi;

const linkFilter = {
    /**
     * Check for forbidden links
     */
    checkLinks(message, config) {
        const content = message.content;
        const urls = content.match(URL_REGEX);

        if (!urls || urls.length === 0) return null;

        for (const url of urls) {
            try {
                const parsed = new URL(url);
                const domain = parsed.hostname.toLowerCase();

                // Check scam domains
                if (KNOWN_SCAM_DOMAINS.some(scam => domain.includes(scam))) {
                    return {
                        type: 'scam_link',
                        action: 'ban',
                        reason: `Phishing/scam link detected: ${domain}`,
                    };
                }

                // Check if links are allowed
                if (config.whitelistedDomains && config.whitelistedDomains.length > 0) {
                    const isWhitelisted = config.whitelistedDomains.some(
                        wl => domain.includes(wl.toLowerCase())
                    );
                    if (isWhitelisted) continue;
                }

                // Check Discord links specifically
                if (config.allowDiscordLinks && (
                    domain.includes('discord.com') ||
                    domain.includes('discord.gg') ||
                    domain.includes('discordapp.com')
                )) {
                    continue;
                }

                return {
                    type: 'blocked_link',
                    action: config.action || 'delete',
                    reason: `Link not allowed: ${domain}`,
                };
            } catch (e) {
                continue;
            }
        }

        return null;
    },

    /**
     * Check for Discord invites
     */
    checkInvites(message, config) {
        const content = message.content;
        const invites = content.match(DISCORD_INVITE_REGEX);

        if (!invites || invites.length === 0) return null;

        return {
            type: 'discord_invite',
            action: config.action || 'delete',
            reason: `Discord invite link detected`,
        };
    },
};

module.exports = linkFilter;
