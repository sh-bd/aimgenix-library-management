import React, { useState, useMemo } from 'react';
import AddBookForm from '../components/AddBook';
import LibrarianBookItem from './LibrarianBookItem';

const LibrarianDashboard = ({ books = [], onAddBook, onDelete, onUpdate, isSubmitting }) => {
    const [searchQuery, setSearchQuery] = useState('');

    // Filter and sort books safely
    const filteredBooks = useMemo(() => {
        if (!Array.isArray(books)) return [];
        const lowerQuery = searchQuery.toLowerCase();
        return [...books]
            .filter(book =>
                (book.title || '').toLowerCase().includes(lowerQuery) ||
                (book.author || '').toLowerCase().includes(lowerQuery) ||
                (book.genre || '').toLowerCase().includes(lowerQuery)
            )
            .sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }, [books, searchQuery]);

    return (
        <div className="space-y-8">
            {/* Add Book Form */}
            <section>
                <AddBookForm onAddBook={onAddBook} isLoading={isSubmitting} />
            </section>

            {/* Manage Collection Section */}
            <section className="bg-white/50 backdrop-blur-sm rounded-lg shadow-inner p-4 sm:p-6 space-y-4">
                <h2 className="text-2xl font-semibold text-gray-800">
                    Manage Collection ({filteredBooks.length} books)
                </h2>

                {/* Search Box */}
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by title, author, or genre..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />

                <ul className="space-y-4 mt-4">
                    {filteredBooks.length > 0 ? (
                        filteredBooks.map(book => (
                            <LibrarianBookItem
                                key={book.id}
                                book={book}
                                onDelete={onDelete}
                                onUpdate={onUpdate}
                                searchQuery={searchQuery}  // <-- pass the current search input
                            />
                        ))
                    ) : (
                        <p className="text-gray-500 text-center py-4">
                            No books match your search. Try another keyword.
                        </p>
                    )}
                </ul>

            </section>
        </div>
    );
};

export default LibrarianDashboard;
