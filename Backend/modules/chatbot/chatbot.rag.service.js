import { HfInference } from '@huggingface/inference';
import { Conversation } from './chatbot.model.js';
import Produit from '../produits/produit.model.js';
import Client from '../clients/client.model.js';
import Facture from '../facture/facture.model.js';
import Commande from '../commande/commande.model.js';
import Devis from '../devis/devi.model.js';
import DetteClient from '../DetteClient/DetteClient.model.js';

const HF_API_TOKEN = process.env.HF_API_TOKEN;
const hf = new HfInference(HF_API_TOKEN);
const MODEL_NAME = 'Qwen/Qwen2.5-7B-Instruct';

const FRENCH_STOP_WORDS = new Set([
  'le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'en', 'et', 'pour', 'qui', 'que', 'ce', 'ces',
  'dans', 'sur', 'est', 'a', 'ont', 'sont', 'je', 'tu', 'il', 'nous', 'vous', 'ils', 'quelles', 'quels',
  'quel', 'quelle', 'combien', 'total', 'liste', 'montre', 'donne', 'moi', 'nos', 'notre', 'votre', 'leur',
  'y', 'a-t-on', 'avec', 'par', 'sous', 'chez', 'comme', 'comment', 'faire', 'fait', 'avoir', 'eu'
]);

const ENTITY_WORDS = new Set([
  'client', 'clients', 'produit', 'produits', 'facture', 'factures', 'commande', 'commandes', 'devis', 'dette', 'dettes'
]);

const buildFallbackReply = (userMessage, contextText) => {
  const lower = userMessage.toLowerCase();
  
  if (contextText && contextText !== 'Aucune donnée spécifique trouvée dans la base de données pour cette requête.') {
    let friendlyText = contextText
      .replace(/--- STATISTIQUES GLOBALES ---/g, '📊 **Statistiques d\'activité :**')
      .replace(/--- PRODUITS TROUVÉS ---/g, '📦 **Produits correspondants :**')
      .replace(/--- CLIENTS TROUVÉS ---/g, '👥 **Clients correspondants :**')
      .replace(/--- FACTURES TROUVÉES ---/g, '🧾 **Factures correspondantes :**')
      .replace(/--- COMMANDES TROUVÉES ---/g, '🛒 **Commandes correspondantes :**')
      .replace(/--- DEVIS TROUVÉS ---/g, '📄 **Devis correspondants :**');
      
    return `Voici les informations de votre base de données :\n\n${friendlyText}`;
  }
  
  if (lower.includes('bonjour') || lower.includes('salut')) {
    return 'Bonjour ! 😊 Je suis Sskoupio, votre assistant ERP. Je peux vous renseigner sur vos produits, vos clients, vos factures ou vos statistiques. Comment puis-je vous aider aujourd\'hui ?';
  }
  
  return 'Je n\'ai pas trouvé d\'informations correspondantes dans la base. Essayez d\'indiquer une recherche plus précise (ex: nom de produit ou de client).';
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

export const deleteConversation = async (conversationId) => {
  const result = await Conversation.findByIdAndDelete(conversationId);
  return result !== null;
};

export const sendMessage = async (conversationId, userMessage) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new Error('Conversation non trouvée');

  // Ajouter le message utilisateur dans l'historique
  conversation.messages.push({ id: `user-${Date.now()}`, text: userMessage, sender: 'user' });

  // 1. Extraire les mots-clés de la requête
  const words = userMessage
    .toLowerCase()
    .replace(/[^\w\sàâäéèêëïîôöùûüç]/gi, ' ')
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length > 1 && !FRENCH_STOP_WORDS.has(w));

  // Filtrer les mots entités génériques pour la recherche par mot-clé
  const searchWords = words.filter(w => !ENTITY_WORDS.has(w));

  // 2. Détecter l'intention de la requête
  const isAskingStats = /combien|statistique|total|résumé|chiffre d'affaires|ca|nombre de|somme/i.test(userMessage);
  const isAskingProducts = /produit|stock|prix|article|catalogue|inventaire/i.test(userMessage);
  const isAskingClients = /client|dette|solde|crédit|bloqué|compte/i.test(userMessage);
  const isAskingFactures = /facture|facturation|avoir|paiement|réglé|payé|impayé/i.test(userMessage);
  const isAskingCommandes = /commande|commandes|cmd/i.test(userMessage);
  const isAskingDevis = /devis/i.test(userMessage);

  let statsText = '';
  let productsText = '';
  let clientsText = '';
  let facturesText = '';
  let commandesText = '';
  let devisText = '';

  // A. Récupérer les statistiques globales
  if (isAskingStats) {
    try {
      const totalClients = await Client.countDocuments();
      const totalProduits = await Produit.countDocuments();
      const totalFactures = await Facture.countDocuments();
      const totalCommandes = await Commande.countDocuments();
      const totalDevis = await Devis.countDocuments();

      const invoiceAgg = await Facture.aggregate([
        {
          $group: {
            _id: null,
            totalTTC: { $sum: '$totalTTC' },
            montantPaye: { $sum: '$montantPaye' },
            resteAPayer: { $sum: '$resteAPayer' }
          }
        }
      ]);
      const totalTTC = invoiceAgg[0]?.totalTTC || 0;
      const totalPaye = invoiceAgg[0]?.montantPaye || 0;
      const totalReste = invoiceAgg[0]?.resteAPayer || 0;

      const debtAgg = await DetteClient.aggregate([
        {
          $group: {
            _id: null,
            totalDettes: { $sum: '$soldeActuel' }
          }
        }
      ]);
      const totalDettes = debtAgg[0]?.totalDettes || 0;

      statsText = `--- STATISTIQUES GLOBALES ---
- Clients enregistrés : ${totalClients}
- Produits en catalogue : ${totalProduits}
- Devis émis : ${totalDevis}
- Commandes enregistrées : ${totalCommandes}
- Factures émises : ${totalFactures}
- Chiffre d'affaires facturé : ${totalTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH
- Montant total réglé par les clients : ${totalPaye.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH
- Reste total à recouvrer : ${totalReste.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH
- Encours global des dettes clients : ${totalDettes.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH`;
    } catch (err) {
      console.warn('Erreur calcul statistiques:', err.message);
    }
  }

  // B. Recherche et récupération des produits
  if (isAskingProducts || searchWords.length > 0) {
    try {
      let products = [];
      if (searchWords.length > 0) {
        const regexList = searchWords.map(w => new RegExp(w, 'i'));
        const query = {
          $or: [
            { designation: { $in: regexList } },
            { reference: { $in: regexList } }
          ]
        };
        products = await Produit.find(query).limit(8);
      }
      
      // Fallback si aucun produit trouvé via mot-clé spécifique, mais intention générale présente
      if (products.length === 0 && (isAskingProducts || searchWords.length === 0)) {
        products = await Produit.find({}).limit(8);
      }

      if (products.length > 0) {
        productsText = '--- PRODUITS TROUVÉS ---\n' + products.map(p => 
          `- ${p.designation} (Réf: ${p.reference}) | Prix Vente: ${p.prixVente} DH | Stock: ${p.stock !== undefined ? p.stock : 'N/A'} (Min: ${p.stockMin || 0})`
        ).join('\n');
      }
    } catch (err) {
      console.warn('Erreur recherche produits:', err.message);
    }
  }

  // C. Recherche et récupération des clients
  if (isAskingClients || searchWords.length > 0) {
    try {
      let clients = [];
      if (searchWords.length > 0) {
        const regexList = searchWords.map(w => new RegExp(w, 'i'));
        const query = {
          $or: [
            { nom: { $in: regexList } },
            { email: { $in: regexList } },
            { reference: { $in: regexList } }
          ]
        };
        clients = await Client.find(query).limit(8).populate('detteClient');
      }
      
      // Fallback si aucun client trouvé via mot-clé spécifique, mais intention générale présente
      if (clients.length === 0 && (isAskingClients || searchWords.length === 0)) {
        clients = await Client.find({}).limit(8).populate('detteClient');
      }

      if (clients.length > 0) {
        clientsText = '--- CLIENTS TROUVÉS ---\n' + clients.map(c => {
          const dette = c.detteClient;
          const soldeStr = dette ? `${dette.soldeActuel} DH (Compte: ${dette.statutCompte})` : '0 DH';
          return `- Client: ${c.nom} (Réf: ${c.reference}) | Tél: ${c.telephone} | Email: ${c.email} | Statut: ${c.statut} | Solde Dette: ${soldeStr}`;
        }).join('\n');
      }
    } catch (err) {
      console.warn('Erreur recherche clients:', err.message);
    }
  }

  // D. Recherche et récupération des factures
  if (isAskingFactures || searchWords.length > 0) {
    try {
      let factures = [];
      if (searchWords.length > 0) {
        const regexList = searchWords.map(w => new RegExp(w, 'i'));
        const query = {
          $or: [
            { reference: { $in: regexList } }
          ]
        };
        factures = await Facture.find(query).sort({ createdAt: -1 }).limit(8).populate('client');
      }

      // Fallback si aucune facture trouvée via mot-clé spécifique, mais intention générale présente
      if (factures.length === 0 && (isAskingFactures || searchWords.length === 0)) {
        factures = await Facture.find({}).sort({ createdAt: -1 }).limit(8).populate('client');
      }

      if (factures.length > 0) {
        facturesText = '--- FACTURES TROUVÉES ---\n' + factures.map(f => 
          `- Facture ${f.reference} (${f.typeFacture}) | Client: ${f.client?.nom || 'N/A'} | Total TTC: ${f.totalTTC} DH | Réglé: ${f.montantPaye} DH | Reste: ${f.resteAPayer} DH | Statut Paiement: ${f.statutPaiement}`
        ).join('\n');
      }
    } catch (err) {
      console.warn('Erreur recherche factures:', err.message);
    }
  }

  // E. Recherche et récupération des commandes
  if (isAskingCommandes || searchWords.length > 0) {
    try {
      let commandes = [];
      if (searchWords.length > 0) {
        const regexList = searchWords.map(w => new RegExp(w, 'i'));
        const query = {
          $or: [
            { reference: { $in: regexList } }
          ]
        };
        commandes = await Commande.find(query).sort({ createdAt: -1 }).limit(8).populate('client');
      }

      // Fallback si aucune commande trouvée via mot-clé spécifique, mais intention générale présente
      if (commandes.length === 0 && (isAskingCommandes || searchWords.length === 0)) {
        commandes = await Commande.find({}).sort({ createdAt: -1 }).limit(8).populate('client');
      }

      if (commandes.length > 0) {
        commandesText = '--- COMMANDES TROUVÉES ---\n' + commandes.map(cmd => 
          `- Commande ${cmd.reference} | Client: ${cmd.client?.nom || 'N/A'} | Total TTC: ${cmd.montantTotal} DH | Statut: ${cmd.statut}`
        ).join('\n');
      }
    } catch (err) {
      console.warn('Erreur recherche commandes:', err.message);
    }
  }

  // F. Recherche et récupération des devis
  if (isAskingDevis || searchWords.length > 0) {
    try {
      let devis = [];
      if (searchWords.length > 0) {
        const regexList = searchWords.map(w => new RegExp(w, 'i'));
        const query = {
          $or: [
            { reference: { $in: regexList } }
          ]
        };
        devis = await Devis.find(query).sort({ createdAt: -1 }).limit(8).populate('client');
      }

      // Fallback si aucun devis trouvé via mot-clé spécifique, mais intention générale présente
      if (devis.length === 0 && (isAskingDevis || searchWords.length === 0)) {
        devis = await Devis.find({}).sort({ createdAt: -1 }).limit(8).populate('client');
      }

      if (devis.length > 0) {
        devisText = '--- DEVIS TROUVÉS ---\n' + devis.map(d => 
          `- Devis ${d.reference || 'Sans Réf'} | Client: ${d.client?.nom || 'N/A'} | Total TTC: ${d.montantTotal} DH | Statut: ${d.statut}`
        ).join('\n');
      }
    } catch (err) {
      console.warn('Erreur recherche devis:', err.message);
    }
  }

  // Compiler le contexte complet
  const contextParts = [];
  if (statsText) contextParts.push(statsText);
  if (productsText) contextParts.push(productsText);
  if (clientsText) contextParts.push(clientsText);
  if (facturesText) contextParts.push(facturesText);
  if (commandesText) contextParts.push(commandesText);
  if (devisText) contextParts.push(devisText);

  const contextText = contextParts.join('\n\n') || 'Aucune donnée spécifique trouvée dans la base de données pour cette requête.';

  // Prompt final pour le LLM
  const promptMessages = [
    {
      role: 'system',
      content: `Tu es Sskoupio, l'assistant virtuel intelligent de ce système ERP.
Tu as accès aux données de la base de données via le contexte fourni.
Réponds toujours en français de manière claire, concise, aérée et très amicale.
Présente tes réponses avec des puces très lisibles et utilise des émojis pour structurer l'information (ex: 📊 pour les stats, 👥 pour les clients, 📦 pour les produits, 🧾 pour les factures, 🛒 pour les commandes, 📄 pour les devis).
Rends la réponse extrêmement simple à lire pour un humain. Évite les termes techniques trop complexes ou bruts.
Si le contexte ne contient pas l'information ou est vide, réponds poliment que tu ne la trouves pas et propose de faire une autre recherche (ex: en donnant un nom exact).
Ne devine jamais des montants, des stocks ou des références absents du contexte.`
    },
    {
      role: 'user',
      content: `Données récupérées en base de données :\n${contextText}\n\nQuestion de l'utilisateur : ${userMessage}`
    }
  ];

  let botReply;
  try {
    if (!HF_API_TOKEN) throw new Error('HF_API_TOKEN manquant dans l\'environnement');
    
    const response = await hf.chatCompletion({
      model: MODEL_NAME,
      messages: promptMessages,
      max_tokens: 300,
      temperature: 0.2
    });
    
    botReply = response.choices[0].message.content.trim();
  } catch (error) {
    console.warn('Erreur Hugging Face / chatCompletion, basculement sur le fallback local:', error.message);
    botReply = buildFallbackReply(userMessage, contextText);
  }

  // Enregistrer la réponse dans l'historique
  conversation.messages.push({ id: `bot-${Date.now()}`, text: botReply, sender: 'bot' });
  conversation.updatedAt = Date.now();
  await conversation.save();

  return botReply;
};
