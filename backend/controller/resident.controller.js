// backend/controllers/resident.controller.js
{/* This file serves as the controller for resident-related operations. 
  It handles incoming requests, validates data, 
  and interacts with the ResidentService to perform business logic.
   */}
const ResidentService = require("../services/resident.service");

const residentService = new ResidentService();
// Register a new resident
exports.registerResident = async (req, res) => {
  try {
    const { name, surname, email, password, community, flatNumber } = req.body;
    console.log(req.body);
    if (!name || !surname || !email || !password || !community || !flatNumber) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const result = await residentService.registerResident({
      name,
      surname,
      email,
      password,
      community,
      flatNumber,
    });

    res.status(201).json(result);
  } catch (err) {
    console.error("Resident registration error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.checkApproval = async (req, res) => {
  try {
    const { email, community } = req.body;

    if (!email || !community) {
      return res.status(400).json({ 
        error: "Email and community are required" 
      });
    }

    const approvalResult = await residentService.checkUserApproval({ 
      email, 
      community, 
    });

    if (!approvalResult.approved) {
      return res.status(403).json({ 
        error: approvalResult.message.split(':')[0], // Gets 'USER_NOT_FOUND' or 'USER_NOT_APPROVED'
        message: approvalResult.message.split(':')[1]?.trim() || approvalResult.message,
        status: approvalResult.status 
      });
    }

    res.json(approvalResult);

  } catch (error) {
    console.error("Error checking approval:", error);
    res.status(500).json({ 
      error: "Internal server error",
      message: error.message 
    });
  }
};