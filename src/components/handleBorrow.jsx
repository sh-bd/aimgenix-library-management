import { doc, runTransaction, Timestamp } from 'firebase/firestore';
import { booksCollectionPath, db } from '../config/firebase';

const handleBorrow = async (bookId, userId, userRole) => {
    if (!userId || userRole !== 'reader') {
        return { success: false, error: 'Only readers can borrow books.' };
    }

    const bookDocRef = doc(db, booksCollectionPath, bookId);

    try {
        const result = await runTransaction(db, async (transaction) => {
            const bookDoc = await transaction.get(bookDocRef);

            if (!bookDoc.exists()) {
                throw new Error('Book not found.');
            }

            const bookData = bookDoc.data();
            const availableQuantity = bookData.availableQuantity || 0;
            const borrowedCopies = bookData.borrowedCopies || [];

            // Check if user already borrowed this book
            const userAlreadyBorrowed = borrowedCopies.some(copy => copy.userId === userId);
            if (userAlreadyBorrowed) {
                throw new Error('You have already borrowed this book.');
            }

            // Check if there are available copies
            if (availableQuantity <= 0) {
                throw new Error('No copies available.');
            }

            // Generate a unique borrow ID and serial number
            const borrowId = crypto.randomUUID();
            const serialNumber = `SN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            // Calculate due date (14 days from now)
            const issueDate = new Date();
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 14);
            dueDate.setHours(23, 59, 59, 999);

            // Create borrow record
            const borrowRecord = {
                userId,
                borrowId,
                serialNumber,
                issueDate: Timestamp.fromDate(issueDate),
                dueDate: Timestamp.fromDate(dueDate)
            };

            // Update book document
            const updatedBorrowedCopies = [...borrowedCopies, borrowRecord];
            const updatedAvailableQuantity = availableQuantity - 1;

            transaction.update(bookDocRef, {
                borrowedCopies: updatedBorrowedCopies,
                availableQuantity: updatedAvailableQuantity
            });

            return { serialNumber, borrowId };
        });

        console.log('✅ Book borrowed successfully!');
        return { success: true, serialNumber: result.serialNumber, borrowId: result.borrowId };

    } catch (error) {
        console.error('❌ Borrow transaction failed:', error);
        return { success: false, error: error.message };
    }
};

export default handleBorrow;