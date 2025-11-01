import { doc, runTransaction } from "firebase/firestore";
import { booksCollectionPath, db } from "../config/firebase";

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
        await runTransaction(db, async (transaction) => {
            const bookDoc = await transaction.get(bookDocRef);

            if (!bookDoc.exists()) {
                throw new Error("Book document does not exist!");
            }

            const bookData = bookDoc.data();
            const copies = Array.isArray(bookData.copies) ? bookData.copies : [];
            const borrowedCopies = Array.isArray(bookData.borrowedCopies) ? bookData.borrowedCopies : [];

            // Find the borrowed copy
            const borrowIndex = borrowedCopies.findIndex(copy => {
                if (borrowId) {
                    return copy.borrowId === borrowId && copy.userId === userId;
                }
                return copy.userId === userId;
            });

            if (borrowIndex === -1) {
                throw new Error("You have not borrowed this book.");
            }

            const returnedCopy = borrowedCopies[borrowIndex];
            const serialNumber = returnedCopy.serialNumber;

            // Update copy status back to available
            const updatedCopies = copies.map(copy => 
                copy.serialNumber === serialNumber 
                    ? { ...copy, status: 'available' }
                    : copy
            );

            // Remove from borrowed copies
            const updatedBorrowedCopies = borrowedCopies.filter((_, index) => index !== borrowIndex);

            transaction.update(bookDocRef, {
                copies: updatedCopies,
                borrowedCopies: updatedBorrowedCopies,
                availableQuantity: (bookData.availableQuantity || 0) + 1
            });

            console.log(`Book returned by user ${userId}, serial: ${serialNumber}`);
        });

        console.log("Book returned successfully!");
        return { success: true };

    } catch (e) {
        console.error("Return transaction failed: ", e);
        return { success: false, error: e.message };
    }
};

export default handleReturn;