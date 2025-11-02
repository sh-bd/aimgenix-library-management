import { Link } from 'react-router-dom';

const MyBookCard = ({ book, borrowInfo }) => {
    const dueDate = borrowInfo?.dueDate;
    const issueDate = borrowInfo?.issueDate;
    const serialNumber = borrowInfo?.serialNumber;

    const isOverdue = dueDate && dueDate < new Date();
    const daysUntilDue = dueDate 
        ? Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24))
        : null;

    return (
        <li className="group bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col h-full">
            {/* Image Container */}
            <Link to={`/book/${book.id}`} className="block relative">
                <div className="relative h-56 sm:h-64 bg-gradient-to-br from-purple-100 to-blue-100 overflow-hidden">
                    {book.thumbnailUrl ? (
                        <img
                            src={book.thumbnailUrl}
                            alt={book.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-16 h-16 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                    )}

                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                        <span className="text-white font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm sm:text-base px-4 py-2 bg-black bg-opacity-50 rounded-lg">
                            View Details
                        </span>
                    </div>

                    {/* Status Badge - Top */}
                    <div className="absolute top-3 left-3 right-3 z-10 flex justify-between items-start gap-2">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-purple-500 text-white shadow-lg">
                            📖 Currently Reading
                        </span>
                        
                        {isOverdue && (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-red-500 text-white shadow-lg animate-pulse">
                                ⚠️ Overdue
                            </span>
                        )}
                    </div>
                </div>
            </Link>

            {/* Content Container */}
            <div className="p-4 sm:p-5 flex flex-col flex-grow">
                {/* Book Title */}
                <Link to={`/book/${book.id}`} className="block mb-3 group/title">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 line-clamp-2 group-hover/title:text-purple-600 transition-colors">
                        {book.title}
                    </h3>
                </Link>

                {/* Book Details */}
                <div className="space-y-2 mb-4 flex-grow">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="truncate">{book.author || 'Unknown Author'}</span>
                    </div>

                    {serialNumber && (
                        <div className="flex items-center gap-2 text-sm">
                            <svg className="w-4 h-4 flex-shrink-0 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                            </svg>
                            <span className="font-mono text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded">
                                {serialNumber}
                            </span>
                        </div>
                    )}
                </div>

                {/* Borrow Info Card */}
                <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-4 mb-4 border border-gray-200">
                    <div className="space-y-2.5">
                        {/* Issue Date */}
                        {issueDate && (
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span className="font-medium">Issued:</span>
                                </div>
                                <span className="font-semibold text-gray-700">
                                    {issueDate.toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </span>
                            </div>
                        )}

                        {/* Due Date */}
                        {dueDate && (
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="font-medium">Due:</span>
                                </div>
                                <span className={`font-semibold ${
                                    isOverdue 
                                        ? 'text-red-600' 
                                        : daysUntilDue <= 3 
                                        ? 'text-orange-600' 
                                        : 'text-green-600'
                                }`}>
                                    {dueDate.toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </span>
                            </div>
                        )}

                        {/* Days Remaining/Overdue */}
                        {daysUntilDue !== null && (
                            <div className={`mt-3 pt-3 border-t ${
                                isOverdue ? 'border-red-200' : 'border-gray-200'
                            }`}>
                                <div className="flex items-center justify-center gap-2">
                                    {isOverdue ? (
                                        <>
                                            <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-sm font-bold text-red-600">
                                                Overdue by {Math.abs(daysUntilDue)} {Math.abs(daysUntilDue) === 1 ? 'day' : 'days'}
                                            </span>
                                        </>
                                    ) : daysUntilDue === 0 ? (
                                        <>
                                            <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-sm font-bold text-orange-600">
                                                Due Today!
                                            </span>
                                        </>
                                    ) : daysUntilDue <= 3 ? (
                                        <>
                                            <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-sm font-bold text-orange-600">
                                                {daysUntilDue} {daysUntilDue === 1 ? 'day' : 'days'} left
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-sm font-bold text-green-600">
                                                {daysUntilDue} {daysUntilDue === 1 ? 'day' : 'days'} remaining
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Return Instructions */}
                <div className={`rounded-xl p-4 border-2 ${
                    isOverdue 
                        ? 'bg-red-50 border-red-300'
                        : daysUntilDue <= 3
                        ? 'bg-orange-50 border-orange-300'
                        : 'bg-blue-50 border-blue-300'
                }`}>
                    <div className="flex items-start gap-3">
                        <svg 
                            className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                                isOverdue 
                                    ? 'text-red-600'
                                    : daysUntilDue <= 3
                                    ? 'text-orange-600'
                                    : 'text-blue-600'
                            }`} 
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                        >
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1">
                            <p className={`text-sm font-bold mb-1 ${
                                isOverdue 
                                    ? 'text-red-800'
                                    : daysUntilDue <= 3
                                    ? 'text-orange-800'
                                    : 'text-blue-800'
                            }`}>
                                {isOverdue 
                                    ? '⚠️ Return to Library Immediately'
                                    : daysUntilDue <= 3
                                    ? '⏰ Return Soon'
                                    : '📚 Return Instructions'
                                }
                            </p>
                            <p className={`text-xs leading-relaxed ${
                                isOverdue 
                                    ? 'text-red-700'
                                    : daysUntilDue <= 3
                                    ? 'text-orange-700'
                                    : 'text-blue-700'
                            }`}>
                                {isOverdue 
                                    ? `This book is overdue by ${Math.abs(daysUntilDue)} ${Math.abs(daysUntilDue) === 1 ? 'day' : 'days'}. Please return it to the library. Fine charges may apply.`
                                    : daysUntilDue === 0
                                    ? 'This book is due today! Please visit the library to return it and avoid late fees.'
                                    : daysUntilDue <= 3
                                    ? `Please return this book to the library within ${daysUntilDue} ${daysUntilDue === 1 ? 'day' : 'days'} to avoid late fees.`
                                    : 'Visit the library to return this book. The librarian will process your return and calculate any applicable fees.'
                                }
                            </p>
                        </div>
                    </div>

                    {/* Serial Number Reminder */}
                    {serialNumber && (
                        <div className={`mt-3 pt-3 border-t ${
                            isOverdue 
                                ? 'border-red-200'
                                : daysUntilDue <= 3
                                ? 'border-orange-200'
                                : 'border-blue-200'
                        }`}>
                            <div className="flex items-center justify-between">
                                <span className={`text-xs font-medium ${
                                    isOverdue 
                                        ? 'text-red-700'
                                        : daysUntilDue <= 3
                                        ? 'text-orange-700'
                                        : 'text-blue-700'
                                }`}>
                                    Bring this serial number:
                                </span>
                                <code className={`text-xs font-bold px-2 py-1 rounded ${
                                    isOverdue 
                                        ? 'bg-red-100 text-red-800'
                                        : daysUntilDue <= 3
                                        ? 'bg-orange-100 text-orange-800'
                                        : 'bg-blue-100 text-blue-800'
                                }`}>
                                    {serialNumber}
                                </code>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </li>
    );
};

export default MyBookCard;