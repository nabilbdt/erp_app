// services/chatbot.service.js
import api from './api.js';

const STORAGE_KEY = 'sskoupi_conversations_mock';

const defaultConversation = () => ({
  id: Date.now().toString(),
  title: 'Nouvelle conversation',
  messages: [
    {
      id: `bot-${Date.now()}`,
      text: 'Bonjour, je suis votre assistant Sskoupi. Comment puis-je vous aider aujourd’hui ?',
      sender: 'bot',
    },
  ],
  createdAt: Date.now(),
});

export const getConversations = async () => {
  try {
    const res = await api.get('/chatbot');
    return res.data.map((c) => ({ ...c, id: c._id || c.id }));
  } catch (err) {
    console.warn('chatbot.service: échec récupération conversations, utilisation du stockage local.', err.message || err);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
    const conv = defaultConversation();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([conv]));
    return [conv];
  }
};

export const createConversation = async () => {
  try {
    const res = await api.post('/chatbot');
    return { ...res.data, id: res.data._id || res.data.id };
  } catch (err) {
    console.warn('chatbot.service: échec création conversation, utilisation du stockage local.', err.message || err);
    const conv = defaultConversation();
    const convs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    convs.unshift(conv);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(convs));
    return conv;
  }
};

export const sendMessage = async (id, message) => {
  try {
    const res = await api.post(`/chatbot/${id}/message`, { message });
    return { reply: res.data.reply || res.data };
  } catch (err) {
    console.warn('chatbot.service: échec envoi message, utilisation du fallback local.', err.message || err);
    // Fallback local simple
    const lower = message.toLowerCase();
    let reply = '';
    if (lower.includes('bonjour') || lower.includes('salut')) reply = 'Bonjour ! Comment puis-je vous aider ?';
    else if (lower.includes('client')) reply = '📋 La gestion des clients est disponible dans votre tableau de bord.';
    else if (lower.includes('produit')) reply = '📦 Vous pouvez gérer vos produits, stocks et catalogues.';
    else if (lower.includes('livraison')) reply = '🚚 Les livraisons sont suivies en temps réel.';
    else reply = '✨ Merci pour votre message. Je reste à votre écoute.';
    return { reply };
  }
};

export const deleteConversation = async (id) => {
  try {
    await api.delete(`/chatbot/${id}`);
    return true;
  } catch (err) {
    console.warn('chatbot.service: échec suppression conversation, utilisation du stockage local.', err.message || err);
    const convs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const filtered = convs.filter((c) => c.id !== id);
    if (filtered.length === convs.length) return false;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  }
};