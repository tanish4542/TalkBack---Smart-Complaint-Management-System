import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaReply, FaCheckCircle, FaPizzaSlice, FaSync } from 'react-icons/fa';
import { io } from 'socket.io-client';
import AppShell from './components/layout/AppShell';
import Card from './components/ui/Card';
import Button from './components/ui/Button';
import Badge from './components/ui/Badge';
import Modal from './components/ui/Modal';
import EmptyState from './components/ui/EmptyState';
import { TableSkeleton } from './components/ui/LoadingState';
import { useToast } from './components/ui/Toast';
import API from './api';

const FoodDashboard = () => {
  const navigate = useNavigate();
  const { showSuccess, showError, showInfo } = useToast();

  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [activeComplaint, setActiveComplaint] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

  const fetchComplaints = async () => {
    try {
      setIsLoading(true);
      const res = await API.get(`/api/food?status=${filter}`);
      setComplaints(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching food complaints:', err);
      showError('Failed to fetch food complaints.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [filter]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const socket = io('http://localhost:3005', { auth: { token } });
    socket.on('complaintUpdated', (payload) => {
      setComplaints((prev) =>
        prev.map((c) => (c.id === payload.id ? { ...c, status: payload.status, version: payload.version } : c))
      );
      showInfo(`Ticket #${payload.id} updated.`);
    });
    return () => socket.disconnect();
  }, [showInfo]);

  const handleStatusUpdate = async (complaint, newStatus) => {
    try {
      await API.put(`/api/food/${complaint.id}/status`, {
        status: newStatus,
        version: complaint.version ?? 0
      });
      showSuccess(`Status updated to ${newStatus.replace('_', ' ')}.`);
      fetchComplaints();
    } catch (err) {
      showError('Failed to update status.');
    }
  };

  const handleResponseSubmit = async (e) => {
    e?.preventDefault();
    if (!activeComplaint || !responseText.trim()) return;

    setIsSubmittingResponse(true);
    try {
      await API.post(`/api/food/${activeComplaint.id}/response`, {
        response: responseText.trim(),
        resolvedBy: 'Food Admin',
        version: activeComplaint.version ?? 0
      });
      showSuccess(`Response submitted for Ticket #${activeComplaint.id}!`);
      setActiveComplaint(null);
      setResponseText('');
      fetchComplaints();
    } catch (err) {
      showError('Failed to submit response.');
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  const filteredComplaints = complaints.filter((c) =>
    (c.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
                <FaPizzaSlice size={20} />
              </span>
              Food & Mess Workstation
            </h1>
            <p className="text-xs text-slate-500 mt-1">Review canteen hygiene and food quality tickets.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchComplaints} icon={FaSync}>Refresh</Button>
            <Button variant="secondary" size="sm" onClick={() => navigate('/admin/home')}>Admin Hub</Button>
          </div>
        </div>

        <Card className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
              {['pending', 'in_review', 'resolved', 'all'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase transition ${
                    filter === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:bg-slate-200/50'
                  }`}
                >
                  {tab.replace('_', ' ')}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-72">
              <input
                type="text"
                placeholder="Search ticket..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
              <FaSearch className="absolute left-3 top-2.5 text-slate-400 text-xs" />
            </div>
          </div>
        </Card>

        {isLoading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : filteredComplaints.length > 0 ? (
          <Card className="shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-100">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                  <tr>
                    <th className="px-6 py-3.5">Ticket</th>
                    <th className="px-6 py-3.5">Description</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredComplaints.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4 font-mono font-bold text-indigo-600">#{item.id}</td>
                      <td className="px-6 py-4 max-w-md">
                        <p className="font-semibold text-slate-900 truncate">{item.description}</p>
                        {item.response && (
                          <div className="mt-1.5 p-2 bg-emerald-50 text-emerald-800 rounded-lg text-[11px]">
                            <strong>Response:</strong> {item.response}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4"><Badge status={item.status} /></td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {item.status === 'pending' && (
                          <Button size="sm" variant="secondary" onClick={() => handleStatusUpdate(item, 'in_review')}>
                            Review
                          </Button>
                        )}
                        <Button size="sm" variant="primary" onClick={() => { setActiveComplaint(item); setResponseText(item.response || ''); }} icon={FaReply}>
                          Respond
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <EmptyState title="No Food Tickets" description="Queue is empty for this criteria." />
        )}
      </div>

      <Modal isOpen={Boolean(activeComplaint)} onClose={() => setActiveComplaint(null)} title={`Respond Ticket #${activeComplaint?.id}`}>
        {activeComplaint && (
          <form onSubmit={handleResponseSubmit} className="space-y-4">
            <p className="text-xs text-slate-700 p-3 bg-slate-50 rounded-xl">{activeComplaint.description}</p>
            <textarea
              rows={4}
              required
              placeholder="Enter response to student..."
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              className="w-full p-3 border rounded-xl text-xs"
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setActiveComplaint(null)}>Cancel</Button>
              <Button type="submit" variant="success" size="sm" isLoading={isSubmittingResponse} icon={FaCheckCircle}>
                Resolve & Send
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </AppShell>
  );
};

export default FoodDashboard;