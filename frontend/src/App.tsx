import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Atlas from './pages/Atlas';
import SeedDetail from './pages/SeedDetail';
import MyPlants from './pages/MyPlants';
import Dashboard from './pages/Dashboard';
import DailyLog from './pages/DailyLog';
import DailyGuide from './pages/DailyGuide';
import Harvest from './pages/Harvest';
import PlantCounter from './pages/PlantCounter';

import DashboardLayout from './components/DashboardLayout';
import AIChatBot from './components/AIChatBot';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';

import { ThemeProvider } from './contexts/ThemeContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const token = localStorage.getItem('token');

  if (!isAuthenticated && !token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function AppContent() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes (No Layout) */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Protected Dashboard Routes */}
          <Route path="/*" element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-50 dark:bg-[#0E1015] transition-colors duration-300">
                <DashboardLayout>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/atlas" element={<Atlas />} />
                    <Route path="/atlas/:id" element={<SeedDetail />} />
                    <Route path="/my-plants" element={<MyPlants />} />
                    <Route path="/dashboard/:cropId" element={<Dashboard />} />
                    <Route path="/guide/:cropId" element={<DailyGuide />} />
                    <Route path="/daily-log/:cropId/:day" element={<DailyLog />} />
                    <Route path="/harvest/:cropId" element={<Harvest />} />
                    <Route path="/count-plants" element={<PlantCounter />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                  </Routes>
                </DashboardLayout>
              </div>
            </ProtectedRoute>
          } />
        </Routes>
        <AIChatBot />
      </AuthProvider>
    </Router>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
