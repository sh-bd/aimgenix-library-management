import { useState } from 'react';
import { apiKey, callGemini } from '../../config/gemini';
import InfoModal from '../InfoModal';

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