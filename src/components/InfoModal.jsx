
const InfoModal = ({ title, content, onClose, isLoading }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
            <div className="text-sm text-gray-600 mb-6 min-h-[100px]">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" role="status">
                            <span className="sr-only">Loading...</span>
                        </div>
                    </div>
                ) : (
                    <p className="whitespace-pre-wrap">{content}</p>
                )}
            </div>
            <div className="flex justify-end">
                <button
                    onClick={onClose}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 transition-colors"
                >
                    Close
                </button>
            </div>
        </div>
    </div>
);

export default InfoModal;