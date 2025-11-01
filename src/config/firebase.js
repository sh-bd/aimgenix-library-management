import { getAnalytics } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, setLogLevel } from 'firebase/firestore';

// --- Load and parse Firebase config from Vite env ---
let firebaseConfig;
try {
    const configString = import.meta.env?.VITE_FIREBASE_CONFIG;
    firebaseConfig = configString ? JSON.parse(configString) : {};
    if (!configString) {
        console.warn("Firebase config missing (VITE_FIREBASE_CONFIG not set). Using empty object.");
    }
} catch (e) {
    console.error('Invalid Firebase config JSON:', e);
    firebaseConfig = {};
}

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Only initialize Analytics if a measurementId exists (browser-only)
const analytics = typeof window !== 'undefined' && firebaseConfig.measurementId
    ? getAnalytics(app)
    : null;

// Optional: enable Firestore debug logs in development only
if (import.meta.env.DEV) {
    setLogLevel('debug');
}

// --- Firestore Collection Paths ---
export const booksCollectionPath = 'books';
export const usersCollectionPath = 'users';
export const borrowHistoryCollectionPath = 'borrowHistory';

// Named exports for easier imports
export { analytics, app, auth, db, firebaseConfig };

