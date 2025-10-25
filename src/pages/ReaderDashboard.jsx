import React, { useState } from 'react';
import BookCard from '../components/readers/BookCard';
import MyBookCard from '../components/readers/MyBookCard';

const ReaderView = ({ books, userId, onBorrow, onReturn }) => {
    const [searchTerm, setSearchTerm] = useState("");

    // Memoize calculations to avoid re-running on every render
    const { myBorrowedBooks, borrowedBookIds } = React.useMemo(() => {
        if (!userId) return { myBorrowedBooks: [], borrowedBookIds: new Set() }; // Guard clause

        const borrowed = books
            .map(book => {
                // Find the specific copy this user borrowed
                const borrowInfo = book.borrowedCopies?.find(c => c.userId === userId);
                if (!borrowInfo) return null; // Skip if not borrowed by this user

                // Use the pre-processed Date object for dueDate
                const dueDate = borrowInfo.dueDate;

                if (!(dueDate instanceof Date && !isNaN(dueDate))) {
                    console.warn("Skipping borrowed book due to invalid due date:", book.id, borrowInfo);
                    return null; // Skip if due date is invalid
                }

                return {
                    ...book,
                    borrowInfo: {
                        ...borrowInfo,
                        dueDate: dueDate
                    }
                };
            })
            .filter(book => book !== null) // Filter out nulls
            .sort((a, b) => a.borrowInfo.dueDate.getTime() - b.borrowInfo.dueDate.getTime()); // Sort by soonest due date

        const ids = new Set(borrowed.map(b => b.id));
        return { myBorrowedBooks: borrowed, borrowedBookIds: ids };
    }, [books, userId]);

    // Filter available books for search (memoized)
    const availableBooks = React.useMemo(() => {
        if (!searchTerm) return books; // Return all books if no search term
        const lowerSearchTerm = searchTerm.toLowerCase();
        return books.filter(book =>
            (book.title?.toLowerCase() || '').includes(lowerSearchTerm) ||
            (book.author?.toLowerCase() || '').includes(lowerSearchTerm) ||
            (book.genre?.toLowerCase() || '').includes(lowerSearchTerm)
        );
    }, [books, searchTerm]);

    return (
        <div className="space-y-8">
            {/* My Borrowed Books Section */}
            {myBorrowedBooks.length > 0 && (
                <section className="bg-white/50 backdrop-blur-sm rounded-lg shadow-inner p-4 sm:p-6">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6">My Borrowed Books ({myBorrowedBooks.length})</h2>
                    <ul className="space-y-4">
                        {myBorrowedBooks.map(book => (
                            <MyBookCard
                                key={book.id + (book.borrowInfo?.borrowId || '')} // More unique key
                                book={book}
                                borrowInfo={book.borrowInfo}
                                onReturn={onReturn}
                            />
                        ))}
                    </ul>
                </section>
            )}

            {/* Search and Browse Section */}
            <section className="bg-white/50 backdrop-blur-sm rounded-lg shadow-inner p-4 sm:p-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Find a Book</h2>
                <input
                    type="text"
                    placeholder="Search by title, author, or genre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm mb-6 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableBooks.length > 0 ? availableBooks.map(book => (
                        <BookCard
                            key={book.id}
                            book={book}
                            userId={userId} // Pass userId here
                            onBorrow={onBorrow}
                            hasBorrowed={borrowedBookIds.has(book.id)}
                        />
                    )) : (
                        <p className="text-gray-500 md:col-span-2 text-center py-4">No books available.</p>
                    )}
                </ul>
                {availableBooks.length === 0 && books.length > 0 && searchTerm && (
                    <p className="text-gray-500 md:col-span-2 text-center py-4">No books found matching "{searchTerm}".</p>
                )}
                {books.length === 0 && !searchTerm && (
                    <p className="text-gray-500 md:col-span-2 text-center py-4">The library currently has no books.</p>
                )}
            </section>
        </div>
    );
};

export default ReaderView;