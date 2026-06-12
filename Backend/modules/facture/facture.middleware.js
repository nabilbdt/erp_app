import { generateBonCommandePDF, envoyerPDFParEmail } from "../Pdfs/BonCommande.js";

/**
 * Middleware post-save pour envoyer automatiquement le PDF
 * du Bon de Commande au client après sa création
 */
export const envoyerBCParEmail = async function (bonCommande) {
  try {
    // Génère le PDF
    const pdfBuffer = await generateBonCommandePDF(bonCommande._id);

    // Met à jour le fichier PDF
    bonCommande.fichierPDF = `/uploads/bc/${bonCommande.reference}.pdf`;
    await bonCommande.save();

    // Envoie par email
    await envoyerPDFParEmail(bonCommande.client.email, pdfBuffer, bonCommande.reference);

    console.log(`Bon de commande envoyé par email : ${bonCommande.reference}`);
  } catch (error) {
    console.error("Erreur envoi PDF BonCommande :", error);
  }
};