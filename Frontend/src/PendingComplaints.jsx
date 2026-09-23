import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaClock, FaReply, FaCheckCircle, FaArrowLeft } from 'react-icons/fa';
import AppShell from './components/layout/AppShell';
import Card from './components/ui/Card';
import Button from './components/ui/Button';
import Badge from './components/ui/Badge';
import Modal from './components/ui/Modal';
import EmptyState from './components/ui/EmptyState';
import { TableSkeleton } from './components/ui/LoadingState';
import { useToast } from './components/ui/Toast';
import API from './api';

const PendingComplaints = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeComplaint, setActiveComplaint] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPending = async () => {
    try {
      setIsLoading(true);
      const res = await API.get('/api/principal/pending?status=pending');
      setComplaints(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error loading pending complaints:', err);
      showError('Failed to load pending complaints.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handlePrincipalResponseSubmit = async (e) => {
    e?.preventDefault();
    if (!activeComplaint || !responseText.trim()) {
      showError('Response cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await API.post(`/api/${activeComplaint.id}/principal-response`, {
        response: responseText.trim(),
        resolvedBy: 'Principal',
        department: activeComplaint.department
      });

      if (res.status === 200) {
        showSuccess('Executive Principal response submitted successfully!');
        setActiveComplaint(null);
        setResponseText('');
        await fetchPending();
      }
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to submit principal response.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <FaClock size={20} />
              </span>
              Pending Cross-Department Complaints
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Active tickets across all university departments awaiting resolution.
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
                    <th className="px-6 py-3.5">Submitted On</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
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
                          <div className="mt-1.5 p-2 bg-indigo-50 text-indigo-900 rounded-lg text-[11px]">
                            <strong>Principal Response:</strong> {item.response}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {item.submitted_at ? new Date(item.submitted_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <Badge status="pending" />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            setActiveComplaint(item);
                            setResponseText(item.response || '');
                          }}
                          icon={FaReply}
                        >
                          Executive Reply
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
            title="All Pending Complaints Handled"
            description="There are currently zero pending complaints requiring executive attention."
          />
        )}
      </div>

      <Modal
        isOpen={Boolean(activeComplaint)}
        onClose={() => setActiveComplaint(null)}
        title={`Principal Executive Reply - Ticket #${activeComplaint?.id}`}
      >
        {activeComplaint && (
          <form onSubmit={handlePrincipalResponseSubmit} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl text-xs">
              <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Department: {activeComplaint.department}
              </span>
              <p className="text-slate-800">{activeComplaint.text}</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Executive Response <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={5}
                required
                placeholder="Enter official Principal response..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs focus:ring-4 focus:ring-indigo-200"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setActiveComplaint(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="success" size="sm" isLoading={isSubmitting} icon={FaCheckCircle}>
                Send Executive Response
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </AppShell>
  );
};

export default PendingComplaints;