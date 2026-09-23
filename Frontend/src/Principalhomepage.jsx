import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaClock, FaCheckCircle, FaExclamationTriangle, FaShieldAlt, FaArrowRight, FaChartBar } from 'react-icons/fa';
import AppShell from './components/layout/AppShell';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from './components/ui/Card';
import Button from './components/ui/Button';
import API from './api';

const PrincipalHomePage = () => {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({ resolved: 0, pending: 0, urgent: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    API.get('/api/principal/home')
      .then((res) => setCounts(res.data))
      .catch((err) => console.error('Error fetching principal metrics:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const executiveWidgets = [
    {
      name: 'Pending Overview',
      count: counts.pending,
      icon: FaClock,
      route: '/principal/pending',
      color: 'border-amber-500 text-amber-600 bg-amber-50',
      desc: 'Active tickets across all university departments'
    },
    {
      name: 'Resolved Operations',
      count: counts.resolved,
      icon: FaCheckCircle,
      route: '/principal/resolved',
      color: 'border-emerald-500 text-emerald-600 bg-emerald-50',
      desc: 'Successfully resolved complaints with admin responses'
    },
    {
      name: 'Urgent & Escalated',
      count: counts.urgent,
      icon: FaExclamationTriangle,
      route: '/principal/urgent',
      color: 'border-rose-500 text-rose-600 bg-rose-50',
      desc: 'Unresolved tickets pending for >7 days requiring executive intervention'
    }
  ];

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Executive Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden">
          <div>
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-semibold uppercase tracking-wider">
              Executive Management Hub
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2">
              Principal Oversight Dashboard
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
              Cross-department operational oversight, automated 7-day escalation monitoring, and direct executive resolution.
            </p>
          </div>
        </div>

        {/* Executive Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {executiveWidgets.map((w) => {
            const Icon = w.icon;
            return (
              <Card
                key={w.name}
                onClick={() => navigate(w.route)}
                className={`p-6 cursor-pointer border-l-4 ${w.color.split(' ')[0]} hover:shadow-xl transition group`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-2xl ${w.color.split(' ').slice(1).join(' ')} flex items-center justify-center`}>
                    <Icon size={24} />
                  </div>
                  <span className="text-xs font-bold text-slate-400 group-hover:text-indigo-600 flex items-center gap-1 transition">
                    Manage <FaArrowRight size={12} />
                  </span>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{w.name}</p>
                  <h3 className="text-3xl font-black text-slate-900 mt-1">{w.count}</h3>
                  <p className="text-xs text-slate-500 mt-2">{w.desc}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
};

export default PrincipalHomePage;