import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../config/firebase";

/**
 * Plain helper function to handle Firebase login.
 * Throws the original Firebase error for proper error handling in the UI.
 */
async function handleLogin(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential;
    } catch (error) {
        // Re-throw the error with all its properties intact
        throw error;
    }
}

export default handleLogin;