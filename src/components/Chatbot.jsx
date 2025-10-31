import { collection, getDocs } from 'firebase/firestore';
import { useState } from 'react';
import { booksCollectionPath, db } from '../config/firebase';
import { apiKey, callGemini } from '../config/gemini';
import ChatbotModal from './ChatbotModal';
import handleBorrow from './handleBorrow';

const Chatbot = ({ userId, userRole }) => { // Add userRole prop
    const [isOpen, setIsOpen] = useState(false);
    const [userInput, setUserInput] = useState("");
    const [chatHistory, setChatHistory] = useState([
        { role: 'model', text: apiKey ? 'Hello! I am the AIMGENIX Library Assistant. I can help you find books, check availability, and borrow books!' : 'Hello! Chatbot is currently unavailable (missing API key).' }
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
                    totalCopies: data.totalQuantity || data.totalCopies || 0
                });
            });
            
            console.log("📚 Fetched books from Firestore:", books.length);
            return books;
        } catch (error) {
            console.error("Error fetching books:", error);
            return [];
        }
    };

    const handleSendMessage = async () => {
        if (!apiKey) return;
        const message = userInput;
        setUserInput("");
        setChatHistory(prev => [...prev, { role: 'user', text: message }]);
        setIsLoading(true);

        try {
            const books = await fetchBooksFromFirestore();

            if (books.length === 0) {
                setChatHistory(prev => [...prev, { 
                    role: 'model', 
                    text: "I'm having trouble accessing the library database. Please try again in a moment." 
                }]);
                setIsLoading(false);
                return;
            }

            const availableBooks = books.filter(book => book.availableCopies > 0);
            const unavailableBooks = books.filter(book => book.availableCopies === 0);

            console.log("✅ Available:", availableBooks.length, "❌ Unavailable:", unavailableBooks.length);

            const availableBookList = availableBooks.map(book => 
                `- "${book.title}" by ${book.author} (Genre: ${book.genre || 'Not specified'}, Rack: ${book.rack || 'N/A'}, Available: ${book.availableCopies}/${book.totalCopies} copies, ID: ${book.id})`
            ).join('\n');

            const unavailableBookList = unavailableBooks.map(book =>
                `- "${book.title}" by ${book.author} (Genre: ${book.genre || 'Not specified'}, All ${book.totalCopies} copies borrowed)`
            ).join('\n');

            const systemPrompt = `You are a friendly and helpful library assistant for the AIMGENIX Library. 

📚 AVAILABLE BOOKS (Can be borrowed RIGHT NOW):
${availableBookList || "No books available at the moment."}

📕 CURRENTLY BORROWED (All copies checked out):
${unavailableBookList || "No books currently borrowed."}

Library Statistics:
- Total unique titles: ${books.length}
- Available for borrowing: ${availableBooks.length}
- All copies borrowed: ${unavailableBooks.length}

CRITICAL INSTRUCTIONS:
1. When asked "do you have [book]?" or "is [book] available?":
   - Check BOTH lists above carefully
   - If in AVAILABLE list: "Yes! '[Title]' is available. We have X out of Y copies in the [Rack] rack. Would you like to borrow it?"
   - If in BORROWED list: "Yes, we have '[Title]', but all copies are currently checked out."
   - If in NEITHER list: "I don't see that book in our catalog."

2. When user wants to borrow (says yes, please, I want it, borrow it, etc.):
   - Verify the book is in AVAILABLE list
   - Respond EXACTLY: "BORROW_BOOK:{bookId}|{bookTitle}"
   - Example: "BORROW_BOOK:abc123|Rich Dad Poor Dad"

3. Always be conversational and helpful!

Examples:
User: "Do you have Rich Dad Poor Dad?"
You: "Yes! 'Rich Dad Poor Dad' by Robert Kiyosaki is available. We have 12 out of 12 copies in the Literature rack. Would you like to borrow it?"

User: "Yes please"
You: "BORROW_BOOK:xyz789|Rich Dad Poor Dad"`;

            const response = await callGemini(message, systemPrompt, false);
            console.log("💬 AI Response:", response);

            // Handle borrow command
            if (response.startsWith("BORROW_BOOK:")) {
                const parts = response.replace("BORROW_BOOK:", "").split("|");
                const bookId = parts[0]?.trim();
                const bookTitle = parts[1]?.trim();

                if (!userId) {
                    setChatHistory(prev => [...prev, { 
                        role: 'model', 
                        text: "Please log in first to borrow books. 📚" 
                    }]);
                } else if (userRole !== 'reader') {
                    setChatHistory(prev => [...prev, { 
                        role: 'model', 
                        text: "Only readers can borrow books. Please switch to a reader account." 
                    }]);
                } else {
                    // Use your existing handleBorrow function
                    console.log(`🔄 Attempting to borrow book: ${bookTitle} (ID: ${bookId})`);
                    const result = await handleBorrow(bookId, userId, userRole);
                    
                    if (result.success) {
                        setChatHistory(prev => [...prev, { 
                            role: 'model', 
                            text: `Perfect! I've borrowed "${bookTitle}" for you. You can see it in your "My Borrowed Books" section. The due date is 14 days from now. Happy reading! 📚` 
                        }]);
                    } else {
                        setChatHistory(prev => [...prev, { 
                            role: 'model', 
                            text: `Sorry, I couldn't borrow "${bookTitle}". ${result.error || 'Please try again.'}` 
                        }]);
                    }
                }
            } else {
                setChatHistory(prev => [...prev, { role: 'model', text: response }]);
            }
        } catch (error) {
            console.error("❌ Chatbot error:", error);
            setChatHistory(prev => [...prev, { 
                role: 'model', 
                text: `I encountered an error: ${error.message}. Please try again.` 
            }]);
        }
        setIsLoading(false);
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