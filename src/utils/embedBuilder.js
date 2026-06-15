const { EmbedBuilder } = require('discord.js');
const { colors, emojis } = require('./constants');

const embedFactory = {
    /**
     * Create a success embed
     */
    success(title, description) {
        return new EmbedBuilder()
            .setColor(colors.success)
            .setTitle(`${emojis.success} ${title}`)
            .setDescription(description)
            .setTimestamp()
            .setFooter({ text: 'AutoGravity', iconURL: null });
    },

    /**
     * Create an error embed
     */
    error(title, description) {
        return new EmbedBuilder()
            .setColor(colors.error)
            .setTitle(`${emojis.error} ${title}`)
            .setDescription(description)
            .setTimestamp()
            .setFooter({ text: 'AutoGravity', iconURL: null });
    },

    /**
     * Create a warning embed
     */
    warning(title, description) {
        return new EmbedBuilder()
            .setColor(colors.warning)
            .setTitle(`${emojis.warning} ${title}`)
            .setDescription(description)
            .setTimestamp()
            .setFooter({ text: 'AutoGravity', iconURL: null });
    },

    /**
     * Create an info embed
     */
    info(title, description) {
        return new EmbedBuilder()
            .setColor(colors.info)
            .setTitle(`${emojis.info} ${title}`)
            .setDescription(description)
            .setTimestamp()
            .setFooter({ text: 'AutoGravity', iconURL: null });
    },

    /**
     * Create a moderation action embed
     */
    moderation(action, moderator, target, reason, caseNumber) {
        const actionEmoji = emojis[action.toLowerCase()] || emojis.case;
        return new EmbedBuilder()
            .setColor(colors.moderation)
            .setTitle(`${actionEmoji} ${action}`)
            .addFields(
                { name: '👤 User', value: `${target} (${target.id})`, inline: true },
                { name: '🛡️ Moderator', value: `${moderator}`, inline: true },
                { name: '📋 Case', value: `#${caseNumber}`, inline: true },
                { name: '📝 Reason', value: reason || 'No reason provided' }
            )
            .setThumbnail(target.displayAvatarURL({ dynamic: true }))
            .setTimestamp()
            .setFooter({ text: 'AutoGravity Moderation' });
    },

    /**
     * Create a moderation DM embed
     */
    moderationDM(action, guildName, reason, duration, caseNumber) {
        const embed = new EmbedBuilder()
            .setColor(colors.moderation)
            .setTitle(`You have been ${action} in ${guildName}`)
            .addFields(
                { name: '📝 Reason', value: reason || 'No reason provided' },
                { name: '📋 Case', value: `#${caseNumber}` }
            )
            .setTimestamp()
            .setFooter({ text: 'AutoGravity Moderation' });

        if (duration) {
            embed.addFields({ name: '⏰ Duration', value: duration });
        }

        return embed;
    },

    /**
     * Create a welcome embed
     */
    welcome(member, guildName, memberCount) {
        return new EmbedBuilder()
            .setColor(colors.primary)
            .setTitle(`${emojis.welcome} Welcome to ${guildName}!`)
            .setDescription(`Hey ${member}, welcome to **${guildName}**!\nYou are our **${memberCount}th** member!`)
            .setThumbnail(member.displayAvatarURL({ dynamic: true, size: 256 }))
            .setTimestamp()
            .setFooter({ text: `AutoGravity • Member #${memberCount}` });
    },

    /**
     * Create a ticket embed
     */
    ticket(title, description) {
        return new EmbedBuilder()
            .setColor(colors.ticket)
            .setTitle(`${emojis.ticket} ${title}`)
            .setDescription(description)
            .setTimestamp()
            .setFooter({ text: 'AutoGravity Tickets' });
    },

    /**
     * Create a level up embed
     */
    levelUp(user, level) {
        return new EmbedBuilder()
            .setColor(colors.level)
            .setTitle(`${emojis.levelUp} Level Up!`)
            .setDescription(`Congratulations ${user}! You've reached **Level ${level}**!`)
            .setTimestamp()
            .setFooter({ text: 'AutoGravity Leveling' });
    },

    /**
     * Create a security alert embed
     */
    security(title, description) {
        return new EmbedBuilder()
            .setColor(colors.security)
            .setTitle(`${emojis.alert} ${title}`)
            .setDescription(description)
            .setTimestamp()
            .setFooter({ text: 'AutoGravity Security' });
    },

    /**
     * Create an audit log embed
     */
    auditLog(title, description, fields = []) {
        const embed = new EmbedBuilder()
            .setColor(colors.primary)
            .setTitle(title)
            .setDescription(description)
            .setTimestamp()
            .setFooter({ text: 'AutoGravity Audit Log' });

        if (fields.length > 0) {
            embed.addFields(fields);
        }

        return embed;
    },

    /**
     * Create a giveaway embed
     */
    giveaway(prize, host, endTime, winners) {
        return new EmbedBuilder()
            .setColor(colors.premium)
            .setTitle(`${emojis.giveaway} GIVEAWAY ${emojis.giveaway}`)
            .setDescription(
                `**${prize}**\n\n` +
                `React with 🎉 to enter!\n\n` +
                `Hosted by: ${host}\n` +
                `Winners: **${winners}**\n` +
                `Ends: <t:${Math.floor(endTime / 1000)}:R>`
            )
            .setTimestamp(endTime)
            .setFooter({ text: 'AutoGravity Giveaways • Ends at' });
    },

    /**
     * Create a stats/analytics embed
     */
    stats(title, fields) {
        const embed = new EmbedBuilder()
            .setColor(colors.primary)
            .setTitle(`${emojis.stats} ${title}`)
            .setTimestamp()
            .setFooter({ text: 'AutoGravity Analytics' });

        if (fields && fields.length > 0) {
            embed.addFields(fields);
        }

        return embed;
    },

    /**
     * Create a basic branded embed
     */
    basic(description) {
        return new EmbedBuilder()
            .setColor(colors.primary)
            .setDescription(description)
            .setTimestamp()
            .setFooter({ text: 'AutoGravity' });
    },
};

module.exports = embedFactory;
