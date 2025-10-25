import { useState } from 'react';

const apiKey = import.meta.env?.VITE_GEMINI_API_KEY || "";
if (!apiKey) {
    console.warn("Gemini API Key (VITE_GEMINI_API_KEY) not found in import.meta.env. API calls will fail.");
}
const geminiModel = "gemini-2.5-flash";
async function callGemini(userQuery, systemInstruction = null, jsonOutput = false, responseSchema = null) {
    if (!apiKey) {
        console.error("Gemini API Key is missing. Cannot make API call.");
        throw new Error("Gemini API Key is missing.");
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
            responseMimeType: "application/json",
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
                body: JSON.stringify(payload)
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
                let reason = candidate?.finishReason || "No content";
                let safetyRatings = candidate?.safetyRatings ? JSON.stringify(candidate.safetyRatings) : "N/A";
                console.error("Invalid response structure from Gemini API:", result);
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

    throw new Error("API call failed after all retries.");
}

const BookCard = ({ book, onBorrow, hasBorrowed }) => {
    const [showSummary, setShowSummary] = useState(false);
    const [summaryContent, setSummaryContent] = useState("");
    const [isSummarizing, setIsSummarizing] = useState(false);
    const getNextAvailableDate = (borrowedCopies) => {
        if (!Array.isArray(borrowedCopies) || borrowedCopies.length === 0) {
            return null;
        }
        try {
            const validDueDates = borrowedCopies
                .map(c => c.dueDate)
                .filter(date => date instanceof Date && !isNaN(date));
            return validDueDates.length > 0 ? new Date(Math.min(...validDueDates.map(date => date.getTime()))) : null;
        } catch (e) {
            console.error("Error calculating next available date:", e);
            return null;
        }
    };
    const isAvailable = book.availableQuantity > 0;

    // Find the earliest due date from borrowed copies
    const nextAvailableDate = getNextAvailableDate(book.borrowedCopies);

    const handleSummarize = async () => {
        if (!apiKey) {
            setSummaryContent("Cannot summarize: Gemini API Key is missing.");
            setShowSummary(true);
            return;
        }
        setShowSummary(true);
        setIsSummarizing(true);
        setSummaryContent("");
        try {
            const systemPrompt = "You are a helpful library assistant. Provide a brief, one-paragraph summary of the book.";
            const userQuery = `Book: "${book.title}" by ${book.author}`;
            const summary = await callGemini(userQuery, systemPrompt, false);
            setSummaryContent(summary);
        } catch (error) {
            console.error("Error summarizing book:", error);
            setSummaryContent(`Could not generate summary: ${error.message}. Please try again.`);
        }
        setIsSummarizing(false);
    };

    return (
        <>
            <li className="flex flex-col p-4 bg-white rounded-lg shadow transition-shadow hover:shadow-md space-y-3">
                {/* Book Info */}
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-indigo-700">{book.title}</h3>
                    <p className="text-sm text-gray-600">by {book.author}</p>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">{book.genre}</p>
                </div>

                {/* Availability & Location */}
                <div className="flex items-center justify-between text-sm">
                    <div className={`font-medium ${isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                        {isAvailable
                            ? `Available: ${book.availableQuantity} / ${book.totalQuantity}`
                            : `Available after: ${nextAvailableDate ? nextAvailableDate.toLocaleDateString() : 'Unknown'}` // Changed N/A to Unknown
                        }
                    </div>
                    <div className="text-sm font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                        Rack: {book.rack}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full">
                    <button
                        onClick={() => onBorrow(book.id)}
                        disabled={!isAvailable || hasBorrowed}
                        className="px-4 py-2 rounded-md text-sm font-medium transition-colors w-full sm:w-auto justify-center bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        {hasBorrowed ? 'Already Borrowed' : 'Borrow'}
                    </button>
                    <button
                        onClick={handleSummarize}
                        disabled={!apiKey} // Disable if API key missing
                        title={!apiKey ? "Gemini API Key missing in .env" : "Summarize this book using AI"}
                        className="px-4 py-2 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors text-sm font-medium w-full sm:w-auto justify-center disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
                    >
                        Summarize ✨
                    </button>
                </div>
            </li>
            {showSummary && (
                <InfoModal
                    title={`Summary for "${book.title}"`}
                    content={summaryContent}
                    isLoading={isSummarizing}
                    onClose={() => setShowSummary(false)}
                />
            )}
        </>
    );
};

export default BookCard;