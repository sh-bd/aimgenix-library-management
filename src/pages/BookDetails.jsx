import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { booksCollectionPath, db, usersCollectionPath } from '../config/firebase';
import { uploadToImgBB } from '../config/imgbb';

const BookDetails = ({ userId, userRole, onDelete }) => {
    const { bookId } = useParams();
    const navigate = useNavigate();
    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionMessage, setActionMessage] = useState(null);
    const [isEditingThumbnail, setIsEditingThumbnail] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [newThumbnailUrl, setNewThumbnailUrl] = useState('');
    const [borrowedUsersEmails, setBorrowedUsersEmails] = useState({});
    const [isEditingBook, setIsEditingBook] = useState(false);
    const [editedBook, setEditedBook] = useState({});
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchBook = async () => {
            try {
                const bookDoc = doc(db, booksCollectionPath, bookId);
                const bookSnapshot = await getDoc(bookDoc);

                if (bookSnapshot.exists()) {
                    const bookData = { id: bookSnapshot.id, ...bookSnapshot.data() };
                    setBook(bookData);

                    // Fetch user emails for borrowed copies
                    if (bookData.borrowedCopies?.length > 0) {
                        const userIds = bookData.borrowedCopies.map(copy => copy.userId);
                        const emailsMap = {};

                        for (const uid of userIds) {
                            try {
                                const userDoc = doc(db, usersCollectionPath, uid);
                                const userSnapshot = await getDoc(userDoc);
                                if (userSnapshot.exists()) {
                                    emailsMap[uid] = userSnapshot.data().email || 'Unknown';
                                } else {
                                    emailsMap[uid] = 'User not found';
                                }
                            } catch (err) {
                                console.error(`Error fetching user ${uid}:`, err);
                                emailsMap[uid] = 'Error loading';
                            }
                        }

                        setBorrowedUsersEmails(emailsMap);
                    }
                } else {
                    setError('Book not found');
                }
            } catch (err) {
                console.error('Error fetching book:', err);
                setError('Failed to load book details');
            } finally {
                setLoading(false);
            }
        };

        if (bookId) {
            fetchBook();
        }
    }, [bookId]);

    const handleImageSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setActionMessage({ type: 'error', text: 'Please select a valid image file' });
            return;
        }

        if (file.size > 32 * 1024 * 1024) {
            setActionMessage({ type: 'error', text: 'Image size must be less than 32MB' });
            return;
        }

        setIsUploadingImage(true);
        setActionMessage(null);

        try {
            const result = await uploadToImgBB(file, book.title || 'book-thumbnail');
            
            if (result.success) {
                setNewThumbnailUrl(result.displayUrl);
                setActionMessage({ type: 'success', text: 'Image uploaded! Click "Save Thumbnail" to confirm.' });
            } else {
                setActionMessage({ type: 'error', text: result.error || 'Failed to upload image' });
            }
        } catch (error) {
            setActionMessage({ type: 'error', text: 'Failed to upload image. Please try again.' });
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleSaveThumbnail = async () => {
        if (!newThumbnailUrl && !isEditingThumbnail) return;

        setActionLoading(true);
        setActionMessage(null);

        try {
            const bookDoc = doc(db, booksCollectionPath, bookId);
            await updateDoc(bookDoc, {
                thumbnailUrl: newThumbnailUrl || null
            });

            setBook({ ...book, thumbnailUrl: newThumbnailUrl || null });
            setIsEditingThumbnail(false);
            setNewThumbnailUrl('');
            setActionMessage({ type: 'success', text: 'Thumbnail updated successfully!' });
            
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (err) {
            console.error('Error updating thumbnail:', err);
            setActionMessage({ type: 'error', text: 'Failed to update thumbnail' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemoveThumbnail = () => {
        setNewThumbnailUrl('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleCancelEdit = () => {
        setIsEditingThumbnail(false);
        setNewThumbnailUrl('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setActionMessage(null);
    };

    const handleEditBook = () => {
        setEditedBook({
            title: book.title || '',
            author: book.author || '',
            genre: book.genre || '',
            rack: book.rack || '',
            isbn: book.isbn || '',
            publicationYear: book.publicationYear || '',
            description: book.description || '',
            totalQuantity: book.totalQuantity || 0,
            availableQuantity: book.availableQuantity || 0
        });
        setIsEditingBook(true);
    };

    const handleSaveBookEdit = async () => {
        setActionLoading(true);
        setActionMessage(null);
        
        try {
            const bookRef = doc(db, booksCollectionPath, bookId);
            await updateDoc(bookRef, {
                title: editedBook.title,
                author: editedBook.author,
                genre: editedBook.genre,
                rack: editedBook.rack,
                isbn: editedBook.isbn || null,
                publicationYear: editedBook.publicationYear || null,
                description: editedBook.description || null,
                totalQuantity: parseInt(editedBook.totalQuantity) || 0,
                availableQuantity: parseInt(editedBook.availableQuantity) || 0
            });

            setBook(prev => ({
                ...prev,
                ...editedBook,
                totalQuantity: parseInt(editedBook.totalQuantity) || 0,
                availableQuantity: parseInt(editedBook.availableQuantity) || 0
            }));

            setIsEditingBook(false);
            setActionMessage({ type: 'success', text: 'Book details updated successfully!' });
            
            setTimeout(() => setActionMessage(null), 3000);
        } catch (error) {
            console.error('Error updating book:', error);
            setActionMessage({ type: 'error', text: 'Failed to update book details.' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancelBookEdit = () => {
        setIsEditingBook(false);
        setEditedBook({});
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
                    <p className="font-medium">Error loading book details</p>
                    <p className="text-sm">{error}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="mt-4 text-indigo-600 hover:text-indigo-800 underline"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (!book) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg">
                    <p>Book not found</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="mt-4 text-indigo-600 hover:text-indigo-800 underline"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const isAvailable = book.availableQuantity > 0;
    const displayThumbnail = newThumbnailUrl || book.thumbnailUrl;
    const canEditThumbnail = userRole === 'librarian' || userRole === 'admin';
    const totalCopies = book.totalQuantity || 0;
    const availableCopies = book.availableQuantity || 0;
    const userHasBorrowed = book.borrowedCopies?.some(copy => copy.userId === userId);

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors"
            >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Library
            </button>

            {actionMessage && (
                <div className={`p-4 rounded-lg ${actionMessage.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                    }`}>
                    <div className="flex items-center">
                        {actionMessage.type === 'success' ? (
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        )}
                        <span className="font-medium">{actionMessage.text}</span>
                    </div>
                </div>
            )}

            {isEditingBook ? (
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Book Details</h2>
                    
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={editedBook.title}
                                    onChange={(e) => setEditedBook({ ...editedBook, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Author <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={editedBook.author}
                                    onChange={(e) => setEditedBook({ ...editedBook, author: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Genre <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={editedBook.genre}
                                    onChange={(e) => setEditedBook({ ...editedBook, genre: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Rack <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={editedBook.rack}
                                    onChange={(e) => setEditedBook({ ...editedBook, rack: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">ISBN</label>
                                <input
                                    type="text"
                                    value={editedBook.isbn}
                                    onChange={(e) => setEditedBook({ ...editedBook, isbn: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                    placeholder="e.g., 978-0-7432-7356-5"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Publication Year</label>
                                <input
                                    type="text"
                                    value={editedBook.publicationYear}
                                    onChange={(e) => setEditedBook({ ...editedBook, publicationYear: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                    placeholder="e.g., 1925"
                                    maxLength="4"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Total Quantity <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={editedBook.totalQuantity}
                                    onChange={(e) => setEditedBook({ ...editedBook, totalQuantity: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Available Quantity <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={editedBook.availableQuantity}
                                    onChange={(e) => setEditedBook({ ...editedBook, availableQuantity: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                value={editedBook.description}
                                onChange={(e) => setEditedBook({ ...editedBook, description: e.target.value })}
                                rows="4"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 resize-none"
                                placeholder="Brief description of the book..."
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={handleCancelBookEdit}
                                disabled={actionLoading}
                                className="flex-1 px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveBookEdit}
                                disabled={actionLoading}
                                className="flex-1 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                            >
                                {actionLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Saving...
                                    </>
                                ) : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="p-8">
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="md:col-span-1">
                                <div className="relative">
                                    <div className="aspect-[3/4] bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg overflow-hidden">
                                        {displayThumbnail ? (
                                            <img
                                                src={displayThumbnail}
                                                alt={book.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <svg className="w-16 h-16 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                </svg>
                                            </div>
                                        )}
                                        
                                        {isUploadingImage && (
                                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                            </div>
                                        )}
                                    </div>

                                    {canEditThumbnail && (
                                        <div className="mt-4 space-y-2">
                                            {!isEditingThumbnail ? (
                                                <button
                                                    onClick={() => setIsEditingThumbnail(true)}
                                                    className="w-full px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium flex items-center justify-center"
                                                >
                                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    {book.thumbnailUrl ? 'Change Thumbnail' : 'Add Thumbnail'}
                                                </button>
                                            ) : (
                                                <div className="space-y-2">
                                                    <input
                                                        ref={fileInputRef}
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleImageSelect}
                                                        disabled={isUploadingImage}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                                    />
                                                    {newThumbnailUrl && (
                                                        <button
                                                            onClick={handleRemoveThumbnail}
                                                            disabled={isUploadingImage}
                                                            className="w-full px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                                                        >
                                                            Remove Selected Image
                                                        </button>
                                                    )}
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={handleSaveThumbnail}
                                                            disabled={!newThumbnailUrl || actionLoading || isUploadingImage}
                                                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                                                        >
                                                            {actionLoading ? 'Saving...' : 'Save Thumbnail'}
                                                        </button>
                                                        <button
                                                            onClick={handleCancelEdit}
                                                            disabled={actionLoading || isUploadingImage}
                                                            className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm font-medium"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="md:col-span-2 space-y-6">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{book.title}</h1>
                                    <p className="text-xl text-gray-600 mb-4">by {book.author}</p>

                                    <div className="flex items-center mb-4">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${isAvailable
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            <span className={`w-2 h-2 rounded-full mr-2 ${isAvailable ? 'bg-green-400' : 'bg-red-400'}`}></span>
                                            {isAvailable ? 'Available' : 'Not Available'}
                                        </span>
                                        <span className="ml-4 text-sm text-gray-600">
                                            {availableCopies} of {totalCopies} copies available
                                        </span>
                                    </div>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="font-semibold text-gray-700 mb-2">Details</h3>
                                        <div className="space-y-2 text-sm">
                                            <div><span className="font-medium">Genre:</span> {book.genre || 'Not specified'}</div>
                                            <div><span className="font-medium">Rack:</span> {book.rack || 'Not specified'}</div>
                                            <div><span className="font-medium">ISBN:</span> {book.isbn || 'Not available'}</div>
                                            <div><span className="font-medium">Publication Year:</span> {book.publicationYear || 'Not specified'}</div>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-700 mb-2">Availability</h3>
                                        <div className="space-y-2 text-sm">
                                            <div><span className="font-medium">Total Copies:</span> {totalCopies}</div>
                                            <div><span className="font-medium">Available:</span> {availableCopies}</div>
                                            <div><span className="font-medium">Borrowed:</span> {totalCopies - availableCopies}</div>
                                        </div>
                                    </div>
                                </div>

                                {book.description && (
                                    <div>
                                        <h3 className="font-semibold text-gray-700 mb-2">Description</h3>
                                        <p className="text-gray-600 leading-relaxed">{book.description}</p>
                                    </div>
                                )}

                                {userRole === 'reader' && (
                                    userHasBorrowed ? (
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                            <div className="flex items-start">
                                                <svg className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                <div>
                                                    <p className="text-sm font-medium text-green-800 mb-1">
                                                        ✓ You Have Borrowed This Book
                                                    </p>
                                                    <p className="text-sm text-green-700">
                                                        You currently have this book borrowed. Please return it to the library when you're done reading.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <div className="flex items-start">
                                                <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                </svg>
                                                <div>
                                                    <p className="text-sm font-medium text-blue-800 mb-1">
                                                        📚 Visit the Library to Borrow
                                                    </p>
                                                    <p className="text-sm text-blue-700">
                                                        Please visit the library in person to borrow this book. Our librarian will assist you with the borrowing process.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                )}

                                {(userRole === 'librarian' || userRole === 'admin') && (
                                    <div className="flex flex-wrap gap-3 pt-4">
                                        <button
                                            onClick={handleEditBook}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                                        >
                                            Edit Book
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (window.confirm(`Are you sure you want to delete "${book.title}"?`)) {
                                                    setActionLoading(true);
                                                    try {
                                                        await onDelete(bookId);
                                                        setActionMessage({ type: 'success', text: 'Book deleted successfully!' });
                                                        setTimeout(() => navigate(-1), 2000);
                                                    } catch (error) {
                                                        setActionMessage({ type: 'error', text: 'Failed to delete book.' });
                                                    } finally {
                                                        setActionLoading(false);
                                                    }
                                                }
                                            }}
                                            disabled={actionLoading}
                                            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            Delete Book
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {(userRole === 'librarian' || userRole === 'admin') && book.borrowedCopies?.length > 0 && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-xl font-semibold mb-4">
                        Currently Borrowed Copies ({book.borrowedCopies.length})
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reader Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {book.borrowedCopies.map((copy, index) => {
                                    const issueDate = copy.issueDate?.seconds 
                                        ? new Date(copy.issueDate.seconds * 1000) 
                                        : null;
                                    const dueDate = copy.dueDate?.seconds 
                                        ? new Date(copy.dueDate.seconds * 1000) 
                                        : null;
                                    const userEmail = borrowedUsersEmails[copy.userId] || 'Loading...';
                                    const isOverdue = dueDate && dueDate < new Date();
                                    
                                    return (
                                        <tr key={copy.borrowId || index} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono text-indigo-600 font-semibold">
                                                    {copy.serialNumber}
                                                </code>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {userEmail}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {issueDate ? issueDate.toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                }) : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {dueDate ? dueDate.toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                }) : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {isOverdue ? (
                                                    <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                                        Overdue
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                        Active
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookDetails;