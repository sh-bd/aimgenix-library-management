import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { booksCollectionPath, db } from '../config/firebase';
import handleReturnWithHistory from '../components/handleReturnWithHistory';

const BorrowedBooksView = ({ userRole, userId }) => {
    const [borrowedBooks, setBorrowedBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [returningBooks, setReturningBooks] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        if (!['admin', 'librarian'].includes(userRole)) {
            navigate('/');
            return;
        }
        fetchBorrowedBooks();
    }, [userRole, navigate]);

    const fetchBorrowedBooks = async () => {
        setLoading(true);
        try {
            const booksSnapshot = await getDocs(collection(db, booksCollectionPath));
            const allBorrowedData = [];

            for (const bookDoc of booksSnapshot.docs) {
                const bookData = bookDoc.data();
                const borrowedCopies = bookData.borrowedCopies || [];

                if (borrowedCopies.length > 0) {
                    for (const borrowedCopy of borrowedCopies) {
                        try {
                            const userDoc = await getDoc(doc(db, 'users', borrowedCopy.userId));
                            const userData = userDoc.exists() ? userDoc.data() : null;

                            allBorrowedData.push({
                                bookId: bookDoc.id,
                                bookTitle: bookData.title,
                                bookAuthor: bookData.author,
                                bookIsbn: bookData.isbn,
                                bookGenre: bookData.genre,
                                bookRack: bookData.rack,
                                serialNumber: borrowedCopy.serialNumber,
                                borrowId: borrowedCopy.borrowId,
                                userId: borrowedCopy.userId,
                                userEmail: userData?.email || 'Unknown',
                                userName: userData?.name || 'Unknown User',
                                issueDate: borrowedCopy.issueDate,
                                dueDate: borrowedCopy.dueDate,
                                isOverdue: borrowedCopy.dueDate && new Date(borrowedCopy.dueDate.seconds * 1000) < new Date()
                            });
                        } catch (error) {
                            console.error("Error fetching user data:", error);
                        }
                    }
                }
            }

            allBorrowedData.sort((a, b) => {
                const dateA = a.issueDate?.seconds || 0;
                const dateB = b.issueDate?.seconds || 0;
                return dateB - dateA;
            });

            setBorrowedBooks(allBorrowedData);
        } catch (error) {
            console.error("Error fetching borrowed books:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleReturnBook = async (book) => {
        const confirmReturn = window.confirm(
            `Return book "${book.bookTitle}" borrowed by ${book.userEmail}?\n\n` +
            `Serial Number: ${book.serialNumber}\n` +
            (book.isOverdue ? `⚠️ This book is OVERDUE. Fine charges may apply.` : '')
        );

        if (!confirmReturn) return;

        const uniqueKey = `${book.bookId}-${book.borrowId}`;
        setReturningBooks(prev => ({ ...prev, [uniqueKey]: true }));

        try {
            // Create borrow record object with all necessary data
            const borrowRecord = {
                userId: book.userId,
                borrowId: book.borrowId,
                serialNumber: book.serialNumber,
                issueDate: book.issueDate,
                dueDate: book.dueDate
            };

            console.log('🔄 Returning book:', {
                bookId: book.bookId,
                bookTitle: book.bookTitle,
                borrowRecord
            });

            const result = await handleReturnWithHistory(book.bookId, borrowRecord);

            if (result.success) {
                alert(`✅ Book "${book.bookTitle}" returned successfully!`);
                // Refresh the list
                await fetchBorrowedBooks();
            } else {
                alert(`❌ Failed to return book: ${result.error}`);
            }
        } catch (error) {
            console.error('Error returning book:', error);
            alert(`❌ Error: ${error.message}`);
        } finally {
            setReturningBooks(prev => {
                const newState = { ...prev };
                delete newState[uniqueKey];
                return newState;
            });
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '-';
        const date = timestamp.seconds
            ? new Date(timestamp.seconds * 1000)
            : new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getDaysRemaining = (dueDate) => {
        if (!dueDate) return 0;
        const due = dueDate.seconds
            ? new Date(dueDate.seconds * 1000)
            : new Date(dueDate);
        const today = new Date();
        const diffTime = due - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    // Filter borrowed books
    const filteredBooks = borrowedBooks.filter(book => {
        const matchesSearch = 
            (book.bookTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (book.bookAuthor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (book.serialNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (book.userEmail || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = 
            filterStatus === 'all' ||
            (filterStatus === 'overdue' && book.isOverdue) ||
            (filterStatus === 'active' && !book.isOverdue);

        return matchesSearch && matchesFilter;
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">Currently Borrowed Books</h2>
                    <p className="text-gray-600 mt-2">
                        Total: <span className="font-semibold">{borrowedBooks.length}</span> | 
                        Overdue: <span className="font-semibold text-red-600">{borrowedBooks.filter(b => b.isOverdue).length}</span>
                    </p>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <div className="relative">
                            <span className="absolute left-3 top-3 text-gray-400">🔍</span>
                            <input
                                type="text"
                                placeholder="Search by book title, author, serial number, or reader..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    <div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">All Books</option>
                            <option value="active">Active Loans</option>
                            <option value="overdue">Overdue Only</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Books List */}
            {filteredBooks.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                    <div className="text-6xl mb-4">📚</div>
                    <h5 className="text-xl text-gray-500">No borrowed books found</h5>
                </div>
            ) : (
                <>
                    {/* Mobile Card View */}
                    <div className="block lg:hidden space-y-4">
                        {filteredBooks.map((book, index) => {
                            const daysRemaining = getDaysRemaining(book.dueDate);
                            const uniqueKey = `${book.bookId}-${book.borrowId}`;
                            const isReturning = returningBooks[uniqueKey];

                            return (
                                <div key={index} className={`bg-white rounded-lg shadow-md p-4 border-l-4 ${
                                    book.isOverdue ? 'border-red-500' : 'border-blue-500'
                                }`}>
                                    {/* Status Badge */}
                                    <div className="flex justify-between items-start mb-3">
                                        <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                                            {book.serialNumber}
                                        </code>
                                        {book.isOverdue ? (
                                            <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                                                ⚠️ Overdue {Math.abs(daysRemaining)}d
                                            </span>
                                        ) : daysRemaining <= 3 ? (
                                            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                                                ⏰ Due Soon
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                                                ✓ Active
                                            </span>
                                        )}
                                    </div>

                                    {/* Book Details */}
                                    <div className="mb-3">
                                        <h3 className="font-bold text-lg text-gray-800">{book.bookTitle}</h3>
                                        <p className="text-sm text-gray-600">by {book.bookAuthor}</p>
                                        {book.bookIsbn && <p className="text-xs text-gray-500">ISBN: {book.bookIsbn}</p>}
                                        <p className="text-xs text-gray-500">
                                            {book.bookGenre && `${book.bookGenre} | `}Rack: {book.bookRack || 'N/A'}
                                        </p>
                                    </div>

                                    {/* Reader Details */}
                                    <div className="mb-3 pb-3 border-t pt-3">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            <span>{book.userEmail}</span>
                                        </div>
                                    </div>

                                    {/* Dates */}
                                    <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                                        <div>
                                            <p className="text-gray-500 text-xs">Issue Date</p>
                                            <p className="font-semibold">{formatDate(book.issueDate)}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 text-xs">Due Date</p>
                                            <p className={`font-semibold ${book.isOverdue ? 'text-red-600' : ''}`}>
                                                {formatDate(book.dueDate)}
                                            </p>
                                            {!book.isOverdue && (
                                                <p className="text-xs text-gray-500">({daysRemaining} days left)</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Return Button */}
                                    <button
                                        onClick={() => handleReturnBook(book)}
                                        disabled={isReturning}
                                        className={`w-full py-2.5 px-4 rounded-lg font-semibold transition-all duration-200 text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2 ${
                                            book.isOverdue
                                                ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
                                                : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {isReturning ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                                </svg>
                                                {book.isOverdue ? 'Accept Return (Overdue)' : 'Accept Return'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden lg:block bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-800 text-white">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Serial Number</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Book Details</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Reader Email</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Issue Date</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Due Date</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                                        <th className="px-4 py-3 text-center text-sm font-semibold">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredBooks.map((book, index) => {
                                        const daysRemaining = getDaysRemaining(book.dueDate);
                                        const uniqueKey = `${book.bookId}-${book.borrowId}`;
                                        const isReturning = returningBooks[uniqueKey];

                                        return (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-4 py-3">
                                                    <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono font-semibold text-indigo-600">
                                                        {book.serialNumber}
                                                    </code>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="font-semibold text-gray-800">{book.bookTitle}</p>
                                                    <p className="text-sm text-gray-600">by {book.bookAuthor}</p>
                                                    {book.bookIsbn && <p className="text-xs text-gray-500">ISBN: {book.bookIsbn}</p>}
                                                    <p className="text-xs text-gray-500">
                                                        {book.bookGenre && `${book.bookGenre} | `}Rack: {book.bookRack || 'N/A'}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="text-sm text-gray-600">{book.userEmail}</p>
                                                </td>
                                                <td className="px-4 py-3 text-sm">{formatDate(book.issueDate)}</td>
                                                <td className="px-4 py-3">
                                                    <p className={`text-sm font-semibold ${book.isOverdue ? 'text-red-600' : ''}`}>
                                                        {formatDate(book.dueDate)}
                                                    </p>
                                                    {!book.isOverdue && (
                                                        <p className="text-xs text-gray-500">({daysRemaining} days left)</p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {book.isOverdue ? (
                                                        <span className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                                                            ⚠️ Overdue {Math.abs(daysRemaining)}d
                                                        </span>
                                                    ) : daysRemaining <= 3 ? (
                                                        <span className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                                                            ⏰ Due Soon
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                                                            ✓ Active
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => handleReturnBook(book)}
                                                        disabled={isReturning}
                                                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 inline-flex items-center gap-2 ${
                                                            book.isOverdue
                                                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                                                : 'bg-green-600 hover:bg-green-700 text-white'
                                                        } disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg`}
                                                    >
                                                        {isReturning ? (
                                                            <>
                                                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                </svg>
                                                                Processing
                                                            </>
                                                        ) : (
                                                            <>
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                                                </svg>
                                                                Accept Return
                                                            </>
                                                        )}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* Summary Card */}
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                    <div>
                        <h3 className="text-3xl font-bold text-gray-800">{filteredBooks.length}</h3>
                        <p className="text-gray-600 mt-1">Total Displayed</p>
                    </div>
                    <div>
                        <h3 className="text-3xl font-bold text-green-600">{filteredBooks.filter(b => !b.isOverdue).length}</h3>
                        <p className="text-gray-600 mt-1">Active Loans</p>
                    </div>
                    <div>
                        <h3 className="text-3xl font-bold text-red-600">{filteredBooks.filter(b => b.isOverdue).length}</h3>
                        <p className="text-gray-600 mt-1">Overdue</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BorrowedBooksView;