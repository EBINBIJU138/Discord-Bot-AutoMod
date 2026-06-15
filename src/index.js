const { Client, GatewayIntentBits, Partials, Collection, ActivityType } = require('discord.js');
const mongoose = require('mongoose');
const config = require('./config');
const logger = require('./utils/logger');
const commandHandler = require('./handlers/commandHandler');
const eventHandler = require('./handlers/eventHandler');

// ══════════════════════════════════════════════════════════
//  🚀 AutoGravity — The Next Generation Discord Management Bot
// ══════════════════════════════════════════════════════════

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildModeration,
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
        Partials.GuildMember,
        Partials.User,
    ],
});

// Collections
client.commands = new Collection();
client.cooldowns = new Collection();
client.snipes = new Collection();

// Anti-spam tracking
client.spamMap = new Map();
client.joinMap = new Map();

// ── Load Handlers ──────────────────────────────────────
async function initialize() {
    logger.info('══════════════════════════════════════════');
    logger.info('  🚀 AutoGravity — Starting Up...');
    logger.info('══════════════════════════════════════════');

    // Load commands & events
    await commandHandler(client);
    await eventHandler(client);

    // Connect to MongoDB
    try {
        await mongoose.connect(config.mongoUri);
        logger.success('📦 Connected to MongoDB successfully!');
    } catch (error) {
        logger.error('Failed to connect to MongoDB:', error.message);
        process.exit(1);
    }

    // Login to Discord
    try {
        await client.login(config.token);
    } catch (error) {
        logger.error('Failed to login to Discord:', error.message);
        process.exit(1);
    }
}

// ── Graceful Shutdown ──────────────────────────────────
process.on('SIGINT', async () => {
    logger.warn('Shutting down AutoGravity...');
    await mongoose.disconnect();
    client.destroy();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    logger.warn('Shutting down AutoGravity...');
    await mongoose.disconnect();
    client.destroy();
    process.exit(0);
});

process.on('unhandledRejection', (error) => {
    logger.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error);
});

// ── Start ──────────────────────────────────────────────
initialize();
