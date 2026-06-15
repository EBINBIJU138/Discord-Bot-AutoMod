const { Events, Collection } = require('discord.js');
const logger = require('../../utils/logger');
const componentHandler = require('../../handlers/componentHandler');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        try {
            if (interaction.isChatInputCommand()) {
                const command = client.commands.get(interaction.commandName);
                if (!command) return;

                // Handle cooldowns
                if (!client.cooldowns.has(command.data.name)) {
                    client.cooldowns.set(command.data.name, new Collection());
                }

                const now = Date.now();
                const timestamps = client.cooldowns.get(command.data.name);
                const cooldownAmount = (command.cooldown || 3) * 1000;

                if (timestamps.has(interaction.user.id)) {
                    const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
                    if (now < expirationTime) {
                        const timeLeft = (expirationTime - now) / 1000;
                        return interaction.reply({ content: `⏳ Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.data.name}\` command.`, ephemeral: true });
                    }
                }

                timestamps.set(interaction.user.id, now);
                setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

                logger.command(interaction.user.tag, interaction.commandName, interaction.guild?.name || 'DM');
                await command.execute(interaction, client);
            } else if (interaction.isButton() || interaction.isStringSelectMenu() || interaction.isModalSubmit()) {
                await componentHandler(interaction, client);
            }
        } catch (error) {
            logger.error(`Interaction error [${interaction.commandName || interaction.customId}]:`, error.message);
            
            const errReply = { content: '❌ There was an error while executing this command!', ephemeral: true };
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errReply).catch(() => {});
            } else {
                await interaction.reply(errReply).catch(() => {});
            }
        }
    },
};
