import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post('http://localhost:3005/api/auth/forgot-password', { email });
      setMessage(`📩 ${res.data.message}`);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 404) {
        setMessage('❗ Email not registered. Please contact admin.');
      } else {
        setMessage('❗ Something went wrong. Try again later.');
      }
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <h2>Forgot Password</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Enter your college email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">Send Password</button>
        </form>
        {message && <p className="message">{message}</p>}
        <button className="back-button" onClick={() => navigate(-1)}>🔙 Back</button>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;