
import { addDoc, collection } from 'firebase/firestore';
import { booksCollectionPath, db } from '../../config/firebase';

/**
 * Adds a new book to the library
 * @param {Object} book - The book data to add
 * @param {string} userId - The ID of the user adding the book
 * @param {string} userRole - The role of the user (should be 'librarian' or 'admin')
 * @returns {Promise<{success: boolean, bookId?: string, error?: string}>}
 */
const addBook = async (book, userId, userRole) => {
    // Check permissions
    if (!userId || (userRole !== 'librarian' && userRole !== 'admin')) {
        const errorMsg = "Permission denied: Only Librarians and Admins can add books.";
        console.warn("Permission denied for addBook action by user:", userId, "with role:", userRole);
        return { success: false, error: errorMsg };
    }

    try {
        // Add client-side timestamp for createdAt
        const docRef = await addDoc(collection(db, booksCollectionPath), {
            ...book,
            createdAt: new Date()
        });

        console.log("Book added with ID:", docRef.id, book.title);
        return { success: true, bookId: docRef.id };

    } catch (e) {
        console.error("Error adding document: ", e);

        let errorMsg;
        if (e.code === 'permission-denied') {
            errorMsg = "Permission denied to add book. Check Firestore rules.";
        } else {
            errorMsg = `Failed to add book: ${e.message}`;
        }

        return { success: false, error: errorMsg };
    }
};

export default addBook;