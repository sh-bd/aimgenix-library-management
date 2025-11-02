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
import AppHeader from "./components/AppHeader";
import AuthContainer from './components/AuthContainer';
import Chatbot from './components/Chatbot';
import FineManagementView from './components/FineManagementView';
import handleAddUser from './components/handleAddUser';
import handleBorrowWithHistory from './components/handleBorrowWithHistory';
import handleLogin from "./components/handleLogin";
import handleReturnWithHistory from './components/handleReturnWithHistory';
import HandleSignOut from "./components/handleSignOut";
import handleSignUp from "./components/handleSignUp";
import addBook from './components/librarian/addBook';
import deleteBook from './components/librarian/deleteBook';
import LoadingSpinner from "./components/LoadingSpinner";
import ManualBorrowView from './components/ManualBorrowView';
import ProtectedRoute from "./components/ProtectedRoute";
import { auth, booksCollectionPath, db, firebaseConfig, usersCollectionPath } from "./config/firebase";
import AdminDashboard from './pages/AdminDashboard';
import BookDetails from './pages/BookDetails';
import BorrowedBooksView from './pages/BorrowedBooksView';
import LibrarianDashboard from "./pages/LibrarianDashboard";
import ReaderView from "./pages/ReaderDashboard";

export default function App() {
  // --- App State ---
  const [books, setBooks] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // --- Auth State ---
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // --- Admin State ---
  const [loadingUsers, setLoadingUsers] = useState(true);

  // --- Authentication Effect ---
  useEffect(() => {
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith("MISSING") || firebaseConfig.apiKey.startsWith("PARSE")) {
      console.error("Invalid Firebase configuration detected. Halting auth setup.");
      setAuthError("Firebase Configuration Error. Check .env file and console.");
      setAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthLoading(true);
      setAuthError(null);
      setError(null);

      if (user) {
        try {
          const userDocRef = doc(db, usersCollectionPath, user.uid);
          console.log("Attempting to fetch user doc:", userDocRef.path);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log("Fetched user role:", userData.role);

            if (['reader', 'librarian', 'admin'].includes(userData.role)) {
              setUserId(user.uid);
              setUserEmail(user.email);
              setUserRole(userData.role);
            } else {
              console.error("Invalid user role found in Firestore:", userData.role);
              setAuthError("Your account has an invalid role. Contact support.");
              await signOut(auth);
              setUserId(null);
              setUserEmail(null);
              setUserRole(null);
            }
          } else {
            console.error("User doc not found in collection:", usersCollectionPath, "for UID:", user.uid);
            setAuthError("Your user account is not fully set up. Please sign up again or contact support.");
            await signOut(auth);
            setUserId(null);
            setUserEmail(null);
            setUserRole(null);
          }
        } catch (err) {
          console.error("Error fetching user role:", err);

          if (err.code === 'unavailable' || err.message.includes('offline')) {
            setAuthError("Cannot connect to the database to verify user role. Check connection.");
          } else {
            setAuthError("Error verifying user data.");
          }

          await signOut(auth);
          setUserId(null);
          setUserEmail(null);
          setUserRole(null);
        }
      } else {
        setUserId(null);
        setUserEmail(null);
        setUserRole(null);
      }

      setAuthLoading(false);
    });

    return () => {
      console.log("Cleaning up auth listener.");
      unsubscribe();
    }
  }, []);

  // --- Firestore Data Effect (Books) ---
  useEffect(() => {
    if (!userId || !userRole || authLoading) {
      setBooks([]);
      setLoading(false);
      return () => { };
    }

    setLoading(true);
    setError(null);
    const booksCollectionRef = collection(db, booksCollectionPath);
    console.log("Setting up Firestore listener for Books at path:", booksCollectionPath);

    const q = query(booksCollectionRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log("Received Book snapshot with", snapshot.docs.length, "docs.");
      const booksData = snapshot.docs.map(docSnapshot => {
        const data = docSnapshot.data();
        return {
          id: docSnapshot.id,
          title: typeof data.title === 'string' ? data.title : 'Unknown Title',
          author: typeof data.author === 'string' ? data.author : 'Unknown Author',
          genre: typeof data.genre === 'string' ? data.genre : 'Unknown Genre',
          rack: typeof data.rack === 'string' ? data.rack : 'Unknown Rack',
          totalQuantity: typeof data.totalQuantity === 'number' && data.totalQuantity >= 0 ? data.totalQuantity : 0,
          availableQuantity: typeof data.availableQuantity === 'number' && data.availableQuantity >= 0 ? data.availableQuantity : 0,
          borrowedCopies: Array.isArray(data.borrowedCopies) ? data.borrowedCopies.map(copy => {
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
            return null;
          }).filter(copy => copy !== null) : [],
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : null
        };
      });

      setBooks(booksData);
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error("Error fetching library books:", err);

      if (err.code === 'permission-denied') {
        setError("Permission denied fetching books. Check Firestore rules.");
      } else if (err.code === 'unavailable' || err.message.includes('offline')) {
        setError("Cannot connect to the database to fetch books. Check your internet connection.");
      } else {
        setError(`Error fetching library books: ${err.message}. Check console for details.`);
      }

      setLoading(false);
      setBooks([]);
    });

    return () => {
      console.log("Cleaning up Firestore Book listener.");
      unsubscribe();
    };
  }, [userId, userRole]);

  // --- Firestore Data Effect (All Users - for Admin AND Librarian) ---
  useEffect(() => {
    // ✅ CHANGE: Allow both admin AND librarian to fetch users
    if ((userRole !== 'admin' && userRole !== 'librarian') || !userId || authLoading) {
      setAllUsers([]);
      setLoadingUsers(false);
      return () => { };
    }

    setLoadingUsers(true);
    setError(null);
    const usersCollectionRef = collection(db, usersCollectionPath);
    console.log("✅ Setting up Firestore listener for Users at path:", usersCollectionPath);

    const q = query(usersCollectionRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log("✅ Received User snapshot with", snapshot.docs.length, "docs.");
      const usersData = snapshot.docs.map(docSnapshot => {
        const data = docSnapshot.data();
        return {
          id: docSnapshot.id,
          email: typeof data.email === 'string' ? data.email : 'No Email',
          name: typeof data.name === 'string' ? data.name : data.email?.split('@')[0] || 'Unknown',
          role: ['reader', 'librarian', 'admin'].includes(data.role) ? data.role : 'reader',
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : null
        };
      });

      setAllUsers(usersData);
      setLoadingUsers(false);
      setError(null);
      console.log('✅ All Users loaded:', usersData);
      console.log('✅ Readers found:', usersData.filter(u => u.role === 'reader'));
    }, (err) => {
      console.error("❌ Error fetching all users:", err);

      if (err.code === 'permission-denied') {
        setError("Permission denied fetching users. Check Firestore rules.");
      } else if (err.code === 'unavailable' || err.message.includes('offline')) {
        setError("Cannot connect to the database to fetch users. Check your internet connection.");
      } else {
        setError(`Error fetching user list: ${err.message}. Check console for details.`);
      }

      setLoadingUsers(false);
      setAllUsers([]);
    });

    return () => {
      console.log("Cleaning up Firestore User listener.");
      unsubscribe();
    };
  }, [userId, userRole, authLoading]);

  // --- Auth Action Wrappers ---
  const handleSignUpWrapper = async (email, password) => {
    return await handleSignUp(email, password, setAuthError);
  };

  const handleLoginWrapper = async (email, password) => {
    return await handleLogin(email, password, setAuthError);
  };

  const handleSignOutWrapper = async () => {
    await HandleSignOut(auth, { setBooks, setAllUsers, setUserId, setUserEmail, setUserRole });
  };

  // --- Admin Action Wrapper ---
  const handleUpdateUserRoleWrapper = async (targetUserId, newRole) => {
    return await handleUpdateUserRole(targetUserId, newRole, setError, userId);
  };

  const handleAddUserWrapper = async (email, password, role) => {
    return await handleAddUser(email, password, role, userId, userRole);
  };

  // --- Firestore Action Wrappers ---
  const addBookWrapper = async (bookData) => {
    setSubmitting(true);
    setError('');
    const result = await addBook(bookData, userId, userRole);

    if (result.success) {
      console.log('Book added successfully!');
    } else {
      setError(result.error || 'Failed to add book');
    }

    setSubmitting(false);
    return result;
  };

  const deleteBookWrapper = async (bookId) => {
    return await deleteBook(bookId, userId, userRole, setError);
  };

  const updateBook = async (updatedBook) => {
    if (!userId || (userRole !== 'librarian' && userRole !== 'admin')) {
      setError("Permission denied: Only Librarians and Admins can update books.");
      console.warn("Permission denied for updateBook action by user:", userId, "with role:", userRole);
      return;
    }

    setError(null);

    try {
      const bookDocRef = doc(db, booksCollectionPath, updatedBook.id);
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

  // Update handleBorrowWrapper to include book title
  const handleBorrowWrapper = async (bookId, bookTitle) => {
    console.log('🎯 BORROW WRAPPER: Starting borrow process');
    console.log('📦 Parameters:', { bookId, bookTitle, userId, userEmail });

    // ✅ Pass all required parameters including bookTitle
    const result = await handleBorrowWithHistory(bookId, userId, userEmail, bookTitle);

    console.log('📦 Borrow result:', result);
    return result;
  };

  // Make sure your wrapper passes the correct parameters
  const handleReturnWrapper = async (bookId, borrowRecord) => {
    console.log('🔍 handleReturnWrapper called with:', { bookId, borrowRecord });

    // ✅ Pass the FULL borrowRecord object, not just userId
    const result = await handleReturnWithHistory(bookId, borrowRecord);

    console.log('📦 Return result:', result);
    return result;
  };

  // --- AppContent Component ---
  const AppContent = ({
    books, userId, userRole, userEmail,
    onAddBook, onDelete, onUpdate, onBorrow, onReturn,
    isSubmitting, error, setError,
    allUsers, loadingUsers, onUpdateRole, onAddUser,
    loadingBooks, // ✅ ADD THIS PARAMETER
    onSignOut
  }) => {
    if (loadingBooks) {
      return <LoadingSpinner />;
    }

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
          userId={userId}
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
                    <AdminDashboard
                      books={books}
                      userId={userId}
                      userRole={userRole}
                      onAddBook={onAddBook}
                      onDelete={onDelete}
                      onUpdate={onUpdate}
                      isSubmitting={isSubmitting}
                      allUsers={allUsers}
                      loadingUsers={loadingUsers}
                      onUpdateRole={onUpdateRole}
                      onAddUser={onAddUser}
                    />
                  ) : userRole === 'librarian' ? (
                    <LibrarianDashboard
                      books={books}
                      userId={userId}
                      userRole={userRole}
                      onAddBook={onAddBook}
                      onDelete={onDelete}
                      onUpdate={onUpdate}
                      isSubmitting={isSubmitting}
                      onAddUser={onAddUser}
                      allUsers={allUsers}
                    />
                  ) : userRole === 'reader' ? (
                    <ReaderView
                      books={books}
                      userId={userId}
                      userEmail={userEmail}
                      onBorrow={onBorrow}
                      onReturn={onReturn}
                      onUpdate={onUpdate}
                      onDelete={onDelete}
                    />
                  ) : (
                    <p className="text-center text-red-600 font-semibold p-10">
                      Error: Unknown user role assigned.
                    </p>
                  )}
                </ProtectedRoute>
              }
            />

            <Route
              path="/book/:bookId"
              element={
                <ProtectedRoute isAuthenticated={!!userId} userRole={userRole}>
                  <BookDetails
                    userId={userId}
                    userRole={userRole}
                    onBorrow={onBorrow}
                    onReturn={onReturn}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                  />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/manual-borrow"
              element={
                userRole === 'admin' || userRole === 'librarian' ? (
                  <ManualBorrowView
                    books={books}
                    allUsers={allUsers}
                    performedBy={userId}
                  />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            <Route
              path="/librarian/manual-borrow"
              element={
                userRole === 'librarian' ? (
                  <ManualBorrowView
                    books={books}
                    allUsers={allUsers}
                    performedBy={userId}
                  />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            <Route
              path="/borrowed-books"
              element={
                userRole === 'admin' || userRole === 'librarian' ? (
                  <BorrowedBooksView
                    userRole={userRole}
                    userId={userId}
                  />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            <Route
              path="/admin/fines"
              element={
                userRole === 'admin' || userRole === 'librarian' ? (
                  <FineManagementView allUsers={allUsers} />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            <Route
              path="/librarian/fines"
              element={
                userRole === 'librarian' ? (
                  <FineManagementView allUsers={allUsers} />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            <Route path="*" element={<Navigate to={userId ? "/dashboard" : "/login"} replace />} />
          </Routes>
        </main>

        <Chatbot
          userId={userId}
          userRole={userRole}
          userEmail={userEmail}
        />
      </>
    );
  };

  // --- Main Render Logic ---
  if (authLoading || (!firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith("MISSING") || firebaseConfig.apiKey.startsWith("PARSE"))) {
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

  if (!userId) {
    return (
      <AuthContainer
        onLogin={handleLoginWrapper}
        onSignUp={handleSignUpWrapper}
        authError={authError}
      />
    );
  }

  if (!userRole) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600">Verifying user role...</p>
        {authError && <p className="mt-2 text-red-600 text-center">{authError}</p>}
        <button
          onClick={handleSignOutWrapper}
          className="mt-4 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
        >
          Sign Out and Retry Login
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 min-h-screen font-inter">
      <div className="container mx-auto max-w-5xl p-4 sm:p-6 lg:p-8 pb-24">
        <Router>
          <AppContent
            books={books}
            userId={userId}
            userRole={userRole}
            userEmail={userEmail}
            onAddBook={addBookWrapper}
            onDelete={deleteBookWrapper}
            onUpdate={updateBook}
            onBorrow={handleBorrowWrapper}
            onReturn={handleReturnWrapper}
            isSubmitting={submitting}
            error={error}
            setError={setError}
            allUsers={allUsers}
            loadingUsers={loadingUsers}
            onUpdateRole={handleUpdateUserRoleWrapper}
            onAddUser={handleAddUserWrapper}
            loadingBooks={loading} 
            onSignOut={handleSignOutWrapper}
          />
        </Router>
      </div>
    </div>
  );
}