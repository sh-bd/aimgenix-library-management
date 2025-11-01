import { arrayRemove, collection, doc, getDoc, getDocs, increment, query, Timestamp, updateDoc, where } from 'firebase/firestore';
import { booksCollectionPath, borrowHistoryCollectionPath, db } from '../config/firebase';

/**
 * Handles returning a book and updates history
 */
const handleReturnWithHistory = async (bookId, borrowRecord) => {
  const { userId, borrowId, issueDate, dueDate } = borrowRecord;
  
  console.log('🔍 Processing return for borrowId:', borrowId);
  console.log('📦 Full borrow record:', borrowRecord);
  
  if (!bookId || !userId || !borrowId) {
    console.error('❌ Missing required information:', { bookId, userId, borrowId });
    return { success: false, error: 'Missing required information.' };
  }

  try {
    const bookRef = doc(db, booksCollectionPath, bookId);
    
    console.log('📝 Fetching book document to get serialNumber...');
    
    // ✅ Fetch the book document to find the matching borrow record with serialNumber
    const bookSnap = await getDoc(bookRef);
    
    if (!bookSnap.exists()) {
      console.error('❌ Book not found:', bookId);
      return { success: false, error: 'Book not found.' };
    }
    
    const bookData = bookSnap.data();
    const borrowedCopies = bookData.borrowedCopies || [];
    
    // ✅ Find the exact borrow record that matches borrowId
    const matchingRecord = borrowedCopies.find(
      record => record.borrowId === borrowId && record.userId === userId
    );
    
    if (!matchingRecord) {
      console.error('❌ No matching borrow record found in book document');
      return { success: false, error: 'Borrow record not found in book document.' };
    }
    
    console.log('✅ Found matching record with serialNumber:', matchingRecord);
    
    // ✅ Use the COMPLETE record from Firestore (includes serialNumber)
    const recordToRemove = {
      userId: matchingRecord.userId,
      borrowId: matchingRecord.borrowId,
      serialNumber: matchingRecord.serialNumber,
      issueDate: matchingRecord.issueDate,
      dueDate: matchingRecord.dueDate
    };
    
    console.log('🗑️ Removing record:', recordToRemove);
    
    // Update book document - remove from borrowedCopies and increment available
    await updateDoc(bookRef, {
      borrowedCopies: arrayRemove(recordToRemove),
      availableQuantity: increment(1)
    });

    console.log('✅ Book document updated');

    // Update history record
    console.log('🔍 Searching for history record with borrowId:', borrowId);
    
    const historyQuery = query(
      collection(db, borrowHistoryCollectionPath),
      where('borrowId', '==', borrowId),
      where('userId', '==', userId),
      where('status', '==', 'borrowed')
    );

    const historySnapshot = await getDocs(historyQuery);

    if (historySnapshot.empty) {
      console.log(' ⚠️ No matching history record found for borrowId:', borrowId);
    } else {
      const historyDoc = historySnapshot.docs[0];
      const historyRef = doc(db, borrowHistoryCollectionPath, historyDoc.id);
      
      await updateDoc(historyRef, {
        returnDate: Timestamp.now(),
        status: 'returned'
      });
      
      console.log('✅ History record updated:', historyDoc.id);
    }

    console.log('✅ Book returned successfully');
    return { success: true, message: 'Book returned successfully!' };

  } catch (error) {
    console.error('❌ Error returning book:', error);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error message:', error.message);
    
    if (error.code === 'permission-denied') {
      return { success: false, error: 'Permission denied. Please check Firestore rules.' };
    }
    
    return { success: false, error: error.message || 'Failed to return book.' };
  }
};

export default handleReturnWithHistory;