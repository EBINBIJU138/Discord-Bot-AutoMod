const { ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const Ticket = require('../../models/Ticket');
const Guild = require('../../models/Guild');
const embedFactory = require('../../utils/embedBuilder');
const logger = require('../../utils/logger');

const ticketManager = {
    async createTicket(interaction, category = 'general', client) {
        try {
            const guildConfig = await Guild.findOne({ guildId: interaction.guild.id });
            if (!guildConfig?.tickets?.enabled) {
                return interaction.reply({ content: '❌ Ticket system is not enabled.', ephemeral: true });
            }

            const openTickets = await Ticket.countDocuments({
                guildId: interaction.guild.id, userId: interaction.user.id, status: { $in: ['open', 'claimed'] }
            });
            if (openTickets >= (guildConfig.tickets.maxOpen || 3)) {
                return interaction.reply({ content: `❌ You already have ${openTickets} open tickets. Max: ${guildConfig.tickets.maxOpen || 3}`, ephemeral: true });
            }

            const ticketCount = await Ticket.countDocuments({ guildId: interaction.guild.id });
            const ticketNumber = ticketCount + 1;

            const permissionOverwrites = [
                { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] },
                { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] },
            ];

            if (guildConfig.tickets.staffRoleId) {
                permissionOverwrites.push({
                    id: guildConfig.tickets.staffRoleId,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                });
            }

            const channel = await interaction.guild.channels.create({
                name: `ticket-${ticketNumber}`,
                type: ChannelType.GuildText,
                parent: guildConfig.tickets.categoryId || null,
                permissionOverwrites,
            });

            await Ticket.create({
                guildId: interaction.guild.id, ticketNumber, userId: interaction.user.id,
                userTag: interaction.user.tag, channelId: channel.id, category,
                participants: [interaction.user.id],
            });

            const embed = new EmbedBuilder()
                .setColor(0x5865F2).setTitle(`🎟️ Ticket #${ticketNumber}`)
                .setDescription(guildConfig.tickets.welcomeMessage || 'A staff member will be with you shortly.')
                .addFields(
                    { name: 'Created by', value: `${interaction.user}`, inline: true },
                    { name: 'Category', value: category, inline: true }
                ).setTimestamp().setFooter({ text: 'AutoGravity Tickets' });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('close_ticket').setLabel('Close Ticket').setEmoji('🔒').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('ticket_claim').setLabel('Claim').setEmoji('✋').setStyle(ButtonStyle.Primary),
            );

            await channel.send({ content: `${interaction.user} Welcome!`, embeds: [embed], components: [row] });
            await interaction.reply({ content: `✅ Ticket created: ${channel}`, ephemeral: true });
        } catch (error) {
            logger.error('Ticket creation error:', error.message);
            await interaction.reply({ content: '❌ Failed to create ticket.', ephemeral: true }).catch(() => {});
        }
    },

    async closeTicket(interaction, client) {
        try {
            const ticket = await Ticket.findOne({ channelId: interaction.channel.id, status: { $in: ['open', 'claimed'] } });
            if (!ticket) return interaction.reply({ content: '❌ This is not a ticket channel.', ephemeral: true });

            await interaction.reply({ content: '🔒 Closing ticket in 5 seconds...' });

            const transcriptGen = require('./transcriptGenerator');
            const transcript = await transcriptGen.generate(interaction.channel);

            await Ticket.updateOne({ channelId: interaction.channel.id }, {
                $set: { status: 'closed', closedBy: interaction.user.id, transcript }
            });

            const guildConfig = await Guild.findOne({ guildId: interaction.guild.id });
            if (guildConfig?.tickets?.logChannelId) {
                const logChannel = interaction.guild.channels.cache.get(guildConfig.tickets.logChannelId);
                if (logChannel) {
                    const embed = embedFactory.ticket('Ticket Closed', `**Ticket:** #${ticket.ticketNumber}\n**Opened by:** <@${ticket.userId}>\n**Closed by:** ${interaction.user}\n**Category:** ${ticket.category}`);
                    await logChannel.send({ embeds: [embed] });
                }
            }

            setTimeout(async () => { await interaction.channel.delete().catch(() => {}); }, 5000);
        } catch (error) {
            logger.error('Ticket close error:', error.message);
        }
    },

    async handleButton(interaction, args, client) {
        const action = args[0];
        if (action === 'create' || action === 'open') {
            await this.createTicket(interaction, args[1] || 'general', client);
        } else if (action === 'claim') {
            const ticket = await Ticket.findOne({ channelId: interaction.channel.id });
            if (!ticket) return interaction.reply({ content: '❌ Not a ticket.', ephemeral: true });
            await Ticket.updateOne({ channelId: interaction.channel.id }, { $set: { status: 'claimed', claimedBy: interaction.user.id } });
            await interaction.reply({ content: `✋ Ticket claimed by ${interaction.user}` });
        }
    },

    async handleCategorySelect(interaction, client) {
        const category = interaction.values[0];
        await this.createTicket(interaction, category, client);
    },

    async handleModal(interaction, args, client) {
        const topic = interaction.fields.getTextInputValue('ticket_topic');
        await this.createTicket(interaction, topic || 'general', client);
    },
};

module.exports = ticketManager;
