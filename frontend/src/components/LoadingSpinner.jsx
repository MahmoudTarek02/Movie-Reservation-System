import './LoadingSpinner.css';

const LoadingSpinner = ({ label = 'Loading...' }) => {
  return (
    <div className="loading" role="status" aria-live="polite">
      <span className="loading__spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
};

export default LoadingSpinner;
