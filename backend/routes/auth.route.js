// backend/routes/auth.route.js
const express = require('express');
const { login } = require('../controller/auth.controller');

const router = express.Router();

router.post('/', login); // POST /login

module.exports = router;

