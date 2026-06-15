const { PermissionFlagsBits } = require('discord.js');

/**
 * Check if a member has moderator permissions
 */
function isModerator(member) {
    return member.permissions.has(PermissionFlagsBits.ManageMessages) ||
           member.permissions.has(PermissionFlagsBits.KickMembers) ||
           member.permissions.has(PermissionFlagsBits.BanMembers);
}

/**
 * Check if a member has admin permissions
 */
function isAdmin(member) {
    return member.permissions.has(PermissionFlagsBits.Administrator);
}

/**
 * Check if a member is the server owner
 */
function isOwner(member) {
    return member.id === member.guild.ownerId;
}

/**
 * Check if the bot can moderate a target member
 */
function canModerate(botMember, targetMember) {
    if (targetMember.id === targetMember.guild.ownerId) return false;
    if (botMember.roles.highest.position <= targetMember.roles.highest.position) return false;
    return true;
}

/**
 * Check if the executing member can moderate the target
 */
function canUserModerate(executingMember, targetMember) {
    if (targetMember.id === targetMember.guild.ownerId) return false;
    if (executingMember.id === targetMember.id) return false;
    if (executingMember.id === executingMember.guild.ownerId) return true;
    if (executingMember.roles.highest.position <= targetMember.roles.highest.position) return false;
    return true;
}

/**
 * Check if the bot has a specific permission
 */
function botHasPermission(guild, permission) {
    return guild.members.me.permissions.has(permission);
}

module.exports = {
    isModerator,
    isAdmin,
    isOwner,
    canModerate,
    canUserModerate,
    botHasPermission,
};
