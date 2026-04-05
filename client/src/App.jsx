import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Dashboard from './pages/dashboard/Dashboard';
import UsersPage from './pages/users/UsersPage';
import StaffPage from './pages/staff/StaffPage';
import TrainersPage from './pages/trainers/TrainersPage';
import WorkoutsPage from './pages/workouts/WorkoutsPage';
import DietPage from './pages/diet/DietPage';
import CalendarPage from './pages/calendar/CalendarPage';
import SongRequestsPage from './pages/songs/SongRequestsPage';
import LoadingSpinner from './components/common/LoadingSpinner';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingSpinner size="lg" message="Verifying session..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingSpinner size="lg" />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="staff" element={<StaffPage />} />
        <Route path="trainers" element={<TrainersPage />} />
        <Route path="workouts" element={<WorkoutsPage />} />
        <Route path="diet" element={<DietPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="songs" element={<SongRequestsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
