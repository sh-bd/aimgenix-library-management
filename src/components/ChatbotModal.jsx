import { useEffect, useRef } from "react";
import { apiKey } from "../config/gemini";

const ChatbotModal = ({ isOpen, onClose, chatHistory, onSendMessage, userInput, setUserInput, isLoading }) => {
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [chatHistory]);

    const handleSend = (e) => {
        e.preventDefault();
        if (userInput.trim() && !isLoading && apiKey) { // Check API key before sending
            onSendMessage();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-24 right-6 z-50 w-full max-w-md bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col h-[70vh]">
            <header className="flex items-center justify-between p-4 border-b border-gray-200 rounded-t-lg bg-indigo-600 text-white">
                <h3 className="text-lg font-semibold">AIMGENIX Library Assistant</h3>
                <button
                    onClick={onClose}
                    className="text-white hover:text-indigo-100 transition-colors"
                    aria-label="Close chat"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </header>

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {chatHistory.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                            className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user'
                                ? 'bg-indigo-500 text-white'
                                : 'bg-gray-100 text-gray-800'
                                }`}
                        >
                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 border-t border-gray-200">
                {!apiKey && (
                    <p className="text-xs text-center text-red-600 mb-2">Chat disabled: Gemini API Key missing.</p>
                )}
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder={apiKey ? "Ask for book suggestions..." : "API Key missing"}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                        disabled={isLoading || !apiKey} // Disable if no API key
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !userInput.trim() || !apiKey} // Disable if no API key
                        title={!apiKey ? "Gemini API Key missing in .env" : "Send message"}
                        className="w-10 h-10 flex items-center justify-center bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors disabled:bg-indigo-300 disabled:cursor-not-allowed"
                        aria-label="Send message"
                    >
                        <svg className="w-5 h-5 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatbotModal;