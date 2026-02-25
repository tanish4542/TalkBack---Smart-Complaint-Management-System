import React, { useState, useEffect } from 'react';
import { FaSearch, FaReply, FaCheckCircle, FaBus, FaRoute } from 'react-icons/fa';

const TransportationDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [responses, setResponses] = useState({});

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const response = await fetch(`http://localhost:3005/api/transportation?status=${filter}`);
        const data = await response.json();
        setComplaints(data);
      } catch (error) {
        console.error("Error fetching complaints:", error);
      }
    };
    fetchComplaints();
  }, [filter]);

  const handleStatusUpdate = async (complaintId, newStatus) => {
    const hasResponse = responses[complaintId] || complaints.find(c => c.id === complaintId)?.response;
    if (newStatus === 'resolved' && !hasResponse) {
      alert("Please respond before resolving the complaint.");
      return;
    }
    try {
      await fetch(`http://localhost:3005/api/transportation/${complaintId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      setComplaints(prev => prev.map(c => c.id === complaintId ? { ...c, status: newStatus } : c));
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleResponseSubmit = async (complaintId) => {
    const responseText = responses[complaintId];
    if (!responseText || !responseText.trim()) {
      alert("Response cannot be empty.");
      return;
    }
    try {
      const res = await fetch(`http://localhost:3005/api/transportation/${complaintId}/response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: responseText, resolvedBy: 'Transport Admin' })
      });
      if (res.ok) {
        alert("Response submitted successfully");
        document.getElementById(`response-${complaintId}`).close();
        setComplaints(prev =>
          prev.map(c => c.id === complaintId ? { ...c, response: responseText, status: 'resolved' } : c)
        );
      }
    } catch (err) {
      console.error("Error submitting response:", err);
      alert("Failed to submit response");
    }
  };

  const filteredComplaints = complaints.filter(complaint =>
    (complaint.text || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (complaint.vehicleNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
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
        <h2 className="text-4xl font-bold text-blue-900">TRANSPORTATION-COMPLAINTS</h2>
        </div>
        <div className="flex space-x-5">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by route, vehicle, or complaint..."
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
          </select>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-s font-medium text-blue-800 uppercase tracking-wider">
                Complaint Details
              </th>
              <th className="px-6 py-3 text-left text-s font-medium text-blue-800 uppercase tracking-wider">
                Route/Vehicle
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
            {filteredComplaints.map((complaint) => (
              <tr key={complaint.id}>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {complaint.text?.substring(0, 80)}{complaint.text?.length > 80 && '...'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(complaint.created_at).toLocaleString()}
                  </div>
                  {complaint.response && (
                    <div className="text-sm text-blue-600 mt-1">
                      Admin Response: {complaint.response}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <FaRoute className="mr-2 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium">Route: {complaint.routeNumber || 'N/A'}</div>
                      {complaint.vehicleNumber && (
                        <div className="text-xs text-gray-500">Vehicle: {complaint.vehicleNumber}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    complaint.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : complaint.status === 'acknowledged'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {complaint.status}
                  </span>
                </td>
                <td className="px-6 py-4 space-x-2">
                  <button
                    onClick={() => document.getElementById(`response-${complaint.id}`).showModal()}
                    className="text-blue-600 hover:text-blue-900 text-sm"
                  >
                    <FaReply className="inline mr-1" /> Respond
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(complaint.id, 
                      complaint.status === 'pending' ? 'acknowledged' : 'resolved')}
                    className="text-green-600 hover:text-green-900 text-sm"
                  >
                    <FaCheckCircle className="inline mr-1" /> 
                    {complaint.status === 'pending' ? 'Acknowledge' : 'Resolve'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Response Dialogs */}
      {filteredComplaints.map((complaint) => (
        <dialog key={`dialog-${complaint.id}`} id={`response-${complaint.id}`} className="modal">
          <div className="modal-box my-4 padding-6">
            <h3 className="font-bold text-lg">Transport Complaint Response</h3>
            <div className="py-4 space-y-2">
              <p><strong>Route:</strong> {complaint.routeNumber || 'N/A'}</p>
              {complaint.vehicleNumber && (
                <p><strong>Vehicle:</strong> {complaint.vehicleNumber}</p>
              )}
              <p className="mt-2">{complaint.text}</p>
            </div>
            <textarea
              className="w-full p-2 border rounded-lg mt-2"
              rows="4"
              placeholder="Enter your response or action taken..."
              value={responses[complaint.id] || ''}
              onChange={(e) => setResponses({ ...responses, [complaint.id]: e.target.value })}
            ></textarea>
            <div className="modal-action">
              <button className="btn mr-14" onClick={() => document.getElementById(`response-${complaint.id}`).close()}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleResponseSubmit(complaint.id)}
              >
                Send Response
              </button>
            </div>
          </div>
        </dialog>
      ))}
    </div>
  );
};

export default TransportationDashboard;