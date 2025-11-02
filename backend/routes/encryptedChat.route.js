// backend/routes/encryptedChat.routes.js
const express = require('express');
const EncryptedChatController = require('../controller/encryptedChat.controller');
const authMiddleware = require('../middleware/auth');
const { db } = require('../firebase');

const router = express.Router();
const controller = new EncryptedChatController(db);

// All routes require authentication
router.use(authMiddleware);

// Create or get existing chat
router.post('/chats', controller.createOrGetChat.bind(controller));

// Get user's chats
router.get('/chats', controller.getUserChats.bind(controller));

// Send message to chat
router.post('/chats/:chatId/messages', controller.sendMessage.bind(controller));

// Get chat messages (decrypted)
router.get('/chats/:chatId/messages', controller.getMessages.bind(controller));

module.exports = router;