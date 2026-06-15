const config = require('../../config');
const logger = require('../../utils/logger');

let model = null;

function getModel() {
    if (model) return model;
    try {
        if (!config.geminiApiKey) return null;
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(config.geminiApiKey);
        model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        return model;
    } catch (error) {
        logger.error('AI init error:', error.message);
        return null;
    }
}

const conversationHistory = new Map();

const aiAssistant = {
    async chat(userId, guildName, message, personality) {
        const ai = getModel();
        if (!ai) return 'AI assistant is not configured. Please set GEMINI_API_KEY.';

        try {
            const key = userId;
            if (!conversationHistory.has(key)) conversationHistory.set(key, []);
            const history = conversationHistory.get(key);
            history.push({ role: 'user', content: message });
            if (history.length > 10) history.splice(0, history.length - 10);

            const systemPrompt = personality || `You are AutoGravity, a helpful Discord bot assistant for the server "${guildName}". Be concise, friendly, and helpful. Keep responses under 2000 characters.`;
            const prompt = `${systemPrompt}\n\nConversation:\n${history.map(m => `${m.role}: ${m.content}`).join('\n')}\n\nassistant:`;

            const result = await ai.generateContent(prompt);
            const response = result.response.text().trim();
            const truncated = response.substring(0, 1900);

            history.push({ role: 'assistant', content: truncated });
            return truncated;
        } catch (error) {
            logger.error('AI chat error:', error.message);
            return 'Sorry, I encountered an error. Please try again later.';
        }
    },

    async moderate(content) {
        const ai = getModel();
        if (!ai) return null;
        try {
            const prompt = `Analyze this message for moderation. Return JSON: {"action":"none|warn|delete","reason":"brief reason","severity":"low|medium|high"}. Message: "${content}"`;
            const result = await ai.generateContent(prompt);
            const text = result.response.text().trim();
            const match = text.match(/\{[\s\S]*?\}/);
            return match ? JSON.parse(match[0]) : null;
        } catch (error) {
            return null;
        }
    },

    clearHistory(userId) { conversationHistory.delete(userId); },
};

setInterval(() => {
    const now = Date.now();
    for (const [key] of conversationHistory) {
        if (conversationHistory.get(key).length === 0) conversationHistory.delete(key);
    }
}, 600000);

module.exports = aiAssistant;
