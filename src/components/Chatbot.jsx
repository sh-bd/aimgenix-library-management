import { useState } from 'react';
import { apiKey, callGemini } from '../config/gemini';
import ChatbotModal from './ChatbotModal';

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [userInput, setUserInput] = useState("");
    const [chatHistory, setChatHistory] = useState([
        { role: 'model', text: apiKey ? 'Hello! I am the AIMGENIX Library Assistant. Ask me for book suggestions based on your interests!' : 'Hello! Chatbot is currently unavailable (missing API key).' }
    ]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSendMessage = async () => {
        if (!apiKey) return; // Don't send if no key
        const message = userInput;
        setUserInput("");
        setChatHistory(prev => [...prev, { role: 'user', text: message }]);
        setIsLoading(true);

        try {
            const systemPrompt = "You are a friendly and helpful library assistant for the AIMGENIX Library. Your main role is to provide book suggestions to readers. You can suggest books based on genre, author, or topics. You cannot access the library's current database, so you cannot check if a book is available. Keep your answers concise and conversational.";
            const response = await callGemini(message, systemPrompt, false);
            setChatHistory(prev => [...prev, { role: 'model', text: response }]);
        } catch (error) {
            console.error("Chatbot error:", error);
            setChatHistory(prev => [...prev, { role: 'model', text: `I'm sorry, I encountered an error: ${error.message}. Please try again.` }]);
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