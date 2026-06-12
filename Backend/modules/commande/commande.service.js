// backend/modules/commande/commande.service.js
import Commande from "./commande.model.js";
import BonCommande from "../bonCommande/bonCommande.model.js";
import Client from "../clients/client.model.js";
import { generateBonCommandePDF, envoyerPDFParEmail } from "../Pdfs/BonCommande.js";
import fs from "fs";
import path from "path";

/**
 * Crée un bon de commande à partir d'une commande validée.
 */
export const creerBonCommande = async (commande) => {
  try {
    if (!commande) return null;
    const exist = await BonCommande.findOne({ commande: commande._id });
    if (exist) return exist;

    if (!commande.reference) throw new Error("Référence manquante");

    const bonCommande = await BonCommande.create({
      reference: commande.reference,
      commande: commande._id,
      client: commande.client,
      dateEmission: new Date(),
      statut: "genere",
    });

    const uploadDir = path.join("uploads", "bc");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const pdfBuffer = await generateBonCommandePDF(bonCommande._id);
    const pdfPath = path.join(uploadDir, `${bonCommande.reference}.pdf`);
    fs.writeFileSync(pdfPath, pdfBuffer);
    bonCommande.fichierPDF = `/${pdfPath}`;
    await bonCommande.save();

    const clientData = await Client.findById(commande.client);
    if (clientData?.email) {
      await envoyerPDFParEmail(clientData.email, pdfBuffer, bonCommande.reference);
      bonCommande.statut = "envoye";
      await bonCommande.save();
    }
    return bonCommande;
  } catch (err) {
    console.error("❌ creerBonCommande:", err);
    return null;
  }
};

/**
 * Crée une commande à partir d'un devis accepté.
 */
export const creerCommandeDepuisDevis = async (devis) => {
  if (!devis || devis.statut !== "accepte") return null;
  const exist = await Commande.findOne({ devis: devis._id });
  if (exist) return exist;

  const produitsCommande = devis.produits.map(p => {
    const prixHT = p.prixHT || 0;
    const tauxTVA = p.tauxTVA || 0;
    const totalHT = prixHT * p.quantite;
    const totalTTC = totalHT * (1 + tauxTVA / 100);
    return {
      produit: p.produit,
      quantite: p.quantite,
      prixHT,
      tauxTVA,
      totalHT,
      totalTTC,
    };
  });
  const montantTotal = produitsCommande.reduce((sum, p) => sum + p.totalTTC, 0);

  const commande = await Commande.create({
    devis: devis._id,
    client: devis.client,
    reference: "",
    produits: produitsCommande,
    montantTotal,
    statut: "confirme",
  });
  await creerBonCommande(commande);
  return commande;
};