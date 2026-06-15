const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

async function eventHandler(client) {
    const eventsPath = path.join(__dirname, '..', 'events');
    let eventCount = 0;

    function loadEvents(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                loadEvents(fullPath);
            } else if (entry.name.endsWith('.js')) {
                try {
                    const event = require(fullPath);

                    if (!event.name) {
                        logger.warn(`⚠️  Event at ${fullPath} is missing "name" property.`);
                        continue;
                    }

                    if (event.once) {
                        client.once(event.name, (...args) => event.execute(...args, client));
                    } else {
                        client.on(event.name, (...args) => event.execute(...args, client));
                    }

                    eventCount++;
                } catch (error) {
                    logger.error(`❌ Failed to load event: ${fullPath}`, error.message);
                }
            }
        }
    }

    if (fs.existsSync(eventsPath)) {
        loadEvents(eventsPath);
    }

    logger.success(`⚡ Loaded ${eventCount} events successfully!`);
}

module.exports = eventHandler;
