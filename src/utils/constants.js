module.exports = {
    // Brand Colors
    colors: {
        primary: 0x6C3CE1,     // Purple
        success: 0x00D26A,     // Green
        error: 0xF8312F,       // Red
        warning: 0xFFB800,     // Amber
        info: 0x00B4D8,        // Cyan
        moderation: 0xFF6B6B,  // Coral
        ticket: 0x5865F2,      // Discord Blurple
        level: 0xF5A623,       // Gold
        security: 0xE74C3C,    // Dark Red
        premium: 0xF0C27F,     // Gold gradient
    },

    // Emojis
    emojis: {
        // Status
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️',
        loading: '⏳',
        
        // Moderation
        ban: '🔨',
        kick: '👢',
        mute: '🔇',
        unmute: '🔊',
        warn: '⚠️',
        timeout: '⏰',
        purge: '🧹',
        case: '📋',
        
        // Features
        welcome: '👋',
        goodbye: '🚪',
        level: '⭐',
        levelUp: '🎉',
        xp: '✨',
        ticket: '🎟️',
        giveaway: '🎁',
        poll: '📊',
        suggest: '💡',
        reputation: '⭐',
        
        // Security
        shield: '🛡️',
        lock: '🔒',
        unlock: '🔓',
        alert: '🚨',
        raid: '⚡',
        
        // General
        bot: '🤖',
        settings: '⚙️',
        stats: '📈',
        calendar: '📅',
        link: '🔗',
        crown: '👑',
        star: '⭐',
        fire: '🔥',
        rocket: '🚀',
        sparkles: '✨',
        globe: '🌐',
        
        // Numbers
        numbers: ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'],
        
        // Progress bar
        barFull: '█',
        barEmpty: '░',
    },

    // Permission levels
    permLevels: {
        USER: 0,
        MODERATOR: 1,
        ADMIN: 2,
        SERVER_OWNER: 3,
        BOT_OWNER: 4,
    },

    // Punishment types
    punishmentTypes: {
        WARN: 'warn',
        MUTE: 'mute',
        KICK: 'kick',
        BAN: 'ban',
        TIMEOUT: 'timeout',
        SOFTBAN: 'softban',
    },

    // Ticket statuses
    ticketStatus: {
        OPEN: 'open',
        CLAIMED: 'claimed',
        CLOSED: 'closed',
        ARCHIVED: 'archived',
    },

    // AutoMod actions
    automodActions: {
        DELETE: 'delete',
        WARN: 'warn',
        MUTE: 'mute',
        KICK: 'kick',
        BAN: 'ban',
    },

    // Suggestion statuses
    suggestionStatus: {
        PENDING: 'pending',
        APPROVED: 'approved',
        DENIED: 'denied',
        IMPLEMENTED: 'implemented',
        CONSIDERED: 'considered',
    },

    // Level XP formula
    xpForLevel: (level) => Math.floor(100 * Math.pow(level, 1.5)),
    levelFromXP: (xp) => Math.floor(Math.pow(xp / 100, 1 / 1.5)),
};
