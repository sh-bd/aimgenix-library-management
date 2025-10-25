import { getAnalytics } from "firebase/analytics";
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  query,
  runTransaction,
  setLogLevel,
  updateDoc
} from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import AdminUserManagement from "./components/AdminUserManagement";
import AppHeader from "./components/AppHeader";
import handleLogin from "./components/handleLogin";
import HandleSignOut from "./components/handleSignOut";
import handleSignUp from "./components/handleSignUp";
import LoadingSpinner from "./components/LoadingSpinner";
import ProtectedRoute from "./components/ProtectedRoute";
import LibrarianDashboard from "./pages/LibrarianDashboard";
import { default as LoginScreen } from "./pages/Login";
import ReaderView from "./pages/ReaderDashboard";
import SignUpScreen from "./pages/SignUp";

// --- Firebase Configuration ---
// Reads the config as a JSON string from your .env file using Vite's import.meta.env
// Ensure your .env file has: VITE_FIREBASE_CONFIG='{"apiKey":"...", ...}'
let firebaseConfig;
try {
  // Use import.meta.env (standard for Vite)
  // The build warning about es2015 might persist if the local build target isn't updated,
  // but this is the correct way to access Vite env vars in the code.
  const configString = import.meta.env?.VITE_FIREBASE_CONFIG;
  if (configString) {
    firebaseConfig = JSON.parse(configString);
  } else {
    firebaseConfig = { apiKey: "MISSING_KEY", authDomain: "MISSING_DOMAIN", projectId: "MISSING_PROJECT" };
    console.warn("Firebase config (VITE_FIREBASE_CONFIG) not found in import.meta.env. Using placeholders.");
  }
} catch (e) {
  console.error("Failed to parse VITE_FIREBASE_CONFIG from import.meta.env:", e);
  // Use placeholder on parse error
  firebaseConfig = { apiKey: "PARSE_ERROR", authDomain: "PARSE_ERROR", projectId: "PARSE_ERROR" };
}


// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// Initialize Analytics only if config seems valid (avoid error with placeholders)
const analytics = firebaseConfig.measurementId ? getAnalytics(app) : null;

// Enable Firestore debug logging
setLogLevel('debug');

// --- Firestore Collection Paths ---
// Root collections for a standard Firebase project
const booksCollectionPath = `books`;
const usersCollectionPath = `users`;

// --- Gemini API Configuration ---
const apiKey = import.meta.env?.VITE_GEMINI_API_KEY || "";
if (!apiKey) {
  console.warn("Gemini API Key (VITE_GEMINI_API_KEY) not found in import.meta.env. API calls will fail.");
}
const geminiModel = "gemini-2.5-flash";

/**
 * Calls the Gemini API with exponential backoff for retries.
 * @param {string} userQuery - The user's prompt.
 * @param {string | null} systemInstruction - The system prompt (optional).
 * @param {boolean} jsonOutput - Whether to request a JSON response.
 * @param {Object | null} responseSchema - Custom JSON schema (optional, used when jsonOutput=true).
 * @returns {Promise<string>} The text response from the API.
 */
async function callGemini(userQuery, systemInstruction = null, jsonOutput = false, responseSchema = null) {
  if (!apiKey) {
    console.error("Gemini API Key is missing. Cannot make API call.");
    throw new Error("Gemini API Key is missing.");
  }

  // Use v1beta for system instructions and JSON schema support
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ parts: [{ text: userQuery }] }],
  };

  // Use systemInstruction (camelCase) for v1beta
  if (systemInstruction) {
    payload.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  if (jsonOutput) {
    payload.generationConfig = {
      responseMimeType: "application/json",
    };

    if (responseSchema) {
      payload.generationConfig.responseSchema = responseSchema;
    }
  }

  let retries = 0;
  const maxRetries = 3;

  while (retries < maxRetries) {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Gemini API Error: ${response.status} ${response.statusText}`, errorBody);

        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          throw new Error(`HTTP error! status: ${response.status} - ${errorBody}`);
        }

        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const candidate = result.candidates?.[0];

      if (candidate && candidate.content?.parts?.[0]?.text) {
        return candidate.content.parts[0].text;
      } else {
        let reason = candidate?.finishReason || "No content";
        let safetyRatings = candidate?.safetyRatings ? JSON.stringify(candidate.safetyRatings) : "N/A";
        console.error("Invalid response structure from Gemini API:", result);
        throw new Error(`Invalid response structure from API. Finish Reason: ${reason}. Safety Ratings: ${safetyRatings}`);
      }
    } catch (error) {
      console.warn(`API call failed (attempt ${retries + 1}):`, error.message);
      retries++;

      if (retries >= maxRetries) {
        throw new Error(`Failed to call Gemini API after ${maxRetries} attempts: ${error.message}`);
      }

      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
    }
  }

  throw new Error("API call failed after all retries.");
}



// /**
//  * Finds the earliest due date from a list of borrowed copies.
//  * @param {Array} borrowedCopies - The array of borrowed copy objects from a book.
//  * @returns {Date | null} The earliest due date as a Date object, or null if none are valid.
//  */
// const getNextAvailableDate = (borrowedCopies) => {
//   if (!Array.isArray(borrowedCopies) || borrowedCopies.length === 0) {
//     return null;
//   }
//   try {
//     const validDueDates = borrowedCopies
//       .map(c => c.dueDate)
//       .filter(date => date instanceof Date && !isNaN(date));
//     return validDueDates.length > 0 ? new Date(Math.min(...validDueDates.map(date => date.getTime()))) : null;
//   } catch (e) {
//     console.error("Error calculating next available date:", e);
//     return null;
//   }
// };


/**
 * Calculates the due date, skipping Fridays and Saturdays.
 * @param {Date} issueDate The date the book is issued.
 * @returns {Date} The calculated due date.
 */
const calculateDueDate = (issueDate = new Date()) => {
  const dueDate = new Date(issueDate.getTime());
  dueDate.setDate(dueDate.getDate() + 14); // Add 14 days

  const dayOfWeek = dueDate.getDay(); // 0=Sunday, 1=Monday, ..., 5=Friday, 6=Saturday

  if (dayOfWeek === 5) { // If it's Friday
    dueDate.setDate(dueDate.getDate() + 2); // Move to Sunday
  } else if (dayOfWeek === 6) { // If it's Saturday
    dueDate.setDate(dueDate.getDate() + 1); // Move to Sunday
  }

  // Set time to end of day
  dueDate.setHours(23, 59, 59, 999);
  return dueDate;
};
/**
 * Calls the Gemini API with exponential backoff for retries.
 * @param {string} userQuery - The user's prompt.
 * @param {string | null} systemInstruction - The system prompt (optional).
 * @param {boolean} jsonOutput - Whether to request a JSON response.
 * @param {Object | null} responseSchema - Custom JSON schema (optional, used when jsonOutput=true).
 * @returns {Promise<string>} The text response from the API.
 */
if (!apiKey) {
  console.warn("Gemini API Key (VITE_GEMINI_API_KEY) not found in import.meta.env. API calls will fail.");
}

// --- Helper Components ---

// const LoadingSpinner 
<LoadingSpinner />

const Modal = ({ title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel" }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{message}</p>
      <div className="flex justify-end space-x-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md font-medium hover:bg-gray-300 transition-colors"
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition-colors"
        >
          {confirmText}
        </button>
      </div>
    </div>
  </div>
);

const InfoModal = ({ title, content, onClose, isLoading }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="text-sm text-gray-600 mb-6 min-h-[100px]">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" role="status">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{content}</p>
        )}
      </div>
      <div className="flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  </div>
);

// --- Auth Components ---

// const LoginScreen

// import NotFound from './pages/NotFound'


const AuthContainer = ({ onLogin, onSignUp, authError }) => {
  const [isLoginView, setIsLoginView] = useState(true);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <h1 className="text-3xl font-bold text-center text-indigo-800 mb-6">
          AIMGENIX Library
        </h1>
        {isLoginView ? (
          <LoginScreen
            onLogin={onLogin}
            onSwitchToSignUp={() => setIsLoginView(false)}
            error={authError}
          />
        ) : (
          <SignUpScreen
            onSignUp={onSignUp}
            onSwitchToLogin={() => setIsLoginView(true)}
            error={authError}
          />
        )}
      </div>
    </div>
  );
};

// --- Library Components ---

/**
 * Chatbot Modal Component
 */
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

/**
 * Chatbot Launcher Component
 */
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

// --- Role-Based Components ---

/**
 * Book Card (Reader View)
 */
// const BookCard 

//   const handleSummarize 

/**
 * My Borrowed Book Card (Reader View)
 */
// const MyBookCard 

/**
 * Book Management Item (Librarian View)
 */
// const LibrarianBookItem 

/**
 * Main View for Readers
 */
// const ReaderView

/**
 * Main View for Librarians
 */
// const LibrarianDashboard 

/**
 * User Role Management Item (Admin View)
 */
// const UserRoleItem 


/**
 * Main View for Admins
 */
// const AdminUserManagement 


/**
 * Main App Header
 */


// Main App Content Component (handles routing logic)
const AppContent = ({
  books, userId, userRole, userEmail,
  onAddBook, onDelete, onUpdate, onBorrow, onReturn,
  isSubmitting, error, setError,
  allUsers, loadingUsers, onUpdateRole,
  loadingBooks, onSignOut
}) => {
  // Show loading spinner while books are loading
  if (loadingBooks) {
    return <LoadingSpinner />;
  }

  // Display general errors
  if (error) {
    return (
      <div className="text-center p-6 sm:p-10 bg-red-100 border border-red-300 rounded-lg shadow-sm">
        <p className="text-red-700 font-semibold text-lg mb-2">An Application Error Occurred</p>
        <p className="text-red-600 text-sm">{error}</p>
        <button
          onClick={() => setError(null)}
          className="mt-4 px-3 py-1 bg-red-200 text-red-800 rounded-md text-sm hover:bg-red-300"
        >
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <>
      <AppHeader
        onSignOut={onSignOut}
        userEmail={userEmail}
        userRole={userRole}
      />

      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route
            path="/login"
            element={userId ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute isAuthenticated={!!userId} userRole={userRole}>
                {userRole === 'admin' ? (
                  <div className="space-y-8">
                    <AdminUserManagement
                      allUsers={allUsers}
                      loadingUsers={loadingUsers}
                      onUpdateRole={onUpdateRole}
                      currentUserId={userId}
                    />
                    <LibrarianDashboard
                      books={books}
                      onAddBook={onAddBook}
                      onDelete={onDelete}
                      onUpdate={onUpdate}
                      isSubmitting={isSubmitting}
                    />
                  </div>
                ) : userRole === 'librarian' ? (
                  <LibrarianDashboard
                    books={books}
                    onAddBook={onAddBook}
                    onDelete={onDelete}
                    onUpdate={onUpdate}
                    isSubmitting={isSubmitting}
                  />
                ) : userRole === 'reader' ? (
                  <ReaderView
                    books={books}
                    userId={userId}
                    onBorrow={onBorrow}
                    onReturn={onReturn}
                  />
                ) : (
                  <p className="text-center text-red-600 font-semibold p-10">Error: Unknown user role assigned.</p>
                )}
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to={userId ? "/dashboard" : "/login"} replace />} />
        </Routes>
      </main>

      <Chatbot />
    </>
  );
};

export default function App() {
  // App State
  const [books, setBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [submitting, setSubmitting] = useState(false); // For add book form
  const [error, setError] = useState(null); // General app error display

  // Auth State
  const [authLoading, setAuthLoading] = useState(true); // Initial auth check
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'reader', 'librarian', or 'admin'
  const [authError, setAuthError] = useState(null); // Specifically for login/signup errors

  // Admin State
  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true); // Initial state should be true


  // --- Authentication Effect ---
  useEffect(() => {
    // Check if Firebase config looks valid before proceeding
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith("MISSING") || firebaseConfig.apiKey.startsWith("PARSE")) {
      console.error("Invalid Firebase configuration detected. Halting auth setup.");
      setAuthError("Firebase Configuration Error. Check .env file and console.");
      setAuthLoading(false);
      return; // Stop execution if config is bad
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthLoading(true); // Set loading true at the start of check
      // Clear errors from previous state on new auth check
      setAuthError(null);
      setError(null);
      if (user) {
        // User is potentially logged in, try fetching role
        try {
          const userDocRef = doc(db, usersCollectionPath, user.uid);
          console.log("Attempting to fetch user doc:", userDocRef.path);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log("Fetched user role:", userData.role);
            if (['reader', 'librarian', 'admin'].includes(userData.role)) {
              // Successfully authenticated and role found
              setUserId(user.uid); // Set user ID only after role is confirmed
              setUserEmail(user.email);
              setUserRole(userData.role);
            } else {
              // Role in DB is invalid
              console.error("Invalid user role found in Firestore:", userData.role);
              setAuthError("Your account has an invalid role. Contact support.");
              await signOut(auth); // Sign out user with bad role
              // Clear state manually after sign out
              setUserId(null); setUserEmail(null); setUserRole(null);
            }
          } else {
            // User exists in Auth, but not in Firestore (e.g., signup interrupted)
            console.error("User doc not found in collection:", usersCollectionPath, "for UID:", user.uid);
            // Provide a specific error for this case
            setAuthError("Your user account is not fully set up. Please sign up again or contact support.");
            // Don't set auth error, allow login screen to show for signup retry
            // Sign out the user from Auth since they don't have a valid role doc
            await signOut(auth);
            setUserId(null); setUserEmail(null); setUserRole(null);
          }
        } catch (err) {
          // Error fetching the role document
          console.error("Error fetching user role:", err);
          if (err.code === 'unavailable' || err.message.includes('offline')) {
            setAuthError("Cannot connect to the database to verify user role. Check connection.");
          } else {
            setAuthError("Error verifying user data.");
          }
          // Sign out if role fetch fails critically
          await signOut(auth);
          setUserId(null); setUserEmail(null); setUserRole(null);
        }

      } else {
        // User is signed out (or never logged in)
        setUserId(null);
        setUserEmail(null);
        setUserRole(null);
      }
      setAuthLoading(false); // Set loading false after check completes
    });

    // Cleanup function
    return () => {
      console.log("Cleaning up auth listener.");
      unsubscribe();
    }
  }, []); // Empty dependency array means this runs once on mount

  // --- Firestore Data Effect (Books) ---
  useEffect(() => {
    // Only fetch if authenticated, role is determined, and auth check is complete
    if (!userId || !userRole || authLoading) {
      setBooks([]);
      setLoadingBooks(false); // Ensure loading is false if we don't fetch
      return () => { }; // Return an empty cleanup function if listener not attached
    }

    setLoadingBooks(true);
    setError(null); // Clear previous errors when starting fetch
    const booksCollectionRef = collection(db, booksCollectionPath);
    console.log("Setting up Firestore listener for Books at path:", booksCollectionPath);

    const q = query(booksCollectionRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log("Received Book snapshot with", snapshot.docs.length, "docs.");
      const booksData = snapshot.docs.map(docSnapshot => {
        const data = docSnapshot.data();
        // More robust validation and type conversion
        return {
          id: docSnapshot.id,
          title: typeof data.title === 'string' ? data.title : 'Unknown Title',
          author: typeof data.author === 'string' ? data.author : 'Unknown Author',
          genre: typeof data.genre === 'string' ? data.genre : 'Unknown Genre',
          rack: typeof data.rack === 'string' ? data.rack : 'Unknown Rack',
          totalQuantity: typeof data.totalQuantity === 'number' && data.totalQuantity >= 0 ? data.totalQuantity : 0,
          availableQuantity: typeof data.availableQuantity === 'number' && data.availableQuantity >= 0 ? data.availableQuantity : 0,
          // Ensure borrowedCopies is an array and filter/map safely
          borrowedCopies: Array.isArray(data.borrowedCopies) ? data.borrowedCopies.map(copy => {
            // Validate each copy object
            const issueDate = copy.issueDate?.toDate ? copy.issueDate.toDate() : null;
            const dueDate = copy.dueDate?.toDate ? copy.dueDate.toDate() : null;
            if (issueDate instanceof Date && !isNaN(issueDate) &&
              dueDate instanceof Date && !isNaN(dueDate) &&
              typeof copy.userId === 'string' && copy.userId &&
              typeof copy.borrowId === 'string' && copy.borrowId) {
              return {
                userId: copy.userId,
                borrowId: copy.borrowId,
                issueDate: issueDate,
                dueDate: dueDate
              };
            }
            return null; // Mark invalid copy structures as null
          }).filter(copy => copy !== null) // Filter out the invalid ones
            : [],
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : null
        };
      });

      setBooks(booksData); // Let sorting happen in the components using useMemo
      setLoadingBooks(false);
      setError(null); // Clear previous errors on success
    }, (err) => {
      console.error("Error fetching library books:", err);
      if (err.code === 'permission-denied') {
        setError("Permission denied fetching books. Check Firestore rules.");
      } else if (err.code === 'unavailable' || err.message.includes('offline')) {
        setError("Cannot connect to the database to fetch books. Check your internet connection.");
      } else {
        setError(`Error fetching library books: ${err.message}. Check console for details.`);
      }
      setLoadingBooks(false);
      setBooks([]); // Clear books on error
    });

    // Cleanup listener on component unmount or when dependencies change
    return () => {
      console.log("Cleaning up Firestore Book listener.");
      unsubscribe();
    };
  }, [userId, userRole]); // Re-run when user changes

  // --- Firestore Data Effect (All Users - for Admin) ---
  useEffect(() => {
    // Only fetch if user is admin and auth is complete
    if (userRole !== 'admin' || !userId || authLoading) {
      setAllUsers([]);
      setLoadingUsers(false); // Ensure loading is false if not fetching
      return () => { }; // Return empty cleanup
    }

    setLoadingUsers(true);
    setError(null); // Clear previous errors
    const usersCollectionRef = collection(db, usersCollectionPath);
    console.log("Setting up Firestore listener for Users at path:", usersCollectionPath);

    const q = query(usersCollectionRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log("Received User snapshot with", snapshot.docs.length, "docs.");
      const usersData = snapshot.docs.map(docSnapshot => {
        const data = docSnapshot.data();
        // Basic validation
        return {
          id: docSnapshot.id,
          email: typeof data.email === 'string' ? data.email : 'No Email',
          role: ['reader', 'librarian', 'admin'].includes(data.role) ? data.role : 'reader', // Default invalid roles
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : null
        };
      });

      setAllUsers(usersData); // Let sorting happen in the component using useMemo
      setLoadingUsers(false);
      setError(null); // Clear errors on success
    }, (err) => {
      console.error("Error fetching all users:", err);
      if (err.code === 'permission-denied') {
        setError("Permission denied fetching users. Check Firestore rules.");
      } else if (err.code === 'unavailable' || err.message.includes('offline')) {
        setError("Cannot connect to the database to fetch users. Check your internet connection.");
      } else {
        setError(`Error fetching user list: ${err.message}. Check console for details.`);
      }
      setLoadingUsers(false);
      setAllUsers([]); // Clear users on error
    });

    // Cleanup listener
    return () => {
      console.log("Cleaning up Firestore User listener.");
      unsubscribe();
    };
  }, [userId, userRole, authLoading]); // Re-run when user/role changes or auth finishes


  // --- Auth Actions ---

  // const handleSignUp

  // const handleLogin

  // const handleSignOut

  // --- Admin Action ---

  const handleUpdateUserRole = async (targetUserId, newRole) => {
    setError(null); // Clear general errors
    console.log(`Attempting to update user ${targetUserId} to role ${newRole}`);

    // Basic validation
    if (!['reader', 'librarian', 'admin'].includes(newRole)) {
      console.error("Invalid role specified:", newRole);
      setError("Invalid role selected.");
      throw new Error("Invalid role selected.");
    }

    if (targetUserId === userId) {
      console.warn("Admin attempted to change their own role. Action blocked.");
      setError("Cannot change your own role."); // Inform user
      throw new Error("Cannot change own role."); // Throw to handle in calling component
    }

    try {
      const userDocRef = doc(db, usersCollectionPath, targetUserId);
      await updateDoc(userDocRef, {
        role: newRole
      });
      console.log("User role update successful in Firestore.");
      // Firestore listener should automatically update the UI state
    } catch (e) {
      console.error("Error updating user role in Firestore:", e);
      if (e.code === 'permission-denied') {
        setError("Permission denied to update user role. Check Firestore rules.");
      } else {
        setError(`Failed to update user role: ${e.message}`);
      }
      throw e; // Re-throw error so component can handle UI state
    }
  };

  // --- Firestore Actions (Books) ---

  const addBook = async (book) => {
    // Check permissions
    if (!userId || (userRole !== 'librarian' && userRole !== 'admin')) {
      setError("Permission denied: Only Librarians and Admins can add books.");
      console.warn("Permission denied for addBook action by user:", userId, "with role:", userRole);
      return;
    }
    setSubmitting(true);
    setError(null); // Clear previous errors
    try {
      // Add client-side timestamp for createdAt
      const docRef = await addDoc(collection(db, booksCollectionPath), {
        ...book,
        createdAt: new Date()
      });
      console.log("Book added with ID:", docRef.id, book.title);
    } catch (e) {
      console.error("Error adding document: ", e);
      if (e.code === 'permission-denied') {
        setError("Permission denied to add book. Check Firestore rules.");
      } else {
        setError(`Failed to add book: ${e.message}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const deleteBook = async (id) => {
    // Check permissions
    if (!userId || (userRole !== 'librarian' && userRole !== 'admin')) {
      setError("Permission denied: Only Librarians and Admins can delete books.");
      console.warn("Permission denied for deleteBook action by user:", userId, "with role:", userRole);
      return;
    }
    setError(null);
    try {
      await deleteDoc(doc(db, booksCollectionPath, id));
      console.log("Deleted book:", id);
    } catch (e) {
      console.error("Error deleting document: ", e);
      if (e.code === 'permission-denied') {
        setError("Permission denied to delete book. Check Firestore rules.");
      } else {
        setError(`Failed to delete book: ${e.message}`);
      }
    }
  };

  const updateBook = async (updatedBook) => {
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

  const handleBorrow = async (bookId) => {
    // Check permissions
    if (!userId || userRole !== 'reader') {
      setError("Permission denied: Only Readers can borrow books.");
      console.warn("Permission denied for handleBorrow action by user:", userId, "with role:", userRole);
      return;
    }
    const bookDocRef = doc(db, booksCollectionPath, bookId);
    setError(null);

    try {
      await runTransaction(db, async (transaction) => {
        const bookDoc = await transaction.get(bookDocRef);
        if (!bookDoc.exists()) throw new Error("Book document does not exist!");

        const bookData = bookDoc.data();

        // Add more robust checks within transaction
        if (typeof bookData.availableQuantity !== 'number' || bookData.availableQuantity <= 0) {
          throw new Error("Book is not available or quantity is invalid.");
        }

        const currentBorrowedCopies = Array.isArray(bookData.borrowedCopies) ? bookData.borrowedCopies : [];
        const hasBorrowed = currentBorrowedCopies.some(c => c.userId === userId);
        if (hasBorrowed) throw new Error("You have already borrowed this book.");

        const newIssueDate = new Date();
        const newDueDate = calculateDueDate(newIssueDate);

        const newBorrowCopy = {
          userId: userId,
          issueDate: newIssueDate, // Store as JS Date, Firestore converts to Timestamp
          dueDate: newDueDate,   // Store as JS Date, Firestore converts to Timestamp
          borrowId: crypto.randomUUID() // Unique ID for this specific borrow instance
        };

        const newBorrowedCopies = [...currentBorrowedCopies, newBorrowCopy];

        transaction.update(bookDocRef, {
          availableQuantity: bookData.availableQuantity - 1,
          borrowedCopies: newBorrowedCopies
        });
        console.log(`Transaction update prepared for borrowing book ${bookId} by user ${userId}`);
      });
      console.log("Book borrowed successfully!");
    } catch (e) {
      console.error("Borrow transaction failed: ", e);
      // Provide specific error messages if possible
      if (e.message.includes("already borrowed")) {
        setError("You have already borrowed this book.");
      } else if (e.message.includes("not available")) {
        setError("This book is currently not available.");
      } else {
        setError(`Failed to borrow book: ${e.message}`);
      }
    }
  };

  const handleReturn = async (bookId, borrowId) => {
    // Check permissions
    if (!userId || userRole !== 'reader') {
      setError("Permission denied: Only Readers can return books.");
      console.warn("Permission denied for handleReturn action by user:", userId, "with role:", userRole);
      return;
    }
    const bookDocRef = doc(db, booksCollectionPath, bookId);
    setError(null);

    try {
      await runTransaction(db, async (transaction) => {
        const bookDoc = await transaction.get(bookDocRef);
        if (!bookDoc.exists()) throw new Error("Book document does not exist!");

        const bookData = bookDoc.data();

        // Ensure data integrity
        const currentBorrowedCopies = Array.isArray(bookData.borrowedCopies) ? bookData.borrowedCopies : [];
        const totalQuantity = typeof bookData.totalQuantity === 'number' ? bookData.totalQuantity : 0;
        let currentAvailableQuantity = typeof bookData.availableQuantity === 'number' ? bookData.availableQuantity : 0;

        const borrowIndex = currentBorrowedCopies.findIndex(c => c.userId === userId && c.borrowId === borrowId);

        if (borrowIndex === -1) {
          // If the record isn't found, maybe it was already returned or there's an issue.
          console.warn(`Borrow record not found for user ${userId} and borrowId ${borrowId} on book ${bookId}. Current copies:`, currentBorrowedCopies);
          throw new Error("Could not find this specific borrow record to return. It might have already been returned.");
        }

        // Create the new array without the returned copy
        const newBorrowedCopies = [
          ...currentBorrowedCopies.slice(0, borrowIndex),
          ...currentBorrowedCopies.slice(borrowIndex + 1)
        ];

        // Only increment available quantity if it makes sense (safety check)
        const newAvailableQuantity = Math.min(totalQuantity, currentAvailableQuantity + 1);

        transaction.update(bookDocRef, {
          availableQuantity: newAvailableQuantity,
          borrowedCopies: newBorrowedCopies
        });
        console.log(`Transaction update prepared for returning book ${bookId} by user ${userId}`);
      });
      console.log("Book returned successfully!");
    } catch (e) {
      console.error("Return transaction failed: ", e);
      setError(`Failed to return book: ${e.message}`);
    }
  };

  // --- Main Render Logic ---

  // Show loading spinner during initial auth check AND if firebase config is invalid
  if (authLoading || (!firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith("MISSING") || firebaseConfig.apiKey.startsWith("PARSE"))) {
    // If config error, show specific message instead of just spinner
    if (!authLoading && authError?.includes("Firebase Configuration Error")) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-red-50 text-red-800">
          <h2 className="text-xl font-semibold mb-2">Configuration Error</h2>
          <p>{authError}</p>
          <p className="mt-2 text-sm">Please ensure your <code>.env</code> file is correctly set up with <code>VITE_FIREBASE_CONFIG</code>.</p>
        </div>
      );
    }
    return <LoadingSpinner fullScreen={true} />;
  }

  // If not authenticated (and config is valid), show Login/Sign Up
  if (!userId) {
    return (
      <AuthContainer
        onLogin={handleLogin}
        onSignUp={handleSignUp}
        authError={authError} // Pass down auth-specific errors
      />
    );
  }

  // Authenticated, but role might still be loading or errored after auth check
  if (!userRole) {
    // This state should ideally be brief if role fetch succeeds/fails quickly
    // If authError occurred during role fetch, display it
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600">Verifying user role...</p>
        {authError && <p className="mt-2 text-red-600 text-center">{authError}</p>}
        <button
          onClick={HandleSignOut}
          className="mt-4 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
        >
          Sign Out and Retry Login
        </button>
      </div>
    );
  }


  // Main App layout for authenticated users
  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 min-h-screen font-inter">
      <div className="container mx-auto max-w-5xl p-4 sm:p-6 lg:p-8 pb-24">
        <Router>
          <AppContent
            books={books}
            userId={userId}
            userRole={userRole}
            userEmail={userEmail}
            onAddBook={addBook}
            onDelete={deleteBook}
            onUpdate={updateBook}
            onBorrow={handleBorrow}
            onReturn={handleReturn}
            isSubmitting={submitting}
            error={error}
            setError={setError}
            allUsers={allUsers}
            loadingUsers={loadingUsers}
            onUpdateRole={handleUpdateUserRole}
            loadingBooks={loadingBooks}
            onSignOut={() => HandleSignOut(auth, { setBooks, setAllUsers })}
          />
        </Router>
      </div>
    </div>
  );
}
