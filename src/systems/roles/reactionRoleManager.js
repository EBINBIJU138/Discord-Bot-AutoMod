const ReactionRole = require('../../models/ReactionRole');
const logger = require('../../utils/logger');

const reactionRoleManager = {
    async handleReactionRoleButton(interaction, args) {
        try {
            const roleId = args.join('_');
            const role = interaction.guild.roles.cache.get(roleId);
            if (!role) return interaction.reply({ content: '❌ Role not found.', ephemeral: true });

            if (interaction.member.roles.cache.has(roleId)) {
                await interaction.member.roles.remove(role);
                return interaction.reply({ content: `❌ Removed role: **${role.name}**`, ephemeral: true });
            } else {
                const rrConfig = await ReactionRole.findOne({ messageId: interaction.message.id });
                if (rrConfig?.exclusive) {
                    for (const r of rrConfig.roles) {
                        if (interaction.member.roles.cache.has(r.roleId)) {
                            await interaction.member.roles.remove(r.roleId).catch(() => {});
                        }
                    }
                }
                await interaction.member.roles.add(role);
                return interaction.reply({ content: `✅ Added role: **${role.name}**`, ephemeral: true });
            }
        } catch (error) {
            logger.error('Reaction role error:', error.message);
            return interaction.reply({ content: '❌ Failed to update role.', ephemeral: true });
        }
    },
};

module.exports = reactionRoleManager;
