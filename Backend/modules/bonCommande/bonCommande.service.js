import fs from "fs";
import path from "path";
import BonCommande from "./bonCommande.model.js";
import Client from "../clients/client.model.js";
import Entreprise from "../entreprise/entreprise.model.js";
import { getTransporter } from "../services/mailService.js";
import { generateBonCommandePDF as generatePDF } from "../Pdfs/BonCommande.js";

/**
 * 📄 GENERATE PDF - Utilise le template de BonCommande.js
 */
export const generateBonCommandePDF = async (bonCommandeId) => {
  return generatePDF(bonCommandeId);
};

/**
 * 📧 EMAIL - Envoie le PDF par email avec les infos de l'entreprise
 */
export const envoyerPDFParEmail = async (email, buffer, reference) => {
  const transporter = getTransporter();
  
  // Récupérer les infos de l'entreprise pour l'email
  const entreprise = await Entreprise.findOne().lean();
  const emailFrom = entreprise?.email || process.env.EMAIL_USER;
  const nomEntreprise = entreprise?.nom || "Entreprise";

  await transporter.sendMail({
    from: `"${nomEntreprise}" <${emailFrom}>`,
    to: email,
    subject: `Bon de commande ${reference}`,
    text: `Bonjour,\n\nVeuillez trouver ci-joint votre bon de commande ${reference}.\n\nCordialement,\n${nomEntreprise}`,
    html: `<p>Bonjour,</p>
           <p>Veuillez trouver ci-joint votre bon de commande <strong>${reference}</strong>.</p>
           <p>Cordialement,<br>${nomEntreprise}</p>`,
    attachments: [
      {
        filename: `bon_commande_${reference}.pdf`,
        content: buffer,
        contentType: "application/pdf",
      },
    ],
  });
  
  console.log(`✅ Email envoyé à ${email} pour le BC ${reference}`);
};