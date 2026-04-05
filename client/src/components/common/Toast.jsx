export default function Toast({ toasts, onRemove }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`} onClick={() => onRemove(t.id)}>
          <span className="material-icons-outlined" style={{ fontSize: 20 }}>
            {t.type === 'success' ? 'check_circle' : t.type === 'error' ? 'error' : 'info'}
          </span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
