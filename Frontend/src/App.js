import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './LoginPage';
import ForgotPasswordPage from './ForgotPasswordPage';
import Studenthomepage from './Studenthomepage';
import AdministrationComplaint from './AdministrationComplaint';
import AcademicsComplaint from './AcademicsComplaint';
import HostelComplaint from './HostelComplaint';
import TransportationComplaint from './TransportationComplaint';
import SanitationComplaint from './SanitationComplaint';
import FoodComplaint from './FoodComplaint';


import AdminHome from './AdminHome';
import AdministrationDashboard from './AdministrationDashboard';
import AcademicsDashboard from './AcademicsDashboard';
import HostelDashboard from './HostelDashboard';
import TransportationDashboard from './TransportationDashboard';
import SanitationDashboard from './SanitationDashboard';
import FoodDashboard from './FoodDashboard';

import PrincipalHomePage from './Principalhomepage';
import PendingComplaints from './PendingComplaints';
import ResolvedComplaints from './ResolvedComplaints';
import UrgentComplaints from './UrgentComplaints';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/student/home" element={<Studenthomepage/>} />
      <Route path="/student/administration" element={<AdministrationComplaint />} />
      <Route path="/student/academics" element={<AcademicsComplaint />} />
      <Route path="/student/hostel" element={<HostelComplaint />} /> 
      <Route path="/student/transportation" element={<TransportationComplaint />} /> 
      <Route path="/student/sanitation" element={<SanitationComplaint />} /> 
      <Route path="/student/food" element={<FoodComplaint />} /> 

      {/* Admin Routes */}
      <Route path="/admin/home" element={<AdminHome />} />
      <Route path="/admin/administration" element={<AdministrationDashboard />} />
      <Route path="/admin/academics" element={<AcademicsDashboard />} />
      <Route path="/admin/hostel" element={<HostelDashboard />} />
      <Route path="/admin/transportation" element={<TransportationDashboard />} />
      <Route path="/admin/sanitation" element={<SanitationDashboard />} />
      <Route path="/admin/food" element={<FoodDashboard />} />

      <Route path="/principal/home" element={<PrincipalHomePage/>}/>
      <Route path="/principal/resolved" element={<ResolvedComplaints status="resolved" />} />
      <Route path="/principal/pending" element={<PendingComplaints status="pending" />} />
      <Route path="/principal/urgent" element={<UrgentComplaints status="urgent" />} />
    </Routes>
  );
}

export default App;