import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaUtensils, FaLock, FaHistory, FaRegClock } from 'react-icons/fa';

const FoodComplaint = () => {
  const navigate = useNavigate();
  const [campus, setCampus] = useState('');
  const [issueType, setIssueType] = useState('');
  const [complaintText, setComplaintText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [complaintHistory, setComplaintHistory] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchComplaintHistory = async () => {
      try {
        const response = await fetch("http://localhost:3005/api/food?status=all");
        const data = await response.json();
        setComplaintHistory(data);
      } catch (error) {
        console.error("Error fetching food complaints:", error);
      }
    };

    fetchComplaintHistory();
  }, []);

  const handleSubmit = async () => {
    if (!complaintText.trim() || !campus || !issueType) {
      alert("Please fill in all fields.");
      return;
    }

    setIsSubmitting(true);
    const user = JSON.parse(localStorage.getItem("user"));
    const userId = isAnonymous ? null : user?.id;

    try {
      const response = await fetch('http://localhost:3005/api/food/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: complaintText,
          isAnonymous,
          userId,
          campus,
          issueType
        })
      });

      if (response.ok) {
        setComplaintText('');
        setCampus('');
        setIssueType('');
        setIsAnonymous(false);

        const updated = await fetch("http://localhost:3005/api/food?status=all");
        const data = await updated.json();
        setComplaintHistory(data);

        setTimeout(() => {
          alert(`Complaint submitted ${isAnonymous ? 'anonymously' : 'successfully'}`);
        }, 200);
      } else {
        alert("Failed to submit complaint.");
      }
    } catch (err) {
      console.error("Submission error:", err);
      alert("Submission failed.");
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
          <FaUtensils className="mr-2" /> FOOD COMPLAINT PORTAL
        </h1>
        <div className="w-6"></div>
      </header>

      <hr className="border-gray-200" />

      <main className="p-6 max-w-3xl mx-auto">
        <div className="bg-gray-50 rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
          <h2 className="text-lg font-medium text-gray-700 mb-4 flex items-center">
            <FaLock className="mr-2" /> NEW COMPLAINT
          </h2>

          <select
            value={campus}
            onChange={(e) => setCampus(e.target.value)}
            className="w-full mb-4 p-3 border rounded-lg"
          >
            <option value="">Select campus/section</option>
            <option>North Campus Hostel</option>
            <option>South Campus Hostel</option>
            <option>North Campus Canteen</option>
            <option>South Campus Canteen</option>
          </select>

          <select
            value={issueType}
            onChange={(e) => setIssueType(e.target.value)}
            className="w-full mb-4 p-3 border rounded-lg"
          >
            <option value="">Select complaint type</option>
            <option>Food Quality</option>
            <option>Quantity</option>
            <option>Seating Arrangement</option>
            <option>Cleanliness</option>
          </select>

          <textarea
            className="w-full p-4 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-200"
            rows="5"
            placeholder="Describe your food-related complaint..."
            value={complaintText}
            onChange={(e) => setComplaintText(e.target.value)}
          ></textarea>

          <div className="flex items-center mb-6">
            <input
              type="checkbox"
              id="anonymous"
              checked={isAnonymous}
              onChange={() => setIsAnonymous(!isAnonymous)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="anonymous" className="ml-2 text-gray-700">
              Submit anonymously
              <span className="text-sm text-gray-500 ml-1">(visible only to cafeteria staff)</span>
            </label>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
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

        <hr className="separator-line border-gray-200 my-4" />

        <div className="relative my-2 flex justify-center">
          <span className="px-4 bg-off-white text-gray-600">Complaint History (View Only)</span>
        </div>

        <hr className="separator-line border-gray-200 my-4" />

        <div className="bg-gray-150 rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center text-gray-700 mb-4">
            <FaHistory className="mr-2" />
            <h3 className="font-medium">Archived Complaints</h3>
          </div>

          {complaintHistory.length > 0 ? (
            <div className="space-y-4">
              {complaintHistory.map((complaint) => (
                <div key={complaint.id} className="p-4 bg-white rounded border border-gray-200">
                  <p className="text-sm text-gray-600 mb-1"><strong>Campus:</strong> {complaint.campus}</p>
                  <p className="text-sm text-gray-600 mb-1"><strong>Type:</strong> {complaint.issueType}</p>
                  <p className="text-gray-800 italic">"{complaint.text}"</p>

                  {complaint.response && (
                    <div className="text-sm text-blue-600 mt-2">
                      Admin Response: {complaint.response}
                    </div>
                  )}

                  <div className="flex justify-between mt-3 text-sm">
                    <div className="text-gray-500">
                      <FaRegClock className="inline mr-1" />
                      {new Date(complaint.submitted_at).toLocaleDateString()}
                    </div>
                    <span className={`px-2 py-1 rounded ${
                      complaint.status.toLowerCase() === 'resolved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {complaint.status}
                    </span>
                  </div>

                  {!complaint.is_anonymous && (
                    <div className="text-xs text-gray-400 mt-1">
                      Submitted by: {complaint.email || 'N/A'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No previous complaints found</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default FoodComplaint;