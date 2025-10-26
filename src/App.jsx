import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  updateDoc
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import handleUpdateUserRole from "./components/admin/handleUpdateUserRole";
import AdminUserManagement from "./components/AdminUserManagement";
import AppHeader from "./components/AppHeader";
import AuthContainer from './components/AuthContainer';
import Chatbot from './components/Chatbot';
import handleBorrow from './components/handleBorrow';
import handleLogin from "./components/handleLogin";
import handleReturn from './components/handleReturn';
import HandleSignOut from "./components/handleSignOut";
import handleSignUp from "./components/handleSignUp";
import addBook from './components/librarian/addBook';
import deleteBook from './components/librarian/deleteBook';
import LoadingSpinner from "./components/LoadingSpinner";
import ProtectedRoute from "./components/ProtectedRoute";
import { auth, booksCollectionPath, db, firebaseConfig, usersCollectionPath } from "./config/firebase";
import LibrarianDashboard from "./pages/LibrarianDashboard";
import ReaderView from "./pages/ReaderDashboard";

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


// /**
//  * Calculates the due date, skipping Fridays and Saturdays.
//  * @param {Date} issueDate The date the book is issued.
//  * @returns {Date} The calculated due date.
//  */
// const calculateDueDate = (issueDate = new Date()) => {
//   const dueDate = new Date(issueDate.getTime());
//   dueDate.setDate(dueDate.getDate() + 14); // Add 14 days

//   const dayOfWeek = dueDate.getDay(); // 0=Sunday, 1=Monday, ..., 5=Friday, 6=Saturday

//   if (dayOfWeek === 5) { // If it's Friday
//     dueDate.setDate(dueDate.getDate() + 2); // Move to Sunday
//   } else if (dayOfWeek === 6) { // If it's Saturday
//     dueDate.setDate(dueDate.getDate() + 1); // Move to Sunday
//   }

//   // Set time to end of day
//   dueDate.setHours(23, 59, 59, 999);
//   return dueDate;
// };
// /**
//  * Calls the Gemini API with exponential backoff for retries.
//  * @param {string} userQuery - The user's prompt.
//  * @param {string | null} systemInstruction - The system prompt (optional).
//  * @param {boolean} jsonOutput - Whether to request a JSON response.
//  * @param {Object | null} responseSchema - Custom JSON schema (optional, used when jsonOutput=true).
//  * @returns {Promise<string>} The text response from the API.
//  */
// if (!apiKey) {
//   console.warn("Gemini API Key (VITE_GEMINI_API_KEY) not found in import.meta.env. API calls will fail.");
// }

// --- Helper Components ---

// const LoadingSpinner 
<LoadingSpinner />

// const Modal 

// const InfoModal 

// --- Auth Components ---

// const LoginScreen

// const AuthContainer 

// --- Library Components ---

/**
 * Chatbot Modal Component
 */
// const ChatbotModal 

/**
 * Chatbot Launcher Component
 */
// const Chatbot 

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

  // const handleUpdateUserRole

  // --- Firestore Actions (Books) ---

  // const addBook 

  // const deleteBook 

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

  // const handleBorrow 

  // const handleReturn

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
