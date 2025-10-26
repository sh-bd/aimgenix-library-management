import { useState } from "react";
import LoginScreen from "../pages/Login";
import SignUpScreen from "../pages/SignUp";

const AuthContainer = ({ onLogin, onSignUp, authError }) => {
    const [isLoginView, setIsLoginView] = useState(true);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                <h1 className="text-3xl font-bold text-center text-indigo-800 mb-6">
                    AIMGENIX Library
                </h1>
                {isLoginView ? (
                    <LoginScreen
                        onLogin={onLogin}
                        onSwitchToSignUp={() => setIsLoginView(false)}
                        error={authError}
                    />
                ) : (
                    <SignUpScreen
                        onSignUp={onSignUp}
                        onSwitchToLogin={() => setIsLoginView(true)}
                        error={authError}
                    />
                )}
            </div>
        </div>
    );
};

export default AuthContainer;