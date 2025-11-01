import { signOut } from "firebase/auth";

/**
 * Handles user sign-out.
 */
export const handleSignOut = async (auth, { setBooks, setAllUsers, setUserId, setUserEmail, setUserRole } = {}) => {
  try {
    // Clear app data BEFORE sign-out to prevent permission errors
    if (setBooks) setBooks([]);
    if (setAllUsers) setAllUsers([]);
    
    // Sign out (this will trigger Firestore listener cleanup)
    await signOut(auth);
    
    // Clear auth state
    if (setUserId) setUserId(null);
    if (setUserEmail) setUserEmail(null);
    if (setUserRole) setUserRole(null);
    
    console.log("✅ Signed out successfully!");
  } catch (error) {
    // Ignore ERR_BLOCKED_BY_CLIENT and permission errors during sign-out
    if (error.code === 'permission-denied' || 
        error.message?.includes('ERR_BLOCKED_BY_CLIENT') ||
        error.message?.includes('Target id not found')) {
      console.log("✅ Sign-out completed (expected cleanup errors)");
      return;
    }
    
    console.error("❌ Error signing out:", error);
    alert("Sign-out failed. Please try again.");
  }
};

export default handleSignOut;