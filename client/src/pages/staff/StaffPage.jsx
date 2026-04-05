import { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

export default function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', role: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => { loadStaff(); }, []);
  const loadStaff = async () => {
    try { const res = await api.getStaff({ page: 1, limit: 50 }); setStaff(res.data); }
    catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleSave = async () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setSaving(true);
    try {
      const res = await api.createStaff(form);
      setSuccessMsg(`Staff created! ID: ${res.data.uniqueStaffId}`);
      setForm({ fullName: '', email: '', phone: '', role: '' });
      loadStaff();
      setTimeout(() => { setSuccessMsg(''); setShowModal(false); }, 3000);
    } catch (err) { setErrors({ submit: err.message }); } finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div className="page-header"><h1>Staff Members</h1><p>Manage your gym staff team</p></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <span className="material-icons-outlined">person_add</span> Add Staff
        </button>
      </div>

      {staff.length > 0 ? (
        <div className="card" style={{ padding: 0, overflow: 'auto' }}>
          <table className="data-table">
            <thead><tr><th>Name</th><th>Staff ID</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th></tr></thead>
            <tbody>{staff.map(s => (
              <tr key={s.id}>
                <td className="label-lg">{s.full_name}</td>
                <td><span className="badge badge-secondary">{s.unique_staff_id}</span></td>
                <td className="body-sm text-muted">{s.email}</td>
                <td className="body-sm">{s.phone || '—'}</td>
                <td className="body-sm">{s.role || '—'}</td>
                <td><span className={`badge ${s.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>{s.status}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon="badge" title="No Staff Members Yet" message="Add staff to manage your gym operations"
          action={<button className="btn btn-primary" onClick={() => setShowModal(true)}>Add First Staff</button>} />
      )}

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setErrors({}); setSuccessMsg(''); }} title="Add Staff Member"
        footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Creating...' : 'Create Staff'}</button></>}>
        {successMsg && <div style={{ padding: '12px 16px', background: 'rgba(64,102,0,0.1)', borderRadius: 8, marginBottom: 16 }}>
          <span className="body-md" style={{ color: 'var(--tertiary)', fontWeight: 600 }}>✓ {successMsg}</span>
        </div>}
        {errors.submit && <div className="auth-error" style={{ marginBottom: 16 }}>{errors.submit}</div>}
        <div className="form-group"><label className="form-label">Full Name *</label>
          <input value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} placeholder="Staff member name" />
          {errors.fullName && <p className="form-error">{errors.fullName}</p>}</div>
        <div className="form-group"><label className="form-label">Email *</label>
          <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="staff@gym.com" />
          {errors.email && <p className="form-error">{errors.email}</p>}</div>
        <div className="form-group"><label className="form-label">Phone</label>
          <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="Phone number" /></div>
        <div className="form-group"><label className="form-label">Role</label>
          <input value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} placeholder="e.g. Front Desk, Manager" /></div>
      </Modal>
    </div>
  );
}
