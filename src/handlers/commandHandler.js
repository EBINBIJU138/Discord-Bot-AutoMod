const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

async function commandHandler(client) {
    const commandsPath = path.join(__dirname, '..', 'commands');
    let commandCount = 0;

    function loadCommands(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                loadCommands(fullPath);
            } else if (entry.name.endsWith('.js')) {
                try {
                    const command = require(fullPath);

                    if ('data' in command && 'execute' in command) {
                        client.commands.set(command.data.name, command);
                        commandCount++;
                    } else {
                        logger.warn(`⚠️  Command at ${fullPath} is missing "data" or "execute" property.`);
                    }
                } catch (error) {
                    logger.error(`❌ Failed to load command: ${fullPath}`, error.message);
                }
            }
        }
    }

    if (fs.existsSync(commandsPath)) {
        loadCommands(commandsPath);
    }

    logger.success(`🔧 Loaded ${commandCount} commands successfully!`);
}

module.exports = commandHandler;
