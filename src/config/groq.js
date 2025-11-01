import Groq from 'groq-sdk';

export const apiKey = import.meta.env.VITE_GROQ_API_KEY;

const groq = apiKey ? new Groq({ 
    apiKey, 
    dangerouslyAllowBrowser: true 
}) : null;

export const callGroq = async (conversationMessages, systemPrompt) => {
    if (!groq || !apiKey) {
        throw new Error('Groq API key not configured');
    }

    try {
        const messages = [
            { role: 'system', content: systemPrompt },
            ...conversationMessages
        ];

        const chatCompletion = await groq.chat.completions.create({
            messages: messages,
            model: 'llama-3.3-70b-versatile',
            temperature: 0.5, // Lower for more consistent responses
            max_tokens: 500,
            top_p: 1,
            stream: false
        });
        
        return chatCompletion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
    } catch (error) {
        console.error('❌ Groq API Error:', error);
        
        if (error.status === 429) {
            throw new Error('Rate limit exceeded. Please try again in a moment.');
        } else if (error.status === 401) {
            throw new Error('Invalid API key. Please check your configuration.');
        } else if (error.message?.includes('decommissioned')) {
            throw new Error('Model is outdated. Please update the code.');
        } else {
            throw new Error('Failed to get response from AI assistant.');
        }
    }
};