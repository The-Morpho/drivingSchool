import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Car, LogOut, User as UserIcon } from 'lucide-react';
import { UserRole, rolePermissions } from '../utils/rolePermissions';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [username, setUsername] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserRole(user.role);
      setUsername(user.username);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
    window.location.reload();
  };

  // Define all possible links with their paths and labels
  const allLinks = [
    { to: '/dashboard', label: 'Dashboard', path: '/dashboard' },
    { to: '/customers', label: 'Customers', path: '/customers' },
    { to: '/staff', label: 'Staff', path: '/staff' },
    { to: '/lessons', label: 'Lessons', path: '/lessons' },
    { to: '/payments', label: 'Payments', path: '/payments' },
    { to: '/vehicles', label: 'Vehicles', path: '/vehicles' },
    { to: '/addresses', label: 'Addresses', path: '/addresses' },
    { to: '/assignments', label: 'Assignments', path: '/assignments' },
    { to: '/chat', label: 'Chat', path: '/chat' },
  ];

  // Filter links based on user role
  const getVisibleLinks = () => {
    if (!userRole) return [];
    const allowedPaths = rolePermissions[userRole];
    return allLinks.filter(link => allowedPaths.includes(link.path));
  };

  const visibleLinks = getVisibleLinks();

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <Car size={28} />
            Driving School
          </Link>

          <button
            className="lg:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className={`${isOpen ? 'block' : 'hidden'} lg:flex gap-1 absolute lg:relative top-16 lg:top-0 left-0 right-0 bg-blue-600 lg:bg-transparent flex-col lg:flex-row w-full lg:w-auto p-4 lg:p-0 z-50`}>
            {visibleLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="py-2 lg:py-1 px-3 rounded hover:bg-blue-700 transition"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            
            {/* Profile Link */}
            <Link
              to="/profile"
              className="py-2 lg:py-1 px-3 rounded hover:bg-blue-700 transition flex items-center gap-2"
              onClick={() => setIsOpen(false)}
            >
              <UserIcon size={18} />
              Profile
            </Link>

            {/* User Info & Logout */}
            <div className="lg:ml-4 py-2 lg:py-1 px-3 flex items-center gap-3 border-t lg:border-t-0 lg:border-l border-blue-500 mt-2 lg:mt-0">
              <div className="hidden lg:block">
                <p className="text-xs text-blue-200">@{username}</p>
                <p className="text-xs font-semibold capitalize">{userRole}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 py-1 px-3 rounded bg-blue-700 hover:bg-blue-800 transition"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
