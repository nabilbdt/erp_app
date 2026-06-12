// modules/chatbot/chatbot.controller.js
import * as chatbotService from './chatbot.rag.service.js';

export const createConversation = async (req, res) => {
  try {
    const newConv = await chatbotService.createConversation();
    res.status(201).json(newConv);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création de la conversation' });
  }
};

export const getAllConversations = async (req, res) => {
  try {
    const conversations = await chatbotService.getAllConversations();
    res.status(200).json(conversations);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des conversations' });
  }
};

export const sendMessage = async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;

  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Le message ne peut pas être vide' });
  }

  try {
    const botReply = await chatbotService.sendMessage(id, message);
    res.status(200).json({ reply: botReply });
  } catch (error) {
    if (error.message === 'Conversation non trouvée') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erreur lors de l\'envoi du message' });
    }
  }
};

export const deleteConversation = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await chatbotService.deleteConversation(id);
    if (deleted) {
      res.status(200).json({ message: 'Conversation supprimée avec succès' });
    } else {
      res.status(404).json({ error: 'Conversation non trouvée' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
};