import React, { useState } from 'react';
import AddUserModal from './AddUserModal';
import UserRoleItem from './UserRoleItem';

const AdminUserManagement = ({ allUsers, loadingUsers, onUpdateRole, onAddUser, currentUserId, userRole }) => {
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

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
            {/* Header with Add User Button */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-2xl font-semibold text-gray-800">
                    User Management ({allUsers.length} total users)
                </h2>
                <button
                    onClick={() => setIsAddUserModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                >
                    <span className="text-xl">➕</span>
                    <span>Add New User</span>
                </button>
            </div>

            {loadingUsers ? (
                <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
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
                            isCurrentUser={false}
                        />
                    )) : (
                        !currentUser && <p className="text-gray-500 text-center py-4">No users found.</p>
                    )}
                    {sortedUsers.length === 0 && currentUser && (
                        <p className="text-gray-500 text-center py-4">No other users found.</p>
                    )}
                </ul>
            )}

            {/* Add User Modal */}
            <AddUserModal
                isOpen={isAddUserModalOpen}
                onClose={() => setIsAddUserModalOpen(false)}
                onAddUser={onAddUser}
                userRole={userRole}
            />
        </section>
    );
};

export default AdminUserManagement;