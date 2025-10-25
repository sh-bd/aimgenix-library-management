import { doc, updateDoc } from 'firebase/firestore';
import { useState } from 'react';
import { db } from '../../config/firebase';

const handleUpdateUserRole = async (targetUserId, newRole) => {
    const [error, setError] = useState(null);
    setError(null); // Clear general errors
    console.log(`Attempting to update user ${targetUserId} to role ${newRole}`);

    // Basic validation
    if (!['reader', 'librarian', 'admin'].includes(newRole)) {
        console.error("Invalid role specified:", newRole);
        setError("Invalid role selected.");
        throw new Error("Invalid role selected.");
    }

    const [userId, setUserId] = useState(null);
    if (targetUserId === userId) {
        console.warn("Admin attempted to change their own role. Action blocked.");
        setError("Cannot change your own role."); // Inform user
        throw new Error("Cannot change own role."); // Throw to handle in calling component
    }

    const usersCollectionPath = `users`;
    try {
        const userDocRef = doc(db, usersCollectionPath, targetUserId);
        await updateDoc(userDocRef, {
            role: newRole
        });
        console.log("User role update successful in Firestore.");
        // Firestore listener should automatically update the UI state
    } catch (e) {
        console.error("Error updating user role in Firestore:", e);
        if (e.code === 'permission-denied') {
            setError("Permission denied to update user role. Check Firestore rules.");
        } else {
            setError(`Failed to update user role: ${e.message}`);
        }
        throw e; // Re-throw error so component can handle UI state
    }
};

export default handleUpdateUserRole;