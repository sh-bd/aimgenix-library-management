import { useRef, useState } from 'react';
import { apiKey, callGemini } from '../config/gemini';
import { imgbbApiKey, uploadToImgBB } from '../config/imgbb';

const AddBookForm = ({ onAddBook, isLoading }) => {
    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [genre, setGenre] = useState('');
    const [rack, setRack] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [isbn, setIsbn] = useState('');
    const [publicationYear, setPublicationYear] = useState('');
    const [description, setDescription] = useState('');
    const [thumbnailUrl, setThumbnailUrl] = useState('');
    const [thumbnailPreview, setThumbnailPreview] = useState('');
    const [error, setError] = useState('');
    const [isFindingDetails, setIsFindingDetails] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const fileInputRef = useRef(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title || !author || !genre || !rack || !quantity || parseInt(quantity, 10) < 1) {
            setError('Please fill in all required fields with valid values (Quantity >= 1).');
            return;
        }
        setError('');
        onAddBook({ 
            title, 
            author, 
            genre, 
            rack, 
            totalQuantity: parseInt(quantity, 10), 
            availableQuantity: parseInt(quantity, 10), 
            borrowedCopies: [],
            thumbnailUrl: thumbnailUrl || null,
            isbn: isbn || null,
            publicationYear: publicationYear || null,
            description: description || null
        });
        
        // Reset form
        setTitle('');
        setAuthor('');
        setGenre('');
        setRack('');
        setQuantity(1);
        setIsbn('');
        setPublicationYear('');
        setDescription('');
        setThumbnailUrl('');
        setThumbnailPreview('');
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
            const systemPrompt = `You are a library assistant. Your job is to find complete book details for a given book title. Respond *only* with a JSON object in the format: {"author": "Author Name", "genre": "Genre", "publicationYear": "YYYY", "isbn": "ISBN Number", "description": "Brief description"}. If you cannot find specific information, leave that field as an empty string.`;
            const userQuery = `Find the author, genre, publication year, ISBN, and a brief description for the book: "${title}"`;

            const jsonString = await callGemini(userQuery, systemPrompt, true);
            const details = JSON.parse(jsonString);

            if (details.author) setAuthor(details.author);
            if (details.genre) setGenre(details.genre);
            if (details.publicationYear) setPublicationYear(details.publicationYear);
            if (details.isbn) setIsbn(details.isbn);
            if (details.description) setDescription(details.description);
            
            if (!details.author && !details.genre && !details.publicationYear && !details.isbn) {
                setError("Could not find details for this book. Please enter them manually.");
            }
        } catch (error) {
            console.error("Error finding book details:", error);
            setError(`Could not find details for this book: ${error.message}. Please enter them manually.`);
        }
        setIsFindingDetails(false);
    };

    const handleImageSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select a valid image file');
            return;
        }

        // Validate file size (max 32MB as per ImgBB)
        if (file.size > 32 * 1024 * 1024) {
            setError('Image size must be less than 32MB');
            return;
        }

        setError('');
        setIsUploadingImage(true);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setThumbnailPreview(reader.result);
        };
        reader.readAsDataURL(file);

        // Upload to ImgBB
        try {
            const result = await uploadToImgBB(file, title || 'book-thumbnail');
            
            if (result.success) {
                setThumbnailUrl(result.displayUrl);
                setError('');
            } else {
                setError(result.error || 'Failed to upload image');
                setThumbnailPreview('');
            }
        } catch (error) {
            setError('Failed to upload image. Please try again.');
            setThumbnailPreview('');
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleRemoveImage = () => {
        setThumbnailUrl('');
        setThumbnailPreview('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 bg-white rounded-lg shadow-lg space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Add a New Book</h2>
            {error && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}

            {/* Thumbnail Upload Section */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Book Thumbnail (Optional)</label>
                
                {thumbnailPreview ? (
                    <div className="relative w-48 mx-auto">
                        <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-300">
                            <img 
                                src={thumbnailPreview} 
                                alt="Book thumbnail preview" 
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleRemoveImage}
                            disabled={isUploadingImage}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg disabled:opacity-50"
                            title="Remove image"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        {isUploadingImage && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="w-48 mx-auto">
                        <label 
                            htmlFor="thumbnail-upload"
                            className={`aspect-[3/4] flex flex-col items-center justify-center bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 hover:border-indigo-500 transition-colors p-4 text-center ${
                                !imgbbApiKey || isUploadingImage ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                            }`}
                        >
                            <input
                                id="thumbnail-upload"
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageSelect}
                                disabled={!imgbbApiKey || isUploadingImage}
                                className="hidden"
                            />
                            {isUploadingImage ? (
                                <>
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
                                    <p className="text-sm text-gray-600">Uploading...</p>
                                </>
                            ) : (
                                <>
                                    <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-sm text-gray-600 font-medium">Click to upload</p>
                                    <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 32MB</p>
                                </>
                            )}
                        </label>
                    </div>
                )}
                {!imgbbApiKey && (
                    <p className="text-xs text-amber-600 mt-2 text-center">⚠️ ImgBB API key not configured</p>
                )}
            </div>

            {/* Title */}
            <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., The Great Gatsby"
                    required
                />
            </div>

            {/* Find Details Button */}
            <button
                type="button"
                onClick={handleFindDetails}
                disabled={isFindingDetails || !title || !apiKey}
                title={!apiKey ? "Gemini API Key missing in .env" : "Find book details using AI"}
                className="w-full flex justify-center items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
            >
                {isFindingDetails ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" role="status"><span className="sr-only">Finding...</span></div>
                ) : (
                    "Find Details ✨"
                )}
            </button>

            {/* Author and Genre Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-1">
                        Author <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="author"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                        placeholder="e.g., F. Scott Fitzgerald"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="genre" className="block text-sm font-medium text-gray-700 mb-1">
                        Genre <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="genre"
                        value={genre}
                        onChange={(e) => setGenre(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                        placeholder="e.g., Fiction"
                        required
                    />
                </div>
            </div>

            {/* ISBN and Publication Year Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="isbn" className="block text-sm font-medium text-gray-700 mb-1">
                        ISBN (Optional)
                    </label>
                    <input
                        type="text"
                        id="isbn"
                        value={isbn}
                        onChange={(e) => setIsbn(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g., 978-0-7432-7356-5"
                    />
                </div>

                <div>
                    <label htmlFor="publicationYear" className="block text-sm font-medium text-gray-700 mb-1">
                        Publication Year (Optional)
                    </label>
                    <input
                        type="text"
                        id="publicationYear"
                        value={publicationYear}
                        onChange={(e) => setPublicationYear(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g., 1925"
                        pattern="[0-9]{4}"
                        maxLength="4"
                    />
                </div>
            </div>

            {/* Description */}
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                </label>
                <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    placeholder="Brief description of the book..."
                />
            </div>

            {/* Rack and Quantity Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                    <label htmlFor="rack" className="block text-sm font-medium text-gray-700 mb-1">
                        Rack <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="rack"
                        value={rack}
                        onChange={(e) => setRack(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        required
                    >
                        <option value="">Select a rack</option>
                        <option value="ICE">ICE</option>
                        <option value="CSE">CSE</option>
                        <option value="Literature">Literature</option>
                        <option value="Math">Math</option>
                        <option value="Science">Science</option>
                        <option value="History">History</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        id="quantity"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                    />
                </div>
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isLoading || isFindingDetails || isUploadingImage}
                className="w-full px-4 py-2 bg-indigo-600 text-white font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
            >
                {isLoading ? 'Adding...' : 'Add Book'}
            </button>
        </form>
    );
};

export default AddBookForm;