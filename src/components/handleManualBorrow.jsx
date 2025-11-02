import { addDoc, arrayUnion, collection, doc, getDoc, getDocs, increment, query, Timestamp, updateDoc, where } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { booksCollectionPath, borrowHistoryCollectionPath, db, reservationsCollectionPath } from '../config/firebase';
import { calculateDueDate } from '../utils/dateUtils';

/**
 * Manual borrow by Admin/Librarian - checks for reservations first
 * @param {string} bookId - The book to borrow
 * @param {string} userId - The user borrowing (selected by admin/librarian)
 * @param {string} userEmail - The user's email
 * @param {string} performedBy - The admin/librarian performing the action
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
const handleManualBorrow = async (bookId, userId, userEmail, performedBy) => {
  console.log('👨‍💼 handleManualBorrow CALLED by:', performedBy);
  console.log('📦 Parameters:', { bookId, userId, userEmail });

  if (!bookId || !userId || !userEmail || !performedBy) {
    return { success: false, error: 'Missing required information.' };
  }

  try {
    // 1. Fetch book details
    const bookRef = doc(db, booksCollectionPath, bookId);
    const bookSnap = await getDoc(bookRef);

    if (!bookSnap.exists()) {
      return { success: false, error: 'Book not found.' };
    }

    const bookData = bookSnap.data();
    const bookTitle = bookData.title || 'Unknown Book';
    const availableQuantity = bookData.availableQuantity || 0;

    // 2. Check if book is available
    if (availableQuantity <= 0) {
      return { success: false, error: 'No copies available.' };
    }

    // 3. Check if book is low stock and has active reservations
    if (availableQuantity < 10) {
      console.log('📌 Low stock book - checking for reservations...');
      
      const reservationsQuery = query(
        collection(db, reservationsCollectionPath),
        where('bookId', '==', bookId),
        where('status', '==', 'active')
      );

      const reservationsSnapshot = await getDocs(reservationsQuery);

      if (!reservationsSnapshot.empty) {
        // Check if any reservation belongs to the user we're borrowing for
        const userReservation = reservationsSnapshot.docs.find(
          doc => doc.data().userId === userId
        );

        if (userReservation) {
          console.log('✅ User has a reservation - proceeding with borrow');
          
          // Mark reservation as collected
          await updateDoc(doc(db, reservationsCollectionPath, userReservation.id), {
            status: 'collected',
            collectedAt: Timestamp.now(),
            collectedBy: performedBy
          });
        } else {
          // Book is reserved by someone else
          const firstReservation = reservationsSnapshot.docs[0].data();
          return {
            success: false,
            error: `This book is reserved by ${firstReservation.userEmail}. Please check with them first or cancel their reservation.`
          };
        }
      }
    }

    // 4. Check if user already borrowed this book
    const borrowedCopies = bookData.borrowedCopies || [];
    const userAlreadyBorrowed = borrowedCopies.some(copy => copy.userId === userId);
    
    if (userAlreadyBorrowed) {
      return { success: false, error: 'User has already borrowed this book.' };
    }

    // 5. Generate borrow details
    const borrowId = uuidv4();
    const serialNumber = `SN-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const issueDate = new Date();
    const dueDate = calculateDueDate(issueDate);

    console.log('📅 Borrow dates:', {
      issue: issueDate.toLocaleDateString(),
      due: dueDate.toLocaleDateString()
    });

    // 6. Create borrow record
    const borrowRecord = {
      userId,
      borrowId,
      serialNumber,
      issueDate: Timestamp.fromDate(issueDate),
      dueDate: Timestamp.fromDate(dueDate),
      issuedBy: performedBy // Track who issued the book
    };

    // 7. Update book document
    await updateDoc(bookRef, {
      borrowedCopies: arrayUnion(borrowRecord),
      availableQuantity: increment(-1)
    });

    console.log('✅ Book document updated');

    // 8. Create history record
    const historyData = {
      bookId,
      bookTitle,
      userId,
      userEmail,
      borrowDate: Timestamp.fromDate(issueDate),
      dueDate: Timestamp.fromDate(dueDate),
      returnDate: null,
      status: 'borrowed',
      serialNumber,
      borrowId,
      issuedBy: performedBy
    };

    const historyDocRef = await addDoc(
      collection(db, borrowHistoryCollectionPath),
      historyData
    );

    console.log('✅ History record created:', historyDocRef.id);

    return {
      success: true,
      message: `Book "${bookTitle}" issued to ${userEmail} successfully! Due date: ${dueDate.toLocaleDateString()}`,
      borrowId,
      serialNumber,
      dueDate: dueDate.toLocaleDateString()
    };

  } catch (error) {
    console.error('❌ Error in manual borrow:', error);
    return { success: false, error: error.message || 'Failed to issue book.' };
  }
};

export default handleManualBorrow;