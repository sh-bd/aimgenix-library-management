import { collection, getDocs } from 'firebase/firestore';
import { useState } from 'react';
import { booksCollectionPath, db } from '../config/firebase';
import { apiKey, callGroq } from '../config/groq';
import ChatbotModal from './ChatbotModal';
import handleReserve from './handleReserve';

const Chatbot = ({ userId, userRole, userEmail }) => { // ✅ Add userEmail
    const [isOpen, setIsOpen] = useState(false);
    const [userInput, setUserInput] = useState("");
    const [chatHistory, setChatHistory] = useState([
        { role: 'assistant', text: apiKey ? 'Hello! I am the AIMGENIX Library Assistant. I can help you find books, check availability, and reserve low-stock books (less than 10 copies)!' : 'Hello! Chatbot is currently unavailable (missing API key).' }
    ]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchBooksFromFirestore = async () => {
        try {
            const booksRef = collection(db, booksCollectionPath);
            const querySnapshot = await getDocs(booksRef);
            
            const books = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                books.push({ 
                    id: doc.id, 
                    ...data,
                    availableCopies: data.availableQuantity || data.availableCopies || 0,
                    totalCopies: data.totalQuantity || data.totalCopies || 0,
                    borrowedCopies: data.borrowedCopies || []
                });
            });
            
            console.log("📚 Fetched books from Firestore:", books.length);
            return books;
        } catch (error) {
            console.error("Error fetching books:", error);
            return [];
        }
    };

    const getUserBorrowedBooks = (books, userId) => {
        const borrowed = [];
        books.forEach(book => {
            const userBorrows = (book.borrowedCopies || []).filter(copy => copy.userId === userId);
            userBorrows.forEach(borrowInfo => {
                borrowed.push({
                    bookId: book.id,
                    bookTitle: book.title,
                    bookAuthor: book.author,
                    borrowId: borrowInfo.borrowId,
                    serialNumber: borrowInfo.serialNumber,
                    dueDate: borrowInfo.dueDate
                });
            });
        });
        return borrowed;
    };

    const handleSendMessage = async () => {
        if (!apiKey) return;
        const message = userInput;
        if (!message.trim()) return;
        
        setUserInput("");
        const newUserMessage = { role: 'user', text: message };
        setChatHistory(prev => [...prev, newUserMessage]);
        setIsLoading(true);

        try {
            const books = await fetchBooksFromFirestore();

            if (books.length === 0) {
                setChatHistory(prev => [...prev, { 
                    role: 'assistant', 
                    text: "I'm having trouble accessing the library database. Please try again in a moment." 
                }]);
                setIsLoading(false);
                return;
            }

            const availableBooks = books.filter(book => book.availableCopies > 0);
            const unavailableBooks = books.filter(book => book.availableCopies === 0);
            const lowStockBooks = books.filter(book => book.availableCopies > 0 && book.availableCopies < 10);
            const userBorrowedBooks = userId ? getUserBorrowedBooks(books, userId) : [];

            console.log("✅ Available:", availableBooks.length, "❌ Unavailable:", unavailableBooks.length, "⚠️ Low Stock:", lowStockBooks.length);

            const availableBookList = availableBooks.map(book => {
                const stockStatus = book.availableCopies < 10 ? '⚠️ LOW STOCK - Can be reserved' : 'In stock';
                return `- "${book.title}" by ${book.author} (Genre: ${book.genre || 'Not specified'}, Rack: ${book.rack || 'N/A'}, Available: ${book.availableCopies}/${book.totalCopies} copies, Status: ${stockStatus}, ID: ${book.id})`;
            }).join('\n');

            const unavailableBookList = unavailableBooks.map(book =>
                `- "${book.title}" by ${book.author} (Genre: ${book.genre || 'Not specified'}, All ${book.totalCopies} copies borrowed - Cannot reserve)`
            ).join('\n');

            const borrowedBookList = userBorrowedBooks.map(book =>
                `- "${book.bookTitle}" by ${book.bookAuthor} (Serial: ${book.serialNumber}, BorrowID: ${book.borrowId}, BookID: ${book.bookId})`
            ).join('\n');

            const systemPrompt = `You are a friendly and helpful library assistant for the AIMGENIX Library. 

📚 AVAILABLE BOOKS (In stock):
${availableBookList || "No books available at the moment."}

📕 CURRENTLY BORROWED BY OTHERS (Out of stock):
${unavailableBookList || "No books currently borrowed by others."}

📖 USER'S BORROWED BOOKS:
${borrowedBookList || "User hasn't borrowed any books yet."}

Library Statistics:
- Total unique titles: ${books.length}
- Available for borrowing: ${availableBooks.length}
- Low stock (< 10 copies): ${lowStockBooks.length}
- Out of stock: ${unavailableBooks.length}
- User's borrowed books: ${userBorrowedBooks.length}

IMPORTANT LIBRARY POLICIES:

1. BORROWING POLICY - CHANGED:
   - Users CANNOT borrow books online anymore
   - Users must visit the library physically to borrow books
   - Only Admin/Librarian can issue books to users
   - When asked about borrowing: "You'll need to visit the library to borrow this book. Our librarian will help you!"

2. RESERVATION POLICY (NEW):
   - Users CAN reserve low-stock books (less than 10 copies) online
   - Reservation is valid for 3 business days (excluding Friday and Saturday)
   - Late collection fine: ৳5 per day after deadline
   - Cannot reserve out-of-stock books (0 copies)
   - When a book has < 10 copies, suggest reservation

3. FINDING BOOKS:
   When asked "do you have [book]?" or "is [book] available?":
   - Check both available and borrowed lists
   - If available with < 10 copies: "Yes! '[Title]' is available but low in stock (X copies left). Would you like to RESERVE it for 3 days?"
   - If available with >= 10 copies: "Yes! '[Title]' is available with X copies. Please visit the library to borrow it!"
   - If out of stock (0 copies): "Yes, we have '[Title]', but all copies are currently borrowed. Cannot reserve at the moment."
   - If not in catalog: "I don't see that book in our catalog."

4. RESERVATION COMMAND:
   When user wants to reserve a low-stock book (says "yes", "reserve it", "book it", etc.):
   - Look at previous message to identify the book
   - Respond with ONLY: "RESERVE_BOOK:{bookId}|{bookTitle}"
   - Example: "RESERVE_BOOK:abc123|Rich Dad Poor Dad"
   - DO NOT add any other text!

5. MAINTAIN CONVERSATION CONTEXT:
   - Remember what YOU said in your last message
   - If you mentioned a specific book and user says "yes" or "reserve it", that's the book they want
   - Never ask "which book?" if you just mentioned a book

IMPORTANT: 
- Users CANNOT borrow books through chat anymore - only physical visit
- Only low-stock books (< 10 copies) can be reserved
- Out-of-stock books (0 copies) CANNOT be reserved
- When responding with RESERVE_BOOK command, use ONLY that command with no extra text!`;

            // Build conversation history for API
            const conversationMessages = chatHistory
                .slice(1)
                .map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'assistant',
                    content: msg.text
                }));

            conversationMessages.push({
                role: 'user',
                content: message
            });

            const response = await callGroq(conversationMessages, systemPrompt);
            console.log("💬 AI Response:", response);

            // Handle reservation command
            if (response.includes("RESERVE_BOOK:")) {
                const commandMatch = response.match(/RESERVE_BOOK:([^|]+)\|(.+)/);
                if (commandMatch) {
                    const bookId = commandMatch[1]?.trim();
                    const bookTitle = commandMatch[2]?.trim();

                    if (!userId) {
                        setChatHistory(prev => [...prev, { 
                            role: 'assistant', 
                            text: "Please log in first to reserve books. 📚" 
                        }]);
                        setIsLoading(false);
                    } else if (userRole !== 'reader') {
                        setChatHistory(prev => [...prev, { 
                            role: 'assistant', 
                            text: "Only readers can reserve books. Please switch to a reader account." 
                        }]);
                        setIsLoading(false);
                    } else if (!userEmail) {
                        setChatHistory(prev => [...prev, { 
                            role: 'assistant', 
                            text: "Cannot reserve - email address not found. Please contact support." 
                        }]);
                        setIsLoading(false);
                    } else {
                        console.log(`📌 Attempting to reserve book: ${bookTitle} (ID: ${bookId})`);
                        const result = await handleReserve(bookId, userId, userEmail);
                        
                        setIsLoading(false);
                        
                        if (result.success) {
                            setChatHistory(prev => [...prev, { 
                                role: 'assistant', 
                                text: `✅ ${result.message}\n\n⚠️ Important: Please collect the book within 3 business days (excluding weekends). Late collection will incur a fine of ৳5 per day.` 
                            }]);
                        } else {
                            setChatHistory(prev => [...prev, { 
                                role: 'assistant', 
                                text: `❌ ${result.error}` 
                            }]);
                        }
                    }
                }
            }
            else {
                // Normal conversation response
                setChatHistory(prev => [...prev, { role: 'assistant', text: response }]);
                setIsLoading(false);
            }
        } catch (error) {
            console.error("❌ Chatbot error:", error);
            setChatHistory(prev => [...prev, { 
                role: 'assistant', 
                text: `I encountered an error: ${error.message}. Please try again.` 
            }]);
            setIsLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-40 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-indigo-700 transition-all transform hover:scale-110"
                aria-label="Open chatbot"
                title="Open Library Assistant Chat"
            >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            </button>
            <ChatbotModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                chatHistory={chatHistory}
                onSendMessage={handleSendMessage}
                userInput={userInput}
                setUserInput={setUserInput}
                isLoading={isLoading}
            />
        </>
    );
};

export default Chatbot;