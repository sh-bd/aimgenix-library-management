import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";

/**
 * Plain helper function — no hooks here
 */
export async function signUpUser(email, password, role) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        role,
        createdAt: serverTimestamp(),
    });

    return user;
}

export default signUpUser;