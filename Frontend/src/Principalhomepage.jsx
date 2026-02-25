import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaClock, FaExclamationTriangle } from 'react-icons/fa';

const PrincipalHomePage = () => {
  const navigate = useNavigate();

  const [counts, setCounts] = useState({
    resolved: 0,
    pending: 0,
    urgent: 0
  });

  useEffect(() => {
    fetch("http://localhost:3005/api/principal/home")
      .then(res => res.json())
      .then(data => setCounts(data))
      .catch(err => console.error("Error fetching counts:", err));
  }, []);

  const widgets = [
    {
      icon: <FaClock size={60} />,
      name: 'Pending',
      count: counts.pending,
      color: 'bg-yellow-100',
      route: '/principal/pending'
    },
    {
      icon: <FaCheckCircle size={60} />,
      name: 'Resolved',
      count: counts.resolved,
      color: 'bg-green-100',
      route: '/principal/resolved'
    },
    {
      icon: <FaExclamationTriangle size={60} />,
      name: 'Urgent',
      count: counts.urgent,
      color: 'bg-red-100',
      route: '/principal/urgent'
    }
  ];

  return (
    <div className="relative min-h-screen overflow-hidden font-sans text-white">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 animate-gradient bg-gradient-to-br from-gray-200 via-blue-300 to-gray-300 bg-size-200 z-0" />

      {/* Decorative blobs */}
      <div className="absolute top-0 -left-20 w-106 h-106 bg-blue-400 opacity-30 rounded-full mix-blend-multiply filter blur-2xl animate-blob z-0" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-yellow-300 opacity-20 rounded-full mix-blend-multiply filter blur-2xl animate-blob animation-delay-2000 z-0" />

      {/* Main Content */}
      <div className="relative z-10 px-4 py-6">
        {/* Logout */}
        <button
          onClick={() => navigate('/')}
          className="absolute top-4 left-4 text-blue-700 font-medium hover:text-gray-300 transition"
        >
          Logout
        </button>

      {/* Logo and Title */}
      <header className="flex justify-center items-center p-6 shadow-sm">
        <img src="/logo1.png" alt="TalkBack Logo" className="h-[150px]" />
      </header>

      <img
        src="/logo.svg"
        alt="College Logo"
        className="absolute top-4 right-4 h-[100px]"
      />

      <hr className="border-gray-200 my-4" />

      <h2 className="text-center text-5xl font-[Satisfy] text-blue-800 mb-4 font-semibold">
        Principal Dashboard
      </h2>

      <hr className="border-gray-200 my-4" />

      {/* Widgets */}
      <main className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 px-10 py-8">
        {widgets.map(widget => (
          <div
            key={widget.name}
            onClick={() => navigate(widget.route)}
            className={`cursor-pointer ${widget.color} p-10 rounded-2xl shadow-lg flex flex-col items-center transition-transform hover:scale-105 hover:shadow-2xl`}
          >
            <div className="text-gray-800 mb-4">{widget.icon}</div>
            <p className="text-xl font-semibold text-gray-700">{widget.name}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{widget.count}</p>
          </div>
        
        ))}
      </main>
      </div>
    </div>
  );
};

export default PrincipalHomePage;