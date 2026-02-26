import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';
import { useState } from 'react';
import {
  FiHome,
  FiCalendar,
  FiClock,
  FiUsers,
  FiFileText,
  FiSettings,
  FiLogOut,
  FiChevronLeft,
  FiChevronRight,
  FiPieChart,
  FiDollarSign
} from 'react-icons/fi';

const Sidebar = ({ role }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);

  const menuItems = {
    employee: [
      { path: '/employee', name: 'Dashboard', icon: FiHome, end: true },
      { path: '/employee/apply-leave', name: 'Apply Leave', icon: FiCalendar },
      { path: '/employee/leave-history', name: 'Leave History', icon: FiClock },
      { path: '/employee/reimbursements', name: 'Reimbursements', icon: FiDollarSign },
    ],
    manager: [
      { path: '/manager', name: 'Dashboard', icon: FiHome, end: true },
      { path: '/manager/leave-requests', name: 'Leave Requests', icon: FiFileText },
      { path: '/manager/reimbursements', name: 'Reimbursement Requests', icon: FiDollarSign },
      { path: '/manager/team', name: 'My Team', icon: FiUsers },
    ],
    admin: [
      { path: '/admin', name: 'Dashboard', icon: FiHome, end: true },
      { path: '/admin/users', name: 'User Management', icon: FiUsers },
      { path: '/admin/reports', name: 'Reports', icon: FiPieChart },
    ]
  };

  const items = menuItems[role] || menuItems.employee;

  const handleLogout = () => {
    logout();
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center px-6 py-3.5 text-gray-700 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-primary-900/10 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-200 ${isActive ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border-r-4 border-primary-600 font-medium' : ''
    } ${!isOpen ? 'justify-center' : ''}`;

  return (
    <div className={`fixed left-0 top-0 h-full bg-white dark:bg-dark-card shadow-2xl transition-all duration-300 z-50 border-r border-gray-100 dark:border-dark-border/30 ${isOpen ? 'w-64' : 'w-20'
      }`}>
      {/* Logo Section */}
      <div className={`flex items-center ${isOpen ? 'justify-between px-6' : 'justify-center'} py-6 border-b border-gray-100 dark:border-dark-border/50`}>
        {isOpen ? (
          <>
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 bg-primary-600 rounded-xl shadow-lg shadow-primary-500/20 flex items-center justify-center">
                <span className="text-white font-bold text-xl">LMS</span>
              </div>
              <span className="font-bold text-xl text-gray-800 dark:text-slate-100">LeaveMS</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-600 dark:text-slate-400 transition-colors"
            >
              <FiChevronLeft />
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-600 dark:text-slate-400 transition-colors"
          >
            <FiChevronRight />
          </button>
        )}
      </div>

      {/* User Info */}
      <div className={`flex items-center ${isOpen ? 'px-6' : 'justify-center'} py-5 border-b border-gray-100 dark:border-dark-border/50`}>
        <div className="h-10 w-10 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center border border-primary-200 dark:border-primary-800">
          <span className="text-primary-600 dark:text-primary-400 font-semibold text-lg">
            {user?.name?.charAt(0).toUpperCase()}
          </span>
        </div>
        {isOpen && (
          <div className="ml-3">
            <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{user?.name}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400 capitalize">{user?.role}</p>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="mt-6">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={navLinkClass}
            title={!isOpen ? item.name : ''}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {isOpen && <span className="ml-3">{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="absolute bottom-0 w-full p-4 border-t border-gray-100 dark:border-dark-border/50 bg-white/50 dark:bg-transparent backdrop-blur-sm">
        <button
          onClick={logout}
          className={`flex items-center px-2 py-2 text-gray-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all duration-200 w-full ${!isOpen ? 'justify-center' : ''
            }`}
          title={!isOpen ? 'Logout' : ''}
        >
          <FiLogOut className="w-5 h-5" />
          {isOpen && <span className="ml-3 font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;