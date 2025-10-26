
const Modal = ({ title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel" }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-sm text-gray-600 mb-4">{message}</p>
            <div className="flex justify-end space-x-2">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md font-medium hover:bg-gray-300 transition-colors"
                >
                    {cancelText}
                </button>
                <button
                    onClick={onConfirm}
                    className="px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition-colors"
                >
                    {confirmText}
                </button>
            </div>
        </div>
    </div>
);

export default Modal;