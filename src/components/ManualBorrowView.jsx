import { useState } from 'react';
import handleManualBorrow from './handleManualBorrow';

const ManualBorrowView = ({ books, allUsers, performedBy }) => {
    // Add this to check data
    console.log('All Users:', allUsers);
    console.log('Reader Users:', allUsers.filter(user => user.role === 'reader'));

    const [selectedBook, setSelectedBook] = useState('');
    const [selectedUser, setSelectedUser] = useState('');
    const [searchBook, setSearchBook] = useState('');
    const [searchUser, setSearchUser] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const availableBooks = books.filter(book => book.availableQuantity > 0);

    const filteredBooks = availableBooks.filter(book =>
        book.title?.toLowerCase().includes(searchBook.toLowerCase()) ||
        book.author?.toLowerCase().includes(searchBook.toLowerCase())
    );

    // Filter users - show all readers by default
    const readerUsers = allUsers.filter(user => user.role === 'reader');
    const filteredUsers = readerUsers.filter(user =>
        user.email?.toLowerCase().includes(searchUser.toLowerCase()) ||
        user.name?.toLowerCase().includes(searchUser.toLowerCase())
    );

    const handleIssueBook = async () => {
        if (!selectedBook || !selectedUser) {
            setMessage({ type: 'error', text: 'Please select both a book and a user.' });
            return;
        }

        const book = books.find(b => b.id === selectedBook);
        const user = allUsers.find(u => u.id === selectedUser);

        if (!book || !user) {
            setMessage({ type: 'error', text: 'Invalid selection.' });
            return;
        }

        // Check if user already borrowed this book
        const alreadyBorrowed = book.borrowedCopies?.some(copy => copy.userId === user.id);
        if (alreadyBorrowed) {
            setMessage({ type: 'error', text: `${user.email} has already borrowed "${book.title}".` });
            return;
        }

        setIsSubmitting(true);
        setMessage({ type: '', text: '' });

        const result = await handleManualBorrow(
            selectedBook,
            user.id,
            user.email,
            performedBy
        );

        setIsSubmitting(false);

        if (result.success) {
            setMessage({ type: 'success', text: result.message });
            setSelectedBook('');
            setSelectedUser('');
            setSearchBook('');
            setSearchUser('');
        } else {
            setMessage({ type: 'error', text: result.error });
        }
    };

    const selectedBookData = books.find(b => b.id === selectedBook);
    const isLowStock = selectedBookData && selectedBookData.availableQuantity < 10;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Issue Books to Users</h2>
                <p className="text-gray-600">
                    Manually assign books to registered readers. System will check for reservations on low-stock books.
                </p>
            </div>

            {/* Message Display */}
            {message.text && (
                <div className={`p-4 rounded-lg ${message.type === 'success'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Select Book */}
                <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                        1. Select Book
                        <span className="ml-2 text-sm font-normal text-gray-500">
                            ({filteredBooks.length} available)
                        </span>
                    </h3>

                    <input
                        type="text"
                        placeholder="🔍 Search by title or author..."
                        value={searchBook}
                        onChange={(e) => setSearchBook(e.target.value)}
                        className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />

                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                        {filteredBooks.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">📚</div>
                                <p className="text-gray-500">No available books found</p>
                            </div>
                        ) : (
                            filteredBooks.map(book => (
                                <button
                                    key={book.id}
                                    onClick={() => setSelectedBook(book.id)}
                                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${selectedBook === book.id
                                            ? 'border-blue-500 bg-blue-50 shadow-md'
                                            : 'border-gray-200 hover:border-blue-300 bg-white hover:shadow-sm'
                                        }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900">{book.title}</h4>
                                            <p className="text-sm text-gray-600">{book.author}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Rack: {book.rack} | Genre: {book.genre}
                                            </p>
                                        </div>
                                        <div className="text-right ml-3">
                                            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${book.availableQuantity < 10
                                                    ? 'bg-orange-100 text-orange-800'
                                                    : 'bg-green-100 text-green-800'
                                                }`}>
                                                {book.availableQuantity} available
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Select User */}
                <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                        2. Select Reader
                        <span className="ml-2 text-sm font-normal text-gray-500">
                            ({filteredUsers.length} readers)
                        </span>
                    </h3>

                    <input
                        type="text"
                        placeholder="🔍 Search by name or email..."
                        value={searchUser}
                        onChange={(e) => setSearchUser(e.target.value)}
                        className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />

                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                        {filteredUsers.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">👥</div>
                                <p className="text-gray-500">No readers found</p>
                            </div>
                        ) : (
                            filteredUsers.map(user => (
                                <button
                                    key={user.id}
                                    onClick={() => setSelectedUser(user.id)}
                                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${selectedUser === user.id
                                            ? 'border-blue-500 bg-blue-50 shadow-md'
                                            : 'border-gray-200 hover:border-blue-300 bg-white hover:shadow-sm'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                            {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-gray-900 truncate">
                                                {user.name || 'No name'}
                                            </h4>
                                            <p className="text-sm text-gray-600 truncate">{user.email}</p>
                                            <p className="text-xs text-gray-500 font-mono">ID: {user.id}</p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
                                                👤 Reader
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Low Stock Warning */}
            {isLowStock && selectedBook && (
                <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <svg className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <p className="font-semibold text-orange-800 mb-1">⚠️ Low Stock Alert</p>
                            <p className="text-sm text-orange-700">
                                This book has less than 10 copies available. The system will check for active reservations before issuing.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Selected Summary */}
            {(selectedBook || selectedUser) && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">📋 Selected Items:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedBook && (
                            <div className="flex items-start gap-2">
                                <span className="text-blue-600">📚</span>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-blue-900">Book:</p>
                                    <p className="text-sm text-blue-700">{selectedBookData?.title}</p>
                                </div>
                            </div>
                        )}
                        {selectedUser && (
                            <div className="flex items-start gap-2">
                                <span className="text-blue-600">👤</span>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-blue-900">Reader:</p>
                                    <p className="text-sm text-blue-700">
                                        {allUsers.find(u => u.id === selectedUser)?.email}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Issue Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleIssueBook}
                    disabled={!selectedBook || !selectedUser || isSubmitting}
                    className={`px-8 py-3 rounded-lg font-semibold text-white transition-all flex items-center gap-2 ${!selectedBook || !selectedUser || isSubmitting
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 transform hover:scale-105 shadow-lg hover:shadow-xl'
                        }`}
                >
                    {isSubmitting ? (
                        <>
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Issuing Book...
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                            Issue Book to Reader
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default ManualBorrowView;