import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { booksCollectionPath, db } from '../config/firebase';

/**
 * Generates unique serial numbers for book copies
 * @param {string} isbn - Book ISBN
 * @param {number} quantity - Number of copies
 * @returns {Array<string>} Array of unique serial numbers
 */
const generateSerialNumbers = (isbn, quantity) => {
    const serials = [];
    const prefix = isbn ? isbn.substring(0, 5) : 'BOOK';
    for (let i = 1; i <= quantity; i++) {
        const serial = `${prefix}-${uuidv4().substring(0, 8).toUpperCase()}-${String(i).padStart(3, '0')}`;
        serials.push(serial);
    }
    return serials;
};

const handleAddBook = async (bookData, userRole) => {
    if (!userRole || !['admin', 'librarian'].includes(userRole)) {
        const errorMsg = "Permission denied: Only Admins and Librarians can add books.";
        console.warn("Permission denied for handleAddBook action by user with role:", userRole);
        return { success: false, error: errorMsg };
    }

    const { title, author, isbn, genre, rack, totalQuantity, publicationYear, description, thumbnailUrl } = bookData;

    if (!title || !author || !totalQuantity || totalQuantity < 1) {
        return { success: false, error: "Missing required fields or invalid quantity." };
    }

    try {
        // Generate serial numbers for each copy
        const serialNumbers = generateSerialNumbers(isbn, totalQuantity);

        // Create copies array with serial numbers
        const copies = serialNumbers.map(serial => ({
            serialNumber: serial,
            status: 'available', // available, borrowed, maintenance
            addedAt: new Date()
        }));

        const newBook = {
            title,
            author,
            isbn: isbn || '',
            genre: genre || '',
            rack: rack || '',
            publicationYear: publicationYear || '',
            description: description || '',
            thumbnailUrl: thumbnailUrl || '',
            totalQuantity: parseInt(totalQuantity),
            availableQuantity: parseInt(totalQuantity),
            copies, // Array of copies with serial numbers
            borrowedCopies: [], // Array of currently borrowed copies
            createdAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, booksCollectionPath), newBook);
        console.log("Book added with ID:", docRef.id);
        return { success: true, bookId: docRef.id, serialNumbers };

    } catch (e) {
        console.error("Error adding book: ", e);
        return { success: false, error: `Failed to add book: ${e.message}` };
    }
};

export default handleAddBook;