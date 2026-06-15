const config = require('../../config');
const logger = require('../../utils/logger');

let genAI = null;
let model = null;

// Initialize Gemini AI (lazy load)
function getModel() {
    if (model) return model;
    
    try {
        if (!config.geminiApiKey) return null;
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        genAI = new GoogleGenerativeAI(config.geminiApiKey);
        model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        return model;
    } catch (error) {
        logger.error('Failed to initialize Gemini AI:', error.message);
        return null;
    }
}

// Cache results to avoid repeated API calls
const toxicityCache = new Map();

const toxicityDetector = {
    /**
     * Check if a message contains toxic content
     */
    async check(message, sensitivityConfig) {
        const ai = getModel();
        if (!ai) return null;

        const content = message.content;
        if (!content || content.length < 5) return null;

        // Check cache
        const cacheKey = content.toLowerCase().trim();
        if (toxicityCache.has(cacheKey)) {
            const cached = toxicityCache.get(cacheKey);
            if (Date.now() - cached.timestamp < 300000) { // 5 min cache
                return cached.result;
            }
        }

        try {
            const prompt = `Analyze this Discord message for toxicity. Rate from 0.0 to 1.0 where 0 is completely safe and 1 is extremely toxic. Consider: hate speech, harassment, threats, sexual content, and severe profanity. Only respond with a JSON object like {"score": 0.5, "category": "none"}. Categories: none, harassment, hate_speech, threat, sexual, profanity. Message: "${content}"`;

            const result = await ai.generateContent(prompt);
            const response = result.response.text().trim();

            // Parse JSON response
            const jsonMatch = response.match(/\{[\s\S]*?\}/);
            if (!jsonMatch) return null;

            const analysis = JSON.parse(jsonMatch[0]);
            const score = parseFloat(analysis.score) || 0;
            const sensitivity = sensitivityConfig?.sensitivity || 0.7;

            const toxicResult = score >= sensitivity ? {
                type: 'toxic_content',
                action: sensitivityConfig?.action || 'delete',
                reason: `Toxic content detected (${analysis.category}, score: ${score.toFixed(2)})`,
                score,
                category: analysis.category,
            } : null;

            // Cache result
            toxicityCache.set(cacheKey, { result: toxicResult, timestamp: Date.now() });

            return toxicResult;
        } catch (error) {
            logger.error('Toxicity detection error:', error.message);
            return null;
        }
    },

    /**
     * Clear old cache entries
     */
    cleanup() {
        const now = Date.now();
        for (const [key, value] of toxicityCache.entries()) {
            if (now - value.timestamp > 600000) toxicityCache.delete(key);
        }
    },
};

setInterval(() => toxicityDetector.cleanup(), 300000);

module.exports = toxicityDetector;
