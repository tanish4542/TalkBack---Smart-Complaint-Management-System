import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaExclamationTriangle, FaReply, FaCheckCircle, FaArrowLeft } from 'react-icons/fa';
import AppShell from './components/layout/AppShell';
import Card from './components/ui/Card';
import Button from './components/ui/Button';
import Badge from './components/ui/Badge';
import Modal from './components/ui/Modal';
import EmptyState from './components/ui/EmptyState';
import { TableSkeleton } from './components/ui/LoadingState';
import { useToast } from './components/ui/Toast';
import API from './api';

const UrgentComplaints = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeComplaint, setActiveComplaint] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUrgent = async () => {
    try {
      setIsLoading(true);
      const res = await API.get('/api/principal/urgent');
      setComplaints(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching urgent complaints:', err);
      showError('Failed to load urgent complaints.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUrgent();
  }, []);

  const calculateDaysPending = (submittedDate) => {
    if (!submittedDate) return 7;
    const now = new Date();
    const submitted = new Date(submittedDate);
    const diffTime = Math.abs(now - submitted);
    return Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  };

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
        showSuccess('Executive response submitted for urgent ticket!');
        setActiveComplaint(null);
        setResponseText('');
        await fetchUrgent();
      }
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to submit response.');
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
              <span className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <FaExclamationTriangle size={20} />
              </span>
              Urgent & Escalated Complaints
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Tickets pending for more than 7 days automatically escalated for Principal intervention.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/principal/home')} icon={FaArrowLeft}>
            Back
          </Button>
        </div>

        {/* Escalation Explanation Banner */}
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 text-xs flex items-start gap-3">
          <FaExclamationTriangle size={18} className="text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block mb-0.5">Automated 7-Day Escalation Trigger Enabled</span>
            <p>
              These tickets exceeded the 7-day SLA resolution limit at the department level. Responses submitted here will directly resolve the complaint and notify the student.
            </p>
          </div>
        </div>

        {isLoading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : complaints.length > 0 ? (
          <Card className="shadow-lg overflow-hidden border-rose-200/80">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-100">
                <thead className="bg-rose-50/50 text-rose-950 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Ticket</th>
                    <th className="px-6 py-3.5">Department</th>
                    <th className="px-6 py-3.5">Description</th>
                    <th className="px-6 py-3.5">Pending SLA</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {complaints.map((item) => (
                    <tr key={item.id} className="hover:bg-rose-50/30 transition">
                      <td className="px-6 py-4 font-mono font-bold text-rose-600">#{item.id}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-full font-bold uppercase text-[10px]">
                          {item.department}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-md">
                        <p className="font-semibold text-slate-900">{item.text}</p>
                      </td>
                      <td className="px-6 py-4 font-bold text-rose-700">
                        {calculateDaysPending(item.submitted_at)} Days Unresolved
                      </td>
                      <td className="px-6 py-4">
                        <Badge status="escalated" text="ESCALATED" />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          size="sm"
                          variant="danger"
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
            title="No Urgent Escalations"
            description="Great news! All department complaints are within SLA resolution limits."
          />
        )}
      </div>

      <Modal
        isOpen={Boolean(activeComplaint)}
        onClose={() => setActiveComplaint(null)}
        title={`Executive Intervention - Ticket #${activeComplaint?.id}`}
      >
        {activeComplaint && (
          <form onSubmit={handlePrincipalResponseSubmit} className="space-y-4">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-950">
              <span className="font-bold block mb-1">
                Department: {activeComplaint.department} (Overdue Ticket)
              </span>
              <p>{activeComplaint.text}</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Principal Response <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={5}
                required
                placeholder="Enter executive response to resolve ticket..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs focus:ring-4 focus:ring-rose-200"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setActiveComplaint(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="danger" size="sm" isLoading={isSubmitting} icon={FaCheckCircle}>
                Submit & Resolve Escalation
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </AppShell>
  );
};

export default UrgentComplaints;