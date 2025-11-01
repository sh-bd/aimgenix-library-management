import { addDoc, collection } from 'firebase/firestore';
import { booksCollectionPath, db } from '../../config/firebase';

/**
 * Generates serial numbers for book copies
 * @param {string} bookId - The book ID (first 8 chars)
 * @param {number} quantity - Number of copies
 * @returns {Array} Array of serial numbers
 */
const generateSerialNumbers = (bookId, quantity) => {
    const prefix = bookId.substring(0, 8).toUpperCase();
    return Array.from({ length: quantity }, (_, i) => 
        `${prefix}-${String(i + 1).padStart(4, '0')}`
    );
};

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
        // First create the book document to get the ID
        const docRef = await addDoc(collection(db, booksCollectionPath), {
            ...book,
            createdAt: new Date(),
            copies: [], // Will be updated with serial numbers
            borrowedCopies: []
        });

        // Generate serial numbers using the document ID
        const serialNumbers = generateSerialNumbers(docRef.id, book.totalQuantity);
        
        // Create copy objects with serial numbers
        const copies = serialNumbers.map(serialNumber => ({
            serialNumber,
            status: 'available', // 'available' | 'borrowed'
            borrowedBy: null,
            issueDate: null,
            dueDate: null,
            borrowId: null
        }));

        // Update the document with copies
        await addDoc(collection(db, booksCollectionPath), {
            ...book,
            createdAt: new Date(),
            copies,
            borrowedCopies: [] // Keep for backward compatibility, but use copies array
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