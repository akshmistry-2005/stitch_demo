export default function LoadingSpinner({ size = '', message = 'Loading...' }) {
  return (
    <div className="loading-overlay">
      <div className={`spinner ${size === 'lg' ? 'spinner-lg' : ''}`} />
      {message && <p className="body-sm text-muted">{message}</p>}
    </div>
  );
}
