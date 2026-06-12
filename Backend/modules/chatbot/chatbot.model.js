// modules/chatbot/chatbot.model.js
import mongoose from 'mongoose';

// Sous-schéma pour un message
const messageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  text: { type: String, required: true },
  sender: { type: String, enum: ['user', 'bot'], required: true },
  timestamp: { type: Date, default: Date.now }
});

// Schéma principal de conversation
const conversationSchema = new mongoose.Schema({
  _id: { type: String, default: () => Date.now().toString() }, // ou ObjectId
  title: { type: String, default: 'Nouvelle conversation' },
  messages: [messageSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true // ajoute automatiquement createdAt et updatedAt
});

// Index pour faciliter les recherches
conversationSchema.index({ createdAt: -1 });

export const Conversation = mongoose.model('Conversation', conversationSchema);