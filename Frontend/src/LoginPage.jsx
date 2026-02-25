import React, { useState } from "react";
import { FaUserShield, FaUserGraduate, FaUserTie } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

function LoginPage() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [animate, setAnimate] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRoleSelect = (role) => {
    setAnimate(true);
    setTimeout(() => {
      setSelectedRole(role);
      setAnimate(false);
    }, 400);
  };

  const floatAnimation = {
  animation: "float 3s ease-in-out infinite"
};


  const handleBack = () => {
    setAnimate(true);
    setTimeout(() => {
      setSelectedRole(null);
      setAnimate(false);
    }, 400);
  };

  const handleLogin = async () => {
    try {
      const response = await axios.post("http://localhost:3005/api/auth/login", {
        email,
        password,
        role: selectedRole,
      });

      const { token, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      if (user.role === "student") {
        navigate("/student/home");
      } else if (user.role === "admin") {
        navigate("/admin/home");
      }else if (user.role==="principal"){
        navigate("/principal/home");
      } else {
        alert("Invalid role.");
      }
    } catch (error) {
      alert(error.response?.data?.error || "Login failed");
    }
  };

  return (
    
    <>
    <style>
      {`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
      `}
    </style>

    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-100 via-purple-300 to-blue-200 relative">
      {/* Top logos */}
      <img src="/logo.svg" alt="College Logo" className="absolute top-3 right-3 w-[110px] h-[110px]" />

      <img src="/images.png" alt="Mascot" className="absolute top-4 left-4 w-[110px]" style={floatAnimation} />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <img src="/logo1.png" alt="Logo" style={{ width: '650px', marginTop: '80px', marginBottom:'80px'}} />
      </div>

      {selectedRole === null ? (
        <div className={`transition-all duration-500 transform ${animate ? "scale-75 opacity-0" : "scale-100 opacity-100"} text-center mt-[10px]`}>
          {/* Centered Logo and Title */}
        <h1 className="text-5xl font-bold text-blue-800 drop-shadow-lg">
          Welcome to the Complaint Box 🎯</h1>

          {/* Role Cards */}
          <div className="flex justify-center items-center gap-12 mt-10">
            <div
              onClick={() => handleRoleSelect("admin")}
              className="cursor-pointer w-60 h-60 p-8 bg-white rounded-2xl shadow-lg hover:scale-105 hover:bg-blue-100 transition duration-300 flex flex-col items-center justify-center space-y-4"
            >
              <FaUserShield className="text-7xl text-blue-600" />
              <h3 className="text-2xl font-bold text-gray-700">ADMIN</h3>
            </div>

            <div
              onClick={() => handleRoleSelect("student")}
              className="cursor-pointer w-60 h-60 p-8 bg-white rounded-2xl shadow-lg hover:scale-105 hover:bg-blue-100 transition duration-300 flex flex-col items-center justify-center space-y-4"
            >
              <FaUserGraduate className="text-7xl text-pink-600" />
              <h2 className="text-2xl font-bold text-gray-700">STUDENT</h2>
            </div>

            <div
              onClick={() => handleRoleSelect("principal")}
              className="cursor-pointer w-60 h-60 p-8 bg-white rounded-2xl shadow-lg hover:scale-105 hover:bg-blue-100 transition duration-300 flex flex-col items-center justify-center space-y-4"
            >
              <FaUserTie className="text-7xl text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-700">PRINCIPAL</h2>
            </div>
          </div>
          <h1 className=" text-2xl  font-bold text-gray-400 drop-shadow-lg mt-14 text-center">
            “🎤Your voice matters – speak up, we’re listening.” </h1>
        </div>
      ) :(
        
        <div className="bg-gradient-to-br from-white-300 via-blue-300 to-pink-200 p-6 rounded-lg shadow-md w-80 relative">
          <h2 className="text-3xl font-bold text-center text-blue-600 mb-8">
            Hello {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}! 👋
          </h2>

          <form className="space-y-6">
            <div>
              <label className="block text-gray-700 mb-3">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-3">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="Enter your password"
              />
            </div>

            <div className="flex justify-between items-center">
              <button type="button" onClick={handleBack} className="text-blue-600 hover:underline text-sm">
                ← Back
              </button>
              <Link to="/forgot-password" className="text-blue-600 hover:underline text-sm">
                Forgot Password?
              </Link>
            </div>

            <button
              type="button"
              onClick={handleLogin}
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-300"
            >
              Login
            </button>
          </form>
        </div>
      )}
    <p className="absolute bottom-2 right-4 text-xs text-gray-500 z-50">
  © JARVIS | All Rights Reserved
</p>
    </div>
  </>
  );
  
}


export default LoginPage;
