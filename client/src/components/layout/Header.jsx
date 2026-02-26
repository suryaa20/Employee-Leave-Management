import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/authContext';
import { useState, useEffect } from 'react';
import { FiBell, FiUser, FiSettings, FiLogOut } from 'react-icons/fi';
import ThemeToggle from '../common/ThemeToggle';

const Header = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Fetch notifications
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    // Mock notifications
    setNotifications([
      { id: 1, message: 'Leave request approved', time: '5 min ago' },
      { id: 2, message: 'New reimbursement pending', time: '1 hour ago' },
    ]);
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('employee')) return 'Employee Dashboard';
    if (path.includes('manager')) return 'Manager Dashboard';
    if (path.includes('admin')) return 'Admin Panel';
    if (path.includes('apply-leave')) return 'Apply for Leave';
    if (path.includes('leave-history')) return 'Leave History';
    if (path.includes('reimbursements')) return 'Reimbursements';
    if (path.includes('users')) return 'User Management';
    if (path.includes('reports')) return 'Reports';
    return 'Dashboard';
  };

  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    return paths.map((path, index) => ({
      name: path.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      path: '/' + paths.slice(0, index + 1).join('/')
    }));
  };

  return (
    <header className="bg-white dark:bg-dark-card shadow-sm sticky top-0 z-40 transition-colors">
      <div className="px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Left side */}
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              {getPageTitle()}
            </h1>
            <nav className="flex mt-1 text-sm">
              <Link to={`/${user?.role}`} className="text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">
                Home
              </Link>
              {getBreadcrumbs().map((crumb, index) => (
                <span key={crumb.path} className="flex items-center">
                  <span className="mx-2 text-gray-400 dark:text-gray-600">/</span>
                  <Link
                    to={crumb.path}
                    className="text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    {crumb.name}
                  </Link>
                </span>
              ))}
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle Button */}
            <ThemeToggle />


            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-3 focus:outline-none"
              >
                <div className="h-10 w-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 dark:text-primary-300 font-semibold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
                </div>
              </button>

              {/* Dropdown Menu - update dark mode classes */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-card rounded-lg shadow-lg py-1 border dark:border-dark-border">
                  {/* ... dropdown items ... */}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;