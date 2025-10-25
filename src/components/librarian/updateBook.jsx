import { doc, updateDoc } from 'firebase/firestore';

/**
 * Updates a book document in Firestore.
 * @param {Object} db - Firestore database instance
 * @param {string} booksCollectionPath - Path to books collection
 * @param {Object} updatedBook - The book object with updated fields
 * @param {string} userId - Current user ID
 * @param {string} userRole - Current user role
 * @param {Function} setError - Error setter function
 * @returns {Promise<void>}
 */
const updateBook = async (db, booksCollectionPath, updatedBook, userId, userRole, setError) => {
    // Check permissions
    if (!userId || (userRole !== 'librarian' && userRole !== 'admin')) {
        setError("Permission denied: Only Librarians and Admins can update books.");
        console.warn("Permission denied for updateBook action by user:", userId, "with role:", userRole);
        return;
    }

    setError(null);

    try {
        const bookDocRef = doc(db, booksCollectionPath, updatedBook.id);

        // Only update the fields that should be editable
        await updateDoc(bookDocRef, {
            title: updatedBook.title,
            author: updatedBook.author,
            genre: updatedBook.genre,
            rack: updatedBook.rack,
            totalQuantity: updatedBook.totalQuantity,
            availableQuantity: updatedBook.availableQuantity
        });

        console.log("Book updated:", updatedBook.id);
    } catch (e) {
        console.error("Error updating document:", e);
        if (e.code === 'permission-denied') {
            setError("Permission denied to update book. Check Firestore rules.");
        } else {
            setError(`Failed to update book: ${e.message}`);
        }
    }
};

export default updateBook;