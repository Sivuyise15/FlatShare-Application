// backend/routes/resident.route.js
const express = require("express");
const { registerResident, checkApproval } = require("../controller/resident.controller");

const router = express.Router();

router.post("/signup", registerResident);
router.post("/check-approval", checkApproval);

module.exports = router;
