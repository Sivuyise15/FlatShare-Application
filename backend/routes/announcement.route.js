const express = require('express');
const router = express.Router();
const AnnouncementController = require("../controller/announcement.controller");


router.post('/', AnnouncementController.createAnnouncement);
router.get('/', AnnouncementController.getAnnouncements);

module.exports = router;
