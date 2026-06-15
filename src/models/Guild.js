const mongoose = require('mongoose');

const guildSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },

    // ── Welcome System ─────────────────────────────────
    welcome: {
        enabled: { type: Boolean, default: false },
        channelId: { type: String, default: null },
        message: { type: String, default: 'Welcome {user} to {server}! You are member #{count}!' },
        dmEnabled: { type: Boolean, default: false },
        dmMessage: { type: String, default: 'Welcome to {server}! Please read the rules.' },
        cardEnabled: { type: Boolean, default: true },
        cardBackground: { type: String, default: null },
        goodbyeEnabled: { type: Boolean, default: false },
        goodbyeChannelId: { type: String, default: null },
        goodbyeMessage: { type: String, default: '{user} has left the server. We now have {count} members.' },
    },

    // ── Verification System ────────────────────────────
    verification: {
        enabled: { type: Boolean, default: false },
        channelId: { type: String, default: null },
        roleId: { type: String, default: null },
        message: { type: String, default: 'Click the button below to verify yourself!' },
    },

    // ── Auto Roles ─────────────────────────────────────
    autoRoles: {
        enabled: { type: Boolean, default: false },
        roles: [{ type: String }],
    },

    // ── Logging ────────────────────────────────────────
    logging: {
        modLogChannel: { type: String, default: null },
        messageLogChannel: { type: String, default: null },
        memberLogChannel: { type: String, default: null },
        serverLogChannel: { type: String, default: null },
    },

    // ── Auto Moderation ────────────────────────────────
    automod: {
        enabled: { type: Boolean, default: false },
        
        antiSpam: {
            enabled: { type: Boolean, default: true },
            threshold: { type: Number, default: 5 },
            interval: { type: Number, default: 5000 },
            action: { type: String, default: 'mute', enum: ['delete', 'warn', 'mute', 'kick', 'ban'] },
            muteDuration: { type: Number, default: 300000 },
        },

        antiLink: {
            enabled: { type: Boolean, default: true },
            allowDiscordLinks: { type: Boolean, default: false },
            whitelistedDomains: [{ type: String }],
            action: { type: String, default: 'delete', enum: ['delete', 'warn', 'mute', 'kick', 'ban'] },
        },

        antiInvite: {
            enabled: { type: Boolean, default: true },
            action: { type: String, default: 'delete', enum: ['delete', 'warn', 'mute', 'kick', 'ban'] },
        },

        antiMassMention: {
            enabled: { type: Boolean, default: true },
            threshold: { type: Number, default: 5 },
            action: { type: String, default: 'mute', enum: ['delete', 'warn', 'mute', 'kick', 'ban'] },
        },

        antiCaps: {
            enabled: { type: Boolean, default: false },
            threshold: { type: Number, default: 70 },
            minLength: { type: Number, default: 10 },
            action: { type: String, default: 'delete', enum: ['delete', 'warn', 'mute', 'kick', 'ban'] },
        },

        toxicityFilter: {
            enabled: { type: Boolean, default: false },
            sensitivity: { type: Number, default: 0.7, min: 0, max: 1 },
            action: { type: String, default: 'delete', enum: ['delete', 'warn', 'mute', 'kick', 'ban'] },
        },

        blacklistedWords: [{ type: String }],
        
        whitelistedRoles: [{ type: String }],
        whitelistedChannels: [{ type: String }],
    },

    // ── Anti-Raid ──────────────────────────────────────
    antiRaid: {
        enabled: { type: Boolean, default: false },
        joinThreshold: { type: Number, default: 10 },
        joinInterval: { type: Number, default: 10000 },
        accountAgeDays: { type: Number, default: 7 },
        action: { type: String, default: 'kick', enum: ['kick', 'ban', 'lockdown'] },
        autoLockdown: { type: Boolean, default: true },
        lockdownDuration: { type: Number, default: 600000 },
    },

    // ── Leveling System ────────────────────────────────
    leveling: {
        enabled: { type: Boolean, default: false },
        channelId: { type: String, default: null },
        xpPerMessage: { min: { type: Number, default: 15 }, max: { type: Number, default: 25 } },
        xpCooldown: { type: Number, default: 60000 },
        levelUpMessage: { type: String, default: '🎉 Congratulations {user}! You reached **Level {level}**!' },
        noXPRoles: [{ type: String }],
        noXPChannels: [{ type: String }],
        roleRewards: [{
            level: { type: Number },
            roleId: { type: String },
        }],
        stackRoles: { type: Boolean, default: false },
    },

    // ── Ticket System ──────────────────────────────────
    tickets: {
        enabled: { type: Boolean, default: false },
        categoryId: { type: String, default: null },
        staffRoleId: { type: String, default: null },
        logChannelId: { type: String, default: null },
        maxOpen: { type: Number, default: 3 },
        autoClose: { type: Boolean, default: false },
        autoCloseHours: { type: Number, default: 48 },
        categories: [{
            name: { type: String },
            emoji: { type: String },
            description: { type: String },
        }],
        welcomeMessage: { type: String, default: 'A staff member will be with you shortly. Please describe your issue.' },
    },

    // ── Suggestions ────────────────────────────────────
    suggestions: {
        enabled: { type: Boolean, default: false },
        channelId: { type: String, default: null },
        reviewChannelId: { type: String, default: null },
    },

    // ── Mod Case Counter ───────────────────────────────
    modCaseCount: { type: Number, default: 0 },

    // ── AI Assistant ───────────────────────────────────
    ai: {
        enabled: { type: Boolean, default: false },
        channelId: { type: String, default: null },
        personality: { type: String, default: 'You are AutoGravity, a helpful and friendly Discord server assistant.' },
    },

    // ── Auto Responses ─────────────────────────────────
    autoResponses: [{
        trigger: { type: String },
        response: { type: String },
        exact: { type: Boolean, default: false },
    }],

    // ── Scheduled Announcements ────────────────────────
    scheduledAnnouncements: [{
        channelId: { type: String },
        message: { type: String },
        cron: { type: String },
        enabled: { type: Boolean, default: true },
    }],

}, { timestamps: true });

module.exports = mongoose.model('Guild', guildSchema);
