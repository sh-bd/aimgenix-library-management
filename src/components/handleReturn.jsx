import { doc, runTransaction } from 'firebase/firestore';
import { booksCollectionPath, db } from '../config/firebase';

/**
 * Returns a borrowed book
 * @param {string} bookId - The ID of the book to return
 * @param {string} borrowId - The ID of the borrow transaction (optional, will use userId if not provided)
 * @param {string} userId - The ID of the user returning the book
 * @param {string} userRole - The role of the user (should be 'reader')
 * @returns {Promise<{success: boolean, error?: string}>}
 */
const handleReturn = async (bookId, borrowId, userId, userRole) => {
    // Check permissions
    if (!userId || userRole !== 'reader') {
        const errorMsg = "Permission denied: Only Readers can return books.";
        console.warn("Permission denied for handleReturn action by user:", userId, "with role:", userRole);
        return { success: false, error: errorMsg };
    }

    const bookDocRef = doc(db, booksCollectionPath, bookId);

    try {
        const result = await runTransaction(db, async (transaction) => {
            const bookDoc = await transaction.get(bookDocRef);

            if (!bookDoc.exists()) {
                throw new Error('Book not found.');
            }

            const bookData = bookDoc.data();
            const borrowedCopies = bookData.borrowedCopies || [];

            // Find the specific borrow record
            const borrowIndex = borrowedCopies.findIndex(
                copy => copy.borrowId === borrowId && copy.userId === userId
            );

            if (borrowIndex === -1) {
                throw new Error('Borrow record not found or does not belong to you.');
            }

            const borrowRecord = borrowedCopies[borrowIndex];
            const dueDate = borrowRecord.dueDate.toDate();
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Start of today

            // Check if return is late (considering weekend grace period)
            const isLateReturn = checkIfLateReturn(dueDate, today);

            if (isLateReturn) {
                const gracePeriodMessage = getDueDateDayName(dueDate) === 'Friday' || getDueDateDayName(dueDate) === 'Saturday'
                    ? ' (Note: Weekend due dates have a Sunday grace period)'
                    : '';
                    
                throw new Error(`This book is overdue. Due date was ${dueDate.toLocaleDateString()}.${gracePeriodMessage} Please contact the library.`);
            }

            // Remove the borrow record
            const updatedBorrowedCopies = borrowedCopies.filter((_, index) => index !== borrowIndex);
            const updatedAvailableQuantity = (bookData.availableQuantity || 0) + 1;

            // Update the book document
            transaction.update(bookDocRef, {
                borrowedCopies: updatedBorrowedCopies,
                availableQuantity: updatedAvailableQuantity
            });

            return { borrowRecord };
        });

        console.log('✅ Book returned successfully!');
        return { success: true, borrowRecord: result.borrowRecord };

    } catch (error) {
        console.error('❌ Return transaction failed:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Check if the return is late, considering weekend grace period
 * If due date is Friday or Saturday, allow return until end of Sunday
 */
const checkIfLateReturn = (dueDate, today) => {
    const dueDateCopy = new Date(dueDate);
    dueDateCopy.setHours(0, 0, 0, 0);
    
    const dueDayOfWeek = dueDateCopy.getDay(); // 0 = Sunday, 5 = Friday, 6 = Saturday
    
    // If due date is Friday (5) or Saturday (6), extend to Sunday
    if (dueDayOfWeek === 5 || dueDayOfWeek === 6) {
        // Calculate the following Sunday
        const daysUntilSunday = (7 - dueDayOfWeek) % 7;
        const gracePeriodEndDate = new Date(dueDateCopy);
        gracePeriodEndDate.setDate(gracePeriodEndDate.getDate() + daysUntilSunday);
        gracePeriodEndDate.setHours(23, 59, 59, 999); // End of Sunday
        
        // Check if today is after the grace period end
        return today > gracePeriodEndDate;
    }
    
    // For other days, check if today is after due date
    return today > dueDateCopy;
};

/**
 * Get the day name for a given date
 */
const getDueDateDayName = (date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
};

export default handleReturn;