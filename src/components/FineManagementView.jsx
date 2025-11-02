import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../config/firebase";

const FineManagementView = ({ allUsers }) => {
  const [finesData, setFinesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('amount'); // 'amount', 'name', 'overdue'

  useEffect(() => {
    if (!allUsers || allUsers.length === 0) {
      setLoading(false);
      return;
    }

    // Get all readers
    const readers = allUsers.filter(user => user.role === 'reader');
    
    if (readers.length === 0) {
      setFinesData([]);
      setLoading(false);
      return;
    }

    console.log('📊 Calculating fines for', readers.length, 'readers');

    // Listen to all borrowed books
    const borrowHistoryRef = collection(db, "borrowHistory");
    const q = query(
      borrowHistoryRef,
      where("status", "==", "borrowed")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Calculate fines for each reader
        const finesByUser = {};
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          const userId = data.userId;
          
          if (!finesByUser[userId]) {
            finesByUser[userId] = {
              totalFine: 0,
              overdueBooks: [],
              totalBorrowed: 0
            };
          }

          finesByUser[userId].totalBorrowed++;

          const dueDate = data.dueDate?.toDate();
          if (dueDate) {
            const dueDateNormalized = new Date(dueDate);
            dueDateNormalized.setHours(0, 0, 0, 0);

            if (dueDateNormalized < today) {
              const diffTime = today.getTime() - dueDateNormalized.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              const bookFine = diffDays * 5;

              finesByUser[userId].totalFine += bookFine;
              finesByUser[userId].overdueBooks.push({
                bookTitle: data.bookTitle,
                dueDate: dueDateNormalized,
                daysOverdue: diffDays,
                fine: bookFine
              });
            }
          }
        });

        // Combine user info with fine data
        const finesArray = readers.map(reader => {
          const fineInfo = finesByUser[reader.id] || {
            totalFine: 0,
            overdueBooks: [],
            totalBorrowed: 0
          };

          return {
            userId: reader.id,
            userName: reader.name || reader.email?.split('@')[0] || 'Unknown',
            userEmail: reader.email,
            totalFine: fineInfo.totalFine,
            overdueCount: fineInfo.overdueBooks.length,
            totalBorrowed: fineInfo.totalBorrowed,
            overdueBooks: fineInfo.overdueBooks
          };
        });

        console.log('💰 Fines calculated:', finesArray);
        setFinesData(finesArray);
        setLoading(false);
      },
      (error) => {
        console.error('❌ Error fetching borrow history:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [allUsers]);

  // Sort the fines data
  const sortedFines = [...finesData].sort((a, b) => {
    switch (sortBy) {
      case 'amount':
        return b.totalFine - a.totalFine;
      case 'name':
        return a.userName.localeCompare(b.userName);
      case 'overdue':
        return b.overdueCount - a.overdueCount;
      default:
        return 0;
    }
  });

  // Calculate totals
  const totalFines = finesData.reduce((sum, reader) => sum + reader.totalFine, 0);
  const readersWithFines = finesData.filter(r => r.totalFine > 0).length;
  const totalOverdueBooks = finesData.reduce((sum, reader) => sum + reader.overdueCount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600 font-medium">Loading fines data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Fine Management</h2>
        <p className="text-gray-600">
          View and manage overdue fines for all readers. Fine rate: ৳5/day
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Fines */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-sm font-semibold uppercase tracking-wide mb-1">Total Fines</p>
              <p className="text-4xl font-extrabold text-red-700">৳{totalFines}</p>
            </div>
            <div className="w-14 h-14 bg-red-200 rounded-full flex items-center justify-center">
              <span className="text-3xl">💰</span>
            </div>
          </div>
        </div>

        {/* Readers with Fines */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-semibold uppercase tracking-wide mb-1">Readers w/ Fines</p>
              <p className="text-4xl font-extrabold text-orange-700">{readersWithFines}</p>
              <p className="text-xs text-orange-600 mt-1">of {finesData.length} total</p>
            </div>
            <div className="w-14 h-14 bg-orange-200 rounded-full flex items-center justify-center">
              <span className="text-3xl">👥</span>
            </div>
          </div>
        </div>

        {/* Overdue Books */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 rounded-xl p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-sm font-semibold uppercase tracking-wide mb-1">Overdue Books</p>
              <p className="text-4xl font-extrabold text-yellow-700">{totalOverdueBooks}</p>
            </div>
            <div className="w-14 h-14 bg-yellow-200 rounded-full flex items-center justify-center">
              <span className="text-3xl">📚</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200">
        <span className="text-sm font-semibold text-gray-700">Sort by:</span>
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy('amount')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              sortBy === 'amount'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            Fine Amount
          </button>
          <button
            onClick={() => setSortBy('overdue')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              sortBy === 'overdue'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            Overdue Count
          </button>
          <button
            onClick={() => setSortBy('name')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              sortBy === 'name'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            Name
          </button>
        </div>
      </div>

      {/* Readers List */}
      <div className="space-y-3">
        {sortedFines.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-gray-200">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-gray-500 font-medium">No readers found</p>
          </div>
        ) : (
          sortedFines.map((reader) => (
            <div
              key={reader.userId}
              className={`bg-white rounded-xl p-5 shadow-md border-2 transition-all ${
                reader.totalFine > 0
                  ? 'border-red-200 hover:shadow-lg'
                  : 'border-green-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                {/* User Info */}
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                    {reader.userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg">{reader.userName}</h3>
                    <p className="text-sm text-gray-600">{reader.userEmail}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Currently borrowed: {reader.totalBorrowed} book{reader.totalBorrowed !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {/* Fine Amount */}
                <div className="text-right">
                  <div className={`text-3xl font-extrabold ${
                    reader.totalFine > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    ৳{reader.totalFine}
                  </div>
                  {reader.overdueCount > 0 ? (
                    <div className="text-xs text-red-600 font-semibold mt-1">
                      {reader.overdueCount} overdue book{reader.overdueCount > 1 ? 's' : ''}
                    </div>
                  ) : (
                    <div className="text-xs text-green-600 font-semibold mt-1">
                      ✓ No fines
                    </div>
                  )}
                </div>
              </div>

              {/* Overdue Books Details */}
              {reader.overdueBooks.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Overdue Books:</p>
                  <div className="space-y-2">
                    {reader.overdueBooks.map((book, index) => (
                      <div key={index} className="bg-red-50 rounded-lg p-3 text-sm">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{book.bookTitle}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              Due: {book.dueDate.toLocaleDateString()} • {book.daysOverdue} day{book.daysOverdue > 1 ? 's' : ''} overdue
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-red-700">৳{book.fine}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FineManagementView;