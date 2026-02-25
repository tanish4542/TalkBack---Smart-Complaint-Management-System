import React, { useState, useEffect } from 'react';
import { FaUserGraduate, FaCheckCircle, FaRegClock } from 'react-icons/fa';

const ResolvedComplaint = () => {
  const [complaints, setComplaints] = useState([]);

  useEffect(() => {
    const fetchResolvedComplaints = async () => {
      try {
        const response = await fetch('http://localhost:3005/api/principal/resolved');
        const data = await response.json();
        setComplaints(data);
      } catch (error) {
        console.error('Error fetching resolved complaints:', error);
      }
    };

    fetchResolvedComplaints();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-400 to-blue-600 p-6">
      <div className="flex items-center space-x-4 mb-6">
        <button onClick={() => window.history.back()} className="text-blue-700 hover:text-blue-500 font-small">
          ←
        </button>
        <FaCheckCircle className="text-5xl text-green-500" />
        <h2 className="text-5xl font-bold text-blue-900">RESOLVED COMPLAINTS</h2>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-blue-800 uppercase">Complaint</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-blue-800 uppercase">Department</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-blue-800 uppercase">Admin Response</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-blue-800 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-blue-800 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {complaints.length > 0 ? (
              complaints.map((complaint) => (
                <tr key={complaint.id}>
                  <td className="px-6 py-4 max-w-md whitespace-pre-wrap text-sm text-gray-900">
                    {complaint.text?.length > 120
                      ? complaint.text.slice(0, 120) + '...'
                      : complaint.text}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 capitalize">
                    {complaint.department}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {complaint.response || 'No response'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <FaRegClock className="inline mr-1" />
                    {new Date(complaint.submitted_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Resolved
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center text-gray-500 py-6">
                  No resolved complaints found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResolvedComplaint;