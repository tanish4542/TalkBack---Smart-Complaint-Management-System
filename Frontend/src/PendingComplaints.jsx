import React, { useState, useEffect } from 'react';
import { FaReply, FaRegClock, FaClock } from 'react-icons/fa';

const PendingComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [responses, setResponses] = useState({});

  useEffect(() => {
    const fetchPendingComplaints = async () => {
      try {
        const res = await fetch("http://localhost:3005/api/principal/pending?status=pending");
        const data = await res.json();
        setComplaints(data);
      } catch (err) {
        console.error("Error fetching complaints:", err);
      }
    };
    fetchPendingComplaints();
  }, []);

  const handleResponseSubmit = async (complaintId, department) => {
    const responseText = responses[complaintId];
    if (!responseText || !responseText.trim()) {
      alert("Response cannot be empty.");
      return;
    }

    try {
      const res = await fetch(`http://localhost:3005/api/${complaintId}/principal-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response: responseText,
          resolvedBy: "Principal",
          department: department
        })
      });

      if (res.ok) {
        document.getElementById(`response-${complaintId}`).close();
        setComplaints(prev =>
          prev.map(c =>
            c.id === complaintId ? { ...c, response: responseText } : c
          )
        );
        alert("Principal response submitted successfully");
      }
    } catch (err) {
      console.error("Error submitting response:", err);
      alert("Failed to submit principal response");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-400 to-blue-600 p-6">
      <div className="flex items-center space-x-4 mb-6">
        <button onClick={() => window.history.back()} className="text-blue-700 font-medium">←</button>
        <FaClock className="text-5xl text-yellow-300" />
        <h2 className="text-5xl font-bold text-blue-900">PENDING COMPLAINTS</h2>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-blue-800 uppercase">Complaint</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-blue-800 uppercase">Department</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-blue-800 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-blue-800 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-blue-800 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {complaints.length > 0 ? complaints.map((complaint) => (
              <tr key={complaint.id}>
                <td className="px-6 py-4 text-gray-800 text-sm">
                  {complaint.text}
                  {complaint.response && (
                    <div className="text-blue-600 mt-1 text-sm">Principal Response: {complaint.response}</div>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-700 text-sm capitalize">
                  {complaint.department}
                </td>
                <td className="px-6 py-4 text-gray-600 text-sm">
                  <FaRegClock className="inline mr-1" />
                  {new Date(complaint.submitted_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-yellow-800 bg-yellow-100 rounded text-sm font-medium">
                  Pending
                </td>
                <td className="px-6 py-4 text-sm">
                  <button
                    onClick={() => document.getElementById(`response-${complaint.id}`).showModal()}
                    className="text-blue-600 hover:text-blue-900 text-sm"
                  >
                    <FaReply className="inline mr-1" /> Respond
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" className="text-center text-gray-500 py-6">No pending complaints found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Response Dialogs */}
      {complaints.map(complaint => (
        <dialog key={complaint.id} id={`response-${complaint.id}`} className="modal">
          <div className="modal-box my-4 p-6">
            <h3 className="font-bold text-lg mb-2">Respond to Complaint</h3>
            <p className="text-gray-700 mb-3">{complaint.text}</p>
            <textarea
              className="w-full border p-3 rounded"
              placeholder="Enter your response..."
              rows="4"
              value={responses[complaint.id] || ''}
              onChange={(e) => setResponses({ ...responses, [complaint.id]: e.target.value })}
            ></textarea>
            <div className="modal-action">
              <form method="dialog">
                <button className="btn">Cancel</button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleResponseSubmit(complaint.id, complaint.department)}
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

export default PendingComplaints;