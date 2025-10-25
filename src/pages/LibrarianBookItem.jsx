import { useState } from 'react';

/**
 * Highlights matching text inside a string.
 * @param {string} text - The full text to display.
 * @param {string} query - The search query.
 * @returns {JSX.Element} JSX with matching parts wrapped in a <span>.
 */
const highlightMatch = (text = '', query = '') => {
  if (!query) return text;

  const regex = new RegExp(`(${query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      <span key={index} className="bg-yellow-200 rounded px-0.5">
        {part}
      </span>
    ) : (
      part
    )
  );
};

/**
 * Finds the earliest due date from borrowed copies
 * @param {Array} borrowedCopies
 * @returns {Date | null}
 */
const getNextAvailableDate = (borrowedCopies) => {
  if (!Array.isArray(borrowedCopies) || borrowedCopies.length === 0) return null;

  try {
    const validDueDates = borrowedCopies
      .map(c => c.dueDate)
      .filter(date => date instanceof Date && !isNaN(date));

    return validDueDates.length > 0
      ? new Date(Math.min(...validDueDates.map(d => d.getTime())))
      : null;
  } catch (e) {
    console.error("Error calculating next available date:", e);
    return null;
  }
};

const LibrarianBookItem = ({ book, onDelete, onUpdate, searchQuery = '' }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedBook, setEditedBook] = useState({ ...book });

  const nextAvailableDate = getNextAvailableDate(book.borrowedCopies);

  const handleSave = () => {
    onUpdate(editedBook);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedBook({ ...book });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${book.title}"? This action cannot be undone.`)) {
      onDelete(book.id);
    }
  };

  return (
    <li className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white rounded-lg shadow space-y-3 sm:space-y-0">
      {/* Book Info */}
      <div className="flex-1 sm:mr-4 space-y-1">
        {isEditing ? (
          <>
            <input
              type="text"
              value={editedBook.title}
              onChange={(e) => setEditedBook(prev => ({ ...prev, title: e.target.value }))}
              className="w-full border px-2 py-1 rounded"
            />
            <input
              type="text"
              value={editedBook.author}
              onChange={(e) => setEditedBook(prev => ({ ...prev, author: e.target.value }))}
              className="w-full border px-2 py-1 rounded"
            />
            <input
              type="text"
              value={editedBook.genre}
              onChange={(e) => setEditedBook(prev => ({ ...prev, genre: e.target.value }))}
              className="w-full border px-2 py-1 rounded"
            />
          </>
        ) : (
          <>
            <h3 className="text-lg font-semibold text-indigo-700">
              {highlightMatch(book.title, searchQuery)}
            </h3>
            <p className="text-sm text-gray-600">
              by {highlightMatch(book.author, searchQuery)}
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">
              {highlightMatch(book.genre, searchQuery)}
            </p>
          </>
        )}
      </div>

      {/* Rack / Stock Info */}
      <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-sm w-full sm:w-auto">
        {isEditing ? (
          <>
            <input
              type="text"
              value={editedBook.rack}
              onChange={(e) => setEditedBook(prev => ({ ...prev, rack: e.target.value }))}
              className="w-24 border px-2 py-1 rounded"
              placeholder="Rack"
            />
            <input
              type="number"
              value={editedBook.availableQuantity}
              onChange={(e) => setEditedBook(prev => ({ ...prev, availableQuantity: parseInt(e.target.value) || 0 }))}
              className="w-20 border px-2 py-1 rounded"
              placeholder="Available"
            />
            <input
              type="number"
              value={editedBook.totalQuantity}
              onChange={(e) => setEditedBook(prev => ({ ...prev, totalQuantity: parseInt(e.target.value) || 0 }))}
              className="w-20 border px-2 py-1 rounded"
              placeholder="Total"
            />
          </>
        ) : (
          <>
            <div className="flex items-center space-x-4">
              <div className="text-sm font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                Rack: {book.rack}
              </div>
              <div className="font-medium text-gray-700 text-right">
                Stock: {book.availableQuantity ?? 'N/A'} / {book.totalQuantity ?? 'N/A'}
              </div>
            </div>
            {nextAvailableDate instanceof Date && !isNaN(nextAvailableDate) && (
              <p className="text-sm text-blue-600 text-right sm:text-left">
                Next Return: {nextAvailableDate.toLocaleDateString()}
              </p>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 sm:pl-4">
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors text-sm font-medium"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors text-sm font-medium"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors text-sm font-medium"
            >
              Delete
            </button>
          </>
        )}
      </div>
    </li>
  );
};

export default LibrarianBookItem;
