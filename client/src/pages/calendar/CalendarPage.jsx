import { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', eventDate: '', isCompetition: false });
  const [winnerForm, setWinnerForm] = useState([{ position: '1st', winnerName: '' }, { position: '2nd', winnerName: '' }, { position: '3rd', winnerName: '' }]);
  const [saving, setSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => { loadEvents(); }, [year, month]);

  const loadEvents = async () => {
    try { const res = await api.getEventsByMonth(year, month + 1); setEvents(res.data); }
    catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDay = (y, m) => new Date(y, m, 1).getDay();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDay(year, month);
  const today = new Date();
  const isToday = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const getEventsForDay = (d) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return events.filter(e => e.event_date?.startsWith(dateStr));
  };

  const handleDayClick = (d) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    setForm({ name: '', description: '', eventDate: dateStr, isCompetition: false });
    setShowEventModal(true);
  };

  const handleSaveEvent = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try { await api.createEvent(form); setShowEventModal(false); loadEvents(); }
    catch (err) { console.error(err); } finally { setSaving(false); }
  };

  const handleDeleteEvent = async (id) => {
    await api.deleteEvent(id); setMenuOpen(null); loadEvents(); setShowDetailModal(false);
  };

  const handleToggleComp = async (id) => {
    await api.toggleCompetition(id); setMenuOpen(null); loadEvents();
  };

  const openEventDetail = (ev) => { setSelectedEvent(ev); setShowDetailModal(true); setMenuOpen(null); };

  const handleSaveWinners = async () => {
    if (!selectedEvent) return;
    setSaving(true);
    try {
      const valid = winnerForm.filter(w => w.winnerName.trim());
      if (valid.length > 0) await api.setEventWinners(selectedEvent.id, valid);
      setShowDetailModal(false); loadEvents();
    } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  const handlePhotoUpload = async (e) => {
    if (!selectedEvent || !e.target.files?.length) return;
    const fd = new FormData();
    for (const f of e.target.files) fd.append('photos', f);
    try { await api.uploadEventPhotos(selectedEvent.id, fd); }
    catch (err) { console.error(err); }
  };

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="page-container">
      <div className="page-header"><h1>Events Calendar</h1><p>Manage gym events and competitions</p></div>

      <div className="card">
        <div className="flex justify-between items-center" style={{ marginBottom: 24 }}>
          <button className="btn btn-icon" onClick={() => setCurrentDate(new Date(year, month - 1))}>
            <span className="material-icons-outlined">chevron_left</span></button>
          <h2 className="headline-md">{months[month]} {year}</h2>
          <button className="btn btn-icon" onClick={() => setCurrentDate(new Date(year, month + 1))}>
            <span className="material-icons-outlined">chevron_right</span></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center' }}>
          {days.map(d => <div key={d} className="label-sm" style={{ padding: 8, color: 'var(--on-surface-variant)' }}>{d}</div>)}
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const d = i + 1;
            const dayEvents = getEventsForDay(d);
            return (
              <div key={d} onClick={() => handleDayClick(d)} style={{
                padding: 8, minHeight: 80, borderRadius: 'var(--radius-md)', cursor: 'pointer', position: 'relative',
                background: isToday(d) ? 'var(--primary)' : dayEvents.length > 0 ? 'var(--surface-container-low)' : 'transparent',
                color: isToday(d) ? 'white' : 'var(--on-surface)', transition: 'background 0.15s',
              }}
                onMouseEnter={e => { if (!isToday(d)) e.currentTarget.style.background = 'var(--surface-container)'; }}
                onMouseLeave={e => { if (!isToday(d) && !dayEvents.length) e.currentTarget.style.background = 'transparent'; else if (!isToday(d)) e.currentTarget.style.background = 'var(--surface-container-low)'; }}>
                <span className="label-lg">{d}</span>
                {dayEvents.map(ev => (
                  <div key={ev.id} onClick={e => { e.stopPropagation(); openEventDetail(ev); }}
                    style={{ fontSize: '0.625rem', padding: '2px 4px', borderRadius: 4, marginTop: 4, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      background: ev.is_competition ? 'var(--tertiary-container)' : 'var(--primary-container)',
                      color: ev.is_competition ? 'var(--on-tertiary-container)' : 'var(--on-primary-container)' }}>
                    {ev.name}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <Modal isOpen={showEventModal} onClose={() => setShowEventModal(false)} title={selectedDate}
        footer={<><button className="btn btn-secondary" onClick={() => setShowEventModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSaveEvent} disabled={saving}>{saving ? 'Saving...' : 'Add Event'}</button></>}>
        <div className="form-group"><label className="form-label">Event Name *</label>
          <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Event name" /></div>
        <div className="form-group"><label className="form-label">Description</label>
          <textarea rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Event details..." /></div>
        <label className="flex items-center gap-sm" style={{ cursor: 'pointer' }}>
          <input type="checkbox" checked={form.isCompetition} onChange={e => setForm(p => ({ ...p, isCompetition: e.target.checked }))} style={{ width: 18, height: 18 }} />
          <span className="body-md">Consider this event as a competition</span>
        </label>
      </Modal>

      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title={selectedEvent?.name} size="lg"
        footer={selectedEvent?.is_competition ? <button className="btn btn-primary" onClick={handleSaveWinners} disabled={saving}>Save Winners</button> : null}>
        {selectedEvent && <>
          <p className="body-md" style={{ marginBottom: 12 }}>{selectedEvent.description || 'No description'}</p>
          <div className="flex gap-sm" style={{ marginBottom: 20 }}>
            <span className="badge badge-neutral">{selectedEvent.event_date}</span>
            {selectedEvent.is_competition && <span className="badge badge-success">Competition</span>}
          </div>
          <div className="flex gap-sm" style={{ marginBottom: 20 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => handleToggleComp(selectedEvent.id)}>
              {selectedEvent.is_competition ? 'Remove Competition' : 'Mark as Competition'}</button>
            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteEvent(selectedEvent.id)}>Delete Event</button>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label className="form-label">Upload Event Photos</label>
            <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={{ padding: 8 }} />
          </div>
          {selectedEvent.is_competition && <div>
            <h4 className="title-md" style={{ marginBottom: 12 }}>Competition Winners</h4>
            {winnerForm.map((w, i) => (
              <div key={i} className="flex items-center gap-md" style={{ marginBottom: 8 }}>
                <span className="badge badge-success" style={{ minWidth: 40, justifyContent: 'center' }}>{w.position}</span>
                <input className="flex-1" value={w.winnerName} onChange={e => {
                  const updated = [...winnerForm]; updated[i].winnerName = e.target.value; setWinnerForm(updated);
                }} placeholder="Winner name" />
              </div>
            ))}
          </div>}
        </>}
      </Modal>
    </div>
  );
}
