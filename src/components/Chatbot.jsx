import { collection, getDocs } from 'firebase/firestore';
import { useState } from 'react';
import { booksCollectionPath, db } from '../config/firebase';
import { apiKey, callGroq } from '../config/groq';
import ChatbotModal from './ChatbotModal';
import handleBorrow from './handleBorrow';
import handleReturn from './handleReturn';

const Chatbot = ({ userId, userRole }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [userInput, setUserInput] = useState("");
    const [chatHistory, setChatHistory] = useState([
        { role: 'assistant', text: apiKey ? 'Hello! I am the AIMGENIX Library Assistant. I can help you find books, check availability, borrow books, and return borrowed books!' : 'Hello! Chatbot is currently unavailable (missing API key).' }
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
            const userBorrowedBooks = userId ? getUserBorrowedBooks(books, userId) : [];

            console.log("✅ Available:", availableBooks.length, "❌ Unavailable:", unavailableBooks.length, "📚 User borrowed:", userBorrowedBooks.length);

            const availableBookList = availableBooks.map(book => 
                `- "${book.title}" by ${book.author} (Genre: ${book.genre || 'Not specified'}, Rack: ${book.rack || 'N/A'}, Available: ${book.availableCopies}/${book.totalCopies} copies, ID: ${book.id})`
            ).join('\n');

            const unavailableBookList = unavailableBooks.map(book =>
                `- "${book.title}" by ${book.author} (Genre: ${book.genre || 'Not specified'}, All ${book.totalCopies} copies borrowed)`
            ).join('\n');

            const borrowedBookList = userBorrowedBooks.map(book =>
                `- "${book.bookTitle}" by ${book.bookAuthor} (Serial: ${book.serialNumber}, BorrowID: ${book.borrowId}, BookID: ${book.bookId})`
            ).join('\n');

            const systemPrompt = `You are a friendly and helpful library assistant for the AIMGENIX Library. 

📚 AVAILABLE BOOKS (Can be borrowed RIGHT NOW):
${availableBookList || "No books available at the moment."}

📕 CURRENTLY BORROWED BY OTHERS (All copies checked out):
${unavailableBookList || "No books currently borrowed by others."}

📖 USER'S BORROWED BOOKS (Books the current user has borrowed):
${borrowedBookList || "User hasn't borrowed any books yet."}

Library Statistics:
- Total unique titles: ${books.length}
- Available for borrowing: ${availableBooks.length}
- All copies borrowed: ${unavailableBooks.length}
- User's borrowed books: ${userBorrowedBooks.length}

CRITICAL INSTRUCTIONS - YOU MUST FOLLOW THESE EXACTLY:

1. FINDING BOOKS:
   When asked "do you have [book]?" or "is [book] available?":
   - Check BOTH available and borrowed lists
   - If in AVAILABLE list: "Yes! '[Title]' is available. We have X out of Y copies in the [Rack] rack. Would you like to borrow it?"
   - If in BORROWED BY OTHERS list: "Yes, we have '[Title]', but all copies are currently checked out."
   - If in USER'S BORROWED list: "You already have '[Title]' borrowed!"
   - If in NEITHER list: "I don't see that book in our catalog."

2. BORROWING BOOKS - CRITICAL:
   When user says ANY of these: "yes", "yes please", "sure", "okay", "i want to borrow it", "borrow it", "borrow it for me":
   - Look at the PREVIOUS message in conversation history
   - If you mentioned a book title in your previous response, that's the book they want
   - Respond with ONLY this format: "BORROW_BOOK:{bookId}|{bookTitle}"
   - Example: "BORROW_BOOK:zxWMsYk0DukttoBJZZ3g|Rich Dad Poor Dad"
   - DO NOT add any other text before or after the command!

3. RETURNING BOOKS:
   When user wants to return a book (says "return [book]", "return it", etc.):
   - Check if book is in USER'S BORROWED BOOKS list
   - If yes, respond with ONLY: "RETURN_BOOK:{bookId}|{borrowId}|{bookTitle}"
   - Example: "RETURN_BOOK:abc123|xyz789|Rich Dad Poor Dad"
   - DO NOT add any other text before or after the command!
   - If not borrowed: "You haven't borrowed '[Title]'.

4. MAINTAIN CONVERSATION CONTEXT!
   - Remember what YOU said in your last message
   - If you asked "Would you like to borrow [Book]?" and user says "yes", that means they want THAT book
   - Never ask "which book?" if you just mentioned a specific book title

IMPORTANT: When responding with BORROW_BOOK or RETURN_BOOK commands, respond with ONLY that command and nothing else!`;

            // Build conversation history for API
            const conversationMessages = chatHistory
                .slice(1) // Skip initial greeting
                .map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'assistant',
                    content: msg.text
                }));

            // Add current message
            conversationMessages.push({
                role: 'user',
                content: message
            });

            const response = await callGroq(conversationMessages, systemPrompt);
            console.log("💬 AI Response:", response);

            // Handle borrow command
            if (response.includes("BORROW_BOOK:")) {
                // Extract just the command part
                const commandMatch = response.match(/BORROW_BOOK:([^|]+)\|(.+)/);
                if (commandMatch) {
                    const bookId = commandMatch[1]?.trim();
                    const bookTitle = commandMatch[2]?.trim();

                    if (!userId) {
                        setChatHistory(prev => [...prev, { 
                            role: 'assistant', 
                            text: "Please log in first to borrow books. 📚" 
                        }]);
                        setIsLoading(false);
                    } else if (userRole !== 'reader') {
                        setChatHistory(prev => [...prev, { 
                            role: 'assistant', 
                            text: "Only readers can borrow books. Please switch to a reader account." 
                        }]);
                        setIsLoading(false);
                    } else {
                        console.log(`🔄 Attempting to borrow book: ${bookTitle} (ID: ${bookId})`);
                        const result = await handleBorrow(bookId, userId, userRole);
                        
                        setIsLoading(false);
                        
                        if (result.success) {
                            setChatHistory(prev => [...prev, { 
                                role: 'assistant', 
                                text: `Perfect! I've borrowed "${bookTitle}" for you (Serial: ${result.serialNumber}). You can see it in your "My Books" section. The due date is 14 days from now. Happy reading! 📚` 
                            }]);
                        } else {
                            setChatHistory(prev => [...prev, { 
                                role: 'assistant', 
                                text: `Sorry, I couldn't borrow "${bookTitle}". ${result.error || 'Please try again.'}` 
                            }]);
                        }
                    }
                }
            }
            // Handle return command
            else if (response.includes("RETURN_BOOK:")) {
                // Extract just the command part
                const commandMatch = response.match(/RETURN_BOOK:([^|]+)\|([^|]+)\|(.+)/);
                if (commandMatch) {
                    const bookId = commandMatch[1]?.trim();
                    const borrowId = commandMatch[2]?.trim();
                    const bookTitle = commandMatch[3]?.trim();

                    if (!userId) {
                        setChatHistory(prev => [...prev, { 
                            role: 'assistant', 
                            text: "Please log in first to return books. 📚" 
                        }]);
                        setIsLoading(false);
                    } else if (userRole !== 'reader') {
                        setChatHistory(prev => [...prev, { 
                            role: 'assistant', 
                            text: "Only readers can return books." 
                        }]);
                        setIsLoading(false);
                    } else {
                        console.log(`🔄 Attempting to return book: ${bookTitle} (ID: ${bookId}, BorrowID: ${borrowId})`);
                        
                        try {
                            const result = await handleReturn(bookId, borrowId, userId, userRole);
                            
                            if (result.success) {
                                setChatHistory(prev => [...prev, { 
                                    role: 'assistant', 
                                    text: `Great! I've successfully returned "${bookTitle}" for you. Thank you for returning it on time! 📚✅` 
                                }]);
                                
                                await new Promise(resolve => setTimeout(resolve, 100));
                                setIsLoading(false);
                            } else {
                                setChatHistory(prev => [...prev, { 
                                    role: 'assistant', 
                                    text: `Sorry, I couldn't return "${bookTitle}". ${result.error || 'Please try again.'}` 
                                }]);
                                setIsLoading(false);
                            }
                        } catch (error) {
                            console.error("Return error:", error);
                            setChatHistory(prev => [...prev, { 
                                role: 'assistant', 
                                text: `An error occurred while returning "${bookTitle}". Please try again.` 
                            }]);
                            setIsLoading(false);
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