import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiKey, callGemini } from '../../config/gemini';
import InfoModal from '../InfoModal';

const BookCard = ({ book, userId, onBorrow, hasBorrowed }) => {
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
    const nextAvailableDate = getNextAvailableDate(book.borrowedCopies);
    const canBorrow = isAvailable && !hasBorrowed;

    const handleBorrow = async () => {
        if (!canBorrow) return;
        await onBorrow(book.id, userId);
    };

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
            <li className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all p-4 border border-gray-200">
                <div className="flex gap-4">
                    {/* Book Thumbnail */}
                    <div className="flex-shrink-0 w-20 h-28 sm:w-24 sm:h-32 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg overflow-hidden">
                        {book.thumbnailUrl ? (
                            <img 
                                src={book.thumbnailUrl} 
                                alt={book.title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                        )}
                    </div>

                    {/* Book Details */}
                    <div className="flex-1 min-w-0">
                        <Link to={`/book/${book.id}`}>
                            <h3 className="text-lg font-semibold text-gray-800 mb-1 line-clamp-2">
                                {book.title}
                            </h3>
                        </Link>
                        <p className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">Author:</span> {book.author}
                        </p>
                        <p className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">Genre:</span> {book.genre}
                        </p>
                        <p className="text-sm text-gray-600 mb-3">
                            <span className="font-medium">Rack:</span> {book.rack}
                        </p>

                        <div className="flex items-center justify-between gap-2">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                isAvailable
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                            }`}>
                                {isAvailable ? `${book.availableQuantity} available` : 'Out of stock'}
                            </span>

                            <button
                                onClick={handleBorrow}
                                disabled={!canBorrow}
                                className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                                    canBorrow
                                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                {hasBorrowed ? 'Already Borrowed' : isAvailable ? 'Borrow' : 'Unavailable'}
                            </button>
                        </div>
                    </div>
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