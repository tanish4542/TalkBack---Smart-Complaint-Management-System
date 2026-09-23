import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaKey, FaSearch, FaArrowLeft, FaShieldAlt, FaHistory, FaCheckCircle, FaClock } from 'react-icons/fa';
import AppShell from './components/layout/AppShell';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from './components/ui/Card';
import Button from './components/ui/Button';
import Input from './components/ui/Input';
import Badge from './components/ui/Badge';
import StatusTimeline from './components/ui/StatusTimeline';
import { useToast } from './components/ui/Toast';
import API from './api';

const AnonymousTracker = () => {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();

  const [tokenInput, setTokenInput] = useState('');
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTrack = async (e) => {
    e?.preventDefault();
    if (!tokenInput || !tokenInput.trim()) {
      setErrorMsg('Please enter a valid tracking token.');
      showError('Please enter a tracking token');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setResult(null);

    try {
      const res = await API.post('/api/complaints/track-anonymous', {
        trackingToken: tokenInput.trim()
      });
      setResult(res.data);
      showSuccess('Anonymous complaint located successfully!');
    } catch (err) {
      const msg = err.response?.data?.error || 'Invalid tracking token or anonymous complaint not found.';
      setErrorMsg(msg);
      showError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-8 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-xs">
                <FaKey size={20} />
              </span>
              Anonymous Complaint Tracking Portal
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Securely verify complaint status and history using your 32-character tracking token.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate(-1)} icon={FaArrowLeft}>
            Back
          </Button>
        </div>

        {/* Token Search Card */}
        <Card className="shadow-lg border-amber-200/60">
          <CardHeader className="bg-gradient-to-r from-amber-50/50 to-orange-50/30">
            <div>
              <CardTitle className="text-amber-900">Enter Tracking Token</CardTitle>
              <CardDescription>Paste the hex token provided to you upon anonymous submission</CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleTrack} className="space-y-4">
              <Input
                label="32-Character Hex Token"
                type="text"
                placeholder="e.g. 8f9a2b7c..."
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                error={errorMsg}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={isLoading}
                icon={FaSearch}
              >
                Locate Complaint Status
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Complaint Result View */}
        {result && result.complaint && (
          <Card className="shadow-xl border-indigo-100 animate-in fade-in zoom-in duration-200">
            <CardHeader className="bg-slate-50/80">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">
                  {result.complaint.department} Department
                </span>
                <CardTitle className="mt-2">Complaint Status Overview</CardTitle>
              </div>
              <Badge status={result.complaint.status} />
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Description */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Complaint Description
                </h4>
                <p className="text-sm font-medium text-slate-800 bg-slate-50 p-4 rounded-xl border border-slate-200/80 italic">
                  "{result.complaint.description}"
                </p>
              </div>

              {/* Resolution / Admin Response */}
              {result.complaint.response ? (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1 flex items-center gap-1.5">
                    <FaCheckCircle className="text-emerald-600" /> Resolution Response ({result.complaint.resolved_by || 'Admin'})
                  </h4>
                  <p className="text-sm text-emerald-800 font-medium">{result.complaint.response}</p>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs font-semibold text-amber-900 flex items-center gap-2">
                  <FaClock className="text-amber-600" /> Currently awaiting administrative review and response.
                </div>
              )}

              {/* Status History Timeline */}
              {result.history && result.history.length > 0 && (
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                    <FaHistory className="text-indigo-600" /> Audit Timeline & State Transitions
                  </h4>
                  <StatusTimeline history={result.history} />
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
};

export default AnonymousTracker;
