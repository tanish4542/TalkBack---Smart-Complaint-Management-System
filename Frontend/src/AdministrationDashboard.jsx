import React, { useState, useEffect } from 'react';
import { FaSearch, FaReply, FaCheckCircle } from 'react-icons/fa';

const AdministrationDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const response = await fetch(`http://localhost:3005/api/administration?status=${filter}`);
        const data = await response.json();
        setComplaints(data);
      } catch (error) {
        console.error("Error fetching complaints:", error);
      }
    };

    fetchComplaints();
  }, [filter]);

  const handleStatusUpdate = async (complaintId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:3005/api/administration/${complaintId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setComplaints(prev =>
          prev.map(c => c.id === complaintId ? { ...c, status: newStatus } : c)
        );
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const filteredComplaints = complaints.filter(complaint =>
    complaint.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (complaint.user_id && complaint.user_id.toString().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-400 to-blue-600 p-6">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-4">
        <button
        onClick={() => window.history.back()}
        className="text-blue-700 hover:text-blue-500 font-small"
      >
        ← 
      </button>
        <h2 className="text-4xl font-bold text-blue-900">ADMINISTRATION-COMPLAINTS</h2>
        </div>
        <div className="flex space-x-5">
          <div className="relative">
            <input
              type="text"
              placeholder="Search complaints..."
              className="pl-10 pr-4 py-2 border rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded-lg px-4 py-2"
          >
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-s font-medium text-blue-800 uppercase tracking-wider">
                Complaint
              </th>
              <th className="px-6 py-3 text-left text-s font-medium text-blue-800 uppercase tracking-wider">
                Submitted
              </th>
              <th className="px-6 py-3 text-left text-s font-medium text-blue-800 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-s font-medium text-blue-800 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredComplaints.length > 0 ? (
              filteredComplaints.map((complaint) => (
                <tr key={complaint.id}>
                  <td className="px-6 py-4 whitespace-pre-wrap max-w-xs">
                    <div className="text-sm font-medium text-gray-900">
                      {complaint.text.length > 100
                        ? `${complaint.text.substring(0, 100)}...`
                        : complaint.text}
                    </div>
                    {!complaint.is_anonymous && (
                      <div className="text-sm text-gray-500">
                        From: {complaint.user_id || 'Unknown'}
                      </div>
                    )}
                    {complaint.response && (
                      <div className="text-sm text-blue-600 mt-1">
                        Admin Response: {complaint.response}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(complaint.submitted_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      complaint.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : complaint.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {complaint.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => document.getElementById(`response-${complaint.id}`).showModal()}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <FaReply className="inline mr-1" /> Respond
                      </button>
                      {complaint.status !== 'resolved' && (
                        <button
                          onClick={() => {
                            if (!complaint.response) {
                              alert("Please respond before resolving the complaint.");
                              return;
                            }
                            handleStatusUpdate(complaint.id, 'resolved');
                          }}
                          className="text-green-600 hover:text-green-900"
                        >
                          <FaCheckCircle className="inline mr-1" /> Resolve
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                  No complaints found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Response Dialogs */}
      {filteredComplaints.map((complaint) => (
        <dialog key={`dialog-${complaint.id}`} id={`response-${complaint.id}`} className="modal">
          <div className="modal-box my-4 padding-6">
            <h2 className="font-bold text-lg">Respond to Complaint</h2>
            <p className="py-4 space-y-2">{complaint.text}</p>
            <textarea
              id={`response-input-${complaint.id}`}
              className="w-full p-4 border rounded-lg"
              rows="4"
              placeholder="Enter your response..."
            ></textarea>
            <div className="modal-action">
              <form method="dialog">
                <button className="btn mr-14">Cancel</button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={async () => {
                    const responseText = document.getElementById(`response-input-${complaint.id}`).value;
                    if (!responseText.trim()) return alert("Response cannot be empty.");
                    try {
                      const res = await fetch(`http://localhost:3005/api/administration/${complaint.id}/response`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          response: responseText,
                          resolvedBy: "Admin"
                        })
                      });
                      if (res.ok) {
                        alert("Response submitted successfully");
                        document.getElementById(`response-${complaint.id}`).close();
                        setComplaints(prev =>
                          prev.map(c =>
                            c.id === complaint.id
                              ? { ...c, response: responseText, status: "resolved" }
                              : c
                          )
                        );
                      }
                    } catch (err) {
                      console.error("Error submitting response:", err);
                      alert("Failed to submit response");
                    }
                  }}
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

export default AdministrationDashboard;