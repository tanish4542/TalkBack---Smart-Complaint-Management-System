import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  FaHome,
  FaPlusCircle,
  FaKey,
  FaUniversity,
  FaBook,
  FaBed,
  FaBus,
  FaBroom,
  FaPizzaSlice,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSignOutAlt,
  FaTimes,
  FaShieldAlt
} from 'react-icons/fa';

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : null;
  const role = user?.role || 'student';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const getNavItems = () => {
    if (role === 'student') {
      return [
        { label: 'Dashboard', path: '/student/home', icon: FaHome },
        { label: 'Academics', path: '/student/academics', icon: FaBook },
        { label: 'Administration', path: '/student/administration', icon: FaUniversity },
        { label: 'Hostel', path: '/student/hostel', icon: FaBed },
        { label: 'Transportation', path: '/student/transportation', icon: FaBus },
        { label: 'Sanitation', path: '/student/sanitation', icon: FaBroom },
        { label: 'Food', path: '/student/food', icon: FaPizzaSlice },
        { label: 'Track Anonymous', path: '/track-anonymous', icon: FaKey }
      ];
    } else if (role === 'admin') {
      return [
        { label: 'Overview', path: '/admin/home', icon: FaHome },
        { label: 'Academics', path: '/admin/academics', icon: FaBook },
        { label: 'Administration', path: '/admin/administration', icon: FaUniversity },
        { label: 'Hostel', path: '/admin/hostel', icon: FaBed },
        { label: 'Transportation', path: '/admin/transportation', icon: FaBus },
        { label: 'Sanitation', path: '/admin/sanitation', icon: FaBroom },
        { label: 'Food', path: '/admin/food', icon: FaPizzaSlice }
      ];
    } else if (role === 'principal') {
      return [
        { label: 'Overview', path: '/principal/home', icon: FaHome },
        { label: 'Pending Complaints', path: '/principal/pending', icon: FaClock },
        { label: 'Resolved Complaints', path: '/principal/resolved', icon: FaCheckCircle },
        { label: 'Urgent / Escalated', path: '/principal/urgent', icon: FaExclamationTriangle }
      ];
    }
    return [];
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-64 bg-slate-900 text-slate-300 z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } border-r border-slate-800 shadow-2xl lg:shadow-none`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-600/30">
              S
            </div>
            <div>
              <h1 className="font-extrabold text-white tracking-wider text-base">SCMS</h1>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                Campus Portal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* User Card */}
        <div className="p-4 mx-3 my-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/30">
              <FaShieldAlt />
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">
                {user?.name || user?.email || 'Authenticated User'}
              </p>
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                {role} account
              </p>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Navigation
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Icon size={15} className={isActive ? 'text-white' : 'text-slate-400'} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition duration-150"
          >
            <FaSignOutAlt />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
