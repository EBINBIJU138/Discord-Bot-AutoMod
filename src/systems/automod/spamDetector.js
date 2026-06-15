// Message rate tracking per user
const messageMap = new Map();
const duplicateMap = new Map();

const spamDetector = {
    /**
     * Check if a message is spam
     */
    check(message, config) {
        const userId = message.author.id;
        const guildId = message.guild.id;
        const key = `${guildId}-${userId}`;
        const now = Date.now();

        // ── Rate Limiting Check ────────────────────────
        if (!messageMap.has(key)) {
            messageMap.set(key, []);
        }

        const timestamps = messageMap.get(key);
        timestamps.push(now);

        // Remove old timestamps
        const filtered = timestamps.filter(t => now - t < (config.interval || 5000));
        messageMap.set(key, filtered);

        if (filtered.length >= (config.threshold || 5)) {
            messageMap.delete(key);
            return {
                type: 'spam',
                action: config.action || 'mute',
                reason: `Spam detected (${filtered.length} messages in ${(config.interval || 5000) / 1000}s)`,
            };
        }

        // ── Duplicate Message Check ────────────────────
        if (!duplicateMap.has(key)) {
            duplicateMap.set(key, []);
        }

        const prevMessages = duplicateMap.get(key);
        prevMessages.push({ content: message.content, timestamp: now });

        // Keep only recent messages
        const recentDupes = prevMessages.filter(m => now - m.timestamp < 10000);
        duplicateMap.set(key, recentDupes);

        const duplicates = recentDupes.filter(m => m.content === message.content);
        if (duplicates.length >= 3) {
            duplicateMap.delete(key);
            return {
                type: 'duplicate_spam',
                action: config.action || 'mute',
                reason: `Duplicate message spam detected (${duplicates.length} identical messages)`,
            };
        }

        return null;
    },

    /**
     * Clean up old entries periodically
     */
    cleanup() {
        const now = Date.now();
        for (const [key, timestamps] of messageMap.entries()) {
            const filtered = timestamps.filter(t => now - t < 30000);
            if (filtered.length === 0) messageMap.delete(key);
            else messageMap.set(key, filtered);
        }
        for (const [key, messages] of duplicateMap.entries()) {
            const filtered = messages.filter(m => now - m.timestamp < 30000);
            if (filtered.length === 0) duplicateMap.delete(key);
            else duplicateMap.set(key, filtered);
        }
    },
};

// Cleanup every 60 seconds
setInterval(() => spamDetector.cleanup(), 60000);

module.exports = spamDetector;
