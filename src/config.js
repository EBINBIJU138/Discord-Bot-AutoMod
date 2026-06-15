require('dotenv').config();

const config = {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    mongoUri: process.env.MONGODB_URI,
    geminiApiKey: process.env.GEMINI_API_KEY,
    devGuildId: process.env.DEV_GUILD_ID || null,
    botStatus: process.env.BOT_STATUS || 'Protecting your server 🛡️',
    
    // Default bot settings
    defaults: {
        embedColor: '#6C3CE1',
        successColor: '#00D26A',
        errorColor: '#F8312F',
        warningColor: '#FFB800',
        infoColor: '#00B4D8',
        modColor: '#FF6B6B',
        
        xpPerMessage: { min: 15, max: 25 },
        xpCooldown: 60000, // 1 minute
        
        antiSpamThreshold: 5,    // messages
        antiSpamInterval: 5000,  // 5 seconds
        
        raidThreshold: 10,       // joins
        raidInterval: 10000,     // 10 seconds
        
        ticketCooldown: 300000,  // 5 minutes
        
        accountAgeMinimum: 7,    // days
    }
};

// Validate required config
const required = ['token', 'clientId', 'mongoUri'];
for (const key of required) {
    if (!config[key]) {
        console.error(`❌ Missing required environment variable: ${key.toUpperCase()}`);
        console.error(`   Please check your .env file.`);
        process.exit(1);
    }
}

module.exports = config;
