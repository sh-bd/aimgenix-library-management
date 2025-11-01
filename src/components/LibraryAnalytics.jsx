import { useMemo, useState } from 'react';

const LibraryAnalytics = ({ books }) => {
  const [selectedFilter, setSelectedFilter] = useState('all'); // all, rack, genre, lowStock

  // Calculate statistics
  const stats = useMemo(() => {
    // Books by rack
    const rackStats = books.reduce((acc, book) => {
      const rack = book.rack || 'Unassigned';
      if (!acc[rack]) {
        acc[rack] = { total: 0, available: 0, borrowed: 0, books: [] };
      }
      acc[rack].total += book.totalQuantity;
      acc[rack].available += book.availableQuantity;
      acc[rack].borrowed += (book.totalQuantity - book.availableQuantity);
      acc[rack].books.push(book);
      return acc;
    }, {});

    // Books by genre
    const genreStats = books.reduce((acc, book) => {
      const genre = book.genre || 'Unassigned';
      if (!acc[genre]) {
        acc[genre] = { total: 0, available: 0, borrowed: 0, books: [] };
      }
      acc[genre].total += book.totalQuantity;
      acc[genre].available += book.availableQuantity;
      acc[genre].borrowed += (book.totalQuantity - book.availableQuantity);
      acc[genre].books.push(book);
      return acc;
    }, {});

    // Low stock books (available quantity <= 3 or availability < 30%)
    const lowStockBooks = books.filter(book => {
      const availabilityPercent = (book.availableQuantity / book.totalQuantity) * 100;
      return book.availableQuantity <= 3 || availabilityPercent < 30;
    }).sort((a, b) => a.availableQuantity - b.availableQuantity);

    // Out of stock books
    const outOfStockBooks = books.filter(book => book.availableQuantity === 0);

    return {
      rackStats,
      genreStats,
      lowStockBooks,
      outOfStockBooks,
      totalBooks: books.length,
      totalCopies: books.reduce((sum, b) => sum + b.totalQuantity, 0),
      totalAvailable: books.reduce((sum, b) => sum + b.availableQuantity, 0),
      totalBorrowed: books.reduce((sum, b) => sum + (b.totalQuantity - b.availableQuantity), 0)
    };
  }, [books]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Library Analytics</h2>
          <p className="text-gray-600 mt-1">Comprehensive overview of your library collection</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-semibold uppercase tracking-wide">Total Books</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">{stats.totalBooks}</p>
              <p className="text-xs text-blue-700 mt-1">{stats.totalCopies} total copies</p>
            </div>
            <div className="text-5xl">📚</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-semibold uppercase tracking-wide">Available</p>
              <p className="text-3xl font-bold text-green-900 mt-2">{stats.totalAvailable}</p>
              <p className="text-xs text-green-700 mt-1">
                {((stats.totalAvailable / stats.totalCopies) * 100).toFixed(1)}% of total
              </p>
            </div>
            <div className="text-5xl">✅</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-semibold uppercase tracking-wide">Borrowed</p>
              <p className="text-3xl font-bold text-purple-900 mt-2">{stats.totalBorrowed}</p>
              <p className="text-xs text-purple-700 mt-1">
                {((stats.totalBorrowed / stats.totalCopies) * 100).toFixed(1)}% borrowed
              </p>
            </div>
            <div className="text-5xl">📖</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border-2 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-semibold uppercase tracking-wide">Low Stock</p>
              <p className="text-3xl font-bold text-red-900 mt-2">{stats.lowStockBooks.length}</p>
              <p className="text-xs text-red-700 mt-1">{stats.outOfStockBooks.length} out of stock</p>
            </div>
            <div className="text-5xl">⚠️</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-lg inline-flex">
        <button
          onClick={() => setSelectedFilter('all')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            selectedFilter === 'all'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📊 Overview
        </button>
        <button
          onClick={() => setSelectedFilter('rack')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            selectedFilter === 'rack'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📍 By Rack
        </button>
        <button
          onClick={() => setSelectedFilter('genre')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            selectedFilter === 'genre'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🎭 By Genre
        </button>
        <button
          onClick={() => setSelectedFilter('lowStock')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            selectedFilter === 'lowStock'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          ⚠️ Low Stock
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-xl shadow-md p-6">
        {selectedFilter === 'all' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Stats */}
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Total Racks</span>
                  <span className="font-bold text-gray-900">{Object.keys(stats.rackStats).length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Total Genres</span>
                  <span className="font-bold text-gray-900">{Object.keys(stats.genreStats).length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
                  <span className="text-red-700">Books Needing Restock</span>
                  <span className="font-bold text-red-900">{stats.lowStockBooks.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
                  <span className="text-red-700">Out of Stock</span>
                  <span className="font-bold text-red-900">{stats.outOfStockBooks.length}</span>
                </div>
              </div>
            </div>

            {/* Top Racks */}
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Top 5 Racks by Books</h3>
              <div className="space-y-3">
                {Object.entries(stats.rackStats)
                  .sort(([, a], [, b]) => b.books.length - a.books.length)
                  .slice(0, 5)
                  .map(([rack, data]) => (
                    <div key={rack} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-gray-900">{rack}</span>
                        <span className="text-sm text-gray-600">{data.books.length} books</span>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                          {data.available} available
                        </span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                          {data.borrowed} borrowed
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {selectedFilter === 'rack' && (
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Books by Rack</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(stats.rackStats)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([rack, data]) => (
                  <div key={rack} className="border-2 border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-lg text-gray-900">{rack}</h4>
                        <p className="text-sm text-gray-500">{data.books.length} unique books</p>
                      </div>
                      <span className="text-3xl">📍</span>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Copies:</span>
                        <span className="font-semibold text-gray-900">{data.total}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600">Available:</span>
                        <span className="font-semibold text-green-700">{data.available}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-purple-600">Borrowed:</span>
                        <span className="font-semibold text-purple-700">{data.borrowed}</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${(data.available / data.total) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-center">
                      {((data.available / data.total) * 100).toFixed(1)}% available
                    </p>

                    {/* Book list */}
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                        View Books ({data.books.length})
                      </summary>
                      <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                        {data.books.map(book => (
                          <li key={book.id} className="text-xs text-gray-600 flex justify-between py-1 border-b border-gray-100">
                            <span className="truncate">{book.title}</span>
                            <span className="text-gray-400 ml-2">{book.availableQuantity}/{book.totalQuantity}</span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  </div>
                ))}
            </div>
          </div>
        )}

        {selectedFilter === 'genre' && (
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Books by Genre</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(stats.genreStats)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([genre, data]) => (
                  <div key={genre} className="border-2 border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-lg text-gray-900">{genre}</h4>
                        <p className="text-sm text-gray-500">{data.books.length} unique books</p>
                      </div>
                      <span className="text-3xl">🎭</span>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Copies:</span>
                        <span className="font-semibold text-gray-900">{data.total}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600">Available:</span>
                        <span className="font-semibold text-green-700">{data.available}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-purple-600">Borrowed:</span>
                        <span className="font-semibold text-purple-700">{data.borrowed}</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${(data.available / data.total) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-center">
                      {((data.available / data.total) * 100).toFixed(1)}% available
                    </p>

                    {/* Book list */}
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                        View Books ({data.books.length})
                      </summary>
                      <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                        {data.books.map(book => (
                          <li key={book.id} className="text-xs text-gray-600 flex justify-between py-1 border-b border-gray-100">
                            <span className="truncate">{book.title}</span>
                            <span className="text-gray-400 ml-2">{book.availableQuantity}/{book.totalQuantity}</span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  </div>
                ))}
            </div>
          </div>
        )}

        {selectedFilter === 'lowStock' && (
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>⚠️</span>
              Low Stock Alert ({stats.lowStockBooks.length} books)
            </h3>
            
            {stats.lowStockBooks.length === 0 ? (
              <div className="text-center py-12 bg-green-50 rounded-xl border-2 border-green-200">
                <div className="text-6xl mb-4">✅</div>
                <p className="text-green-700 text-lg font-semibold">All books are well stocked!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Book</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Author</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rack</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Available</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {stats.lowStockBooks.map(book => {
                      const availabilityPercent = (book.availableQuantity / book.totalQuantity) * 100;
                      const isOutOfStock = book.availableQuantity === 0;
                      
                      return (
                        <tr key={book.id} className={`hover:bg-gray-50 ${isOutOfStock ? 'bg-red-50' : ''}`}>
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{book.title}</div>
                            <div className="text-xs text-gray-500">{book.genre}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">{book.author}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{book.rack}</td>
                          <td className="px-6 py-4">
                            <span className={`text-lg font-bold ${isOutOfStock ? 'text-red-600' : 'text-orange-600'}`}>
                              {book.availableQuantity}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">{book.totalQuantity}</td>
                          <td className="px-6 py-4">
                            {isOutOfStock ? (
                              <span className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                                🚫 Out of Stock
                              </span>
                            ) : availabilityPercent < 30 ? (
                              <span className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">
                                ⚠️ Critical ({availabilityPercent.toFixed(0)}%)
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                                ⚡ Low Stock
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LibraryAnalytics;