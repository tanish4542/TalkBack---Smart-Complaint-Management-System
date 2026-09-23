import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUniversity, FaHistory, FaLock } from 'react-icons/fa';
import AppShell from './components/layout/AppShell';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from './components/ui/Card';
import Button from './components/ui/Button';
import Badge from './components/ui/Badge';
import Modal from './components/ui/Modal';
import EmptyState from './components/ui/EmptyState';
import { useToast } from './components/ui/Toast';
import API from './api';

const AdministrationComplaint = () => {
  const navigate = useNavigate();
  const { showSuccess, showError, showInfo } = useToast();

  const [description, setDescription] = useState('');
  const [issueType, setIssueType] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [history, setHistory] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedToken, setGeneratedToken] = useState(null);

  const fetchHistory = async () => {
    try {
      const res = await API.get('/api/administration/history');
      setHistory(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching admin history:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!description || !description.trim()) {
      showError('Please enter a complaint description.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await API.post('/api/administration/submit', {
        description: description.trim(),
        type: issueType,
        isAnonymous
      });

      if (res.status === 200) {
        if (isAnonymous && res.data?.trackingToken) {
          setGeneratedToken(res.data.trackingToken);
        } else {
          showSuccess('Administration complaint submitted successfully!');
        }
        setDescription('');
        setIssueType('');
        setIsAnonymous(false);
        await fetchHistory();
      }
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to submit complaint.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FaUniversity size={20} />
              </span>
              Administration Portal
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              File issues regarding fee payments, ID cards, certificates, or administrative services.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>Back</Button>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="bg-slate-50/50">
            <CardTitle>File Administrative Complaint</CardTitle>
            <CardDescription>Provide details for prompt administrative review</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1.5">
                  Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe your administrative issue..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm focus:ring-4 focus:ring-indigo-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1.5">
                  Category
                </label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm"
                >
                  <option value="">Select Category...</option>
                  <option value="Fee Payment">Fee Payment & Accounts</option>
                  <option value="ID Card">ID Card & Documentation</option>
                  <option value="Certificates">Certificates & Verification</option>
                  <option value="General Admin">General Administration</option>
                </select>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="anon-admin"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="mt-0.5 h-4 w-4 text-indigo-600 rounded"
                />
                <label htmlFor="anon-admin" className="text-xs font-bold text-slate-900 cursor-pointer flex items-center gap-1.5">
                  <FaLock className="text-amber-500" /> Submit Anonymously
                </label>
              </div>

              <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isSubmitting}>
                Submit Administration Ticket
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FaHistory /> Administrative History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {history.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {history.map((c) => (
                  <div key={c.id} className="p-6">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-600">#{c.id}</span>
                        <Badge status={c.status} />
                      </div>
                      <span className="text-[11px] text-slate-400">{c.created_at ? new Date(c.created_at).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <p className="text-xs text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">"{c.description}"</p>
                    {c.response && (
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs mt-2">
                        <span className="font-bold text-emerald-900 block">Response ({c.resolved_by || 'Admin'}):</span>
                        <p className="text-emerald-800">{c.response}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8">
                <EmptyState title="No History Found" description="No administrative tickets have been registered." />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal isOpen={Boolean(generatedToken)} onClose={() => setGeneratedToken(null)} title="Anonymous Token Issued">
        <div className="space-y-4">
          <p className="text-xs text-slate-600">Save this token to track your anonymous complaint status:</p>
          <div className="p-3 bg-slate-100 rounded-xl font-mono text-xs font-bold select-all">{generatedToken}</div>
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={() => { navigator.clipboard.writeText(generatedToken); showInfo('Token copied!'); }}>Copy Token</Button>
            <Button size="sm" variant="secondary" onClick={() => setGeneratedToken(null)}>Close</Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
};

export default AdministrationComplaint;