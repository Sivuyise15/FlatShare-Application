// backend/routes/community.js
import express from 'express';
import { registerCommunity } from '../controller/community.controller.js';

const router = express.Router();

router.post('/', registerCommunity);

export default router;
