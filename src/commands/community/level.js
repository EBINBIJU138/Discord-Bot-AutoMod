const { SlashCommandBuilder } = require('discord.js');
const levelManager = require('../../systems/leveling/levelManager');
const embedFactory = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('level')
        .setDescription('View your or another user\'s level')
        .addUserOption(option => option.setName('user').setDescription('The user to view').setRequired(false)),

    async execute(interaction, client) {
        const user = interaction.options.getUser('user') || interaction.user;
        const levelData = await levelManager.getUserLevel(user.id, interaction.guild.id);

        const embed = embedFactory.basic(`**Level:** ${levelData.level}\n**Total XP:** ${levelData.totalXP}\n\n**Progress:** ${levelManager.createProgressBar(levelData.percentage)} ${levelData.percentage}%`)
            .setTitle(`⭐ ${user.username}'s Level Card`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }));

        await interaction.reply({ embeds: [embed] });
    },
};
