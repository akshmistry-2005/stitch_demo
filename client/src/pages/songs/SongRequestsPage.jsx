import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

export default function SongRequestsPage() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ songTitle: '', artist: '', requestedBy: '' });

  const handleSocketEvent = useCallback((event, data) => {
    if (event === 'song:new-request') setQueue(prev => [...prev, data]);
    else if (event === 'song:queue-update') setQueue(data);
    else if (event === 'song:status-update') setQueue(prev => prev.map(s => s.id === data.id ? data : s));
  }, []);

  useSocket(handleSocketEvent);

  useEffect(() => { loadQueue(); }, []);
  const loadQueue = async () => {
    try { const res = await api.getSongQueue(); setQueue(res.data); } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!form.songTitle || !form.requestedBy) return;
    try { await api.submitSongRequest(form); setForm({ songTitle: '', artist: '', requestedBy: '' }); } catch (err) { console.error(err); }
  };

  const updateStatus = async (id, status) => {
    try { await api.updateSongStatus(id, status); } catch (err) { console.error(err); }
  };

  const nowPlaying = queue.find(s => s.status === 'playing');
  const queued = queue.filter(s => s.status === 'queued');

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="page-container">
      <div className="page-header"><h1>Song Request Queue</h1><p>Live music requests from gym members</p></div>
      <div className="content-grid-2">
        <div>
          {nowPlaying && (
            <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dim))', borderRadius: 'var(--radius-2xl)', padding: 28, marginBottom: 24, color: 'white' }}>
              <p className="label-sm" style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>Now Playing</p>
              <h2 className="headline-md" style={{ color: 'white' }}>{nowPlaying.song_title}</h2>
              <p className="body-md" style={{ color: 'rgba(255,255,255,0.7)' }}>{nowPlaying.artist || 'Unknown'}</p>
              <button className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', marginTop: 16 }} onClick={() => updateStatus(nowPlaying.id, 'played')}>
                <span className="material-icons-outlined">skip_next</span> Mark as Played
              </button>
            </div>
          )}
          <div className="card">
            <h3 className="headline-sm" style={{ marginBottom: 16 }}>Queue ({queued.length})</h3>
            {queued.length > 0 ? queued.map((song, i) => (
              <div key={song.id} className="flex items-center gap-md" style={{ padding: '14px 0', borderBottom: i < queued.length - 1 ? '1px solid var(--surface-container)' : 'none' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', color: 'var(--on-surface-variant)', flexShrink: 0 }}>{i + 1}</div>
                <div className="flex-1">
                  <p className="title-md">{song.song_title}</p>
                  <p className="body-sm text-muted">{song.artist || ''} • by {song.requested_by}</p>
                </div>
                <div className="flex gap-xs">
                  <button className="btn btn-sm btn-success" onClick={() => updateStatus(song.id, 'playing')}>Play</button>
                  <button className="btn btn-sm btn-secondary" onClick={() => updateStatus(song.id, 'skipped')}>Skip</button>
                </div>
              </div>
            )) : <EmptyState icon="queue_music" title="Queue Empty" message="No songs in queue" />}
          </div>
        </div>
        <div>
          <div className="card">
            <h3 className="headline-sm" style={{ marginBottom: 20 }}>Submit a Request</h3>
            <p className="body-sm text-muted" style={{ marginBottom: 20 }}>Test the song request flow</p>
            <div className="form-group"><label className="form-label">Song Title *</label>
              <input value={form.songTitle} onChange={e => setForm(p => ({ ...p, songTitle: e.target.value }))} placeholder="e.g. Thunderstruck" /></div>
            <div className="form-group"><label className="form-label">Artist</label>
              <input value={form.artist} onChange={e => setForm(p => ({ ...p, artist: e.target.value }))} placeholder="e.g. AC/DC" /></div>
            <div className="form-group"><label className="form-label">Requested By *</label>
              <input value={form.requestedBy} onChange={e => setForm(p => ({ ...p, requestedBy: e.target.value }))} placeholder="Member name" /></div>
            <button className="btn btn-primary w-full" onClick={handleSubmit} disabled={!form.songTitle || !form.requestedBy}>Submit Request</button>
          </div>
          <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--on-surface-variant)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--tertiary)', animation: 'pulse 2s infinite' }} /> Live • Real-time updates
          </div>
        </div>
      </div>
    </div>
  );
}
