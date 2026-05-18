import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { useContext, useEffect } from 'react';
import Navbar from './components/Navbar';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Lazy loading or basic imports for pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import BookingPage from './pages/BookingPage';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div>Loading...</div>;

  // Not logged in → go to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but not admin → redirect to their dashboard with error
  if (requireAdmin && user.role !== 'admin') {
    toast.error('Access denied: Admins only.', { toastId: 'admin-denied' });
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-slate-50">
          <Navbar />
          <main className="flex-grow container mx-auto px-4 py-8">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected User Routes */}
              <Route 
                path="/dashboard" 
                element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} 
              />
              <Route 
                path="/book/:hallId" 
                element={<ProtectedRoute><BookingPage /></ProtectedRoute>} 
              />

              {/* Protected Admin Routes */}
              <Route 
                path="/admin/*" 
                element={<ProtectedRoute requireAdmin={true}><AdminDashboard /></ProtectedRoute>} 
              />
            </Routes>
          </main>
          <ToastContainer position="bottom-right" theme="colored" />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
 
