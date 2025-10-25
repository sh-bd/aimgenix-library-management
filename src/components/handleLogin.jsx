// import { signInWithEmailAndPassword } from "firebase/auth";
// import { useState } from "react";
// import { auth } from "../config/firebase";


// function HandleLogin() {
//     const [email, setEmail] = useState("");
//     const [password, setPassword] = useState("");
//     const [authError, setAuthError] = useState("");
//     const [loading, setLoading] = useState(false);

//     const handleLoginSubmit = async (e) => {
//         e.preventDefault();
//         setAuthError("");
//         setLoading(true);

//         try {
//             await signInWithEmailAndPassword(auth, email, password);
//             alert("✅ Login successful!");
//             setEmail("");
//             setPassword("");
//         } catch (error) {
//             console.error("Error logging in:", error);

//             switch (error.code) {
//                 case "auth/invalid-email":
//                     setAuthError("Please enter a valid email address.");
//                     break;
//                 case "auth/user-not-found":
//                 case "auth/wrong-password":
//                 case "auth/invalid-credential":
//                     setAuthError("Invalid email or password.");
//                     break;
//                 default:
//                     setAuthError("Login failed. Please try again.");
//             }
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <form onSubmit={handleLoginSubmit} style={{ maxWidth: 400, margin: "2rem auto" }}>
//             <h2>Login</h2>
//             <input
//                 type="email"
//                 placeholder="Email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 required
//                 style={{ display: "block", width: "100%", marginBottom: "10px" }}
//             />
//             <input
//                 type="password"
//                 placeholder="Password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 required
//                 style={{ display: "block", width: "100%", marginBottom: "10px" }}
//             />
//             <button type="submit" disabled={loading} style={{ width: "100%" }}>
//                 {loading ? "Logging in..." : "Login"}
//             </button>

//             {authError && <p style={{ color: "red", marginTop: "10px" }}>{authError}</p>}
//         </form>
//     );
// }

// export default HandleLogin;

// handleLogin.js
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../config/firebase";

/**
 * Plain helper function to handle Firebase login.
 * No hooks here, so it can be called safely from any component.
 */
async function handleLogin(email, password) {
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        throw error;
    }
}
export default handleLogin;