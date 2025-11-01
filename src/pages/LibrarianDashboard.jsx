import { useState } from 'react';
import BookManagement from '../components/BookManagement';
import BorrowedBooksView from '../pages/BorrowedBooksView';

const LibrarianDashboard = ({ books = [], userId, userRole, onAddBook, onDelete, onUpdate, isSubmitting }) => {
    const [activeView, setActiveView] = useState('manageBooks');

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
            <div className="container mx-auto px-4 max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">Librarian Dashboard</h1>
                    <p className="text-gray-600">Manage your library collection</p>
                </div>

                {/* Navigation Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Book Collection */}
                    <button
                        onClick={() => setActiveView('manageBooks')}
                        className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${
                            activeView === 'manageBooks'
                                ? 'bg-gradient-to-br from-green-500 to-green-700 text-white shadow-xl'
                                : 'bg-white text-gray-700 shadow-md hover:shadow-xl border border-gray-200'
                        }`}
                    >
                        <div className="relative z-10">
                            <div className={`text-5xl mb-4 transition-transform duration-300 group-hover:scale-110 ${
                                activeView === 'manageBooks' ? '' : 'filter grayscale group-hover:grayscale-0'
                            }`}>
                                📚
                            </div>
                            <h3 className="text-xl font-bold mb-2">Book Collection</h3>
                            <p className={`text-sm ${
                                activeView === 'manageBooks' ? 'text-green-100' : 'text-gray-500'
                            }`}>
                                Add, edit, and organize books
                            </p>
                        </div>
                        {activeView === 'manageBooks' && (
                            <div className="absolute top-4 right-4">
                                <span className="flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                                </span>
                            </div>
                        )}
                    </button>

                    {/* Borrowed Books */}
                    <button
                        onClick={() => setActiveView('borrowedBooks')}
                        className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${
                            activeView === 'borrowedBooks'
                                ? 'bg-gradient-to-br from-cyan-500 to-cyan-700 text-white shadow-xl'
                                : 'bg-white text-gray-700 shadow-md hover:shadow-xl border border-gray-200'
                        }`}
                    >
                        <div className="relative z-10">
                            <div className={`text-5xl mb-4 transition-transform duration-300 group-hover:scale-110 ${
                                activeView === 'borrowedBooks' ? '' : 'filter grayscale group-hover:grayscale-0'
                            }`}>
                                📋
                            </div>
                            <h3 className="text-xl font-bold mb-2">Borrowed Books</h3>
                            <p className={`text-sm ${
                                activeView === 'borrowedBooks' ? 'text-cyan-100' : 'text-gray-500'
                            }`}>
                                Track all borrowed books and returns
                            </p>
                        </div>
                        {activeView === 'borrowedBooks' && (
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
                    {activeView === 'manageBooks' && (
                        <BookManagement
                            books={books}
                            userId={userId}
                            userRole={userRole}
                            onAddBook={onAddBook}
                            onDelete={onDelete}
                            onUpdate={onUpdate}
                            isSubmitting={isSubmitting}
                        />
                    )}

                    {activeView === 'borrowedBooks' && (
                        <BorrowedBooksView userRole={userRole} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default LibrarianDashboard;