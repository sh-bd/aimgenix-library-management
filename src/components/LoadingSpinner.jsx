
const LoadingSpinner = ({ fullScreen = false }) => (
    <div className={`flex justify-center items-center ${fullScreen ? 'h-screen' : 'py-10'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" role="status">
            <span className="sr-only">Loading...</span>
        </div>
    </div>
);

export default LoadingSpinner;