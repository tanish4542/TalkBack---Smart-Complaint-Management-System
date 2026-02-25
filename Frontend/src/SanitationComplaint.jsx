import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaLock, FaHistory, FaTrashAlt, FaRegClock, FaBroom } from 'react-icons/fa';

const SanitationComplaint = () => {
  const navigate = useNavigate();
  const [complaintText, setComplaintText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [complaintHistory, setComplaintHistory] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState('');
  const [issueType, setIssueType] = useState('');

  // ✅ Fetch sanitation complaint history
  const fetchComplaintHistory = async () => {
    try {
      const response = await fetch('http://localhost:3005/api/sanitation');
      if (!response.ok) {
        throw new Error('Failed to fetch complaints');
      }
      const data = await response.json();
      setComplaintHistory(data);
    } catch (error) {
      console.error("Error fetching sanitation complaints:", error);
    }
  };

  useEffect(() => {
    fetchComplaintHistory();
  }, []);

  const handleSubmit = async () => {
    if (!complaintText.trim()) return;
    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:3005/api/sanitation/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: complaintText,
          isAnonymous,
          location,
          issueType,
          urgency: document.getElementById('urgency').value
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit complaint');
      }

      alert(`Sanitation complaint submitted ${isAnonymous ? 'anonymously' : ''}`);
      setComplaintText('');
      setLocation('');
      setIssueType('');

      // ✅ Refresh history after submit
      await fetchComplaintHistory();

    } catch (error) {
      console.error("Submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-400 via-blue-300 to-black p-6">      
      {/* Header */}
      <header className="flex justify-between items-center p-6 shadow-sm">
        <button onClick={() => navigate(-1)} className="text-gray-700 hover:text-gray-900">
          <FaArrowLeft size={20} />
        </button>
        <h1 className="text-4xl font-bold text-gray-800 flex items-center">
          <FaBroom className="mr-4" /> SANITATION COMPLAINT PORTAL
        </h1>
        <div className="w-6"></div>
      </header>

      <hr className="border-gray-200" />

      <main className="p-6 max-w-3xl mx-auto">
        {/* Complaint Form */}
        <div className="bg-gray-150 rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
          <h2 className="text-lg font-medium text-gray-700 mb-4 flex items-center">
            <FaLock className="mr-2" /> NEW COMPLAINT
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location*</label>
              <select 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full border border-gray-300 rounded p-2 text-sm"
                required
              >
                <option value="">Select location</option>
                <option>Main Building</option>
                <option>Classroom Block</option>
                <option>Library</option>
                <option>Cafeteria</option>
                <option>Sports Complex</option>
                <option>Outdoor Areas</option>
                <option>Restrooms</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Issue Type*</label>
              <select 
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full border border-gray-300 rounded p-2 text-sm"
                required
              >
                <option value="">Select issue type</option>
                <option>Waste Accumulation</option>
                <option>Spills/Leaks</option>
                <option>Restroom Maintenance</option>
                <option>Pest Control</option>
                <option>Odor Issues</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Urgency Level*</label>
            <select 
              id="urgency"
              className="w-full border border-gray-300 rounded p-2 text-sm"
              defaultValue="medium"
            >
              <option value="low">Low (General cleanliness)</option>
              <option value="medium">Medium (Needs attention)</option>
              <option value="high">High (Health hazard)</option>
            </select>
          </div>

          <textarea
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 mb-4"
            rows="6"
            placeholder="Describe the sanitation issue in detail (include specific area if possible)..."
            value={complaintText}
            onChange={(e) => setComplaintText(e.target.value)}
          ></textarea>

          <div className="flex items-center mb-6">
            <input
              type="checkbox"
              id="anonymous-sanitation"
              checked={isAnonymous}
              onChange={() => setIsAnonymous(!isAnonymous)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="anonymous-sanitation" className="ml-2 text-gray-700">
              Submit anonymously
              <span className="text-sm text-gray-500 ml-1">(details will be hidden)</span>
            </label>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !complaintText.trim() || !location || !issueType}
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

        {/* Separator */}
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

        {/* Complaint History */}
        <div className="bg-gray-150 rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center text-gray-700 mb-4">
            <FaTrashAlt className="mr-2" />
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
                        <span className="mr-3">Location: {complaint.location}</span>
                        <span>Type: {complaint.issueType}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`px-2 py-1 rounded text-xs mb-3 ${
                        complaint.urgency === 'high' 
                          ? 'bg-red-100 text-red-800' 
                          : complaint.urgency === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {complaint.urgency} priority
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        complaint.status === 'resolved' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {complaint.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between mt-3 text-sm text-gray-500">
                    <div>
                      <FaRegClock className="inline mr-1" />
                      {new Date(complaint.date).toLocaleDateString()}
                    </div>
                    {complaint.resolvedBy && (
                      <div>Cleaned by: {complaint.resolvedBy}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No sanitation complaints found</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default SanitationComplaint;