import { collection, deleteDoc, doc, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db, reservationsCollectionPath } from '../config/firebase';

const ReservationsView = ({ userId, userRole }) => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active'); // active, expired, collected, all

  useEffect(() => {
    if (!userId) return;

    let reservationsQuery;

    if (userRole === 'reader') {
      // Reader sees only their reservations
      if (filter === 'all') {
        reservationsQuery = query(
          collection(db, reservationsCollectionPath),
          where('userId', '==', userId),
          orderBy('reservationDate', 'desc')
        );
      } else {
        reservationsQuery = query(
          collection(db, reservationsCollectionPath),
          where('userId', '==', userId),
          where('status', '==', filter),
          orderBy('reservationDate', 'desc')
        );
      }
    } else {
      // Admin/Librarian sees all reservations
      if (filter === 'all') {
        reservationsQuery = query(
          collection(db, reservationsCollectionPath),
          orderBy('reservationDate', 'desc')
        );
      } else {
        reservationsQuery = query(
          collection(db, reservationsCollectionPath),
          where('status', '==', filter),
          orderBy('reservationDate', 'desc')
        );
      }
    }

    const unsubscribe = onSnapshot(reservationsQuery, (snapshot) => {
      const reservationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReservations(reservationsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching reservations:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId, userRole, filter]);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return timestamp.toDate().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateFine = (reservation) => {
    if (reservation.status !== 'active') return 0;

    const deadline = reservation.deadline?.toDate();
    if (!deadline) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadlineNormalized = new Date(deadline);
    deadlineNormalized.setHours(0, 0, 0, 0);

    if (today > deadlineNormalized) {
      let daysLate = 0;
      let currentDate = new Date(deadlineNormalized);
      
      while (currentDate < today) {
        currentDate.setDate(currentDate.getDate() + 1);
        const dayOfWeek = currentDate.getDay();
        // Count only business days (skip Friday=5 and Saturday=6)
        if (dayOfWeek !== 5 && dayOfWeek !== 6) {
          daysLate++;
        }
      }

      return daysLate * 5; // ৳5 per business day
    }

    return 0;
  };

  const handleCancelReservation = async (reservationId) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return;

    try {
      await deleteDoc(doc(db, reservationsCollectionPath, reservationId));
      console.log('✅ Reservation cancelled');
    } catch (error) {
      console.error('❌ Error cancelling reservation:', error);
      alert('Failed to cancel reservation: ' + error.message);
    }
  };

  const getStatusBadge = (reservation) => {
    const fine = calculateFine(reservation);
    
    switch (reservation.status) {
      case 'active':
        if (fine > 0) {
          return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">⚠️ Overdue - ৳{fine} fine</span>;
        }
        return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">📌 Active</span>;
      case 'collected':
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">✅ Collected</span>;
      case 'expired':
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">⏰ Expired</span>;
      case 'cancelled':
        return <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">🚫 Cancelled</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">{reservation.status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalFines = reservations
    .filter(r => r.status === 'active')
    .reduce((sum, r) => sum + calculateFine(r), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">
            {userRole === 'reader' ? 'My Reservations' : 'All Reservations'}
          </h2>
          <p className="text-gray-600 mt-1">
            {reservations.length} {reservations.length === 1 ? 'reservation' : 'reservations'}
            {totalFines > 0 && (
              <span className="ml-2 text-red-600 font-semibold">
                • Pending Fines: ৳{totalFines}
              </span>
            )}
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'active' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('collected')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'collected' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Collected
          </button>
          <button
            onClick={() => setFilter('expired')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'expired' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Expired
          </button>
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
        </div>
      </div>

      {/* Reservations Table */}
      {reservations.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <div className="text-6xl mb-4">📌</div>
          <p className="text-gray-500 text-lg">No reservations found</p>
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
                  Reserved On
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Deadline
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Fine
                </th>
                {userRole === 'reader' && (
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reservations.map((reservation) => {
                const fine = calculateFine(reservation);
                return (
                  <tr key={reservation.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{reservation.bookTitle}</div>
                      <div className="text-xs text-gray-500">ID: {reservation.reservationId}</div>
                    </td>
                    {(userRole === 'admin' || userRole === 'librarian') && (
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{reservation.userEmail}</div>
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {formatDate(reservation.reservationDate)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {formatDate(reservation.deadline)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(reservation)}
                    </td>
                    <td className="px-6 py-4">
                      {fine > 0 ? (
                        <span className="inline-flex items-center px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm font-semibold border border-red-200">
                          ৳{fine}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">৳0</span>
                      )}
                    </td>
                    {userRole === 'reader' && (
                      <td className="px-6 py-4">
                        {reservation.status === 'active' && (
                          <button
                            onClick={() => handleCancelReservation(reservation.id)}
                            className="text-sm text-red-600 hover:text-red-800 font-medium"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Statistics */}
      {(userRole === 'admin' || userRole === 'librarian') && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <div className="text-3xl mb-2">📌</div>
            <div className="text-2xl font-bold text-blue-900">
              {reservations.filter(r => r.status === 'active').length}
            </div>
            <div className="text-sm text-blue-700">Active Reservations</div>
          </div>
          
          <div className="bg-green-50 rounded-xl p-6 border border-green-200">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-2xl font-bold text-green-900">
              {reservations.filter(r => r.status === 'collected').length}
            </div>
            <div className="text-sm text-green-700">Collected</div>
          </div>
          
          <div className="bg-red-50 rounded-xl p-6 border border-red-200">
            <div className="text-3xl mb-2">⚠️</div>
            <div className="text-2xl font-bold text-red-900">
              {reservations.filter(r => r.status === 'active' && calculateFine(r) > 0).length}
            </div>
            <div className="text-sm text-red-700">Overdue</div>
          </div>

          <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
            <div className="text-3xl mb-2">💰</div>
            <div className="text-2xl font-bold text-amber-900">
              ৳{totalFines}
            </div>
            <div className="text-sm text-amber-700">Total Fines</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationsView;