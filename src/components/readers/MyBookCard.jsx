
const MyBookCard = ({ book, borrowInfo, onReturn }) => {
    // Use the dueDate directly as it should be a Date object after processing in useEffect
    const dueDate = borrowInfo?.dueDate;
    const isOverdue = dueDate && (new Date() > dueDate);

    return (
        <li className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg shadow ${isOverdue ? 'bg-red-50 border border-red-200' : 'bg-white'}`}>
            <div className="mb-3 sm:mb-0 sm:mr-4 flex-1">
                <h3 className="text-lg font-semibold text-indigo-700">{book?.title || 'Unknown Title'}</h3>
                <p className="text-sm text-gray-600">by {book?.author || 'Unknown Author'}</p>
                <p className={`text-sm font-medium mt-1 ${isOverdue ? 'text-red-600' : 'text-gray-700'}`}>
                    {dueDate instanceof Date && !isNaN(dueDate) ? `Due Date: ${dueDate.toLocaleDateString()}` : 'Due Date: Unknown'} {isOverdue && "(Overdue)"}
                </p>
            </div>
            <button
                // Ensure borrowInfo and borrowId exist before allowing return
                onClick={() => borrowInfo?.borrowId && onReturn(book.id, borrowInfo.borrowId)}
                disabled={!borrowInfo?.borrowId}
                className="px-4 py-2 rounded-md text-sm font-medium transition-colors w-full sm:w-auto justify-center bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
                Return Book
            </button>
        </li>
    );
};

export default MyBookCard;