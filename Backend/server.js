const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");

const authRoutes = require("./routes/auth");
const complaintRoutes = require("./routes/complaints");
const academicComplaintsRoute = require("./routes/academiccomplaints");
const administrationComplaintsRoute = require("./routes/administration");
const transportationComplaintsRoute = require("./routes/transport");
const sanitationRoutes = require('./routes/sanitation');
const hostelRoutes = require('./routes/hostel');
const foodRoutes = require('./routes/food');
const principalRoutes = require('./routes/principal');
const app = express();

dotenv.config();

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/academic", academicComplaintsRoute);
app.use("/api/administration", administrationComplaintsRoute);
app.use("/api/transportation", transportationComplaintsRoute); 
app.use('/api/sanitation', sanitationRoutes);
app.use('/api/hostel', hostelRoutes);
app.use('/api/food', foodRoutes);
app.use('/api', principalRoutes);
// Start server
const PORT = 3005;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});