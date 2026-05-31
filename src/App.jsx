import React from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate 
} from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import GlobalQR from './pages/GlobalQR';
import PublicRegistration from './pages/PublicRegistration';
import PublicAttendance from './pages/PublicAttendance';
import TamuUndanganPage from './pages/TamuUndanganPage';
import DaftarPesertaPage from './pages/DaftarPesertaPage';
import ScannerPage from './pages/ScannerPage';
import LivePresence from './pages/LivePresence';

/**
 * Administrative Protected Router guard.
 */
const ProtectedRoute = ({ children }) => {
  const session = sessionStorage.getItem('admin_session');
  if (session !== 'active') {
    return <Navigate to="/login" replace />;
  }
  return children;
};

/**
 * Application Entry Router setup.
 */
function App() {
  return (
    <Router>
      <Routes>
        {/* Unprotected Public Routes */}
        {/* Root Page: Public Workshop Registration & Ticket Generator */}
        <Route path="/" element={<PublicRegistration />} />
        <Route path="/register" element={<PublicRegistration />} />
        
        {/* Public Attendance check-in at venue (scanned from global QR) */}
        <Route path="/presensi" element={<PublicAttendance />} />

        {/* Live Projector Screen Presence */}
        <Route path="/live" element={<LivePresence />} />

        {/* Protected Admin Suite entry */}
        <Route path="/login" element={<Login />} />

        {/* Protected Admin Control Panels */}
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/event-qr" 
          element={
            <ProtectedRoute>
              <GlobalQR />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/tamu-undangan" 
          element={
            <ProtectedRoute>
              <TamuUndanganPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/daftar-peserta" 
          element={
            <ProtectedRoute>
              <DaftarPesertaPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/scanner" 
          element={
            <ProtectedRoute>
              <ScannerPage />
            </ProtectedRoute>
          } 
        />

        {/* Catch-all redirect to public registration homepage */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
