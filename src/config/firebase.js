import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Parse Firebase configuration from JSON string or use individual env vars
let firebaseConfig;

if (import.meta.env.VITE_FIREBASE_CONFIG) {
  // Parse JSON string config
  try {
    firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG);
    console.log('✅ Using VITE_FIREBASE_CONFIG (JSON format)');
  } catch (error) {
    console.error('❌ Failed to parse VITE_FIREBASE_CONFIG:', error);
    throw new Error('Invalid Firebase configuration JSON');
  }
} else {
  // Use individual env vars
  firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ""
  };
  console.log('✅ Using individual Firebase env variables');
}

// Validate Firebase configuration
const validateFirebaseConfig = () => {
  const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missingKeys = requiredKeys.filter(key => !firebaseConfig[key]);
  
  if (missingKeys.length > 0) {
    console.error('❌ Missing Firebase configuration keys:', missingKeys);
    console.error('Please check your .env file and ensure Firebase variables are set correctly.');
    return false;
  }
  
  console.log('✅ Firebase configuration validated successfully');
  return true;
};

// Validate before initializing
if (!validateFirebaseConfig()) {
  throw new Error('Firebase configuration is incomplete. Please check your .env file.');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Export Firebase config for validation in App.jsx
export { firebaseConfig };

// Collection paths
export const booksCollectionPath = "books";
export const borrowHistoryCollectionPath = "borrowHistory";
export const reservationsCollectionPath = "reservations";
export const usersCollectionPath = "users";

