import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../config/firebase";

/**
 * Plain helper function to handle Firebase login.
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise} Firebase UserCredential
 * @throws {Error} Firebase authentication error
 */
async function handleLogin(email, password) {
    // Directly return the promise - no need for try-catch if just re-throwing
    return await signInWithEmailAndPassword(auth, email, password);
}

export default handleLogin;