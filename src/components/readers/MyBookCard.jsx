const MyBookCard = ({ book, borrowInfo, onReturn }) => {
    const dueDate = borrowInfo?.dueDate;
    const issueDate = borrowInfo?.issueDate;
    
    const daysUntilDue = dueDate 
        ? Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null;

    const isOverdue = daysUntilDue !== null && daysUntilDue < 0;

    const handleReturn = async () => {
        // ✅ Use the borrowInfo prop directly - it already has all the data!
        if (!borrowInfo) {
            console.error('❌ No borrow record found');
            return;
        }
        
        console.log('📦 Returning book with borrowInfo:', borrowInfo);
        
        // ✅ Pass BOTH bookId AND the full borrowInfo object
        const result = await onReturn(book.id, borrowInfo);
        
        if (result?.success) {
            // alert('✅ Book returned successfully!');
        } else {
            console.error('❌ Return failed:', result?.error);
            alert(`❌ Return failed: ${result?.error || 'Unknown error'}`);
        }
    };

    return (
        <li className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all p-4 border-l-4 border-indigo-500">
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
                    <h3 className="text-lg font-semibold text-gray-800 mb-1 line-clamp-2">
                        {book.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Author:</span> {book.author}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Genre:</span> {book.genre}
                    </p>

                    <div className="flex flex-wrap gap-2 mt-3 mb-3">
                        {issueDate && (
                            <span className="text-xs text-gray-500">
                                Issued: {issueDate.toLocaleDateString()}
                            </span>
                        )}
                        {dueDate && (
                            <span className={`text-xs font-medium ${
                                isOverdue ? 'text-red-600' : 'text-gray-700'
                            }`}>
                                Due: {dueDate.toLocaleDateString()}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            isOverdue
                                ? 'bg-red-100 text-red-800'
                                : daysUntilDue <= 3
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                        }`}>
                            {isOverdue 
                                ? `Overdue by ${Math.abs(daysUntilDue)} days`
                                : `${daysUntilDue} days left`
                            }
                        </span>

                        <button
                            onClick={handleReturn}
                            className="px-4 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                            Return Book
                        </button>
                    </div>
                </div>
            </div>
        </li>
    );
};

export default MyBookCard;