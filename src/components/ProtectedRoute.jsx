
const ProtectedRoute = ({ children, isAuthenticated, userRole, allowedRoles }) => {
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(userRole)) {
        if (userRole === 'reader') return <Navigate to="/dashboard" replace />;
        if (userRole === 'librarian') return <Navigate to="/dashboard" replace />;
        if (userRole === 'admin') return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default ProtectedRoute;