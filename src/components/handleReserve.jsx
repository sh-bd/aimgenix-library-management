import { addDoc, collection, doc, getDoc, Timestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { booksCollectionPath, db, reservationsCollectionPath } from '../config/firebase';

/**
 * Handles reserving a low-stock book
 * @param {string} bookId - The ID of the book to reserve
 * @param {string} userId - The ID of the user reserving
 * @param {string} userEmail - The email of the user reserving
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
const handleReserve = async (bookId, userId, userEmail) => {
  console.log('📌 handleReserve CALLED:', { bookId, userId, userEmail });

  if (!bookId || !userId || !userEmail) {
    return { success: false, error: 'Missing required information.' };
  }

  try {
    // Fetch book details
    const bookRef = doc(db, booksCollectionPath, bookId);
    const bookSnap = await getDoc(bookRef);

    if (!bookSnap.exists()) {
      return { success: false, error: 'Book not found.' };
    }

    const bookData = bookSnap.data();
    const bookTitle = bookData.title || 'Unknown Book';
    const availableQuantity = bookData.availableQuantity || 0;

    // Check if book is actually low stock (< 10 copies)
    if (availableQuantity >= 10) {
      return { 
        success: false, 
        error: 'This book is not low in stock. You can borrow it directly from the library.' 
      };
    }

    // Check if book is out of stock
    if (availableQuantity === 0) {
      return { 
        success: false, 
        error: 'This book is currently out of stock. Please try again later.' 
      };
    }

    // Generate reservation details
    const reservationId = uuidv4();
    const reservationDate = new Date();
    
    // Calculate deadline (3 days excluding Friday and Saturday)
    const deadline = calculateReservationDeadline(reservationDate);

    console.log('📅 Reservation dates:', {
      reservationDate: reservationDate.toLocaleDateString(),
      deadline: deadline.toLocaleDateString()
    });

    // Create reservation record
    const reservationData = {
      reservationId,
      bookId,
      bookTitle,
      userId,
      userEmail,
      reservationDate: Timestamp.fromDate(reservationDate),
      deadline: Timestamp.fromDate(deadline),
      status: 'active', // active, expired, collected, cancelled
      createdAt: Timestamp.now()
    };

    // Add to reservations collection
    const reservationDocRef = await addDoc(
      collection(db, reservationsCollectionPath),
      reservationData
    );

    console.log('✅ Reservation created:', reservationDocRef.id);

    return {
      success: true,
      message: `Book "${bookTitle}" reserved successfully! Please collect it by ${deadline.toLocaleDateString()}. Late collection will incur a fine of ৳5 per day.`,
      reservationId,
      deadline: deadline.toLocaleDateString()
    };

  } catch (error) {
    console.error('❌ Error reserving book:', error);
    return { success: false, error: error.message || 'Failed to reserve book.' };
  }
};

/**
 * Calculate reservation deadline (3 business days, excluding Friday & Saturday)
 * @param {Date} startDate - The reservation date
 * @returns {Date} - The deadline date
 */
const calculateReservationDeadline = (startDate) => {
  let deadline = new Date(startDate);
  let businessDaysAdded = 0;

  while (businessDaysAdded < 3) {
    deadline.setDate(deadline.getDate() + 1);
    const dayOfWeek = deadline.getDay();
    
    // Skip Friday (5) and Saturday (6)
    if (dayOfWeek !== 5 && dayOfWeek !== 6) {
      businessDaysAdded++;
    }
  }

  deadline.setHours(23, 59, 59, 999); // End of day
  return deadline;
};

export default handleReserve;