import { useContext, useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogOut, Calendar, LayoutDashboard, Home, ChevronDown, User } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/login');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to={user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/'} className="flex items-center gap-2">
              <Calendar className="h-6 w-6 text-green-600" />
              <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
                Schedulix
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                {/* Navigation Links */}
                <Link
                  to="/"
                  className="text-gray-600 hover:text-green-600 font-medium flex items-center gap-1 transition-colors text-sm"
                >
                  <Home className="h-4 w-4" />
                  <span className="hidden sm:block">Home</span>
                </Link>

                {user.role === 'admin' ? (
                  <Link
                    to="/admin"
                    className="text-gray-600 hover:text-green-600 font-medium flex items-center gap-1 transition-colors text-sm"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="hidden sm:block">Admin Panel</span>
                  </Link>
                ) : (
                  <Link
                    to="/dashboard"
                    className="text-gray-600 hover:text-green-600 font-medium flex items-center gap-1 transition-colors text-sm"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="hidden sm:block">Dashboard</span>
                  </Link>
                )}

                {/* User Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-green-600 transition-colors px-3 py-2 rounded-lg hover:bg-gray-50"
                  >
                    <div className="w-7 h-7 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">
                      {user.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <span className="hidden sm:block">{user.name}</span>
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 animate-in fade-in slide-in-from-top-1">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-green-100 text-green-700 uppercase tracking-wide">
                          {user.role}
                        </span>
                      </div>

                      {/* Links */}
                      <div className="py-1">
                        <Link
                          to="/"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Home className="h-4 w-4 text-gray-400" />
                          Home
                        </Link>
                        <Link
                          to={user.role === 'admin' ? '/admin' : '/dashboard'}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <LayoutDashboard className="h-4 w-4 text-gray-400" />
                          {user.role === 'admin' ? 'Admin Panel' : 'My Dashboard'}
                        </Link>
                      </div>

                      {/* Logout */}
                      <div className="border-t border-gray-100 pt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                        >
                          <LogOut className="h-4 w-4" />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-green-600 font-medium transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
