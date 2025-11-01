import { addDoc, arrayUnion, collection, doc, getDoc, increment, Timestamp, updateDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { booksCollectionPath, borrowHistoryCollectionPath, db } from '../config/firebase';

/**
 * Handles borrowing a book and records it in history
 */
const handleBorrowWithHistory = async (bookId, userId, userEmail, bookTitle) => {
  console.log('🎯 handleBorrowWithHistory CALLED');
  console.log('📦 Input parameters:', { bookId, userId, userEmail, bookTitle });
  
  if (!bookId || !userId || !userEmail) {
    console.error('❌ Missing required information:', { bookId, userId, userEmail });
    return { success: false, error: 'Missing required information.' };
  }

  try {
    const bookRef = doc(db, booksCollectionPath, bookId);
    
    // If bookTitle not provided, fetch it from Firestore
    if (!bookTitle) {
      console.log('📚 Fetching book title from Firestore...');
      const bookSnap = await getDoc(bookRef);
      if (bookSnap.exists()) {
        bookTitle = bookSnap.data().title || 'Unknown Book';
        console.log('✅ Fetched book title:', bookTitle);
      } else {
        console.error('❌ Book not found:', bookId);
        return { success: false, error: 'Book not found.' };
      }
    }
    
    // Generate unique identifiers
    const borrowId = uuidv4();
    const serialNumber = `SN-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const issueDate = Timestamp.now();
    const dueDate = Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)); // 14 days

    console.log('🆔 Generated IDs:', { borrowId, serialNumber });

    // Create borrow record for the book document
    const borrowRecord = {
      userId,
      borrowId,
      serialNumber,
      issueDate,
      dueDate
    };

    console.log('📝 Updating book document...');
    
    // Update book document
    await updateDoc(bookRef, {
      borrowedCopies: arrayUnion(borrowRecord),
      availableQuantity: increment(-1)
    });

    console.log('✅ Book document updated');

    // Record in borrowHistory collection
    console.log('📝 Creating history record in collection:', borrowHistoryCollectionPath);
    
    const historyData = {
      bookId,
      bookTitle,
      userId,
      userEmail,
      borrowDate: issueDate,
      dueDate,
      returnDate: null,
      status: 'borrowed',
      serialNumber,
      borrowId
    };
    
    console.log('📦 History data:', historyData);
    
    const historyDocRef = await addDoc(collection(db, borrowHistoryCollectionPath), historyData);

    console.log('✅ History record created with ID:', historyDocRef.id);
    console.log('📚 Book title in history:', bookTitle);

    return { 
      success: true, 
      message: `Book "${bookTitle}" borrowed successfully!`,
      borrowId,
      historyId: historyDocRef.id
    };

  } catch (error) {
    console.error('❌ Error borrowing book:', error);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error message:', error.message);
    
    if (error.code === 'permission-denied') {
      return { success: false, error: 'Permission denied. Please check Firestore rules.' };
    }
    
    return { success: false, error: error.message || 'Failed to borrow book.' };
  }
};

export default handleBorrowWithHistory;