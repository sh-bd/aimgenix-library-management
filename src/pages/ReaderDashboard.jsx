import React, { useEffect, useState } from 'react';
import BorrowHistoryView from '../components/BorrowHistoryView';
import BookCard from '../components/readers/BookCard';
import MyBookCard from '../components/readers/MyBookCard';
import ReservationsView from '../components/ReservationsView';

const ReaderView = ({ books, userId, onBorrow, onReturn }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [activeView, setActiveView] = useState(() => {
        return localStorage.getItem('readerActiveView') || 'browse';
    });
    const [filterBy, setFilterBy] = useState('all');
    const [selectedFilter, setSelectedFilter] = useState('');

    // ✅ Librarian Contact Information
    const librarianInfo = {
        name: "Librarian X",
        email: "librarian@aimgenix.com",
        phone: "+880 1714-202023"
    };

    useEffect(() => {
        localStorage.setItem('readerActiveView', activeView);
    }, [activeView]);

    // Memoize calculations to avoid re-running on every render
    const { myBorrowedBooks, borrowedBookIds } = React.useMemo(() => {
        if (!userId) return { myBorrowedBooks: [], borrowedBookIds: new Set() };

        const parseTimestamp = (ts) => {
            if (!ts) return null;
            if (typeof ts.toDate === 'function') return ts.toDate();
            if (typeof ts.seconds === 'number') return new Date(ts.seconds * 1000);
            if (typeof ts === 'string') {
                const d = new Date(ts);
                return isNaN(d) ? null : d;
            }
            if (ts instanceof Date) return ts;
            return null;
        };

        // ✅ FIXED: Create a separate entry for each borrow instance
        const borrowed = [];
        
        books.forEach(book => {
            // Find ALL borrow records for this user, not just the first one
            const userBorrowRecords = book.borrowedCopies?.filter(c => c.userId === userId) || [];
            
            // Create a separate entry for each borrow record
            userBorrowRecords.forEach(borrowInfoRaw => {
                const dueDate = parseTimestamp(borrowInfoRaw.dueDate);
                const issueDate = parseTimestamp(borrowInfoRaw.issueDate);

                if (!(dueDate instanceof Date && !isNaN(dueDate))) {
                    console.warn("Skipping borrowed book due to invalid due date:", book.id, borrowInfoRaw);
                    return;
                }

                borrowed.push({
                    ...book,
                    borrowInfo: {
                        ...borrowInfoRaw,
                        dueDate,
                        issueDate
                    }
                });
            });
        });

        // Sort by due date
        borrowed.sort((a, b) => a.borrowInfo.dueDate.getTime() - b.borrowInfo.dueDate.getTime());

        const ids = new Set(borrowed.map(b => b.id));
        return { myBorrowedBooks: borrowed, borrowedBookIds: ids };
    }, [books, userId]);

    // Get unique values for filters
    const filterOptions = React.useMemo(() => {
        const racks = new Set();
        const genres = new Set();
        const authors = new Set();
        const years = new Set();

        books.forEach(book => {
            if (book.rack) racks.add(book.rack);
            if (book.genre) genres.add(book.genre);
            if (book.author) authors.add(book.author);
            if (book.publicationYear) years.add(book.publicationYear);
        });

        return {
            racks: Array.from(racks).sort(),
            genres: Array.from(genres).sort(),
            authors: Array.from(authors).sort(),
            years: Array.from(years).sort((a, b) => b - a) // newest first
        };
    }, [books]);

    // Filter available books for search and filters (memoized)
    const availableBooks = React.useMemo(() => {
        let filtered = books;

        // Apply search filter
        if (searchTerm) {
            const lowerSearchTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(book =>
                (book.title?.toLowerCase() || '').includes(lowerSearchTerm) ||
                (book.author?.toLowerCase() || '').includes(lowerSearchTerm) ||
                (book.genre?.toLowerCase() || '').includes(lowerSearchTerm)
            );
        }

        // Apply category filter
        if (filterBy !== 'all' && selectedFilter) {
            filtered = filtered.filter(book => {
                switch (filterBy) {
                    case 'rack':
                        return book.rack === selectedFilter;
                    case 'genre':
                        return book.genre === selectedFilter;
                    case 'author':
                        return book.author === selectedFilter;
                    case 'year':
                        return book.publicationYear === selectedFilter;
                    default:
                        return true;
                }
            });
        }

        return filtered;
    }, [books, searchTerm, filterBy, selectedFilter]);

    // Reset selected filter when filter type changes
    const handleFilterChange = (newFilterBy) => {
        setFilterBy(newFilterBy);
        setSelectedFilter('');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
            <div className="container mx-auto px-4 max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">Reader Dashboard</h1>
                    <p className="text-gray-600">Browse and manage your borrowed books</p>
                </div>

                {/* Navigation Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {/* Browse Books */}
                    <button
                        onClick={() => setActiveView('browse')}
                        className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${
                            activeView === 'browse'
                                ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-xl'
                                : 'bg-white text-gray-700 shadow-md hover:shadow-xl border border-gray-200'
                        }`}
                    >
                        <div className="relative z-10">
                            <div className={`text-5xl mb-4 transition-transform duration-300 group-hover:scale-110 ${
                                activeView === 'browse' ? '' : 'filter grayscale group-hover:grayscale-0'
                            }`}>
                                📚
                            </div>
                            <h3 className="text-xl font-bold mb-2">Browse Books</h3>
                            <p className={`text-sm ${
                                activeView === 'browse' ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                                {availableBooks.length} books available
                            </p>
                        </div>
                        {activeView === 'browse' && (
                            <div className="absolute top-4 right-4">
                                <span className="flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                                </span>
                            </div>
                        )}
                    </button>

                    {/* My Books */}
                    <button
                        onClick={() => setActiveView('myBooks')}
                        className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${
                            activeView === 'myBooks'
                                ? 'bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-xl'
                                : 'bg-white text-gray-700 shadow-md hover:shadow-xl border border-gray-200'
                        }`}
                    >
                        <div className="relative z-10">
                            <div className={`text-5xl mb-4 transition-transform duration-300 group-hover:scale-110 ${
                                activeView === 'myBooks' ? '' : 'filter grayscale group-hover:grayscale-0'
                            }`}>
                                📖
                            </div>
                            <h3 className="text-xl font-bold mb-2">My Books</h3>
                            <p className={`text-sm ${
                                activeView === 'myBooks' ? 'text-purple-100' : 'text-gray-500'
                            }`}>
                                {myBorrowedBooks.length} books borrowed
                            </p>
                        </div>
                        {activeView === 'myBooks' && (
                            <div className="absolute top-4 right-4">
                                <span className="flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                                </span>
                            </div>
                        )}
                    </button>

                    {/* My Reservations - NEW */}
                    <button
                        onClick={() => setActiveView('reservations')}
                        className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${
                            activeView === 'reservations'
                                ? 'bg-gradient-to-br from-orange-500 to-orange-700 text-white shadow-xl'
                                : 'bg-white text-gray-700 shadow-md hover:shadow-xl border border-gray-200'
                        }`}
                    >
                        <div className="relative z-10">
                            <div className={`text-5xl mb-4 transition-transform duration-300 group-hover:scale-110 ${
                                activeView === 'reservations' ? '' : 'filter grayscale group-hover:grayscale-0'
                            }`}>
                                📌
                            </div>
                            <h3 className="text-xl font-bold mb-2">My Reservations</h3>
                            <p className={`text-sm ${
                                activeView === 'reservations' ? 'text-orange-100' : 'text-gray-500'
                            }`}>
                                View reserved books
                            </p>
                        </div>
                        {activeView === 'reservations' && (
                            <div className="absolute top-4 right-4">
                                <span className="flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                                </span>
                            </div>
                        )}
                    </button>

                    {/* History */}
                    <button
                        onClick={() => setActiveView('history')}
                        className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${
                            activeView === 'history'
                                ? 'bg-gradient-to-br from-green-500 to-green-700 text-white shadow-xl'
                                : 'bg-white text-gray-700 shadow-md hover:shadow-xl border border-gray-200'
                        }`}
                    >
                        <div className="relative z-10">
                            <div className={`text-5xl mb-4 transition-transform duration-300 group-hover:scale-110 ${
                                activeView === 'history' ? '' : 'filter grayscale group-hover:grayscale-0'
                            }`}>
                                📋
                            </div>
                            <h3 className="text-xl font-bold mb-2">History</h3>
                            <p className={`text-sm ${
                                activeView === 'history' ? 'text-green-100' : 'text-gray-500'
                            }`}>
                                View borrow history
                            </p>
                        </div>
                        {activeView === 'history' && (
                            <div className="absolute top-4 right-4">
                                <span className="flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                                </span>
                            </div>
                        )}
                    </button>
                </div>

                {/* ✅ NEW: Librarian Contact Card - Better Position & Design */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-200">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-2xl">
                            📞
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">Need Help?</h3>
                            <p className="text-sm text-gray-500">Contact our librarian</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        {/* Name */}
                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">
                                👤
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-gray-500 font-medium">Name</p>
                                <p className="text-sm font-semibold text-gray-800">{librarianInfo.name}</p>
                            </div>
                        </div>

                        {/* Email */}
                        <a 
                            href={`mailto:${librarianInfo.email}`}
                            className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors group"
                        >
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                                📧
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-gray-500 font-medium">Email</p>
                                <p className="text-sm font-semibold text-blue-600 group-hover:underline truncate">
                                    {librarianInfo.email}
                                </p>
                            </div>
                        </a>

                        {/* Phone */}
                        <a 
                            href={`tel:${librarianInfo.phone}`}
                            className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-green-50 transition-colors group"
                        >
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                                📱
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-gray-500 font-medium">Phone</p>
                                <p className="text-sm font-semibold text-green-600 group-hover:underline">
                                    {librarianInfo.phone}
                                </p>
                            </div>
                        </a>
                    </div>
                </div>

                {/* Content Area */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    {/* Browse Books View */}
                    {activeView === 'browse' && (
                        <div>
                            <div className="mb-6">
                                <h2 className="text-3xl font-bold text-gray-800 mb-4">Browse Books</h2>
                                <p className="text-gray-600 mb-4">
                                    ℹ️ <strong>Note:</strong> You can only reserve low-stock books (less than 10 copies) online. 
                                    To borrow books, please visit the library. Our librarian will assist you!
                                </p>
                                
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <input
                                        type="text"
                                        placeholder="Search by title or author..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <select
                                        value={filterBy}
                                        onChange={(e) => handleFilterChange(e.target.value)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="all">All Books</option>
                                        <option value="rack">By Rack</option>
                                        <option value="genre">By Genre</option>
                                        <option value="author">By Author</option>
                                        <option value="year">By Year</option>
                                    </select>
                                </div>
                            </div>

                            {availableBooks.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 rounded-xl">
                                    <div className="text-6xl mb-4">📚</div>
                                    <p className="text-gray-500 text-lg">No books found matching your criteria</p>
                                </div>
                            ) : (
                                <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {availableBooks.map(book => (
                                        <BookCard
                                            key={book.id}
                                            book={book}
                                            userId={userId}
                                            onBorrow={onBorrow}
                                            hasBorrowed={borrowedBookIds.has(book.id)}
                                        />
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    {/* My Books View */}
                    {activeView === 'myBooks' && (
                        <div>
                            <div className="mb-6">
                                <h2 className="text-3xl font-bold text-gray-800 mb-2">My Borrowed Books</h2>
                                <p className="text-gray-600">
                                    You currently have {myBorrowedBooks.length} {myBorrowedBooks.length === 1 ? 'book' : 'books'} borrowed
                                </p>
                            </div>

                            {myBorrowedBooks.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 rounded-xl">
                                    <div className="text-6xl mb-4">📖</div>
                                    <p className="text-gray-500 text-lg">You haven't borrowed any books yet</p>
                                    <button
                                        onClick={() => setActiveView('browse')}
                                        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Browse Books
                                    </button>
                                </div>
                            ) : (
                                <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {myBorrowedBooks.map(book => {
                                        const borrowInfo = book.borrowedCopies.find(copy => copy.userId === userId);
                                        return (
                                            <MyBookCard
                                                key={book.id}
                                                book={book}
                                                borrowInfo={borrowInfo}
                                                onReturn={onReturn}
                                            />
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    )}

                    {/* Reservations View - NEW */}
                    {activeView === 'reservations' && (
                        <ReservationsView userId={userId} userRole="reader" />
                    )}

                    {/* History View */}
                    {activeView === 'history' && (
                        <BorrowHistoryView userId={userId} userRole="reader" />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReaderView;