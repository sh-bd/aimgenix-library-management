import { Timestamp, addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db, reservationsCollectionPath } from '../../config/firebase';

const BookCard = ({ book, userId, hasBorrowed }) => {
    const [isReserving, setIsReserving] = useState(false);
    const [hasReserved, setHasReserved] = useState(false);
    const [checkingReservation, setCheckingReservation] = useState(true);

    const availableCopies = book.availableQuantity || 0;
    const totalCopies = book.totalQuantity || 0;
    const isLowStock = totalCopies < 10;
    const canReserve = isLowStock && availableCopies > 0 && !hasBorrowed && !hasReserved;

    // Check if user already has an active reservation for this book
    useEffect(() => {
        const checkExistingReservation = async () => {
            if (!userId || !book.id) {
                setCheckingReservation(false);
                return;
            }

            try {
                console.log('🔍 Checking existing reservation for:', { bookId: book.id, userId });
                
                const reservationsRef = collection(db, reservationsCollectionPath);
                const q = query(
                    reservationsRef,
                    where('bookId', '==', book.id),
                    where('userId', '==', userId),
                    where('status', '==', 'pending')
                );

                const snapshot = await getDocs(q);
                const hasActiveReservation = !snapshot.empty;
                
                console.log('✅ Reservation check result:', { hasActiveReservation, count: snapshot.size });
                setHasReserved(hasActiveReservation);
            } catch (error) {
                console.error('❌ Error checking reservation:', error);
            } finally {
                setCheckingReservation(false);
            }
        };

        checkExistingReservation();
    }, [book.id, userId]);

    const handleReserve = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('🎯 Reserve button clicked!', {
            isReserving,
            canReserve,
            bookId: book.id,
            userId,
            availableCopies,
            isLowStock,
            hasBorrowed,
            hasReserved
        });

        if (isReserving || !canReserve) {
            console.log('⚠️ Cannot reserve:', { isReserving, canReserve });
            return;
        }

        setIsReserving(true);
        try {
            console.log('📝 Creating reservation...');
            
            const reservationData = {
                bookId: book.id,
                bookTitle: book.title,
                bookAuthor: book.author || 'Unknown Author',
                bookImage: book.thumbnailUrl || '',
                userId: userId,
                status: 'pending',
                reservationDate: Timestamp.now(),
                expiryDate: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)),
                createdAt: Timestamp.now()
            };

            console.log('📤 Sending reservation data:', reservationData);
            const docRef = await addDoc(collection(db, reservationsCollectionPath), reservationData);
            
            console.log('✅ Reservation created successfully!', docRef.id);
            setHasReserved(true);
            alert('✅ Book reserved successfully! Please collect within 24 hours.');
        } catch (error) {
            console.error('❌ Error reserving book:', error);
            console.error('Error details:', {
                code: error.code,
                message: error.message,
                stack: error.stack
            });
            alert('❌ Failed to reserve book. Please try again.');
        } finally {
            setIsReserving(false);
        }
    };

    return (
        <li className="group bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col h-full">
            {/* Image Container - Fixed aspect ratio */}
            <Link to={`/book/${book.id}`} className="block relative">
                <div className="relative h-56 sm:h-64 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    {book.thumbnailUrl ? (
                        <img
                            src={book.thumbnailUrl}
                            alt={book.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                    )}
                    
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                        <span className="text-white font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm sm:text-base px-4 py-2 bg-black bg-opacity-50 rounded-lg">
                            View Details
                        </span>
                    </div>

                    {/* Stock Badge - Top Right */}
                    <div className="absolute top-3 right-3 z-10">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold shadow-lg ${
                            availableCopies === 0 
                                ? 'bg-red-500 text-white' 
                                : availableCopies < 5 
                                ? 'bg-orange-500 text-white' 
                                : 'bg-green-500 text-white'
                        }`}>
                            {availableCopies === 0 ? 'Out of Stock' : `${availableCopies} Available`}
                        </span>
                    </div>

                    {/* Low Stock Badge - Top Left */}
                    {isLowStock && availableCopies > 0 && (
                        <div className="absolute top-3 left-3 z-10">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-400 text-gray-900 shadow-lg animate-pulse">
                                ⚡ Low Stock
                            </span>
                        </div>
                    )}

                    {/* Already Borrowed Badge */}
                    {hasBorrowed && (
                        <div className="absolute bottom-3 left-3 right-3 z-10">
                            <span className="inline-flex items-center justify-center w-full px-3 py-2 rounded-lg text-xs font-bold bg-blue-500 text-white shadow-lg">
                                ✓ Already Borrowed
                            </span>
                        </div>
                    )}

                    {/* Reserved Badge */}
                    {hasReserved && !hasBorrowed && (
                        <div className="absolute bottom-3 left-3 right-3 z-10">
                            <span className="inline-flex items-center justify-center w-full px-3 py-2 rounded-lg text-xs font-bold bg-orange-500 text-white shadow-lg">
                                📌 Reserved (24h)
                            </span>
                        </div>
                    )}
                </div>
            </Link>

            {/* Content Container */}
            <div className="p-4 sm:p-5 flex flex-col flex-grow">
                {/* Book Title - Clickable */}
                <Link to={`/book/${book.id}`} className="block mb-3 group/title">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 line-clamp-2 group-hover/title:text-blue-600 transition-colors">
                        {book.title}
                    </h3>
                </Link>

                {/* Book Details */}
                <div className="space-y-1.5 mb-4 flex-grow text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="truncate">{book.author || 'Unknown Author'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span className="truncate">{book.genre || 'N/A'}</span>
                    </div>

                    {book.rack && (
                        <div className="flex items-center gap-2 text-gray-600">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            <span className="truncate">Rack: {book.rack}</span>
                        </div>
                    )}
                </div>

                {/* Action Section - Always at bottom */}
                <div className="mt-auto pt-4 border-t border-gray-100 space-y-2">
                    {hasBorrowed ? (
                        // Already Borrowed State
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
                            <div className="flex items-center justify-center gap-2 text-blue-700">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="font-semibold text-sm">You've Borrowed This</span>
                            </div>
                            <p className="text-xs text-blue-600 text-center mt-1">
                                Return to library when done
                            </p>
                        </div>
                    ) : availableCopies === 0 ? (
                        // Out of Stock State
                        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3">
                            <div className="flex items-center justify-center gap-2 text-red-700">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span className="font-semibold text-sm">Currently Unavailable</span>
                            </div>
                        </div>
                    ) : hasReserved ? (
                        // Already Reserved State
                        <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-3">
                            <div className="flex items-center justify-center gap-2 text-orange-700">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="font-semibold text-sm">Reserved for 24 Hours</span>
                            </div>
                            <p className="text-xs text-orange-600 text-center mt-1">
                                Please collect from library soon
                            </p>
                        </div>
                    ) : (
                        // Available State
                        <>
                            {canReserve && (
                                <button
                                    onClick={handleReserve}
                                    disabled={isReserving || checkingReservation}
                                    className="w-full py-2.5 px-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {isReserving ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Reserving...
                                        </span>
                                    ) : checkingReservation ? (
                                        'Checking...'
                                    ) : (
                                        '📌 Reserve Now (24h)'
                                    )}
                                </button>
                            )}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <div className="flex items-start gap-2">
                                    <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-xs text-blue-700 leading-relaxed">
                                        Visit the library to borrow this book
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </li>
    );
};

export default BookCard;