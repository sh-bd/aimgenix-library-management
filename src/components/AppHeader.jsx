import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../config/firebase";

const AppHeader = ({ onSignOut, userEmail, userRole, userId }) => {
  const [loading, setLoading] = useState(false);
  const [totalFine, setTotalFine] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);

  useEffect(() => {
    // Only calculate fines for readers
    if (userRole !== 'reader' || !userId) {
      console.log('❌ Skipping fine calculation:', { userRole, userId });
      return;
    }

    console.log('✅ Starting fine calculation for user:', userId);

    const borrowHistoryRef = collection(db, "borrowHistory");
    const q = query(
      borrowHistoryRef,
      where("userId", "==", userId),
      where("status", "==", "borrowed")
    );

    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        console.log('📦 Snapshot received. Document count:', snapshot.size);
        
        let fine = 0;
        let count = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset to start of day

        snapshot.forEach((doc) => {
          const data = doc.data();
          console.log('📄 Document data:', {
            id: doc.id,
            bookTitle: data.bookTitle,
            status: data.status,
            dueDate: data.dueDate?.toDate?.()?.toLocaleDateString(),
            hasToDate: typeof data.dueDate?.toDate === 'function'
          });

          const dueDate = data.dueDate?.toDate();
          
          if (dueDate) {
            // Normalize dueDate to start of day
            const dueDateNormalized = new Date(dueDate);
            dueDateNormalized.setHours(0, 0, 0, 0);
            
            // Check if overdue
            if (dueDateNormalized < today) {
              count++;
              // Calculate days overdue - use getTime() for accurate calculation
              const diffTime = today.getTime() - dueDateNormalized.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              fine += diffDays * 5; // BDT 5 per day
              
              console.log('📚 Overdue book:', {
                bookId: data.bookId,
                bookTitle: data.bookTitle,
                dueDate: dueDateNormalized.toLocaleDateString(),
                today: today.toLocaleDateString(),
                daysOverdue: diffDays,
                fineForThisBook: diffDays * 5
              });
            } else {
              console.log('✅ Not overdue:', data.bookTitle);
            }
          } else {
            console.log('⚠️ No dueDate found for:', data.bookTitle);
          }
        });

        console.log('💰 Total Fine:', fine, '| Overdue Count:', count);
        setTotalFine(fine);
        setOverdueCount(count);
      },
      (error) => {
        console.error('❌ Error fetching borrow history:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
      }
    );

    return () => unsubscribe();
  }, [userId, userRole]);

  const handleClick = async () => {
    setLoading(true);
    try {
      await onSignOut();
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="mb-8 pb-4 border-b border-gray-200">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex-1">
          <h1 className="text-3xl sm:text-4xl font-bold text-center sm:text-left text-indigo-800">
            AIMGENIX
          </h1>
          {userEmail && userRole && (
            <div className="text-sm text-center sm:text-left text-gray-600 mt-1">
              Logged in as: <span className="font-medium">{userEmail}</span>
              {" "}(<span className="font-medium capitalize">{userRole}</span>)
            </div>
          )}
        </div>

        {/* Fine Display for Readers */}
        {userRole === 'reader' && (
          <div className={`
            relative overflow-hidden
            border-2 rounded-xl px-6 py-3 
            min-w-[220px] max-w-[280px]
            shadow-lg hover:shadow-xl transition-all duration-300
            ${totalFine > 0 
              ? 'bg-gradient-to-br from-red-50 via-red-100 to-red-50 border-red-400' 
              : 'bg-gradient-to-br from-green-50 via-green-100 to-green-50 border-green-400'
            }
          `}>
            {/* Decorative Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-0 left-0 w-20 h-20 bg-current rounded-full -translate-x-10 -translate-y-10"></div>
              <div className="absolute bottom-0 right-0 w-16 h-16 bg-current rounded-full translate-x-8 translate-y-8"></div>
            </div>

            <div className="relative flex items-center justify-between gap-3">
              {/* Icon Section */}
              <div className={`
                flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center
                ${totalFine > 0 
                  ? 'bg-red-200 text-red-700' 
                  : 'bg-green-200 text-green-700'
                }
              `}>
                <span className="text-2xl">{totalFine > 0 ? '⚠️' : '✅'}</span>
              </div>

              {/* Fine Details */}
              <div className="flex-1 text-left">
                <div className={`
                  text-[10px] font-bold uppercase tracking-wider mb-0.5
                  ${totalFine > 0 ? 'text-red-600' : 'text-green-600'}
                `}>
                  {totalFine > 0 ? 'Pending Fine' : 'Clear Account'}
                </div>
                
                <div className="flex items-baseline gap-1">
                  <span className={`
                    text-3xl font-extrabold leading-none
                    ${totalFine > 0 ? 'text-red-700' : 'text-green-700'}
                  `}>
                    ৳{totalFine}
                  </span>
                  <span className={`
                    text-xs font-medium
                    ${totalFine > 0 ? 'text-red-500' : 'text-green-500'}
                  `}>
                    BDT
                  </span>
                </div>
                
                {overdueCount > 0 && (
                  <div className="text-[10px] text-red-600 font-semibold mt-0.5 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                    {overdueCount} book{overdueCount > 1 ? 's' : ''} overdue
                  </div>
                )}
                
                {totalFine === 0 && (
                  <div className="text-[10px] text-green-600 font-medium mt-0.5">
                    All books returned on time
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleClick}
          disabled={loading}
          className={`px-4 py-2 bg-red-600 text-white font-medium rounded-md shadow-sm transition-colors w-full sm:w-auto ${
            loading ? "opacity-60 cursor-not-allowed" : "hover:bg-red-700"
          }`}
        >
          {loading ? "Signing Out..." : "Sign Out"}
        </button>
      </div>
    </header>
  );
};

export default AppHeader;
