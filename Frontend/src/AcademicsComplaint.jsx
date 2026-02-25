import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaLock, FaHistory, FaChalkboardTeacher, FaRegClock } from 'react-icons/fa';

const AcademicsComplaint = () => {
  const navigate = useNavigate();
  const [complaintText, setComplaintText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [complaintHistory, setComplaintHistory] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedType, setSelectedType] = useState('');

  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchComplaintHistory = async () => {
      try {
        const response = await axios.get(`http://localhost:3005/api/academic/history`);
        setComplaintHistory(response.data);
      } catch (error) {
        console.error("Error fetching academic complaints:", error);
      }
    };
  
    fetchComplaintHistory();
  }, [userId]);

  const handleSubmit = async () => {
    if (!complaintText.trim() || !selectedType) {
      alert("Please enter complaint text and select type");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post('http://localhost:3005/api/academic/submit', {
        description: complaintText,
        isAnonymous,
        course: selectedCourse,
        type: selectedType,
        userId
      });

      if (response.status === 200) {
        alert(`Academic complaint submitted ${isAnonymous ? 'anonymously' : ''}`);
        setComplaintText('');
        setSelectedCourse('');
        setSelectedType('');
        setIsAnonymous(false);
        
        const updatedHistory = await axios.get(`http://localhost:3005/api/academic/history`);
        setComplaintHistory(updatedHistory.data);
      }
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
          <FaChalkboardTeacher className="mr-4" /> ACADEMICS COMPLAINT PORTAL
        </h1>
        <div className="w-6"></div>
      </header>

      <hr className="border-gray-200" />

      <main className="p-6 max-w-3xl mx-auto">
        <div className="bg-gray-150 rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
          <h2 className="text-lg font-medium text-gray-700 mb-4 flex items-center">
            <FaLock className="mr-2" /> NEW COMPLAINT
          </h2>

          <textarea
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 mb-4"
            rows="6"
            placeholder="Describe your academic complaint (courses, exams, faculty, etc.)..."
            value={complaintText}
            onChange={(e) => setComplaintText(e.target.value)}
          ></textarea>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course Related</label>
              <select
                className="w-full border border-gray-300 rounded p-2 text-sm"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
              >
                <option value="">Select course (optional)</option>
                <option>Mathematics</option>
                <option>Computer Science</option>
                <option>Engineering</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Complaint Type</label>
              <select
                className="w-full border border-gray-300 rounded p-2 text-sm"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="">Select type</option>
                <option>Grading Issue</option>
                <option>Course Material</option>
                <option>Faculty Conduct</option>
              </select>
            </div>
          </div>

          <div className="flex items-center mb-6">
            <input
              type="checkbox"
              id="anonymous-academic"
              checked={isAnonymous}
              onChange={() => setIsAnonymous(!isAnonymous)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="anonymous-academic" className="ml-2 text-gray-700">
              Submit anonymously 
              <span className="text-sm text-gray-500 ml-1">(visible only to academic staff)</span>
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
            <FaHistory className="mr-2" />
            <h3 className="font-medium">Archived Complaints</h3>
          </div>

          {complaintHistory.length > 0 ? (
            <div className="space-y-4">
              {complaintHistory.map((complaint) => (
                <div key={complaint.id} className="p-4 bg-white rounded border border-gray-200">
                  <div className="flex justify-between items-start">
                    <p className="text-gray-700 italic flex-1">"{complaint.description}"</p>
                    <span className={`px-2 py-1 rounded text-xs ml-2 ${
                      complaint.status === 'resolved'
                        ? 'bg-green-100 text-green-800'
                        : complaint.status === 'in_review'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {complaint.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="mt-2 text-sm text-gray-500">
                    {complaint.course && (
                      <span className="mr-3">Course: {complaint.course}</span>
                    )}
                    {complaint.complaint_type && (
                      <span>Type: {complaint.complaint_type}</span>
                    )}
                  </div>

                  {complaint.response && (
                    <div className="mt-2 text-sm text-blue-600">
                      <strong>
                        {complaint.resolved_by?.toLowerCase() === 'principal' ? 'Principal Response:' : 'Admin Response:'}
                      </strong> {complaint.response}
                    </div>
                  )}

                  {!complaint.is_anonymous && (
                    <div className="text-xs text-gray-400 mt-1">
                      Submitted by: {complaint.email || 'N/A'}
                    </div>
                  )}

                  <div className="flex justify-between mt-3 text-sm">
                    <div className="text-gray-500">
                      <FaRegClock className="inline mr-1" />
                      {complaint.submitted_at
                        ? new Date(complaint.submitted_at).toLocaleDateString()
                        : 'N/A'}
                    </div>
                    {complaint.resolved_by && (
                      <div className="text-gray-500">
                        Resolved by: {complaint.resolved_by}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No academic complaints found</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default AcademicsComplaint;