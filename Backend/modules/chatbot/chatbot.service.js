// modules/chatbot/chatbot.service.js
import { HfInference } from '@huggingface/inference';
import { Conversation } from './chatbot.model.js';

const HF_API_TOKEN = process.env.HF_API_TOKEN;
const hf = new HfInference(HF_API_TOKEN);

// Modèle conversationnel gratuit
const MODEL_NAME = 'microsoft/DialoGPT-medium';

// Réponses locales de secours (si l'API échoue)
const getLocalResponse = (message) => {
  const lower = message.toLowerCase();
  if (lower.includes('bonjour') || lower.includes('salut'))
    return 'Bonjour ! Je suis votre assistant Sskoupi. Comment puis-je vous aider ?';
  if (lower.includes('client')) return '📋 La gestion des clients se trouve dans votre tableau de bord.';
  if (lower.includes('produit')) return '📦 Vous pouvez gérer vos produits et stocks depuis l\'onglet Produits.';
  if (lower.includes('livraison')) return '🚚 Les livraisons sont suivies en temps réel. Consultez l\'historique.';
  return '✨ Merci pour votre message. Je reste à votre écoute.';
};

export const createConversation = async () => {
  const newConversation = new Conversation();
  await newConversation.save();
  return newConversation;
};

export const getAllConversations = async () => {
  const conversations = await Conversation.find().sort({ createdAt: -1 });
  return conversations;
};

export const sendMessage = async (conversationId, userMessage) => {
  // Rechercher la conversation
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new Error('Conversation non trouvée');
  }

  // Ajouter le message de l'utilisateur
  conversation.messages.push({
    id: `user-${Date.now()}`,
    text: userMessage,
    sender: 'user'
  });

  // Générer la réponse (API ou fallback)
  let botReply;
  try {
    const response = await hf.textGeneration({
      model: MODEL_NAME,
      inputs: userMessage,
      parameters: {
        max_new_tokens: 150,
        return_full_text: false,
        temperature: 0.7
      }
    });
    botReply = response.generated_text.trim();
  } catch (error) {
    console.error('Erreur Hugging Face:', error.message);
    botReply = getLocalResponse(userMessage);
  }

  // Ajouter la réponse du bot
  conversation.messages.push({
    id: `bot-${Date.now()}`,
    text: botReply,
    sender: 'bot'
  });

  conversation.updatedAt = Date.now();
  await conversation.save();

  return botReply;
};

export const deleteConversation = async (conversationId) => {
  const result = await Conversation.findByIdAndDelete(conversationId);
  return result !== null;
};