import { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

export default function UsersPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', heightCm: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => { loadMembers(); }, [search]);

  const loadMembers = async () => {
    try {
      const res = await api.getMembers({ search, page: 1, limit: 50 });
      setMembers(res.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Please enter user name';
    if (!form.email.trim()) e.email = 'Please enter email address';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Please enter a valid email';
    if (!form.phone.trim()) e.phone = 'Please enter phone number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await api.createMember(form);
      setSuccessMsg(`Member created! ID: ${res.data.uniqueMemberId}`);
      setForm({ fullName: '', email: '', phone: '', heightCm: '' });
      loadMembers();
      setTimeout(() => { setSuccessMsg(''); setShowModal(false); }, 3000);
    } catch (err) {
      setErrors({ submit: err.message });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this member?')) return;
    await api.deleteMember(id);
    loadMembers();
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div className="page-header">
          <h1>Member Directory</h1>
          <p>{members.length} Active High-Performance Athletes</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <span className="material-icons-outlined">person_add</span> Add New User
        </button>
      </div>

      <div className="search-bar" style={{ marginBottom: 24 }}>
        <span className="material-icons-outlined">search</span>
        <input placeholder="Search members by name, email, or ID..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {members.length > 0 ? (
        <div className="card" style={{ padding: 0, overflow: 'auto' }}>
          <table className="data-table">
            <thead><tr><th>Name</th><th>Member ID</th><th>Email</th><th>Phone</th><th>Status</th><th>Trainer</th><th></th></tr></thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id}>
                  <td><span className="label-lg">{m.full_name}</span></td>
                  <td><span className="badge badge-primary">{m.unique_member_id}</span></td>
                  <td className="body-sm text-muted">{m.email}</td>
                  <td className="body-sm">{m.phone || '—'}</td>
                  <td><span className={`badge ${m.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>{m.status}</span></td>
                  <td className="body-sm">{m.trainer_name || '—'}</td>
                  <td>
                    <button className="btn-icon" style={{ width: 32, height: 32 }} onClick={() => handleDelete(m.id)}>
                      <span className="material-icons-outlined" style={{ fontSize: 16 }}>delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon="group" title="Initialize Your Roster" message="Start your journey at the Kinetic Atelier by documenting your first high-performance athlete."
          action={<button className="btn btn-primary" onClick={() => setShowModal(true)}>Add First Member</button>} />
      )}

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setErrors({}); setSuccessMsg(''); }} title="New Athlete Profile"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Creating...' : 'Create Member'}</button>
        </>}>
        <p className="body-sm text-muted" style={{ marginBottom: 20 }}>Enter precision vitals for enrollment</p>
        {successMsg && <div style={{ padding: '12px 16px', background: 'rgba(64,102,0,0.1)', borderRadius: 'var(--radius-md)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-icons-outlined" style={{ color: 'var(--tertiary)', fontSize: 20 }}>check_circle</span>
          <span className="body-md" style={{ color: 'var(--tertiary)', fontWeight: 600 }}>{successMsg}</span>
        </div>}
        {errors.submit && <div className="auth-error" style={{ marginBottom: 16 }}><span className="material-icons-outlined">error</span>{errors.submit}</div>}
        <div className="form-group">
          <label className="form-label">Full Name *</label>
          <input value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} placeholder="Enter member name" />
          {errors.fullName && <p className="form-error">{errors.fullName}</p>}
        </div>
        <div className="form-group">
          <label className="form-label">Email Address *</label>
          <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="member@email.com" />
          {errors.email && <p className="form-error">{errors.email}</p>}
        </div>
        <div className="form-group">
          <label className="form-label">Phone Number *</label>
          <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+1 (555) 000-0000" />
          {errors.phone && <p className="form-error">{errors.phone}</p>}
        </div>
        <div className="form-group">
          <label className="form-label">Height (cm)</label>
          <input type="number" value={form.heightCm} onChange={e => setForm(p => ({ ...p, heightCm: e.target.value }))} placeholder="e.g. 175" />
        </div>
      </Modal>
    </div>
  );
}
