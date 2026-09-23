import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaArrowLeft } from 'react-icons/fa';
import AppShell from './components/layout/AppShell';
import Card from './components/ui/Card';
import Button from './components/ui/Button';
import Badge from './components/ui/Badge';
import EmptyState from './components/ui/EmptyState';
import { TableSkeleton } from './components/ui/LoadingState';
import { useToast } from './components/ui/Toast';
import API from './api';

const ResolvedComplaints = () => {
  const navigate = useNavigate();
  const { showError } = useToast();

  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    API.get('/api/principal/pending?status=resolved')
      .then((res) => setComplaints(Array.isArray(res.data) ? res.data : []))
      .catch((err) => {
        console.error('Error fetching resolved complaints:', err);
        showError('Failed to load resolved complaints.');
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FaCheckCircle size={20} />
              </span>
              Resolved Operations Archive
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Historical archive of resolved tickets across all campus departments.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/principal/home')} icon={FaArrowLeft}>
            Back
          </Button>
        </div>

        {isLoading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : complaints.length > 0 ? (
          <Card className="shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-100">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Ticket</th>
                    <th className="px-6 py-3.5">Department</th>
                    <th className="px-6 py-3.5">Complaint Content</th>
                    <th className="px-6 py-3.5">Date</th>
                    <th className="px-6 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {complaints.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4 font-mono font-bold text-indigo-600">#{item.id}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-full font-bold uppercase text-[10px]">
                          {item.department}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-md">
                        <p className="font-semibold text-slate-900">{item.text}</p>
                        {item.response && (
                          <div className="mt-1.5 p-2 bg-emerald-50 text-emerald-900 rounded-lg text-[11px]">
                            <strong>Resolution Response:</strong> {item.response}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {item.submitted_at ? new Date(item.submitted_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <Badge status="resolved" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <EmptyState
            title="No Resolved Archive"
            description="No resolved complaints recorded in the system yet."
          />
        )}
      </div>
    </AppShell>
  );
};

export default ResolvedComplaints;