const apiKey = import.meta.env?.VITE_GEMINI_API_KEY || ''
const geminiModel = 'gemini-2.5-flash'

export async function callGemini(
    userQuery,
    systemInstruction = null,
    jsonOutput = false,
    responseSchema = null
) {
    if (!apiKey) throw new Error('Gemini API key missing')

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`

    const payload = { contents: [{ parts: [{ text: userQuery }] }] }

    if (systemInstruction)
        payload.systemInstruction = { parts: [{ text: systemInstruction }] }

    if (jsonOutput)
        payload.generationConfig = {
            responseMimeType: 'application/json',
            ...(responseSchema && { responseSchema }),
        }

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        const errorBody = await response.text()
        throw new Error(`Gemini API error: ${response.status} - ${errorBody}`)
    }

    const data = await response.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response'
}
