import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaReply, FaCheckCircle, FaBook, FaSync } from 'react-icons/fa';
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

const AcademicsDashboard = () => {
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Response modal state
  const [activeComplaint, setActiveComplaint] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

  const fetchComplaints = async () => {
    try {
      setIsLoading(true);
      const res = await API.get(`/api/academic?status=${filter}`);
      setComplaints(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error loading academic admin complaints:', err);
      showError('Failed to fetch academic complaints.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [filter]);

  // Real-time Socket.IO sync
  useEffect(() => {
    const token = localStorage.getItem('token');
    const socket = io('http://localhost:3005', {
      auth: { token }
    });

    socket.on('complaintUpdated', (payload) => {
      setComplaints((prev) =>
        prev.map((c) => (c.id === payload.id ? { ...c, status: payload.status, version: payload.version } : c))
      );
      showInfo(`Ticket #${payload.id} status updated in real-time.`);
    });

    return () => socket.disconnect();
  }, [showInfo]);

  const handleStatusUpdate = async (complaint, newStatus) => {
    if (newStatus === 'resolved' && !complaint.response && !responseText) {
      showWarning('Please submit a response to the student before resolving the complaint.');
      return;
    }

    try {
      const res = await API.put(`/api/academic/${complaint.id}/status`, {
        status: newStatus,
        version: complaint.version ?? 0
      });

      showSuccess(`Complaint #${complaint.id} status updated to ${newStatus.replace('_', ' ')}.`);
      fetchComplaints();
    } catch (err) {
      if (err.response?.status === 409) {
        showError('Concurrency Conflict: This complaint was updated by another admin. Refreshing latest data...');
        fetchComplaints();
      } else {
        showError(err.response?.data?.error || 'Failed to update complaint status.');
      }
    }
  };

  const handleResponseSubmit = async (e) => {
    e?.preventDefault();
    if (!activeComplaint || !responseText.trim()) {
      showError('Response cannot be empty.');
      return;
    }

    setIsSubmittingResponse(true);

    try {
      const res = await API.post(`/api/academic/${activeComplaint.id}/response`, {
        response: responseText.trim(),
        resolvedBy: 'Academic Admin',
        version: activeComplaint.version ?? 0
      });

      showSuccess(`Response saved and ticket #${activeComplaint.id} marked as resolved!`);
      setActiveComplaint(null);
      setResponseText('');
      fetchComplaints();
    } catch (err) {
      if (err.response?.status === 409) {
        showError('Concurrency Conflict: Someone else updated this complaint. Refreshing...');
        setActiveComplaint(null);
        fetchComplaints();
      } else {
        showError(err.response?.data?.error || 'Failed to submit response.');
      }
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  const filteredComplaints = complaints.filter(
    (c) =>
      (c.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.course || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(c.id).includes(searchTerm)
  );

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FaBook size={20} />
              </span>
              Academics Department Workstation
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage course, exam, and grading grievances submitted by students.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchComplaints} icon={FaSync}>
              Refresh Queue
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate('/admin/home')}>
              Admin Hub
            </Button>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
              {['pending', 'in_review', 'resolved', 'all'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                    filter === tab
                      ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  {tab.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <input
                type="text"
                placeholder="Search ticket #, course, or keyword..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
              <FaSearch className="absolute left-3 top-2.5 text-slate-400 text-xs" />
            </div>
          </div>
        </Card>

        {/* Main Complaint Table */}
        {isLoading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : filteredComplaints.length > 0 ? (
          <Card className="shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-100">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Ticket</th>
                    <th className="px-6 py-3.5">Description & Student</th>
                    <th className="px-6 py-3.5">Course / Type</th>
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
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {item.is_anonymous ? (
                            <span className="text-amber-600 font-semibold">Anonymous Student</span>
                          ) : (
                            <span>Student: {item.user_name || item.email || `ID ${item.user_id}`}</span>
                          )}
                        </p>
                        {item.response && (
                          <div className="mt-1.5 p-2 bg-emerald-50 text-emerald-800 rounded-lg text-[11px] border border-emerald-100">
                            <strong>Admin Response:</strong> {item.response}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{item.course || 'N/A'}</div>
                        <div className="text-[11px] text-slate-400">{item.complaint_type || 'Academic Issue'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge status={item.status} />
                      </td>
                      <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                        {item.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleStatusUpdate(item, 'in_review')}
                          >
                            Start Review
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            setActiveComplaint(item);
                            setResponseText(item.response || '');
                          }}
                          icon={FaReply}
                        >
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
          <EmptyState
            title="Queue Empty"
            description={`No academic complaints found matching '${filter.replace('_', ' ')}' status.`}
          />
        )}
      </div>

      {/* Response Modal */}
      <Modal
        isOpen={Boolean(activeComplaint)}
        onClose={() => setActiveComplaint(null)}
        title={`Respond & Resolve Ticket #${activeComplaint?.id}`}
      >
        {activeComplaint && (
          <form onSubmit={handleResponseSubmit} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 border border-slate-200">
              <p><strong>Course:</strong> {activeComplaint.course || 'N/A'}</p>
              <p><strong>Description:</strong> {activeComplaint.description}</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Administrator Response <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={5}
                required
                placeholder="Enter official academic response to student..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs focus:ring-4 focus:ring-indigo-200"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setActiveComplaint(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="success"
                size="sm"
                isLoading={isSubmittingResponse}
                icon={FaCheckCircle}
              >
                Send Response & Resolve
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </AppShell>
  );
};

export default AcademicsDashboard;