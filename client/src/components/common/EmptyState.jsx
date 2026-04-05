export default function EmptyState({ icon = 'inbox', title, message, action }) {
  return (
    <div className="empty-state">
      <span className="material-icons-outlined">{icon}</span>
      <h3>{title}</h3>
      <p>{message}</p>
      {action && <div style={{ marginTop: 20 }}>{action}</div>}
    </div>
  );
}
