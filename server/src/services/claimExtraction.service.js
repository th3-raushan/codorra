const claimExtractionPrompt = require('./../prompts/claimExtraction.prompt');

const extractClaims = async (content) => {
    // Dynamic import — @huggingface/inference is ESM-only
    const { InferenceClient } = await import("@huggingface/inference");
    const client = new InferenceClient(process.env.HF_TOKEN);

    try {
        const chatCompletion = await client.chatCompletion({
            model: "MiniMaxAI/MiniMax-M2.1:novita",
            messages: [
                { role: "system", content: claimExtractionPrompt },
                { role: "user", content },
            ],
        });

        let responseText = chatCompletion.choices[0].message.content
            .replace(/^```(?:json)?\s*\n?/i, '')
            .replace(/\n?```\s*$/i, '')
            .trim();

        try {
            const parsed = JSON.parse(responseText);
            return { success: true, claims: parsed.claims || parsed };
        } catch (parseError) {
            console.error('JSON parse error:', parseError.message);
            return { success: false, error: 'Failed to parse claims from AI response', claims: [] };
        }
    } catch (error) {
        console.error('Claim extraction error:', error.message);
        return { success: false, error: error.message, claims: [] };
    }
};

module.exports = extractClaims;