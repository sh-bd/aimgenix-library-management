import { useState } from 'react';
import AddUserModal from './AddUserModal';

const LibrarianUserManagement = ({ onAddUser, userRole }) => {
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

    return (
        <section className="bg-white/50 backdrop-blur-sm rounded-lg shadow-inner p-4 sm:p-6">
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">User Management</h2>
                <p className="text-gray-600">Add new readers to the library system</p>
            </div>

            {/* Add Reader Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 text-center border border-blue-200">
                <div className="text-6xl mb-4">📚👤</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Add New Reader</h3>
                <p className="text-gray-600 mb-6">Create new reader accounts for library members</p>
                <button
                    onClick={() => setIsAddUserModalOpen(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                >
                    <span className="text-xl">➕</span>
                    <span>Add New Reader</span>
                </button>
            </div>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> As a librarian, you can only create <strong>Reader</strong> accounts. 
                    Contact an admin to create librarian or admin accounts.
                </p>
            </div>

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

export default LibrarianUserManagement;