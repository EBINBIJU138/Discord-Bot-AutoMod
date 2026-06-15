const Suggestion = require('../../models/Suggestion');
const Guild = require('../../models/Guild');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const logger = require('../../utils/logger');

const suggestionManager = {
    async create(interaction, content) {
        const guildConfig = await Guild.findOne({ guildId: interaction.guild.id });
        if (!guildConfig?.suggestions?.enabled) return interaction.reply({ content: '❌ Suggestions not enabled.', ephemeral: true });

        const count = await Suggestion.countDocuments({ guildId: interaction.guild.id });
        const suggestion = await Suggestion.create({
            guildId: interaction.guild.id, suggestionNumber: count + 1,
            userId: interaction.user.id, userTag: interaction.user.tag, content,
        });

        const channel = interaction.guild.channels.cache.get(guildConfig.suggestions.channelId);
        if (!channel) return interaction.reply({ content: '❌ Suggestion channel not found.', ephemeral: true });

        const embed = new EmbedBuilder().setColor(0xFFB800)
            .setTitle(`💡 Suggestion #${suggestion.suggestionNumber}`)
            .setDescription(content)
            .addFields({ name: 'Status', value: '⏳ Pending', inline: true }, { name: 'Votes', value: '👍 0 | 👎 0', inline: true })
            .setFooter({ text: `Suggested by ${interaction.user.tag}` }).setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`suggest_up_${suggestion.suggestionNumber}`).setEmoji('👍').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`suggest_down_${suggestion.suggestionNumber}`).setEmoji('👎').setStyle(ButtonStyle.Danger),
        );

        const msg = await channel.send({ embeds: [embed], components: [row] });
        await Suggestion.updateOne({ _id: suggestion._id }, { messageId: msg.id, channelId: channel.id });
        await interaction.reply({ content: `✅ Suggestion #${suggestion.suggestionNumber} submitted!`, ephemeral: true });
    },

    async handleSuggestionButton(interaction, args) {
        const [direction, numStr] = [args[0], args[1]];
        const num = parseInt(numStr);
        const suggestion = await Suggestion.findOne({ guildId: interaction.guild.id, suggestionNumber: num });
        if (!suggestion) return interaction.reply({ content: '❌ Suggestion not found.', ephemeral: true });

        if (direction === 'up') {
            if (suggestion.upvotes.includes(interaction.user.id)) return interaction.reply({ content: '❌ Already voted.', ephemeral: true });
            await Suggestion.updateOne({ _id: suggestion._id }, { $pull: { downvotes: interaction.user.id }, $addToSet: { upvotes: interaction.user.id } });
        } else {
            if (suggestion.downvotes.includes(interaction.user.id)) return interaction.reply({ content: '❌ Already voted.', ephemeral: true });
            await Suggestion.updateOne({ _id: suggestion._id }, { $pull: { upvotes: interaction.user.id }, $addToSet: { downvotes: interaction.user.id } });
        }

        const updated = await Suggestion.findOne({ _id: suggestion._id });
        const msg = await interaction.channel.messages.fetch(suggestion.messageId).catch(() => null);
        if (msg) {
            const embed = EmbedBuilder.from(msg.embeds[0]);
            embed.spliceFields(1, 1, { name: 'Votes', value: `👍 ${updated.upvotes.length} | 👎 ${updated.downvotes.length}`, inline: true });
            await msg.edit({ embeds: [embed] });
        }
        await interaction.reply({ content: '✅ Vote recorded!', ephemeral: true });
    },

    async handleSuggestionModal() { /* placeholder */ },
};

module.exports = suggestionManager;
