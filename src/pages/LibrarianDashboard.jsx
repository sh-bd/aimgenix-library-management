import { useState } from 'react';
import BookManagement from '../components/BookManagement';
import LibrarianUserManagement from '../components/LibrarianUserManagement';
import LibraryAnalytics from '../components/LibraryAnalytics';
import ManualBorrowView from '../components/ManualBorrowView';
import ReservationsView from '../components/ReservationsView';
import BorrowedBooksView from '../pages/BorrowedBooksView';

const LibrarianDashboard = ({ books = [], userId, userRole, onAddBook, onDelete, onUpdate, isSubmitting, onAddUser, allUsers }) => {
    const [activeView, setActiveView] = useState('analytics');

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
            <div className="container mx-auto px-4 max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">Librarian Dashboard</h1>
                    <p className="text-gray-600">Manage your library collection and users</p>
                </div>

                {/* Navigation Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                    {/* Analytics */}
                    <button
                        onClick={() => setActiveView('analytics')}
                        className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${
                            activeView === 'analytics'
                                ? 'bg-gradient-to-br from-orange-500 to-orange-700 text-white shadow-xl'
                                : 'bg-white text-gray-700 shadow-md hover:shadow-xl border border-gray-200'
                        }`}
                    >
                        <div className="relative z-10">
                            <div className={`text-5xl mb-4 transition-transform duration-300 group-hover:scale-110 ${
                                activeView === 'analytics' ? '' : 'filter grayscale group-hover:grayscale-0'
                            }`}>
                                📊
                            </div>
                            <h3 className="text-xl font-bold mb-2">Analytics</h3>
                            <p className={`text-sm ${
                                activeView === 'analytics' ? 'text-orange-100' : 'text-gray-500'
                            }`}>
                                Statistics
                            </p>
                        </div>
                        {activeView === 'analytics' && (
                            <div className="absolute top-4 right-4">
                                <span className="flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                                </span>
                            </div>
                        )}
                    </button>

                    {/* Book Collection */}
                    <button
                        onClick={() => setActiveView('manageBooks')}
                        className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${
                            activeView === 'manageBooks'
                                ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-xl'
                                : 'bg-white text-gray-700 shadow-md hover:shadow-xl border border-gray-200'
                        }`}
                    >
                        <div className="relative z-10">
                            <div className={`text-5xl mb-4 transition-transform duration-300 group-hover:scale-110 ${
                                activeView === 'manageBooks' ? '' : 'filter grayscale group-hover:grayscale-0'
                            }`}>
                                📚
                            </div>
                            <h3 className="text-xl font-bold mb-2">Books</h3>
                            <p className={`text-sm ${
                                activeView === 'manageBooks' ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                                Manage
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

                    {/* Issue Books - NEW */}
                    <button
                        onClick={() => setActiveView('issueBooks')}
                        className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${
                            activeView === 'issueBooks'
                                ? 'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-xl'
                                : 'bg-white text-gray-700 shadow-md hover:shadow-xl border border-gray-200'
                        }`}
                    >
                        <div className="relative z-10">
                            <div className={`text-5xl mb-4 transition-transform duration-300 group-hover:scale-110 ${
                                activeView === 'issueBooks' ? '' : 'filter grayscale group-hover:grayscale-0'
                            }`}>
                                📤
                            </div>
                            <h3 className="text-xl font-bold mb-2">Issue</h3>
                            <p className={`text-sm ${
                                activeView === 'issueBooks' ? 'text-indigo-100' : 'text-gray-500'
                            }`}>
                                To Users
                            </p>
                        </div>
                        {activeView === 'issueBooks' && (
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
                                ? 'bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-xl'
                                : 'bg-white text-gray-700 shadow-md hover:shadow-xl border border-gray-200'
                        }`}
                    >
                        <div className="relative z-10">
                            <div className={`text-5xl mb-4 transition-transform duration-300 group-hover:scale-110 ${
                                activeView === 'borrowedBooks' ? '' : 'filter grayscale group-hover:grayscale-0'
                            }`}>
                                📖
                            </div>
                            <h3 className="text-xl font-bold mb-2">Borrowed</h3>
                            <p className={`text-sm ${
                                activeView === 'borrowedBooks' ? 'text-purple-100' : 'text-gray-500'
                            }`}>
                                Active
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

                    {/* Reservations - NEW */}
                    <button
                        onClick={() => setActiveView('reservations')}
                        className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${
                            activeView === 'reservations'
                                ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-xl'
                                : 'bg-white text-gray-700 shadow-md hover:shadow-xl border border-gray-200'
                        }`}
                    >
                        <div className="relative z-10">
                            <div className={`text-5xl mb-4 transition-transform duration-300 group-hover:scale-110 ${
                                activeView === 'reservations' ? '' : 'filter grayscale group-hover:grayscale-0'
                            }`}>
                                📌
                            </div>
                            <h3 className="text-xl font-bold mb-2">Reserved</h3>
                            <p className={`text-sm ${
                                activeView === 'reservations' ? 'text-amber-100' : 'text-gray-500'
                            }`}>
                                Bookings
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

                    {/* User Management */}
                    <button
                        onClick={() => setActiveView('manageUsers')}
                        className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${
                            activeView === 'manageUsers'
                                ? 'bg-gradient-to-br from-green-500 to-green-700 text-white shadow-xl'
                                : 'bg-white text-gray-700 shadow-md hover:shadow-xl border border-gray-200'
                        }`}
                    >
                        <div className="relative z-10">
                            <div className={`text-5xl mb-4 transition-transform duration-300 group-hover:scale-110 ${
                                activeView === 'manageUsers' ? '' : 'filter grayscale group-hover:grayscale-0'
                            }`}>
                                👥
                            </div>
                            <h3 className="text-xl font-bold mb-2">Users</h3>
                            <p className={`text-sm ${
                                activeView === 'manageUsers' ? 'text-green-100' : 'text-gray-500'
                            }`}>
                                Manage
                            </p>
                        </div>
                        {activeView === 'manageUsers' && (
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
                    {activeView === 'analytics' && (
                        <LibraryAnalytics books={books} />
                    )}

                    {activeView === 'manageBooks' && (
                        <BookManagement
                            books={books}
                            onAddBook={onAddBook}
                            onDelete={onDelete}
                            onUpdate={onUpdate}
                            isSubmitting={isSubmitting}
                            userRole={userRole}
                        />
                    )}

                    {activeView === 'issueBooks' && (
                        <ManualBorrowView
                            books={books}
                            allUsers={allUsers}
                            performedBy={userId}
                        />
                    )}

                    {activeView === 'borrowedBooks' && (
                        <BorrowedBooksView
                            books={books}
                            userId={userId}
                            userRole={userRole}
                        />
                    )}

                    {activeView === 'reservations' && (
                        <ReservationsView userId={userId} userRole={userRole} />
                    )}

                    {activeView === 'manageUsers' && (
                        <LibrarianUserManagement onAddUser={onAddUser} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default LibrarianDashboard;