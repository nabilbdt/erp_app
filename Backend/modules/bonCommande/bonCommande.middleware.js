import {
  generateBonCommandePDF,
  envoyerPDFParEmail,
} from "./bonCommande.service.js";

import Client from "../clients/client.model.js";

/**
 * 🔥 POST-SAVE HOOK
 */
export const envoyerBCParEmail = async (bonCommande) => {
  try {
    const pdf = await generateBonCommandePDF(bonCommande._id);

    bonCommande.fichierPDF = `/uploads/bc/${bonCommande.reference}.pdf`;
    await bonCommande.save();

    const client = await Client.findById(bonCommande.client);

    if (client?.email) {
      await envoyerPDFParEmail(client.email, pdf, bonCommande.reference);
    }

    console.log("BC envoyé:", bonCommande.reference);
  } catch (err) {
    console.error(err);
  }
};