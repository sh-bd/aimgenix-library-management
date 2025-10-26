
import { deleteDoc, doc } from 'firebase/firestore';
import { booksCollectionPath, db } from '../../config/firebase';

/**
 * Deletes a book from the library
 * @param {string} id - The ID of the book to delete
 * @param {string} userId - The ID of the user deleting the book
 * @param {string} userRole - The role of the user (should be 'librarian' or 'admin')
 * @returns {Promise<{success: boolean, error?: string}>}
 */
const deleteBook = async (id, userId, userRole) => {
    // Check permissions
    if (!userId || (userRole !== 'librarian' && userRole !== 'admin')) {
        const errorMsg = "Permission denied: Only Librarians and Admins can delete books.";
        console.warn("Permission denied for deleteBook action by user:", userId, "with role:", userRole);
        return { success: false, error: errorMsg };
    }

    try {
        await deleteDoc(doc(db, booksCollectionPath, id));
        console.log("Deleted book:", id);
        return { success: true };

    } catch (e) {
        console.error("Error deleting document: ", e);

        let errorMsg;
        if (e.code === 'permission-denied') {
            errorMsg = "Permission denied to delete book. Check Firestore rules.";
        } else {
            errorMsg = `Failed to delete book: ${e.message}`;
        }

        return { success: false, error: errorMsg };
    }
};

export default deleteBook;