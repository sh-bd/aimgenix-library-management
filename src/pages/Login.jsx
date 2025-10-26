// LoginScreen.jsx
import { useState } from "react";

const LoginScreen = ({ onLogin, onSwitchToSignUp, error: externalError }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await onLogin(email, password);
      console.log("✅ Login successful");
    } catch (loginError) {
      console.error("Login failed:", loginError);

      // Check for network-related errors first
      if (loginError.code === "auth/network-request-failed" ||
        loginError.message?.includes("network") ||
        loginError.message?.includes("offline") ||
        loginError.message?.includes("INTERNET_DISCONNECTED") ||
        loginError.message?.includes("ERR_INTERNET_DISCONNECTED")) {
        setError("No internet connection. Please check your network and try again.");
      }
      // Check for specific Firebase auth errors
      else if (loginError.code === "auth/invalid-credential" ||
        loginError.code === "auth/wrong-password" ||
        loginError.code === "auth/user-not-found") {
        setError("Invalid email or password. Please try again.");
      }
      else if (loginError.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      }
      else if (loginError.code === "auth/user-disabled") {
        setError("This account has been disabled. Contact support.");
      }
      else if (loginError.code === "auth/too-many-requests") {
        setError("Too many failed login attempts. Please try again later.");
      }
      // Generic fallback
      else {
        setError("Invalid email or password. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Determine if the error is network-related for styling
  const displayError = error || externalError;
  const isNetworkError = displayError && (
    displayError.includes("internet") ||
    displayError.includes("network") ||
    displayError.includes("connection") ||
    displayError.includes("offline")
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto mt-8 space-y-4 p-6 bg-white rounded-lg shadow-md"
    >
      <h2 className="text-2xl font-semibold text-center text-gray-800">Login</h2>

      {displayError && (
        <div className={`text-sm p-3 rounded-md text-center ${isNetworkError
            ? "text-orange-700 bg-orange-100 border border-orange-200"
            : "text-red-600 bg-red-100 border border-red-200"
          }`}>
          {isNetworkError ? (
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
              </svg>
              <span>{displayError}</span>
            </div>
          ) : (
            displayError
          )}
        </div>
      )}

      <div>
        <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          id="login-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          type="password"
          id="login-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
          disabled={isLoading}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-2 bg-indigo-600 text-white font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? "Logging in..." : "Login"}
      </button>

      <p className="text-sm text-center text-gray-600 mt-4">
        Don't have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToSignUp}
          className="font-medium text-indigo-600 hover:text-indigo-500"
          disabled={isLoading}
        >
          Sign Up
        </button>
      </p>
    </form>
  );
};

export default LoginScreen;