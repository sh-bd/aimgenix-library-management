
import { doc, runTransaction } from 'firebase/firestore';
import { booksCollectionPath, db } from '../config/firebase';
import { calculateDueDate } from '../utils/dateUtils';

/**
 * Borrows a book for a user
 * @param {string} bookId - The ID of the book to borrow
 * @param {string} userId - The ID of the user borrowing the book
 * @param {string} userRole - The role of the user (should be 'reader')
 * @returns {Promise<{success: boolean, error?: string}>}
 */
const handleBorrow = async (bookId, userId, userRole) => {
    // Check permissions
    if (!userId || userRole !== 'reader') {
        const errorMsg = "Permission denied: Only Readers can borrow books.";
        console.warn("Permission denied for handleBorrow action by user:", userId, "with role:", userRole);
        return { success: false, error: errorMsg };
    }

    const bookDocRef = doc(db, booksCollectionPath, bookId);

    try {
        await runTransaction(db, async (transaction) => {
            const bookDoc = await transaction.get(bookDocRef);

            if (!bookDoc.exists()) {
                throw new Error("Book document does not exist!");
            }

            const bookData = bookDoc.data();

            // Add more robust checks within transaction
            if (typeof bookData.availableQuantity !== 'number' || bookData.availableQuantity <= 0) {
                throw new Error("Book is not available or quantity is invalid.");
            }

            const currentBorrowedCopies = Array.isArray(bookData.borrowedCopies) ? bookData.borrowedCopies : [];
            const hasBorrowed = currentBorrowedCopies.some(c => c.userId === userId);

            if (hasBorrowed) {
                throw new Error("You have already borrowed this book.");
            }

            const newIssueDate = new Date();
            const newDueDate = calculateDueDate(newIssueDate);

            const newBorrowCopy = {
                userId: userId,
                issueDate: newIssueDate, // Store as JS Date, Firestore converts to Timestamp
                dueDate: newDueDate,     // Store as JS Date, Firestore converts to Timestamp
                borrowId: crypto.randomUUID() // Unique ID for this specific borrow instance
            };

            const newBorrowedCopies = [...currentBorrowedCopies, newBorrowCopy];

            transaction.update(bookDocRef, {
                availableQuantity: bookData.availableQuantity - 1,
                borrowedCopies: newBorrowedCopies
            });

            console.log(`Transaction update prepared for borrowing book ${bookId} by user ${userId}`);
        });

        console.log("Book borrowed successfully!");
        return { success: true };

    } catch (e) {
        console.error("Borrow transaction failed: ", e);

        // Provide specific error messages
        let errorMsg;
        if (e.message.includes("already borrowed")) {
            errorMsg = "You have already borrowed this book.";
        } else if (e.message.includes("not available")) {
            errorMsg = "This book is currently not available.";
        } else {
            errorMsg = `Failed to borrow book: ${e.message}`;
        }

        return { success: false, error: errorMsg };
    }
};

export default handleBorrow;