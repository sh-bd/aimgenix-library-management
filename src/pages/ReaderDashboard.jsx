import React, { useState } from 'react';
import BookCard from '../components/readers/BookCard';
import MyBookCard from '../components/readers/MyBookCard';

const ReaderView = ({ books, userId, onBorrow, onReturn }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [activeView, setActiveView] = useState('browse');
    const [filterBy, setFilterBy] = useState('all'); // all, rack, genre, author, year
    const [selectedFilter, setSelectedFilter] = useState('');

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

        const borrowed = books
            .map(book => {
                const borrowInfoRaw = book.borrowedCopies?.find(c => c.userId === userId);
                if (!borrowInfoRaw) return null;

                const dueDate = parseTimestamp(borrowInfoRaw.dueDate);
                const issueDate = parseTimestamp(borrowInfoRaw.issueDate);

                if (!(dueDate instanceof Date && !isNaN(dueDate))) {
                    console.warn("Skipping borrowed book due to invalid due date:", book.id, borrowInfoRaw);
                    return null;
                }

                return {
                    ...book,
                    borrowInfo: {
                        ...borrowInfoRaw,
                        dueDate,
                        issueDate
                    }
                };
            })
            .filter(Boolean)
            .sort((a, b) => a.borrowInfo.dueDate.getTime() - b.borrowInfo.dueDate.getTime());

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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
                                📚
                            </div>
                            <h3 className="text-xl font-bold mb-2">My Books</h3>
                            <p className={`text-sm ${
                                activeView === 'myBooks' ? 'text-purple-100' : 'text-gray-500'
                            }`}>
                                View and manage your borrowed books
                            </p>
                            {myBorrowedBooks.length > 0 && (
                                <div className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                    activeView === 'myBooks' 
                                        ? 'bg-white/20 text-white' 
                                        : 'bg-purple-100 text-purple-800'
                                }`}>
                                    {myBorrowedBooks.length} borrowed
                                </div>
                            )}
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

                    {/* Browse Library */}
                    <button
                        onClick={() => setActiveView('browse')}
                        className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${
                            activeView === 'browse'
                                ? 'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-xl'
                                : 'bg-white text-gray-700 shadow-md hover:shadow-xl border border-gray-200'
                        }`}
                    >
                        <div className="relative z-10">
                            <div className={`text-5xl mb-4 transition-transform duration-300 group-hover:scale-110 ${
                                activeView === 'browse' ? '' : 'filter grayscale group-hover:grayscale-0'
                            }`}>
                                🔍
                            </div>
                            <h3 className="text-xl font-bold mb-2">Browse Library</h3>
                            <p className={`text-sm ${
                                activeView === 'browse' ? 'text-indigo-100' : 'text-gray-500'
                            }`}>
                                Search and borrow books from library
                            </p>
                            <div className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                activeView === 'browse' 
                                    ? 'bg-white/20 text-white' 
                                    : 'bg-indigo-100 text-indigo-800'
                            }`}>
                                {books.length} available
                            </div>
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
                </div>

                {/* Content Area */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    {/* My Borrowed Books Section */}
                    {activeView === 'myBooks' && (
                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold text-gray-800">
                                My Borrowed Books ({myBorrowedBooks.length})
                            </h2>
                            {myBorrowedBooks.length > 0 ? (
                                <ul className="space-y-4 mt-4">
                                    {myBorrowedBooks.map(book => (
                                        <MyBookCard
                                            key={book.id + (book.borrowInfo?.borrowId || '')}
                                            book={book}
                                            borrowInfo={book.borrowInfo}
                                            onReturn={onReturn}
                                        />
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">📚</div>
                                    <p className="text-gray-500 text-lg">You haven't borrowed any books yet</p>
                                    <button
                                        onClick={() => setActiveView('browse')}
                                        className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                    >
                                        Browse Library
                                    </button>
                                </div>
                            )}
                        </section>
                    )}

                    {/* Browse Library Section */}
                    {activeView === 'browse' && (
                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold text-gray-800">
                                Browse Library ({availableBooks.length} books)
                            </h2>

                            {/* Search and Filter Controls */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                {/* Search Input */}
                                <div className="md:col-span-6 relative">
                                    <span className="absolute left-3 top-3 text-gray-400">🔍</span>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search by title, author, or genre..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Filter Type */}
                                <div className="md:col-span-3">
                                    <select
                                        value={filterBy}
                                        onChange={(e) => handleFilterChange(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    >
                                        <option value="all">All Books</option>
                                        <option value="rack">By Rack</option>
                                        <option value="genre">By Genre</option>
                                        <option value="author">By Author</option>
                                        <option value="year">By Year</option>
                                    </select>
                                </div>

                                {/* Filter Value */}
                                {filterBy !== 'all' && (
                                    <div className="md:col-span-3">
                                        <select
                                            value={selectedFilter}
                                            onChange={(e) => setSelectedFilter(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        >
                                            <option value="">
                                                Select {filterBy === 'rack' ? 'Rack' : filterBy === 'genre' ? 'Genre' : filterBy === 'author' ? 'Author' : 'Year'}
                                            </option>
                                            {filterBy === 'rack' && filterOptions.racks.map(rack => (
                                                <option key={rack} value={rack}>{rack}</option>
                                            ))}
                                            {filterBy === 'genre' && filterOptions.genres.map(genre => (
                                                <option key={genre} value={genre}>{genre}</option>
                                            ))}
                                            {filterBy === 'author' && filterOptions.authors.map(author => (
                                                <option key={author} value={author}>{author}</option>
                                            ))}
                                            {filterBy === 'year' && filterOptions.years.map(year => (
                                                <option key={year} value={year}>{year}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Active Filters Display */}
                            {(searchTerm || (filterBy !== 'all' && selectedFilter)) && (
                                <div className="flex flex-wrap gap-2 items-center">
                                    <span className="text-sm text-gray-600">Active filters:</span>
                                    {searchTerm && (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                                            Search: "{searchTerm}"
                                            <button
                                                onClick={() => setSearchTerm('')}
                                                className="hover:text-indigo-900"
                                            >
                                                ✕
                                            </button>
                                        </span>
                                    )}
                                    {filterBy !== 'all' && selectedFilter && (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                                            {filterBy === 'rack' ? '📍' : filterBy === 'genre' ? '🎭' : filterBy === 'author' ? '✍️' : '📅'} {selectedFilter}
                                            <button
                                                onClick={() => {
                                                    setFilterBy('all');
                                                    setSelectedFilter('');
                                                }}
                                                className="hover:text-purple-900"
                                            >
                                                ✕
                                            </button>
                                        </span>
                                    )}
                                    <button
                                        onClick={() => {
                                            setSearchTerm('');
                                            setFilterBy('all');
                                            setSelectedFilter('');
                                        }}
                                        className="text-sm text-gray-500 hover:text-gray-700 underline"
                                    >
                                        Clear all
                                    </button>
                                </div>
                            )}

                            {/* Books List */}
                            <ul className="space-y-4 mt-4">
                                {availableBooks.length > 0 ? (
                                    availableBooks.map(book => (
                                        <BookCard
                                            key={book.id}
                                            book={book}
                                            userId={userId}
                                            onBorrow={onBorrow}
                                            hasBorrowed={borrowedBookIds.has(book.id)}
                                        />
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-center py-8">
                                        {searchTerm || selectedFilter
                                            ? `No books match your filters. Try adjusting your search.`
                                            : books.length === 0 
                                                ? "The library currently has no books."
                                                : "No books available."}
                                    </p>
                                )}
                            </ul>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReaderView;