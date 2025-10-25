import React from 'react';

const AdminUserManagement = ({ allUsers, loadingUsers, onUpdateRole, currentUserId }) => {
    // Sort users alphabetically by email for display
    const sortedUsers = React.useMemo(() => {
        // Filter out the current admin user before sorting
        return allUsers
            .filter(user => user.id !== currentUserId)
            .sort((a, b) => (a.email || '').localeCompare(b.email || ''));
    }, [allUsers, currentUserId]);

    // Find the current admin user separately
    const currentUser = allUsers.find(user => user.id === currentUserId);


    return (
        <section className="bg-white/50 backdrop-blur-sm rounded-lg shadow-inner p-4 sm:p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">User Management ({allUsers.length} total users)</h2>
            {loadingUsers ? (
                <LoadingSpinner />
            ) : (
                <ul className="space-y-4">
                    {/* Display current admin user first, disabled */}
                    {currentUser && (
                        <UserRoleItem
                            key={currentUser.id}
                            user={currentUser}
                            onUpdateRole={onUpdateRole}
                            isCurrentUser={true}
                        />
                    )}
                    {/* Display other users */}
                    {sortedUsers.length > 0 ? sortedUsers.map(user => (
                        <UserRoleItem
                            key={user.id}
                            user={user}
                            onUpdateRole={onUpdateRole}
                            isCurrentUser={false} // Always false for this list
                        />
                    )) : (
                        !currentUser && <p className="text-gray-500 text-center py-4">No users found.</p> // Show if only admin exists
                    )}
                    {sortedUsers.length === 0 && currentUser && (
                        <p className="text-gray-500 text-center py-4">No other users found.</p> // Show if only admin exists
                    )}
                </ul>
            )}
        </section>
    );
};

export default AdminUserManagement;