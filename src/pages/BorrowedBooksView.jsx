import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { booksCollectionPath, db } from '../config/firebase';

const BorrowedBooksView = ({ userRole }) => {
    const [borrowedBooks, setBorrowedBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
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
                <button
                    onClick={() => navigate(-1)}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                    ← Back
                </button>
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

            {/* Books List - Card Layout for Mobile, Table for Desktop */}
            {filteredBooks.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                    <h5 className="text-xl text-gray-500">No borrowed books found</h5>
                </div>
            ) : (
                <>
                    {/* Mobile Card View */}
                    <div className="block lg:hidden space-y-4">
                        {filteredBooks.map((book, index) => {
                            const daysRemaining = getDaysRemaining(book.dueDate);
                            return (
                                <div key={index} className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
                                    {/* Status Badge */}
                                    <div className="flex justify-between items-start mb-3">
                                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">{book.serialNumber}</code>
                                        {book.isOverdue ? (
                                            <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                                                Overdue {Math.abs(daysRemaining)}d
                                            </span>
                                        ) : daysRemaining <= 3 ? (
                                            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                                                Due Soon
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                                                Active
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
                                    <div className="mb-3 border-t pt-3">
                                        <p className="text-sm text-gray-600">{book.userEmail}</p>
                                    </div>

                                    {/* Dates */}
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <p className="text-gray-500">Issue Date</p>
                                            <p className="font-semibold">{formatDate(book.issueDate)}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Due Date</p>
                                            <p className="font-semibold">{formatDate(book.dueDate)}</p>
                                            {!book.isOverdue && (
                                                <p className="text-xs text-gray-500">({daysRemaining} days left)</p>
                                            )}
                                        </div>
                                    </div>
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
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredBooks.map((book, index) => {
                                        const daysRemaining = getDaysRemaining(book.dueDate);
                                        return (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-4 py-3">
                                                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">{book.serialNumber}</code>
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
                                                    <p className="text-sm">{formatDate(book.dueDate)}</p>
                                                    {!book.isOverdue && (
                                                        <p className="text-xs text-gray-500">({daysRemaining} days left)</p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {book.isOverdue ? (
                                                        <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                                                            Overdue {Math.abs(daysRemaining)}d
                                                        </span>
                                                    ) : daysRemaining <= 3 ? (
                                                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                                                            Due Soon
                                                        </span>
                                                    ) : (
                                                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
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