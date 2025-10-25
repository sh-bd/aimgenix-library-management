import { useEffect, useState } from 'react';

const UserRoleItem = ({ user, onUpdateRole, isCurrentUser }) => {
    const [role, setRole] = useState(user.role);
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState(null); // Local error state for this item

    const handleChange = async (e) => {
        const newRole = e.target.value;
        // Don't update state immediately, wait for confirmation from Firestore
        // setRole(newRole); 
        setIsUpdating(true);
        setError(null); // Clear previous errors
        try {
            await onUpdateRole(user.id, newRole);
            setRole(newRole); // Update local state only on success
        } catch (updateError) {
            console.error("Failed to update role:", updateError);
            setError("Update failed. Check permissions or network.");
            // Don't revert role here, let the listener eventually correct it if needed
            // setRole(user.role); 
        } finally {
            setIsUpdating(false);
        }
    };

    // Update local role state if the user prop changes (due to Firestore listener)
    useEffect(() => {
        setRole(user.role);
    }, [user.role]);

    return (
        <li className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white rounded-lg shadow space-y-2 sm:space-y-0">
            <div className="flex-1 sm:mr-4">
                <p className="font-medium text-gray-800 break-all">{user.email || 'No Email'}</p>
                <p className="text-sm text-gray-500 break-all">User ID: {user.id}</p>
                {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
            </div>
            <div className="flex items-center space-x-2">
                {isUpdating && ( // Show spinner next to select while updating
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500" role="status">
                        <span className="sr-only">Updating...</span>
                    </div>
                )}
                <p className="text-sm text-gray-600">Role:</p>
                <select
                    value={role}
                    onChange={handleChange}
                    // Prevent admin from changing their own role via this UI
                    disabled={isCurrentUser || isUpdating}
                    className="px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                    <option value="reader">Reader</option>
                    <option value="librarian">Librarian</option>
                    <option value="admin">Admin</option>
                </select>
            </div>
            {isCurrentUser && <p className="w-full text-right sm:w-auto text-xs text-indigo-600 pt-1 sm:pt-0 sm:pl-2">(This is you)</p>}
        </li>
    );
};

export default UserRoleItem;