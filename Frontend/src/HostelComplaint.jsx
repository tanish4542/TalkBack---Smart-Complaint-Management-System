import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaLock, FaHistory, FaBed, FaRegClock, FaBuilding } from 'react-icons/fa';
import axios from 'axios'; // ✅ Added Axios import

const HostelComplaint = () => {
  const navigate = useNavigate();
  const [complaintText, setComplaintText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [complaintHistory, setComplaintHistory] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hostelBlock, setHostelBlock] = useState('');
  const [roomNumber, setRoomNumber] = useState('');

  // Fetch hostel complaint history
  useEffect(() => {
    const fetchComplaintHistory = async () => {
      try {
        const response = await axios.get('http://localhost:3005/api/hostel/all'); // ✅ Axios GET
        setComplaintHistory(response.data);
      } catch (error) {
        console.error("Error fetching hostel complaints:", error);
      }
    };

    fetchComplaintHistory();
  }, []);

  const handleSubmit = async () => {
    if (!complaintText.trim()) return;

    setIsSubmitting(true);

    try {
      const response = await axios.post('http://localhost:3005/api/hostel/submit', { // ✅ Axios POST
        text: complaintText,
        isAnonymous,
        department: 'hostel',
        hostelBlock,
        roomNumber: isAnonymous ? null : roomNumber
      });

      if (response.status === 200) {
  alert("Complaint submitted successfully");
  setComplaintText('');
  setHostelBlock('');
  setRoomNumber('');
  setIsAnonymous(false);
}
    } catch (error) {
      console.error("Submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
     <div className="min-h-screen bg-gradient-to-br from-gray-400 via-blue-300 to-black p-6">      
      {/* Header with Hostel Theme */}
      <header className="flex justify-between items-center p-6 shadow-sm">
        <button onClick={() => navigate(-1)} className="text-gray-700 hover:text-gray-900">
          <FaArrowLeft size={20} />
        </button>
        <h1 className="text-4xl font-bold text-gray-800 flex items-center">
          <FaBed className="mr-2" /> HOSTEL COMPLAINT PORTAL
        </h1>
        <div className="w-6"></div>
      </header>

      <hr className="border-gray-200" />

      {/* Main Content */}
      <main className="p-6 max-w-3xl mx-auto">
        <div className="bg-gray-50 rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
          <h2 className="text-lg font-medium text-gray-700 mb-4 flex items-center">
            <FaLock className="mr-2" /> NEW COMPLAINT
          </h2>

          {/* Hostel-specific fields */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hostel Block*</label>
              <select
                value={hostelBlock}
                onChange={(e) => setHostelBlock(e.target.value)}
                className="w-full border border-gray-300 rounded p-2 text-sm"
                required
              >
                <option value="">Select block</option>
                <option>A Block</option>
                <option>B Block</option>
                <option>C Block</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isAnonymous ? 'Room Number (Optional)' : 'Room Number*'}
              </label>
              <input
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="w-full border border-gray-300 rounded p-2 text-sm"
                disabled={isAnonymous}
                placeholder={isAnonymous ? "Hidden for anonymity" : "E.g. 205"}
              />
            </div>
          </div>

          <textarea
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 mb-4"
            rows="6"
            placeholder="Describe your hostel complaint (maintenance, cleanliness, etc.)..."
            value={complaintText}
            onChange={(e) => setComplaintText(e.target.value)}
          ></textarea>

          <div className="flex items-center mb-6">
            <input
              type="checkbox"
              id="anonymous-hostel"
              checked={isAnonymous}
              onChange={() => {
                setIsAnonymous(!isAnonymous);
                if (!isAnonymous) setRoomNumber('');
              }}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="anonymous-hostel" className="ml-2 text-gray-700">
              Submit anonymously
              <span className="text-sm text-gray-500 ml-1">(Submitted to Warden)</span>
            </label>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !complaintText.trim() || !hostelBlock}
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
      
        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center"></div>
          <div className="relative flex justify-center">
            <span className="px-4 bg-off-white text-gray-600">
              Complaint History (View Only)
            </span>
          </div>
        </div>

         <hr className="separator-line border-gray-200 my-4" />


        {/* Hostel Complaint History */}
        <div className="bg-gray-150 rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center text-gray-700 mb-4">
            <FaBuilding className="mr-2" />
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
                        <span className="mr-3">Block: {complaint.hostelBlock}</span>
                        {complaint.roomNumber && !complaint.isAnonymous && (
                          <span>Room: {complaint.roomNumber}</span>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs h-fit ${
                      complaint.status === 'resolved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {complaint.status}
                    </span>
                  </div>

                  <div className="flex justify-between mt-3 text-sm text-gray-500">
                    <div>
                      <FaRegClock className="inline mr-1" />
                      {new Date(complaint.date).toLocaleDateString()}
                    </div>
                    {complaint.resolvedBy && (
                      <div>Resolved by: {complaint.resolvedBy}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No hostel complaints found</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default HostelComplaint;