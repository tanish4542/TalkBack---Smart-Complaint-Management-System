import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaUniversity,
  FaBook,
  FaBed,
  FaBus,
  FaBroom,
  FaPizzaSlice,
  FaClock,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClipboardList,
  FaArrowRight
} from 'react-icons/fa';
import AppShell from './components/layout/AppShell';
import Card from './components/ui/Card';
import API from './api';

const AdminHomePage = () => {
  const navigate = useNavigate();

  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : {};
  const adminName = user.name || 'Administrator';

  const [metrics, setMetrics] = useState({ total: 0, pending: 0, reviewing: 0, resolved: 0 });

  useEffect(() => {
    // Aggregate metrics across academic department sample
    API.get('/api/academic')
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        const pending = data.filter((c) => c.status === 'pending').length;
        const reviewing = data.filter((c) => c.status === 'in_review' || c.status === 'under_review').length;
        const resolved = data.filter((c) => c.status === 'resolved').length;
        setMetrics({
          total: data.length,
          pending,
          reviewing,
          resolved
        });
      })
      .catch((err) => console.error('Error fetching admin overview metrics:', err));
  }, []);

  const departmentCards = [
    { name: 'Academics', route: '/admin/academics', icon: FaBook, color: 'text-indigo-600', bg: 'bg-indigo-50', desc: 'Course grading, material & exams' },
    { name: 'Administration', route: '/admin/administration', icon: FaUniversity, color: 'text-blue-600', bg: 'bg-blue-50', desc: 'Fees, ID cards & records' },
    { name: 'Hostel', route: '/admin/hostel', icon: FaBed, color: 'text-purple-600', bg: 'bg-purple-50', desc: 'Maintenance & room facilities' },
    { name: 'Transportation', route: '/admin/transportation', icon: FaBus, color: 'text-amber-600', bg: 'bg-amber-50', desc: 'Buses, drivers & schedules' },
    { name: 'Sanitation', route: '/admin/sanitation', icon: FaBroom, color: 'text-rose-600', bg: 'bg-rose-50', desc: 'Cleanliness & hygiene' },
    { name: 'Food', route: '/admin/food', icon: FaPizzaSlice, color: 'text-orange-600', bg: 'bg-orange-50', desc: 'Mess quality & dining' }
  ];

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl">
          <div>
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-semibold uppercase tracking-wider">
              Operational Hub
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2">
              Welcome back, {adminName} 👋
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
              Monitor active ticket queues, resolve student grievances, and perform optimistic concurrency status updates.
            </p>
          </div>
        </div>

        {/* Workload Metric Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 border-l-4 border-l-indigo-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Tickets</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{metrics.total}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FaClipboardList size={18} />
              </div>
            </div>
          </Card>

          <Card className="p-5 border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Action</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{metrics.pending}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <FaClock size={18} />
              </div>
            </div>
          </Card>

          <Card className="p-5 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Under Review</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{metrics.reviewing}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FaExclamationTriangle size={18} />
              </div>
            </div>
          </Card>

          <Card className="p-5 border-l-4 border-l-emerald-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Resolved</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{metrics.resolved}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FaCheckCircle size={18} />
              </div>
            </div>
          </Card>
        </div>

        {/* Department Workstations */}
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">Department Workstations</h2>
            <p className="text-xs text-slate-500">Select a department to view, review, and resolve tickets</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {departmentCards.map((dept) => {
              const Icon = dept.icon;
              return (
                <Card
                  key={dept.name}
                  onClick={() => navigate(dept.route)}
                  className="p-5 cursor-pointer hover:border-indigo-500/50 hover:shadow-lg transition group"
                >
                  <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 rounded-2xl ${dept.bg} ${dept.color} flex items-center justify-center transition duration-200`}>
                      <Icon size={22} />
                    </div>
                    <span className="text-slate-300 group-hover:text-indigo-600 transition">
                      <FaArrowRight size={14} />
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-4 group-hover:text-indigo-600 transition">
                    {dept.name} Department
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">{dept.desc}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default AdminHomePage;