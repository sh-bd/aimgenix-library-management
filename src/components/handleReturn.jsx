
import { doc, runTransaction } from "firebase/firestore";
import { booksCollectionPath, db } from "../config/firebase";

/**
 * Returns a borrowed book
 * @param {string} bookId - The ID of the book to return
 * @param {string} borrowId - The unique ID of the borrow instance
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

            // Ensure data integrity
            const currentBorrowedCopies = Array.isArray(bookData.borrowedCopies)
                ? bookData.borrowedCopies
                : [];
            const totalQuantity = typeof bookData.totalQuantity === 'number'
                ? bookData.totalQuantity
                : 0;
            let currentAvailableQuantity = typeof bookData.availableQuantity === 'number'
                ? bookData.availableQuantity
                : 0;

            const borrowIndex = currentBorrowedCopies.findIndex(
                c => c.userId === userId && c.borrowId === borrowId
            );

            if (borrowIndex === -1) {
                // If the record isn't found, maybe it was already returned or there's an issue.
                console.warn(
                    `Borrow record not found for user ${userId} and borrowId ${borrowId} on book ${bookId}. Current copies:`,
                    currentBorrowedCopies
                );
                throw new Error("Could not find this specific borrow record to return. It might have already been returned.");
            }

            // Create the new array without the returned copy
            const newBorrowedCopies = [
                ...currentBorrowedCopies.slice(0, borrowIndex),
                ...currentBorrowedCopies.slice(borrowIndex + 1)
            ];

            // Only increment available quantity if it makes sense (safety check)
            const newAvailableQuantity = Math.min(totalQuantity, currentAvailableQuantity + 1);

            transaction.update(bookDocRef, {
                availableQuantity: newAvailableQuantity,
                borrowedCopies: newBorrowedCopies
            });

            console.log(`Transaction update prepared for returning book ${bookId} by user ${userId}`);
        });

        console.log("Book returned successfully!");
        return { success: true };

    } catch (e) {
        console.error("Return transaction failed: ", e);

        let errorMsg;
        if (e.message.includes("not found") || e.message.includes("already been returned")) {
            errorMsg = e.message;
        } else {
            errorMsg = `Failed to return book: ${e.message}`;
        }

        return { success: false, error: errorMsg };
    }
};

export default handleReturn;