import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBook, FaHistory, FaLock } from 'react-icons/fa';
import AppShell from './components/layout/AppShell';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from './components/ui/Card';
import Button from './components/ui/Button';
import Badge from './components/ui/Badge';
import Modal from './components/ui/Modal';
import EmptyState from './components/ui/EmptyState';
import { useToast } from './components/ui/Toast';
import API from './api';

const AcademicsComplaint = () => {
  const navigate = useNavigate();
  const { showSuccess, showError, showInfo } = useToast();

  const [description, setDescription] = useState('');
  const [course, setCourse] = useState('');
  const [type, setType] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [history, setHistory] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Anonymous token modal
  const [generatedToken, setGeneratedToken] = useState(null);

  const fetchHistory = async () => {
    try {
      const res = await API.get('/api/academic/history');
      setHistory(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error loading academic history:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!description || !description.trim()) {
      showError('Please enter a description for your academic complaint.');
      return;
    }
    if (!type) {
      showError('Please select a complaint type.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await API.post('/api/academic/submit', {
        description: description.trim(),
        course,
        type,
        isAnonymous
      });

      if (res.status === 200) {
        if (isAnonymous && res.data?.trackingToken) {
          setGeneratedToken(res.data.trackingToken);
        } else {
          showSuccess('Academic complaint submitted successfully!');
        }

        setDescription('');
        setCourse('');
        setType('');
        setIsAnonymous(false);
        await fetchHistory();
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to submit academic complaint.';
      showError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FaBook size={20} />
              </span>
              Academics Complaint Portal
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Submit issues concerning course content, exam grading, or faculty conduct.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            Back
          </Button>
        </div>

        {/* Complaint Submission Form Card */}
        <Card className="shadow-lg border-indigo-100">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-indigo-50/50">
            <div>
              <CardTitle>File New Academic Complaint</CardTitle>
              <CardDescription>Fill out the required information below to notify academic administrators</CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Complaint Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Provide detailed context regarding your academic issue..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-200 focus:border-indigo-600 transition"
                />
              </div>

              {/* Categorization Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Course / Subject (Optional)
                  </label>
                  <select
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-200 focus:border-indigo-600 transition"
                  >
                    <option value="">Select Course...</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Engineering">Engineering</option>
                    <option value="General Science">General Science</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Complaint Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-200 focus:border-indigo-600 transition"
                  >
                    <option value="">Select Type...</option>
                    <option value="Grading Issue">Grading Issue</option>
                    <option value="Course Material">Course Material</option>
                    <option value="Faculty Conduct">Faculty Conduct</option>
                    <option value="Exam Schedule">Exam Schedule</option>
                  </select>
                </div>
              </div>

              {/* Anonymous Checkbox Callout */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="anonymous-check"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="mt-0.5 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                />
                <div>
                  <label htmlFor="anonymous-check" className="text-xs font-bold text-slate-900 cursor-pointer flex items-center gap-1.5">
                    <FaLock className="text-amber-500" />
                    Submit Anonymously
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                    When checked, your user ID and email will not be linked to this complaint. You will receive a unique 32-character tracking token to check status later.
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={isSubmitting}
              >
                Submit Academic Complaint {isAnonymous ? '(Anonymous)' : ''}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Complaints History Section */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <FaHistory className="text-indigo-600" /> My Academic Complaint History
              </CardTitle>
              <CardDescription>View status, admin responses, and resolution history for past tickets</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {history.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {history.map((item) => (
                  <div key={item.id} className="p-6 hover:bg-slate-50/50 transition">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-600">#{item.id}</span>
                        <Badge status={item.status} />
                        {item.course && (
                          <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                            {item.course}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-medium text-slate-400">
                        Submitted: {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-slate-800 mb-3 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                      "{item.description}"
                    </p>

                    {item.response && (
                      <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 text-xs">
                        <span className="font-bold text-emerald-900 block mb-0.5">
                          Resolution Response ({item.resolved_by || 'Admin'}):
                        </span>
                        <p className="text-emerald-800">{item.response}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8">
                <EmptyState
                  title="No Academic History"
                  description="You have not submitted any academic complaints under your account."
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Anonymous Token Modal */}
      <Modal
        isOpen={Boolean(generatedToken)}
        onClose={() => setGeneratedToken(null)}
        title="Anonymous Complaint Submitted Successfully"
      >
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs">
            <p className="font-bold mb-1 flex items-center gap-1.5">
              <FaLock className="text-amber-600" /> Save Your Tracking Token!
            </p>
            <p>
              Your complaint was saved anonymously. Because it is not linked to your student account, you must use this tracking token to view updates.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Your 32-Character Tracking Token
            </label>
            <div className="p-3 bg-slate-100 rounded-xl font-mono text-xs font-bold text-slate-800 border border-slate-200 select-all break-all">
              {generatedToken}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(generatedToken);
                showInfo('Tracking token copied to clipboard!');
              }}
            >
              Copy Token
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setGeneratedToken(null)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
};

export default AcademicsComplaint;