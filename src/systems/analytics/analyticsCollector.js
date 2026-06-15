const Analytics = require('../../models/Analytics');
const logger = require('../../utils/logger');

const analyticsCollector = {
    async trackMessage(message) {
        if (!message.guild || message.author.bot) return;
        const today = new Date().toISOString().split('T')[0];
        try {
            await Analytics.findOneAndUpdate(
                { guildId: message.guild.id, date: today },
                { $inc: { messageCount: 1 } },
                { upsert: true }
            );
        } catch (e) { /* silent */ }
    },

    async trackModAction(guildId, type) {
        const today = new Date().toISOString().split('T')[0];
        const field = `moderationActions.${type}`;
        await Analytics.findOneAndUpdate(
            { guildId, date: today },
            { $inc: { [field]: 1 } },
            { upsert: true }
        ).catch(() => {});
    },

    async getStats(guildId, days = 7) {
        const dates = [];
        for (let i = 0; i < days; i++) {
            const d = new Date(); d.setDate(d.getDate() - i);
            dates.push(d.toISOString().split('T')[0]);
        }
        return Analytics.find({ guildId, date: { $in: dates } }).sort({ date: -1 }).lean();
    },

    async getDailySnapshot(guildId) {
        const today = new Date().toISOString().split('T')[0];
        return Analytics.findOne({ guildId, date: today }).lean();
    },
};

module.exports = analyticsCollector;
