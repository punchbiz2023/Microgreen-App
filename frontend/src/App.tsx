import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Atlas from './pages/Atlas';
import SeedDetail from './pages/SeedDetail'; // New
import MyPlants from './pages/MyPlants';
import Dashboard from './pages/Dashboard';
import DailyLog from './pages/DailyLog';
import DailyGuide from './pages/DailyGuide';
import Harvest from './pages/Harvest';

import Header from './components/Header';
import AIChatBot from './components/AIChatBot';

import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register'; // We'll create this next
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';

import { useAuth } from './contexts/AuthContext';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  // We check for token existence as well for immediate protection
  const token = localStorage.getItem('token');

  if (!isAuthenticated && !token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 pb-12">
          <Header />
          <Routes>
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/atlas" element={<ProtectedRoute><Atlas /></ProtectedRoute>} />
            <Route path="/atlas/:id" element={<ProtectedRoute><SeedDetail /></ProtectedRoute>} />
            <Route path="/my-plants" element={<ProtectedRoute><MyPlants /></ProtectedRoute>} />
            <Route path="/dashboard/:cropId" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/guide/:cropId" element={<ProtectedRoute><DailyGuide /></ProtectedRoute>} />
            <Route path="/log/:cropId/:day" element={<ProtectedRoute><DailyLog /></ProtectedRoute>} />
            <Route path="/harvest/:cropId" element={<ProtectedRoute><Harvest /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/login" element={<AdminLogin />} />
          </Routes>
          <AIChatBot />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
