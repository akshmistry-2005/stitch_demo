import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import './Dashboard.css';

export default function Dashboard() {
  const [stats, setStats] = useState({ activeUsers: 0, totalTrainers: 0, newToday: 0, totalStaff: 0 });
  const [events, setEvents] = useState([]);
  const [songQueue, setSongQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleSocketEvent = useCallback((event, data) => {
    if (event === 'song:new-request') {
      setSongQueue(prev => [...prev, data]);
    } else if (event === 'song:queue-update') {
      setSongQueue(data);
    } else if (event === 'song:status-update') {
      setSongQueue(prev => prev.map(s => s.id === data.id ? data : s));
    }
  }, []);

  useSocket(handleSocketEvent);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsRes, eventsRes, songsRes] = await Promise.all([
        api.getDashboardStats(),
        api.getTodayEvents(),
        api.getSongQueue()
      ]);
      setStats(statsRes.data);
      setEvents(eventsRes.data);
      setSongQueue(songsRes.data);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const nowPlaying = songQueue.find(s => s.status === 'playing');
  const queued = songQueue.filter(s => s.status === 'queued');

  if (loading) return <LoadingSpinner size="lg" message="Loading dashboard..." />;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Atelier Overview</h1>
        <p>Real-time performance metrics for your gym</p>
      </div>

      <div className="content-grid-dashboard">
        <div className="dashboard-main">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon-wrapper primary"><span className="material-icons-outlined">group</span></div>
              <p className="stat-label">Active Users</p>
              <p className="stat-value">{stats.activeUsers.toLocaleString()}</p>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrapper secondary"><span className="material-icons-outlined">supervisor_account</span></div>
              <p className="stat-label">Trainers</p>
              <p className="stat-value">{stats.totalTrainers}</p>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrapper tertiary"><span className="material-icons-outlined">person_add</span></div>
              <p className="stat-label">New Joins Today</p>
              <p className="stat-value">{stats.newToday}</p>
              <div className="stat-trend"><span className="material-icons-outlined" style={{ fontSize: 14 }}>trending_up</span> Updated in real-time</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrapper neutral"><span className="material-icons-outlined">badge</span></div>
              <p className="stat-label">Staff Members</p>
              <p className="stat-value">{stats.totalStaff}</p>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 24 }}>
            <h3 className="headline-sm" style={{ marginBottom: 16 }}>Today's Events</h3>
            {events.length > 0 ? (
              <div className="events-list">
                {events.map(ev => (
                  <div key={ev.id} className="event-item">
                    <div className="event-dot" />
                    <div>
                      <p className="label-lg">{ev.name}</p>
                      <p className="body-sm text-muted">{ev.description || 'No description'}</p>
                    </div>
                    {ev.is_competition && <span className="badge badge-success">Competition</span>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-events">
                <span className="material-icons-outlined" style={{ fontSize: 40, color: 'var(--surface-dim)', marginBottom: 8 }}>event_busy</span>
                <p className="body-md" style={{ fontWeight: 600 }}>No events scheduled for today</p>
                <p className="body-sm text-muted">Check the calendar for upcoming events</p>
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-songs-panel">
          <div className="songs-panel-inner">
            <h3 className="headline-sm" style={{ marginBottom: 20 }}>
              <span className="material-icons-outlined" style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--primary)' }}>queue_music</span>
              Live Requests
            </h3>

            {nowPlaying && (
              <div className="now-playing">
                <p className="label-sm">Now Playing</p>
                <div className="now-playing-track">
                  <div className="playing-bars"><span /><span /><span /><span /></div>
                  <div>
                    <p className="title-md">{nowPlaying.song_title}</p>
                    <p className="body-sm text-muted">{nowPlaying.artist || 'Unknown Artist'}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="queue-section">
              <p className="label-sm" style={{ marginBottom: 12 }}>Queue List</p>
              {queued.length > 0 ? queued.map((song, i) => (
                <div key={song.id} className="queue-item">
                  <div className="queue-position">{i + 1}</div>
                  <div className="queue-info">
                    <p className="label-lg">{song.song_title}</p>
                    <p className="body-sm text-muted">Requested by {song.requested_by}</p>
                  </div>
                </div>
              )) : (
                <p className="body-sm text-muted" style={{ textAlign: 'center', padding: '20px 0' }}>No songs in queue</p>
              )}
            </div>
            <div className="live-indicator"><span className="live-dot" /> Live • Auto-updates</div>
          </div>
        </div>
      </div>
    </div>
  );
}
