const { SlashCommandBuilder } = require('discord.js');
const aiAssistant = require('../../systems/ai/aiAssistant');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ai')
        .setDescription('Interact with AutoGravity AI')
        .addSubcommand(sub => 
            sub.setName('ask')
                .setDescription('Ask the AI a question')
                .addStringOption(option => option.setName('query').setDescription('Your question').setRequired(true))
        ),

    async execute(interaction, client) {
        await interaction.deferReply();
        const query = interaction.options.getString('query');
        const response = await aiAssistant.chat(interaction.user.id, interaction.guild.name, query);
        
        if (response.length > 2000) {
            await interaction.editReply({ content: response.substring(0, 1997) + '...' });
        } else {
            await interaction.editReply({ content: response });
        }
    },
};
