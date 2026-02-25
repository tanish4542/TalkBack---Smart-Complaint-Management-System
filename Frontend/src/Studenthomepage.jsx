import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUniversity, FaBook, FaBed, FaBus, FaBroom,FaPizzaSlice } from 'react-icons/fa';

const StudentHomePage = () => {
  const navigate = useNavigate();

  const handleWidgetClick = (route) => {
    navigate(route);
  };

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

<header className="home-header flex justify-center items-center p-6 shadow-sm">
  {/* Center Logo */}
  <div className="logo-center">
    <img
      src="/logo1.png"
      alt="Complaint Box"
      className="complaint-logo h-[130px]"
    />
  </div>
</header>

<button
  className="absolute top-4 right-2 text-blue-800 "
>
  <img
      src="/logo.svg"
      alt="nie logo"
      className="complaint-logo h-[100px]"
    />
</button>

      <hr className="separator-line border-gray-200 my-4" />

      <h2 className="text-center text-5xl font-italic text-lg text-blue-500 mb-4 font-semibold">
        Your voice matters — speak up for a better tomorrow.
      </h2>

      <hr className="separator-line border-gray-200 my-4" />

      <main className="widget-container grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 px-10 py-8">
        {[
          { icon: <FaUniversity size={60} />, name: 'Administration', route: '/student/administration', color: 'bg-blue-100' },
          { icon: <FaBook size={60} />, name: 'Academics', route: '/student/academics', color: 'bg-green-100' },
          { icon: <FaBed size={60} />, name: 'Hostel', route: '/student/hostel', color: 'bg-purple-100' },
          { icon: <FaBus size={60} />, name: 'Transportation', route: '/student/transportation', color: 'bg-yellow-100' },
          { icon: <FaBroom size={60} />, name: 'Sanitation', route: '/student/sanitation', color: 'bg-red-100' },
          { icon: <FaPizzaSlice size={60} />, name: 'Food', route: '/student/food', color: 'bg-orange-100' },
        ].map((widget) => (
          <div
            key={widget.name}
            className={`widget ${widget.color} p-10 rounded-2xl shadow-lg flex flex-col items-center cursor-pointer transition-transform hover:scale-105 hover:shadow-2xl`}
            onClick={() => handleWidgetClick(widget.route)}
          >
            <div className="text-gray-700 mb-4">{widget.icon}</div>
            <p className="text-gray-800 font-semibold text-xl">{widget.name}</p>
          </div>
        ))}
      </main>
      </div>
    </div>
  );
};

export default StudentHomePage;