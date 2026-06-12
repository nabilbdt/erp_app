// modules/chatbot/chatbot.routes.js
import express from 'express';
import * as chatbotController from './chatbot.controller.js';

const router = express.Router();

router.post('/', chatbotController.createConversation);
router.get('/', chatbotController.getAllConversations);
router.post('/:id/message', chatbotController.sendMessage);
router.delete('/:id', chatbotController.deleteConversation);

export default router;   // ⚠️ export par défaut