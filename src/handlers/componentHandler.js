const logger = require('../utils/logger');

async function componentHandler(interaction, client) {
    // Handle button interactions
    if (interaction.isButton()) {
        const [action, ...args] = interaction.customId.split('_');

        switch (action) {
            case 'ticket':
                const ticketManager = require('../systems/tickets/ticketManager');
                await ticketManager.handleButton(interaction, args, client);
                break;

            case 'verify':
                const verificationManager = require('../systems/welcome/verificationManager');
                await verificationManager.handleVerification(interaction, client);
                break;

            case 'giveaway':
                const giveawayManager = require('../systems/giveaway/giveawayManager');
                await giveawayManager.handleButton(interaction, args, client);
                break;

            case 'role':
                const { handleReactionRoleButton } = require('../systems/roles/reactionRoleManager');
                await handleReactionRoleButton(interaction, args, client);
                break;

            case 'page':
                // Pagination handled inline
                break;

            case 'close':
                if (args[0] === 'ticket') {
                    const tm = require('../systems/tickets/ticketManager');
                    await tm.closeTicket(interaction, client);
                }
                break;

            case 'suggest':
                const { handleSuggestionButton } = require('../systems/community/suggestionManager');
                await handleSuggestionButton(interaction, args, client);
                break;

            default:
                break;
        }
    }

    // Handle select menu interactions
    if (interaction.isStringSelectMenu()) {
        const [action, ...args] = interaction.customId.split('_');

        switch (action) {
            case 'ticketcategory':
                const ticketManager = require('../systems/tickets/ticketManager');
                await ticketManager.handleCategorySelect(interaction, client);
                break;

            case 'settings':
                // Settings menu handled in settings command
                break;

            default:
                break;
        }
    }

    // Handle modal submissions
    if (interaction.isModalSubmit()) {
        const [action, ...args] = interaction.customId.split('_');

        switch (action) {
            case 'ticket':
                const ticketManager = require('../systems/tickets/ticketManager');
                await ticketManager.handleModal(interaction, args, client);
                break;

            case 'suggest':
                const { handleSuggestionModal } = require('../systems/community/suggestionManager');
                await handleSuggestionModal(interaction, args, client);
                break;

            case 'appeal':
                // Appeal modal handling
                break;

            default:
                break;
        }
    }
}

module.exports = componentHandler;
