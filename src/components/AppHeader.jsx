import { useState } from "react";

const AppHeader = ({ onSignOut, userEmail, userRole }) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await onSignOut();
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="mb-8 pb-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-center sm:text-left text-indigo-800">
          AIMGENIX Library
        </h1>
        {userEmail && userRole && (
          <div className="text-sm text-center sm:text-left text-gray-600 mt-1">
            Logged in as: <span className="font-medium">{userEmail}</span>
            (<span className="font-medium capitalize">{userRole}</span>)
          </div>
        )}
      </div>
      <button
        onClick={handleClick}
        disabled={loading}
        className={`px-4 py-2 bg-red-600 text-white font-medium rounded-md shadow-sm transition-colors w-full sm:w-auto ${
          loading ? "opacity-60 cursor-not-allowed" : "hover:bg-red-700"
        }`}
      >
        {loading ? "Signing Out..." : "Sign Out"}
      </button>
    </header>
  );
};

export default AppHeader;
