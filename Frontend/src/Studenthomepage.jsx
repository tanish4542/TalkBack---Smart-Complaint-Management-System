import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaUniversity,
  FaBook,
  FaBed,
  FaBus,
  FaBroom,
  FaPizzaSlice,
  FaPlusCircle,
  FaKey,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaClipboardList,
  FaArrowRight
} from 'react-icons/fa';
import AppShell from './components/layout/AppShell';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from './components/ui/Card';
import Badge from './components/ui/Badge';
import Button from './components/ui/Button';
import API from './api';

const StudentHomePage = () => {
  const navigate = useNavigate();

  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : {};
  const studentName = user.name || 'Student';

  const [recentComplaints, setRecentComplaints] = useState([]);
  const [counts, setCounts] = useState({ total: 0, pending: 0, inReview: 0, resolved: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        // Fetch academic history as sample or aggregate
        const res = await API.get('/api/academic/history');
        const data = Array.isArray(res.data) ? res.data : [];
        setRecentComplaints(data.slice(0, 5));

        const pending = data.filter((c) => c.status === 'pending').length;
        const review = data.filter((c) => c.status === 'in_review' || c.status === 'under_review').length;
        const resolved = data.filter((c) => c.status === 'resolved').length;

        setCounts({
          total: data.length,
          pending,
          inReview: review,
          resolved
        });
      } catch (err) {
        console.error('Error loading student dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const departmentWidgets = [
    { name: 'Academics', route: '/student/academics', icon: FaBook, desc: 'Courses, exams & grading' },
    { name: 'Administration', route: '/student/administration', icon: FaUniversity, desc: 'Fees & administrative records' },
    { name: 'Hostel', route: '/student/hostel', icon: FaBed, desc: 'Rooms, maintenance & facilities' },
    { name: 'Transportation', route: '/student/transportation', icon: FaBus, desc: 'Buses, routes & schedules' },
    { name: 'Sanitation', route: '/student/sanitation', icon: FaBroom, desc: 'Cleanliness & hygiene' },
    { name: 'Food', route: '/student/food', icon: FaPizzaSlice, desc: 'Mess & canteen quality' }
  ];

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-900 to-indigo-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-semibold uppercase tracking-wider">
              Student Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2">
              Welcome back, {studentName} 👋
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
              Track your open tickets, register issues across campus departments, or check status anonymously.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap gap-3">
            <Button
              onClick={() => navigate('/track-anonymous')}
              variant="secondary"
              icon={FaKey}
              size="md"
            >
              Track Anonymous
            </Button>
          </div>
        </div>

        {/* Real Backend Summary Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 border-l-4 border-l-indigo-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Complaints</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{counts.total}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FaClipboardList size={18} />
              </div>
            </div>
          </Card>

          <Card className="p-5 border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{counts.pending}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <FaClock size={18} />
              </div>
            </div>
          </Card>

          <Card className="p-5 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">In Review</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{counts.inReview}</h3>
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
                <h3 className="text-2xl font-black text-slate-900 mt-1">{counts.resolved}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FaCheckCircle size={18} />
              </div>
            </div>
          </Card>
        </div>

        {/* Department Selection Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">File a Department Complaint</h2>
              <p className="text-xs text-slate-500">Select the relevant department to register your issue</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {departmentWidgets.map((dept) => {
              const Icon = dept.icon;
              return (
                <Card
                  key={dept.name}
                  onClick={() => navigate(dept.route)}
                  className="p-5 cursor-pointer hover:border-indigo-500/50 hover:shadow-lg transition group"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition duration-200">
                      <Icon size={22} />
                    </div>
                    <span className="text-slate-300 group-hover:text-indigo-600 transition">
                      <FaArrowRight size={14} />
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-4 group-hover:text-indigo-600 transition">
                    {dept.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">{dept.desc}</p>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Recent Complaints Table */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Recent Academic Activity</CardTitle>
              <CardDescription>Your latest submitted tickets and administrator updates</CardDescription>
            </div>
            <Button onClick={() => navigate('/student/academics')} variant="outline" size="sm">
              View All
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {recentComplaints.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs divide-y divide-slate-100">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5">Ticket ID</th>
                      <th className="px-6 py-3.5">Description</th>
                      <th className="px-6 py-3.5">Date</th>
                      <th className="px-6 py-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {recentComplaints.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-6 py-4 font-mono font-bold text-indigo-600">#{c.id}</td>
                        <td className="px-6 py-4 max-w-md truncate">{c.description}</td>
                        <td className="px-6 py-4 text-slate-500">
                          {c.created_at ? new Date(c.created_at).toLocaleDateString() : 'Recent'}
                        </td>
                        <td className="px-6 py-4">
                          <Badge status={c.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500">
                No recent complaints recorded. Select a department above to submit your first ticket.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
};

export default StudentHomePage;