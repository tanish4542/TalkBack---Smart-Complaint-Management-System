import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaBars, FaBell, FaWifi, FaKey, FaShieldAlt } from 'react-icons/fa';

const Topbar = ({ onOpenSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : null;

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/student/home')) return 'Student Portal Overview';
    if (path.includes('/student/academics')) return 'Academics Complaint Portal';
    if (path.includes('/student/administration')) return 'Administration Complaint Portal';
    if (path.includes('/student/hostel')) return 'Hostel Complaint Portal';
    if (path.includes('/student/transportation')) return 'Transportation Complaint Portal';
    if (path.includes('/student/sanitation')) return 'Sanitation Complaint Portal';
    if (path.includes('/student/food')) return 'Food & Catering Complaint Portal';
    if (path.includes('/track-anonymous')) return 'Anonymous Complaint Tracking Portal';
    if (path.includes('/admin/home')) return 'Administrator Operational Hub';
    if (path.includes('/admin/academics')) return 'Academics Admin Workstation';
    if (path.includes('/admin/administration')) return 'Administration Workstation';
    if (path.includes('/admin/hostel')) return 'Hostel Admin Workstation';
    if (path.includes('/admin/transportation')) return 'Transportation Workstation';
    if (path.includes('/admin/sanitation')) return 'Sanitation Workstation';
    if (path.includes('/admin/food')) return 'Food & Catering Workstation';
    if (path.includes('/principal/home')) return 'Executive Principal Dashboard';
    if (path.includes('/principal/pending')) return 'Pending Executive Complaints';
    if (path.includes('/principal/resolved')) return 'Resolved Executive Complaints';
    if (path.includes('/principal/urgent')) return 'Urgent & Escalated Complaints';
    return 'Smart Complaint Management System';
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 px-4 lg:px-8 flex items-center justify-between shadow-xs backdrop-blur-md bg-white/90">
      {/* Left: Mobile Menu Toggle & Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 focus:outline-none"
        >
          <FaBars size={18} />
        </button>

        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            {getPageTitle()}
          </h2>
          <p className="text-[11px] text-slate-500 hidden sm:block">
            Smart Complaint Management System • Real-time Monitoring
          </p>
        </div>
      </div>

      {/* Right: Real-time Socket Indicator & User Badge */}
      <div className="flex items-center gap-3">
        {/* Socket IO connection indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Sync</span>
        </div>

        {/* Quick Track Anonymous Button */}
        {user?.role === 'student' && (
          <button
            onClick={() => navigate('/track-anonymous')}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition"
          >
            <FaKey className="text-amber-500" />
            <span>Track Anonymous</span>
          </button>
        )}

        {/* Profile Badge */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-slate-800 leading-tight">
              {user?.name || user?.email || 'User'}
            </p>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              {user?.role || 'Guest'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
