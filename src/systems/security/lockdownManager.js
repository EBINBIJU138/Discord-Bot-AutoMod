const { PermissionFlagsBits } = require('discord.js');
const embedFactory = require('../../utils/embedBuilder');
const logger = require('../../utils/logger');

const lockdownManager = {
    lockedGuilds: new Map(),

    async lockdown(guild, initiator, reason, duration) {
        try {
            const channels = guild.channels.cache.filter(c => c.type === 0);
            const lockedChannels = [];

            for (const [, channel] of channels) {
                try {
                    await channel.permissionOverwrites.edit(guild.id, { [PermissionFlagsBits.SendMessages]: false }, { reason });
                    lockedChannels.push(channel.id);
                } catch (e) { /* skip channels we can't edit */ }
            }

            this.lockedGuilds.set(guild.id, { channels: lockedChannels, timestamp: Date.now() });

            const embed = embedFactory.security('🔒 Server Lockdown',
                `**Reason:** ${reason}\n**Duration:** ${duration ? `${duration / 60000} minutes` : 'Until manually unlocked'}\n**Initiated by:** ${initiator.tag || 'AutoMod'}`
            );

            const announceChannel = channels.first();
            if (announceChannel) await announceChannel.send({ embeds: [embed] }).catch(() => {});

            if (duration) {
                setTimeout(() => this.unlock(guild, 'Auto-unlock after lockdown duration'), duration);
            }

            logger.warn(`🔒 Server ${guild.name} locked down: ${reason}`);
            return lockedChannels.length;
        } catch (error) {
            logger.error('Lockdown error:', error.message);
            return 0;
        }
    },

    async unlock(guild, reason) {
        try {
            const lockData = this.lockedGuilds.get(guild.id);
            if (!lockData) return 0;

            let unlocked = 0;
            for (const channelId of lockData.channels) {
                const channel = guild.channels.cache.get(channelId);
                if (channel) {
                    try {
                        await channel.permissionOverwrites.edit(guild.id, { [PermissionFlagsBits.SendMessages]: null }, { reason });
                        unlocked++;
                    } catch (e) { /* skip */ }
                }
            }

            this.lockedGuilds.delete(guild.id);

            const embed = embedFactory.success('🔓 Lockdown Lifted', `**Reason:** ${reason}\n**Channels unlocked:** ${unlocked}`);
            const firstChannel = guild.channels.cache.filter(c => c.type === 0).first();
            if (firstChannel) await firstChannel.send({ embeds: [embed] }).catch(() => {});

            logger.info(`🔓 Server ${guild.name} unlocked: ${reason}`);
            return unlocked;
        } catch (error) {
            logger.error('Unlock error:', error.message);
            return 0;
        }
    },

    isLocked(guildId) { return this.lockedGuilds.has(guildId); },
};

module.exports = lockdownManager;
