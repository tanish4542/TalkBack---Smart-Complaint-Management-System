import React, { useState, useEffect } from 'react';
import { FaReply, FaUserGraduate, FaExclamationTriangle } from 'react-icons/fa';

const UrgentComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [responses, setResponses] = useState({});

  useEffect(() => {
    const fetchUrgentComplaints = async () => {
      try {
        const response = await fetch('http://localhost:3005/api/principal/urgent');
        const data = await response.json();
        setComplaints(data);
      } catch (error) {
        console.error('Error fetching urgent complaints:', error);
      }
    };

    fetchUrgentComplaints();
  }, []);

  const handlePrincipalResponseSubmit = async (complaintId) => {
    const responseText = responses[complaintId];
    const complaint = complaints.find(c => c.id === complaintId);

    if (!responseText || !responseText.trim()) {
      alert('Response cannot be empty.');
      return;
    }

    try {
      const res = await fetch(`http://localhost:3005/api/${complaintId}/principal-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response: responseText,
          resolvedBy: "Principal",
          department: complaint.department
        })
      });

      if (res.ok) {
        alert('Principal response submitted');
        document.getElementById(`dialog-${complaintId}`).close();
        setComplaints(prev =>
          prev.map(c =>
            c.id === complaintId ? { ...c, principalResponse: responseText } : c
          )
        );
      }
    } catch (err) {
      console.error('Error submitting principal response:', err);
      alert('Failed to submit response');
    }
  };

  const calculateDaysPending = (submittedDate) => {
    const now = new Date();
    const submitted = new Date(submittedDate);
    const diffTime = Math.abs(now - submitted);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-400 to-blue-600 p-6">
      <div className="flex items-center space-x-4 mb-6">
        <button onClick={() => window.history.back()} className="text-blue-700 hover:text-blue-500 font-small">
          ←
        </button>
        <FaExclamationTriangle className="text-5xl text-red-500" />
        <h2 className="text-5xl font-bold text-blue-900">URGENT COMPLAINTS</h2>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-blue-800 uppercase">Complaint</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-blue-800 uppercase">Department</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-blue-800 uppercase">Submitted On</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-blue-800 uppercase">Pending (Days)</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-blue-800 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-blue-800 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {complaints.length > 0 ? (
              complaints.map((complaint) => (
                <tr key={complaint.id}>
                  <td className="px-6 py-4 max-w-md whitespace-pre-wrap">
                    <div className="text-sm text-gray-900">
                      {complaint.text.length > 120 ? complaint.text.slice(0, 120) + '...' : complaint.text}
                    </div>
                    
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{complaint.department}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {new Date(complaint.submitted_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {calculateDaysPending(complaint.submitted_at)} days
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      Urgent
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => document.getElementById(`dialog-${complaint.id}`).showModal()}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <FaReply className="inline mr-1" /> Principal Reply
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No urgent complaints found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Principal Response Dialogs */}
      {complaints.map((complaint) => (
        <dialog key={complaint.id} id={`dialog-${complaint.id}`} className="modal">
          <div className="modal-box my-4 padding-6">
            <h2 className="font-bold text-lg">Principal Response</h2>
            <p className="py-4">{complaint.text}</p>
            <textarea
              className="w-full p-2 border rounded-lg"
              rows="4"
              placeholder="Enter your response..."
              value={responses[complaint.id] || ''}
              onChange={(e) => setResponses({ ...responses, [complaint.id]: e.target.value })}
            ></textarea>
            <div className="modal-action">
              <form method="dialog">
                <button className="btn mr-20">Cancel</button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handlePrincipalResponseSubmit(complaint.id)}
                >
                  Send Response
                </button>
              </form>
            </div>
          </div>
        </dialog>
      ))}
    </div>
  );
};

export default UrgentComplaints;