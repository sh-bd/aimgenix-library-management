import { signOut } from "firebase/auth";

/**
 * Handles user sign-out.
 * @param {Object} auth - Firebase auth instance
 * @param {Object} params
 * @param {Function} [params.setBooks] - Optional setter to clear books state.
 * @param {Function} [params.setAllUsers] - Optional setter to clear users state.
 */
export const handleSignOut = async (auth, { setBooks, setAllUsers } = {}) => {
  try {
    await signOut(auth);
    // Clear app data if setters provided
    if (setBooks) setBooks([]);
    if (setAllUsers) setAllUsers([]);
    // console.log("Signed out successfully!");
  } catch (error) {
    console.error("Error signing out:", error);
    alert("Sign-out failed. Please try again.");
  }
};

export default handleSignOut;