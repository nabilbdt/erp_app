import BonLivraison from "./bonLivraison.model.js";
import Client from "../clients/client.model.js";
import { generateBonLivraisonPDF, envoyerBonLivraisonParEmail } from "../Pdfs/BonLivraison.js";

/**
 * Crée un Bon de Livraison pour les produits livrés
 * @param {Object} livraison Document livraison avec produitsLivres remplis
 * @returns {Promise<Object|null>} Le BL créé ou null
 */
export const creerBonLivraisonPartiel = async (livraison) => {
  try {
    if (!livraison || !livraison.produitsLivres || livraison.produitsLivres.length === 0) {
      console.log("ℹ️ Pas de produits livrés, BL non créé");
      return null;
    }

    const clientId = livraison.client;

    const bl = await BonLivraison.create({
      livraison: livraison._id,
      client: clientId,
      produitsLivres: livraison.produitsLivres,
      dateLivraison: livraison.dateLivraison,
    });

    const pdfBuffer = await generateBonLivraisonPDF(bl._id);

    const client = await Client.findById(clientId);
    if (client?.email) {
      await envoyerBonLivraisonParEmail(client.email, pdfBuffer, bl.reference);
      console.log("✅ BonLivraison envoyé par email à :", client.email);
    } else {
      console.log("⚠️ Client sans email pour la livraison :", livraison._id);
    }

    return bl;
  } catch (error) {
    console.error("❌ Erreur création BonLivraison :", error);
    return null;
  }
}

// Keep the old function for backward compatibility
export const creerBonLivraison = creerBonLivraisonPartiel;

