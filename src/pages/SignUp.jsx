// SignUpScreen.jsx
import { useState } from "react";
import { signUpUser } from "../components/handleSignUp";

const SignUpScreen = ({ onSwitchToLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("reader");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await signUpUser(email, password, role);
      alert("✅ Account created successfully!");
      setEmail("");
      setPassword("");
    } catch (err) {
      console.error("Sign up error:", err);
      switch (err.code) {
        case "auth/email-already-in-use":
          setError("This email is already in use.");
          break;
        case "auth/invalid-email":
          setError("Please enter a valid email address.");
          break;
        case "auth/weak-password":
          setError("Password should be at least 6 characters.");
          break;
        default:
          setError("Sign-up failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-8 space-y-4 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-center text-gray-800">Sign Up</h2>

      {error && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md text-center">{error}</p>}

      <div>
        <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          id="signup-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />
      </div>

      <div>
        <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <input
          type="password"
          id="signup-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="At least 6 characters"
          required
        />
      </div>

      <div>
        <label htmlFor="signup-role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
        <select
          id="signup-role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="reader">Reader</option>
          <option value="librarian">Librarian</option>
          <option value="admin">Admin</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">Note: "Admin" is for testing. In a real app, this would be set manually.</p>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-2 bg-indigo-600 text-white font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? "Creating Account..." : "Sign Up"}
      </button>

      <p className="text-sm text-center text-gray-600">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-medium text-indigo-600 hover:text-indigo-500"
        >
          Login
        </button>
      </p>
    </form>
  );
};

export default SignUpScreen;
