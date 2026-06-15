const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

/**
 * Create a paginated embed response
 */
async function paginate(interaction, pages, timeout = 120000) {
    if (!pages || pages.length === 0) return;

    if (pages.length === 1) {
        return interaction.editReply({ embeds: [pages[0]] });
    }

    let currentPage = 0;

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('page_first')
            .setEmoji('⏮️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
        new ButtonBuilder()
            .setCustomId('page_prev')
            .setEmoji('◀️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
        new ButtonBuilder()
            .setCustomId('page_count')
            .setLabel(`Page 1/${pages.length}`)
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true),
        new ButtonBuilder()
            .setCustomId('page_next')
            .setEmoji('▶️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(pages.length <= 1),
        new ButtonBuilder()
            .setCustomId('page_last')
            .setEmoji('⏭️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(pages.length <= 1)
    );

    const message = await interaction.editReply({
        embeds: [pages[0]],
        components: [row],
    });

    const collector = message.createMessageComponentCollector({
        time: timeout,
    });

    collector.on('collect', async (i) => {
        if (i.user.id !== interaction.user.id) {
            return i.reply({ content: '❌ You cannot use these buttons.', ephemeral: true });
        }

        switch (i.customId) {
            case 'page_first':
                currentPage = 0;
                break;
            case 'page_prev':
                currentPage = Math.max(0, currentPage - 1);
                break;
            case 'page_next':
                currentPage = Math.min(pages.length - 1, currentPage + 1);
                break;
            case 'page_last':
                currentPage = pages.length - 1;
                break;
        }

        const updatedRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('page_first')
                .setEmoji('⏮️')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(currentPage === 0),
            new ButtonBuilder()
                .setCustomId('page_prev')
                .setEmoji('◀️')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(currentPage === 0),
            new ButtonBuilder()
                .setCustomId('page_count')
                .setLabel(`Page ${currentPage + 1}/${pages.length}`)
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId('page_next')
                .setEmoji('▶️')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(currentPage === pages.length - 1),
            new ButtonBuilder()
                .setCustomId('page_last')
                .setEmoji('⏭️')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(currentPage === pages.length - 1)
        );

        await i.update({
            embeds: [pages[currentPage]],
            components: [updatedRow],
        });
    });

    collector.on('end', async () => {
        const disabledRow = new ActionRowBuilder().addComponents(
            ...row.components.map((c) =>
                ButtonBuilder.from(c).setDisabled(true)
            )
        );

        await message.edit({ components: [disabledRow] }).catch(() => {});
    });
}

module.exports = { paginate };
