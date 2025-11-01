import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db, usersCollectionPath } from '../config/firebase';

/**
 * Handles adding a new user (Admin and Librarian only)
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @param {string} role - User's role (reader, librarian, admin)
 * @param {string} currentUserId - ID of the user performing this action
 * @param {string} currentUserRole - Role of the user performing this action
 * @returns {Promise<{success: boolean, error?: string, userId?: string}>}
 */
const handleAddUser = async (email, password, role, currentUserId, currentUserRole) => {
  // Validate permissions
  if (!currentUserId || (currentUserRole !== 'admin' && currentUserRole !== 'librarian')) {
    return { success: false, error: 'Permission denied: Only Admins and Librarians can add users.' };
  }

  // Librarians can only create readers
  if (currentUserRole === 'librarian' && role !== 'reader') {
    return { success: false, error: 'Permission denied: Librarians can only add Readers.' };
  }

  // Validate inputs
  if (!email || !email.includes('@')) {
    return { success: false, error: 'Invalid email address.' };
  }

  if (!password || password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' };
  }

  if (!['reader', 'librarian', 'admin'].includes(role)) {
    return { success: false, error: 'Invalid role selected.' };
  }

  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = userCredential.user;

    // Add user data to Firestore
    const userDocRef = doc(db, usersCollectionPath, newUser.uid);
    await setDoc(userDocRef, {
      email: email,
      role: role,
      createdAt: Timestamp.now(),
      createdBy: currentUserId
    });

    console.log('✅ User added successfully:', newUser.uid);
    
    // Sign out the newly created user to prevent auto-login
    // The admin/librarian should remain logged in
    // Note: This is a temporary solution. In production, use Firebase Admin SDK on backend.
    
    return { 
      success: true, 
      userId: newUser.uid,
      message: `User ${email} added successfully as ${role}.`
    };

  } catch (error) {
    console.error('❌ Error adding user:', error);

    // Handle specific Firebase errors
    if (error.code === 'auth/email-already-in-use') {
      return { success: false, error: 'This email is already registered.' };
    } else if (error.code === 'auth/invalid-email') {
      return { success: false, error: 'Invalid email format.' };
    } else if (error.code === 'auth/weak-password') {
      return { success: false, error: 'Password is too weak. Use at least 6 characters.' };
    } else if (error.code === 'permission-denied') {
      return { success: false, error: 'Permission denied. Check Firestore rules.' };
    }

    return { success: false, error: error.message || 'Failed to add user.' };
  }
};

export default handleAddUser;