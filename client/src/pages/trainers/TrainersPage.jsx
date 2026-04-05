import { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

export default function TrainersPage() {
  const [trainers, setTrainers] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', specialization: '' });
  const [assignForm, setAssignForm] = useState({ trainerId: '', memberId: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [trainerMembers, setTrainerMembers] = useState([]);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [tRes, mRes] = await Promise.all([api.getTrainers(), api.getMembers({ limit: 200 })]);
      setTrainers(tRes.data);
      setMembers(mRes.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleAddTrainer = async () => {
    if (!form.fullName.trim()) { setErrors({ fullName: 'Name required' }); return; }
    setSaving(true);
    try { await api.createTrainer(form); setShowAdd(false); setForm({ fullName: '', email: '', phone: '', specialization: '' }); load(); }
    catch (err) { setErrors({ submit: err.message }); } finally { setSaving(false); }
  };

  const handleAssign = async () => {
    if (!assignForm.trainerId || !assignForm.memberId) { setErrors({ assign: 'Select both trainer and member' }); return; }
    setSaving(true);
    try { await api.assignTrainer(assignForm); setShowAssign(false); setAssignForm({ trainerId: '', memberId: '' }); load(); }
    catch (err) { setErrors({ assign: err.message }); } finally { setSaving(false); }
  };

  const viewMembers = async (trainer) => {
    setSelectedTrainer(trainer);
    const res = await api.getTrainerMembers(trainer.id);
    setTrainerMembers(res.data);
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div className="page-header"><h1>Trainers & Assignments</h1><p>Manage trainers and assign them to members</p></div>
        <div className="flex gap-sm">
          <button className="btn btn-secondary" onClick={() => setShowAssign(true)}><span className="material-icons-outlined">link</span> Assign Trainer</button>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}><span className="material-icons-outlined">person_add</span> Add Trainer</button>
        </div>
      </div>

      {trainers.length > 0 ? (
        <div className="flex gap-lg flex-wrap">
          {trainers.map(t => (
            <div key={t.id} className="card" style={{ flex: '1 1 300px', maxWidth: 400 }}>
              <div className="flex items-center gap-md" style={{ marginBottom: 16 }}>
                <div className="profile-avatar" style={{ width: 48, height: 48, fontSize: '1rem' }}>{t.full_name.charAt(0)}</div>
                <div>
                  <p className="title-md">{t.full_name}</p>
                  <p className="body-sm text-muted">{t.specialization || 'General Trainer'}</p>
                </div>
              </div>
              <div className="flex gap-sm" style={{ marginBottom: 12 }}>
                {t.email && <p className="body-sm text-muted">{t.email}</p>}
              </div>
              <div className="flex justify-between items-center">
                <span className="badge badge-primary">{t.assigned_members_count || 0} Members</span>
                <button className="btn btn-tertiary btn-sm" onClick={() => viewMembers(t)}>View Members</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon="supervisor_account" title="No Trainers Yet" message="Add trainers to start assigning them to gym members"
          action={<button className="btn btn-primary" onClick={() => setShowAdd(true)}>Add First Trainer</button>} />
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add New Trainer"
        footer={<><button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleAddTrainer} disabled={saving}>{saving ? 'Adding...' : 'Add Trainer'}</button></>}>
        {errors.submit && <div className="auth-error" style={{ marginBottom: 16 }}>{errors.submit}</div>}
        <div className="form-group"><label className="form-label">Full Name *</label>
          <input value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} placeholder="Trainer name" />
          {errors.fullName && <p className="form-error">{errors.fullName}</p>}</div>
        <div className="form-group"><label className="form-label">Email</label>
          <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="trainer@gym.com" /></div>
        <div className="form-group"><label className="form-label">Phone</label>
          <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
        <div className="form-group"><label className="form-label">Specialization</label>
          <input value={form.specialization} onChange={e => setForm(p => ({ ...p, specialization: e.target.value }))} placeholder="e.g. Strength Training, Yoga" /></div>
      </Modal>

      <Modal isOpen={showAssign} onClose={() => { setShowAssign(false); setErrors({}); }} title="Assign Trainer to Member"
        footer={<><button className="btn btn-secondary" onClick={() => setShowAssign(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleAssign} disabled={saving}>{saving ? 'Assigning...' : 'Assign'}</button></>}>
        {errors.assign && <div className="auth-error" style={{ marginBottom: 16 }}><span className="material-icons-outlined">error</span>{errors.assign}</div>}
        <p className="body-sm text-muted" style={{ marginBottom: 20 }}>Note: Each member can only have one trainer at a time.</p>
        <div className="form-group"><label className="form-label">Select Trainer</label>
          <select value={assignForm.trainerId} onChange={e => setAssignForm(p => ({ ...p, trainerId: e.target.value }))}>
            <option value="">Choose a trainer...</option>
            {trainers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
          </select></div>
        <div className="form-group"><label className="form-label">Select Member</label>
          <select value={assignForm.memberId} onChange={e => setAssignForm(p => ({ ...p, memberId: e.target.value }))}>
            <option value="">Choose a member...</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.full_name} ({m.unique_member_id})</option>)}
          </select></div>
      </Modal>

      <Modal isOpen={!!selectedTrainer} onClose={() => setSelectedTrainer(null)} title={`${selectedTrainer?.full_name}'s Members`}>
        {trainerMembers.length > 0 ? trainerMembers.map(m => (
          <div key={m.id} className="flex items-center gap-md" style={{ padding: '12px 0', borderBottom: '1px solid var(--surface-container)' }}>
            <div className="profile-avatar" style={{ width: 36, height: 36, fontSize: '0.75rem' }}>{m.full_name.charAt(0)}</div>
            <div><p className="label-lg">{m.full_name}</p><p className="body-sm text-muted">{m.unique_member_id}</p></div>
          </div>
        )) : <p className="body-md text-muted" style={{ textAlign: 'center', padding: 20 }}>No members assigned yet</p>}
      </Modal>
    </div>
  );
}
