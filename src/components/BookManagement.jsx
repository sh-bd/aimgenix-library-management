import { useMemo, useState } from 'react';
import AddBookForm from '../components/AddBook';
import LibrarianBookItem from '../pages/LibrarianBookItem';

const BookManagement = ({ books = [], userId, userRole, onAddBook, onDelete, onUpdate, isSubmitting }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('addBook');

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
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex gap-4 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('addBook')}
                    className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
                        activeTab === 'addBook'
                            ? 'border-green-600 text-green-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    ➕ Add Book
                </button>
                <button
                    onClick={() => setActiveTab('manageBooks')}
                    className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
                        activeTab === 'manageBooks'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    📖 Manage Collection
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'addBook' && (
                <section>
                    <AddBookForm 
                        onAddBook={onAddBook} 
                        userId={userId}
                        userRole={userRole}
                        isLoading={isSubmitting} 
                    />
                </section>
            )}

            {activeTab === 'manageBooks' && (
                <section className="space-y-4">
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
                                    userId={userId}
                                    userRole={userRole}
                                    onDelete={onDelete}
                                    onUpdate={onUpdate}
                                    searchQuery={searchQuery}
                                />
                            ))
                        ) : (
                            <p className="text-gray-500 text-center py-4">
                                {searchQuery 
                                    ? "No books match your search. Try another keyword."
                                    : "No books in the library yet. Add your first book above!"}
                            </p>
                        )}
                    </ul>
                </section>
            )}
        </div>
    );
};

export default BookManagement;