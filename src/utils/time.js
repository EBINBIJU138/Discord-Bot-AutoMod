const ms = require('ms');

/**
 * Parse a duration string into milliseconds
 * Supports: 1s, 1m, 1h, 1d, 1w, 1y
 * Also supports compound: 1d12h, 2h30m
 */
function parseDuration(input) {
    if (!input) return null;

    // Try ms library first
    const result = ms(input);
    if (result) return result;

    // Try compound duration parsing
    const regex = /(\d+)\s*(s|sec|second|seconds|m|min|minute|minutes|h|hr|hour|hours|d|day|days|w|week|weeks|mo|month|months|y|year|years)/gi;
    let total = 0;
    let match;

    while ((match = regex.exec(input)) !== null) {
        const value = parseInt(match[1]);
        const unit = match[2].toLowerCase();

        switch (unit) {
            case 's': case 'sec': case 'second': case 'seconds':
                total += value * 1000; break;
            case 'm': case 'min': case 'minute': case 'minutes':
                total += value * 60 * 1000; break;
            case 'h': case 'hr': case 'hour': case 'hours':
                total += value * 60 * 60 * 1000; break;
            case 'd': case 'day': case 'days':
                total += value * 24 * 60 * 60 * 1000; break;
            case 'w': case 'week': case 'weeks':
                total += value * 7 * 24 * 60 * 60 * 1000; break;
            case 'mo': case 'month': case 'months':
                total += value * 30 * 24 * 60 * 60 * 1000; break;
            case 'y': case 'year': case 'years':
                total += value * 365 * 24 * 60 * 60 * 1000; break;
        }
    }

    return total > 0 ? total : null;
}

/**
 * Format milliseconds to a human-readable string
 */
function formatDuration(ms) {
    if (!ms) return 'Permanent';

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours % 24 > 0) parts.push(`${hours % 24}h`);
    if (minutes % 60 > 0) parts.push(`${minutes % 60}m`);
    if (seconds % 60 > 0 && days === 0) parts.push(`${seconds % 60}s`);

    return parts.join(' ') || '0s';
}

/**
 * Get a Discord relative timestamp
 */
function relativeTimestamp(date) {
    const unix = Math.floor(date.getTime() / 1000);
    return `<t:${unix}:R>`;
}

/**
 * Get a Discord full timestamp
 */
function fullTimestamp(date) {
    const unix = Math.floor(date.getTime() / 1000);
    return `<t:${unix}:F>`;
}

/**
 * Get a Discord short timestamp
 */
function shortTimestamp(date) {
    const unix = Math.floor(date.getTime() / 1000);
    return `<t:${unix}:f>`;
}

module.exports = {
    parseDuration,
    formatDuration,
    relativeTimestamp,
    fullTimestamp,
    shortTimestamp,
};
