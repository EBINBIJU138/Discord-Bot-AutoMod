const logger = require('../../utils/logger');

const transcriptGenerator = {
    async generate(channel) {
        try {
            const messages = [];
            let lastId;

            while (true) {
                const fetched = await channel.messages.fetch({ limit: 100, before: lastId });
                if (fetched.size === 0) break;
                messages.push(...fetched.values());
                lastId = fetched.last().id;
                if (fetched.size < 100) break;
            }

            messages.reverse();

            let transcript = `Ticket Transcript - #${channel.name}\n`;
            transcript += `Server: ${channel.guild.name}\n`;
            transcript += `Generated: ${new Date().toISOString()}\n`;
            transcript += '═'.repeat(50) + '\n\n';

            for (const msg of messages) {
                const time = msg.createdAt.toISOString();
                transcript += `[${time}] ${msg.author.tag}: ${msg.content || '[No text content]'}\n`;
                if (msg.attachments.size > 0) {
                    msg.attachments.forEach(a => { transcript += `  📎 Attachment: ${a.url}\n`; });
                }
                if (msg.embeds.length > 0) {
                    transcript += `  📋 [${msg.embeds.length} embed(s)]\n`;
                }
            }

            transcript += '\n' + '═'.repeat(50);
            transcript += `\nTotal messages: ${messages.length}`;

            return transcript;
        } catch (error) {
            logger.error('Transcript generation error:', error.message);
            return 'Transcript generation failed.';
        }
    },
};

module.exports = transcriptGenerator;
