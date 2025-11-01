import { useState } from 'react';
import { Link } from 'react-router-dom';

const LibrarianBookItem = ({ book, userId, userRole, onDelete, onUpdate, searchQuery }) => {
    const [isEditing, setIsEditing] = useState(false);

    const isAvailable = book.availableQuantity > 0;
    const borrowedCount = (book.totalQuantity || 0) - (book.availableQuantity || 0);
    const displayThumbnail = book.thumbnailUrl; // Use book.thumbnailUrl directly

    return (
        <li className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden cursor-pointer">
            <Link to={`/book/${book.id}`} className="block">
                <div className="p-4 flex flex-col sm:flex-row gap-4">
                    {/* Book Thumbnail */}
                    <div className="flex-shrink-0 w-full sm:w-24 aspect-[3/4] bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg overflow-hidden hover:opacity-80 transition-opacity">
                        {displayThumbnail ? (
                            <img
                                src={displayThumbnail}
                                alt={book.title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                        )}
                    </div>

                    {/* Book Details */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-indigo-700 hover:text-indigo-900 transition-colors truncate" title={book.title}>
                                    {book.title}
                                </h3>
                                <p className="text-sm text-gray-600 truncate" title={book.author}>by {book.author}</p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    isAvailable 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full mr-1 ${
                                        isAvailable ? 'bg-green-400' : 'bg-red-400'
                                    }`}></span>
                                    {isAvailable ? 'Available' : 'Out'}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                            <div>
                                <span className="text-gray-500">Genre:</span>
                                <span className="ml-1 font-medium text-gray-700 truncate block" title={book.genre}>{book.genre}</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Rack:</span>
                                <span className="ml-1 font-medium text-gray-700">{book.rack}</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Available:</span>
                                <span className="ml-1 font-medium text-gray-700">{book.availableQuantity}/{book.totalQuantity}</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Borrowed:</span>
                                <span className="ml-1 font-medium text-gray-700">{borrowedCount}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </li>
    );
};

export default LibrarianBookItem;