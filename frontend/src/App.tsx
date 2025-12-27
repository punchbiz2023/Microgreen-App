import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Atlas from './pages/Atlas';
import SeedDetail from './pages/SeedDetail'; // New
import MyPlants from './pages/MyPlants';
import Dashboard from './pages/Dashboard';
import DailyLog from './pages/DailyLog';
import Harvest from './pages/Harvest';

import Header from './components/Header';

import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register'; // We'll create this next
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 pb-12">
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/atlas" element={<Atlas />} />
            <Route path="/atlas/:id" element={<SeedDetail />} />
            <Route path="/my-plants" element={<MyPlants />} />
            <Route path="/dashboard/:cropId" element={<Dashboard />} />
            <Route path="/log/:cropId/:day" element={<DailyLog />} />
            <Route path="/harvest/:cropId" element={<Harvest />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/login" element={<AdminLogin />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
