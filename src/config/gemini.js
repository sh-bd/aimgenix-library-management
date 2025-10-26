// src/config/gemini.js
const apiKey = import.meta.env?.VITE_GEMINI_API_KEY || '';
const geminiModel = 'gemini-2.5-flash';

// Check and warn if API key is missing
if (!apiKey) {
    console.warn('⚠️ Gemini API Key (VITE_GEMINI_API_KEY) not found. API calls will fail.');
}

/**
 * Calls the Gemini API with exponential backoff for retries.
 * @param {string} userQuery - The user's prompt.
 * @param {string | null} systemInstruction - The system prompt (optional).
 * @param {boolean} jsonOutput - Whether to request a JSON response.
 * @param {Object | null} responseSchema - Custom JSON schema (optional, used when jsonOutput=true).
 * @returns {Promise<string>} The text response from the API.
 */
export async function callGemini(
    userQuery,
    systemInstruction = null,
    jsonOutput = false,
    responseSchema = null
) {
    if (!apiKey) {
        console.error('Gemini API Key is missing. Cannot make API call.');
        throw new Error('Gemini API Key is missing.');
    }

    // Use v1beta for system instructions and JSON schema support
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
    };

    // Use systemInstruction (camelCase) for v1beta
    if (systemInstruction) {
        payload.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    if (jsonOutput) {
        payload.generationConfig = {
            responseMimeType: 'application/json',
        };
        if (responseSchema) {
            payload.generationConfig.responseSchema = responseSchema;
        }
    }

    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`Gemini API Error: ${response.status} ${response.statusText}`, errorBody);

                if (response.status >= 400 && response.status < 500 && response.status !== 429) {
                    throw new Error(`HTTP error! status: ${response.status} - ${errorBody}`);
                }

                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            const candidate = result.candidates?.[0];

            if (candidate && candidate.content?.parts?.[0]?.text) {
                return candidate.content.parts[0].text;
            } else {
                let reason = candidate?.finishReason || 'No content';
                let safetyRatings = candidate?.safetyRatings ? JSON.stringify(candidate.safetyRatings) : 'N/A';
                console.error('Invalid response structure from Gemini API:', result);
                throw new Error(`Invalid response structure from API. Finish Reason: ${reason}. Safety Ratings: ${safetyRatings}`);
            }
        } catch (error) {
            console.warn(`API call failed (attempt ${retries + 1}):`, error.message);
            retries++;

            if (retries >= maxRetries) {
                throw new Error(`Failed to call Gemini API after ${maxRetries} attempts: ${error.message}`);
            }

            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
        }
    }

    throw new Error('API call failed after all retries.');
}

// Export the API key and check for components that need them
export { apiKey };
export const hasGeminiKey = !!apiKey;