import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FaArrowLeft, FaLock, FaBus,
  FaRegClock, FaRoute
} from 'react-icons/fa';

const TransportationComplaint = () => {
  const navigate = useNavigate();
  const [complaintText, setComplaintText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [complaintHistory, setComplaintHistory] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [routeNumber, setRouteNumber] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [issueType, setIssueType] = useState('');

  useEffect(() => {
    const fetchComplaintHistory = async () => {
      try {
        const { data } = await axios.get('http://localhost:3005/api/transportation/history');
        setComplaintHistory(data);
      } catch (error) {
        console.error("Error fetching transportation complaints:", error);
      }
    };

    fetchComplaintHistory();
  }, []);

  const handleSubmit = async () => {
    if (!complaintText.trim() || !routeNumber || !issueType) return;

    setIsSubmitting(true);

    try {
      await axios.post('http://localhost:3005/api/transportation/submit', {
        vehicleNumber: vehicleNumber || '',
        type: issueType,
        text: complaintText,
        isAnonymous
      });

      alert(`Transportation complaint submitted ${isAnonymous ? 'anonymously' : ''}`);
      setComplaintText('');
      setRouteNumber('');
      setVehicleNumber('');
      setIssueType('');

      // Refresh history
      const { data } = await axios.get('http://localhost:3005/api/transportation/history');
      setComplaintHistory(data);
    } catch (error) {
      console.error("Submission error:", error);
      alert("Failed to submit complaint.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
     <div className="min-h-screen bg-gradient-to-br from-gray-400 via-blue-300 to-black p-6">      
      <header className="flex justify-between items-center p-6 shadow-sm">
        <button onClick={() => navigate(-1)} className="text-gray-700 hover:text-gray-900">
          <FaArrowLeft size={20} />
        </button>
        <h1 className="text-4xl font-bold text-gray-800 flex items-center">
          <FaBus className="mr-4" /> TRANSPORTATION COMPLAINT PORTAL
        </h1>
        <div className="w-6"></div>
      </header>

      <hr className="border-gray-200" />

      <main className="p-6 max-w-3xl mx-auto">
        {/* New Complaint Form */}
        <div className="bg-gray-150 rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
          <h2 className="text-lg font-medium text-gray-700 mb-4 flex items-center">
            <FaLock className="mr-2" /> NEW COMPLAINT
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Route Number*</label>
              <select
                value={routeNumber}
                onChange={(e) => setRouteNumber(e.target.value)}
                className="w-full border border-gray-300 rounded p-2 text-sm"
              >
                <option value="">Select route</option>
                <option>Route 1 (Main Campus)</option>
                <option>Route 2 (North Campus)</option>
                <option>Route 3 (South Campus)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number (Optional)</label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                className="w-full border border-gray-300 rounded p-2 text-sm"
                placeholder="E.g. KA01AB1234"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Complaint Type*</label>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 text-sm mb-4"
            >
              <option value="">Select type</option>
              <option>Bus Schedule</option>
              <option>Driver Behavior</option>
              <option>Vehicle Condition</option>
              <option>Route Change</option>
              <option>Other</option>
            </select>
          </div>

          <textarea
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 mb-4"
            rows="6"
            placeholder="Describe your transportation complaint (include time, location, etc.)..."
            value={complaintText}
            onChange={(e) => setComplaintText(e.target.value)}
          ></textarea>

          <div className="flex items-center mb-6">
            <input
              type="checkbox"
              id="anonymous-transport"
              checked={isAnonymous}
              onChange={() => setIsAnonymous(!isAnonymous)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="anonymous-transport" className="ml-2 text-gray-700">
              Submit anonymously <span className="text-sm text-gray-500">(details will be hidden)</span>
            </label>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !complaintText.trim() || !routeNumber || !issueType}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors shadow-sm ${
              isSubmitting
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-800 hover:bg-blue-600 text-white'
            }`}
          >
            {isSubmitting ? 'Submitting...' : 'SUBMIT COMPLAINT'}
            {isAnonymous && (
              <span className="text-blue-100 text-sm ml-2">(Anonymous)</span>
            )}
          </button>
        </div>

        {/* Complaint History */}
        <hr className="separator-line border-gray-200 my-4" />

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center"></div>
          <div className="relative flex justify-center">
            <span className="px-4 bg-off-white text-gray-600">
              Complaint History (View Only)
            </span>
          </div>
        </div>

        <hr className="separator-line border-gray-200 my-4" />

        <div className="bg-gray-150 rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center text-gray-700 mb-4">
            <FaRoute className="mr-2" />
            <h3 className="font-medium">Archived Complaints</h3>
          </div>

          {complaintHistory.length > 0 ? (
            <div className="space-y-4">
              {complaintHistory.map((complaint) => (
                <div key={complaint.id} className="p-4 bg-white rounded border border-gray-200">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-gray-700 italic">"{complaint.text}"</p>
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="mr-3">Type: {complaint.type}</span>
                        {complaint.vehicleNumber && (
                          <span>Vehicle: {complaint.vehicleNumber}</span>
                        )}
                      </div>

                      {complaint.response && (
                        <div className="mt-2 text-sm text-blue-600">
                          <strong>Admin Response:</strong> {complaint.response}
                        </div>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded text-xs h-fit ${
                      complaint.status === 'resolved'
                        ? 'bg-green-100 text-green-800'
                        : complaint.status === 'acknowledged'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {complaint.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex justify-between mt-3 text-sm text-gray-500">
                    <div>
                      <FaRegClock className="inline mr-1" />
                      {complaint.created_at
                        ? new Date(complaint.created_at).toLocaleString()
                        : 'N/A'}
                    </div>
                    {complaint.resolved_by && (
                      <div>Resolved by: {complaint.resolved_by}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No transportation complaints found</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default TransportationComplaint;