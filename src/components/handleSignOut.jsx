// import { signOut } from "firebase/auth";
// import { useState } from "react";
// import { auth } from "../config/firebase";


// function HandleSignOut({ setBooks, setAllUsers }) {
//     const [authError, setAuthError] = useState("");
//     const [loading, setLoading] = useState(false);

//     const handleSignOutClick = async () => {
//         setAuthError("");
//         setLoading(true);

//         try {
//             await signOut(auth);

//             // Clear app data
//             if (setBooks) setBooks([]);
//             if (setAllUsers) setAllUsers([]);

//             alert("✅ Signed out successfully!");
//         } catch (error) {
//             console.error("Error signing out:", error);
//             setAuthError("Sign-out failed. Please try again.");
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div style={{ maxWidth: 400, margin: "2rem auto", textAlign: "center" }}>
//             <button
//                 onClick={handleSignOutClick}
//                 disabled={loading}
//                 style={{ width: "100%", padding: "10px" }}
//             >
//                 {loading ? "Signing Out..." : "Sign Out"}
//             </button>

//             {authError && <p style={{ color: "red", marginTop: "10px" }}>{authError}</p>}
//         </div>
//     );
// }

// export default HandleSignOut;
// handleSignOut.jsx
import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";

/**
 * Handles user sign-out.
 * @param {Object} params
 * @param {Function} [params.setBooks] - Optional setter to clear books state.
 * @param {Function} [params.setAllUsers] - Optional setter to clear users state.
 */
export const handleSignOut = async ({ setBooks, setAllUsers } = {}) => {
  try {
    await signOut(auth);

    // Clear app data if setters provided
    if (setBooks) setBooks([]);
    if (setAllUsers) setAllUsers([]);

    // alert("✅ Signed out successfully!");
  } catch (error) {
    console.error("Error signing out:", error);
    alert("Sign-out failed. Please try again.");
  }
};
export default handleSignOut;   