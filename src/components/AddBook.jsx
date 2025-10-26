import { useState } from 'react';
import { apiKey, callGemini } from '../config/gemini';

const AddBookForm = ({ onAddBook, isLoading }) => {
    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [genre, setGenre] = useState('');
    const [rack, setRack] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [error, setError] = useState('');
    const [isFindingDetails, setIsFindingDetails] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title || !author || !genre || !rack || !quantity || parseInt(quantity, 10) < 1) {
            setError('Please fill in all fields with valid values (Quantity >= 1).');
            return;
        }
        setError('');
        onAddBook({ title, author, genre, rack, totalQuantity: parseInt(quantity, 10), availableQuantity: parseInt(quantity, 10), borrowedCopies: [] });
        setTitle('');
        setAuthor('');
        setGenre('');
        setRack('');
        setQuantity(1);
    };

    const handleFindDetails = async () => {
        if (!title) {
            setError("Please enter a title first to find details.");
            return;
        }
        if (!apiKey) {
            setError("Cannot find details: Gemini API Key is missing.");
            return;
        }
        setError("");
        setIsFindingDetails(true);
        try {
            const systemPrompt = `You are a library assistant. Your job is to find the author and genre for a given book title. Respond *only* with a JSON object in the format: {"author": "Author Name", "genre": "Genre"}. If you cannot find the book, respond with {"author": "", "genre": ""}.`;
            const userQuery = `Find the author and genre for the book: "${title}"`;

            const jsonString = await callGemini(userQuery, systemPrompt, true);

            const details = JSON.parse(jsonString);

            if (details.author) setAuthor(details.author);
            if (details.genre) setGenre(details.genre);
            if (!details.author && !details.genre) {
                setError("Could not find details for this book. Please enter them manually.");
            }

        } catch (error) {
            console.error("Error finding book details:", error);
            setError(`Could not find details for this book: ${error.message}. Please enter them manually.`);
        }
        setIsFindingDetails(false);
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 bg-white rounded-lg shadow-lg space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Add a New Book</h2>
            {error && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}

            {/* Title */}
            <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., The Great Gatsby"
                />
            </div>

            {/* Find Details Button */}
            <button
                type="button"
                onClick={handleFindDetails}
                disabled={isFindingDetails || !title || !apiKey} // Disable if API key is missing
                title={!apiKey ? "Gemini API Key missing in .env" : "Find author and genre using AI"}
                className="w-full flex justify-center items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
            >
                {isFindingDetails ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" role="status"><span className="sr-only">Finding...</span></div>
                ) : (
                    "Find Details ✨"
                )}
            </button>

            {/* Author */}
            <div>
                <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                <input
                    type="text"
                    id="author"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                    placeholder="e.g., F. Scott Fitzgerald"
                />
            </div>

            {/* Genre */}
            <div>
                <label htmlFor="genre" className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
                <input
                    type="text"
                    id="genre"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                    placeholder="e.g., Fiction"
                />
            </div>

            {/* Rack and Quantity Row */}
            <div className="flex gap-4">
                <div className="flex-1">
                    <label htmlFor="rack" className="block text-sm font-medium text-gray-700 mb-1">Rack</label>
                    <select
                        id="rack"
                        value={rack}
                        onChange={(e) => setRack(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                        <option value="">Select a rack</option>
                        <option value="ICE">ICE</option>
                        <option value="CSE">CSE</option>
                        <option value="Literature">Literature</option>
                        <option value="Math">Math</option>
                    </select>
                </div>

                <div className="w-32">
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input
                        type="number"
                        id="quantity"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isLoading || isFindingDetails}
                className="w-full px-4 py-2 bg-indigo-600 text-white font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
            >
                {isLoading ? 'Adding...' : 'Add Book'}
            </button>
        </form>
    );
};

export default AddBookForm;