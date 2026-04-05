import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import './Sidebar.css';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { path: '/users', label: 'Users', icon: 'group' },
  { path: '/workouts', label: 'Workouts', icon: 'fitness_center' },
  { path: '/diet', label: 'Diet Plans', icon: 'restaurant_menu' },
  { path: '/staff', label: 'Staff', icon: 'badge' },
  { path: '/trainers', label: 'Trainers', icon: 'supervisor_account' },
  { path: '/songs', label: 'Song Requests', icon: 'queue_music' },
  { path: '/calendar', label: 'Calendar', icon: 'calendar_today' },
];

export default function Sidebar() {
  const { user, gym, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="brand-icon">
            <span className="material-icons-outlined">fitness_center</span>
          </div>
          <div className="brand-text">
            <h1 className="brand-name">Kinetic Atelier</h1>
            <p className="brand-sub">Premium Management</p>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => (
          <NavLink key={item.path} to={item.path} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="material-icons-outlined nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
          <span className="material-icons-outlined">{theme === 'light' ? 'dark_mode' : 'light_mode'}</span>
          <span className="nav-label">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
        </button>

        <div className="sidebar-profile">
          <div className="profile-avatar">
            {user?.fullName?.charAt(0) || 'A'}
          </div>
          <div className="profile-info">
            <p className="profile-name">{user?.fullName || 'Admin'}</p>
            <p className="profile-role">{gym?.name || 'Gym Owner'}</p>
          </div>
          <button className="btn-icon" onClick={handleLogout} title="Logout" style={{ marginLeft: 'auto', width: 32, height: 32, fontSize: '0.8rem' }}>
            <span className="material-icons-outlined" style={{ fontSize: 18 }}>logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
