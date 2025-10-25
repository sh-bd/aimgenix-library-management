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
      // You can use Firebase error codes here if needed
      setError("Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto mt-8 space-y-4 p-6 bg-white rounded-lg shadow-md"
    >
      <h2 className="text-2xl font-semibold text-center text-gray-800">Login</h2>

      {(error || externalError) && (
        <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md text-center">
          {error || externalError}
        </p>
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
        >
          Sign Up
        </button>
      </p>
    </form>
  );
};

export default LoginScreen;
