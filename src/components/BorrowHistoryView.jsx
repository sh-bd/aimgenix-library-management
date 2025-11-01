import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { borrowHistoryCollectionPath, db } from '../config/firebase';

const BorrowHistoryView = ({ userId, userRole }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, borrowed, returned

  useEffect(() => {
    if (!userId) return;

    let historyQuery;

    if (userRole === 'reader') {
      // Reader sees only their history
      historyQuery = query(
        collection(db, borrowHistoryCollectionPath),
        where('userId', '==', userId),
        orderBy('borrowDate', 'desc')
      );
    } else {
      // Admin/Librarian sees all history
      historyQuery = query(
        collection(db, borrowHistoryCollectionPath),
        orderBy('borrowDate', 'desc')
      );
    }

    const unsubscribe = onSnapshot(historyQuery, (snapshot) => {
      const historyData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHistory(historyData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching borrow history:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId, userRole]);

  const filteredHistory = history.filter(record => {
    if (filter === 'all') return true;
    return record.status === filter;
  });

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return timestamp.toDate().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (record) => {
    const now = new Date();
    const dueDate = record.dueDate?.toDate();
    
    if (record.status === 'returned') {
      return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">✓ Returned</span>;
    }
    
    if (dueDate && now > dueDate) {
      return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">⚠ Overdue</span>;
    }
    
    return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">📖 Borrowed</span>;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">
            {userRole === 'reader' ? 'My Borrowing History' : 'All Borrowing History'}
          </h2>
          <p className="text-gray-600 mt-1">
            {filteredHistory.length} {filteredHistory.length === 1 ? 'record' : 'records'}
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'all' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('borrowed')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'borrowed' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('returned')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'returned' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Returned
          </button>
        </div>
      </div>

      {/* History Table */}
      {filteredHistory.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <div className="text-6xl mb-4">📚</div>
          <p className="text-gray-500 text-lg">No borrowing history found</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-md">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Book
                </th>
                {(userRole === 'admin' || userRole === 'librarian') && (
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    User
                  </th>
                )}
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Borrow Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Return Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredHistory.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{record.bookTitle}</div>
                    <div className="text-xs text-gray-500">SN: {record.serialNumber}</div>
                  </td>
                  {(userRole === 'admin' || userRole === 'librarian') && (
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{record.userEmail}</div>
                    </td>
                  )}
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {formatDate(record.borrowDate)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {formatDate(record.dueDate)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {record.returnDate ? formatDate(record.returnDate) : '—'}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(record)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Statistics (for Admin/Librarian) */}
      {(userRole === 'admin' || userRole === 'librarian') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <div className="text-3xl mb-2">📖</div>
            <div className="text-2xl font-bold text-blue-900">
              {history.filter(r => r.status === 'borrowed').length}
            </div>
            <div className="text-sm text-blue-700">Currently Borrowed</div>
          </div>
          
          <div className="bg-green-50 rounded-xl p-6 border border-green-200">
            <div className="text-3xl mb-2">✓</div>
            <div className="text-2xl font-bold text-green-900">
              {history.filter(r => r.status === 'returned').length}
            </div>
            <div className="text-sm text-green-700">Total Returns</div>
          </div>
          
          <div className="bg-red-50 rounded-xl p-6 border border-red-200">
            <div className="text-3xl mb-2">⚠</div>
            <div className="text-2xl font-bold text-red-900">
              {history.filter(r => {
                if (r.status !== 'borrowed') return false;
                const now = new Date();
                const dueDate = r.dueDate?.toDate();
                return dueDate && now > dueDate;
              }).length}
            </div>
            <div className="text-sm text-red-700">Overdue Books</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BorrowHistoryView;