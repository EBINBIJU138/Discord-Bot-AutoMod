const Giveaway = require('../../models/Giveaway');
const embedFactory = require('../../utils/embedBuilder');
const logger = require('../../utils/logger');

const giveawayManager = {
    async create(interaction, prize, duration, winnersCount, channel) {
        try {
            const endsAt = new Date(Date.now() + duration);
            const embed = embedFactory.giveaway(prize, interaction.user, endsAt.getTime(), winnersCount);
            const msg = await channel.send({ embeds: [embed] });
            await msg.react('🎉');

            await Giveaway.create({
                guildId: interaction.guild.id, channelId: channel.id, messageId: msg.id,
                hostId: interaction.user.id, prize, winnersCount, endsAt,
            });

            setTimeout(() => this.end(interaction.guild.id, msg.id), duration);
            return msg;
        } catch (error) {
            logger.error('Giveaway create error:', error.message);
            return null;
        }
    },

    async end(guildId, messageId) {
        try {
            const giveaway = await Giveaway.findOne({ guildId, messageId, ended: false });
            if (!giveaway) return;

            const guild = require('../../index')?.guilds?.cache?.get(guildId);
            if (!guild) return;

            const channel = guild.channels.cache.get(giveaway.channelId);
            if (!channel) return;

            const msg = await channel.messages.fetch(messageId).catch(() => null);
            if (!msg) return;

            const reaction = msg.reactions.cache.get('🎉');
            const users = reaction ? await reaction.users.fetch() : new Map();
            const entries = users.filter(u => !u.bot).map(u => u.id);

            const winners = [];
            const pool = [...entries];
            for (let i = 0; i < Math.min(giveaway.winnersCount, pool.length); i++) {
                const idx = Math.floor(Math.random() * pool.length);
                winners.push(pool.splice(idx, 1)[0]);
            }

            await Giveaway.updateOne({ messageId }, { $set: { ended: true, winners, entries } });

            const winnerMentions = winners.map(id => `<@${id}>`).join(', ') || 'No valid entries';
            const embed = embedFactory.giveaway(giveaway.prize, `<@${giveaway.hostId}>`, giveaway.endsAt.getTime(), giveaway.winnersCount)
                .setTitle('🎁 GIVEAWAY ENDED 🎁')
                .setDescription(`**${giveaway.prize}**\n\n🏆 **Winners:** ${winnerMentions}\n\nHosted by: <@${giveaway.hostId}>`);

            await msg.edit({ embeds: [embed] });
            await channel.send({ content: `🎉 Congratulations ${winnerMentions}! You won **${giveaway.prize}**!` });
        } catch (error) {
            logger.error('Giveaway end error:', error.message);
        }
    },

    async handleButton(interaction, args) {
        if (args[0] === 'enter') {
            const giveaway = await Giveaway.findOne({ messageId: interaction.message.id });
            if (!giveaway || giveaway.ended) return interaction.reply({ content: '❌ This giveaway has ended.', ephemeral: true });
            if (giveaway.entries.includes(interaction.user.id)) return interaction.reply({ content: '❌ Already entered.', ephemeral: true });
            await Giveaway.updateOne({ messageId: interaction.message.id }, { $push: { entries: interaction.user.id } });
            await interaction.reply({ content: '✅ You have entered the giveaway!', ephemeral: true });
        }
    },

    async startTimers(client) {
        const active = await Giveaway.find({ ended: false, endsAt: { $gt: new Date() } });
        for (const g of active) {
            const remaining = g.endsAt.getTime() - Date.now();
            if (remaining > 0) setTimeout(() => this.end(g.guildId, g.messageId), remaining);
        }
        logger.info(`⏰ Restored ${active.length} active giveaway timers`);
    },
};

module.exports = giveawayManager;
