import Recu from "./recu.model.js";
import Paiement from "../paiement/paiement.model.js";
import { generateRecuPDF, envoyerRecuParEmail } from "../Pdfs/Recu.js";

// =====================================
// CREER RECU + ENVOI EMAIL AUTOMATIQUE
// =====================================
export const genererRecu = async (req, res) => {
  try {
    const { paiementId } = req.params;

    // 1. récupérer paiement
    const paiement = await Paiement.findById(paiementId)
      .populate("client")
      .populate("facture");

    if (!paiement) {
      return res.status(404).json({ message: "Paiement introuvable" });
    }

    // 2. créer reçu
    const recu = await Recu.create({
      reference: `REC-${Date.now()}`,
      paiement: paiement._id,
      client: paiement.client._id,
      facture: paiement.facture._id,
    });

    // 3. générer PDF
    const pdfBuffer = await generateRecuPDF(paiementId);

    // 4. envoyer email client
    await envoyerRecuParEmail(
      paiement.client.email,
      pdfBuffer,
      recu.reference
    );

    // 5. update reçu
    recu.pdfUrl = `/uploads/recus/${recu.reference}.pdf`;
    recu.envoyeParEmail = true;
    recu.dateEnvoiEmail = new Date();
    await recu.save();

    return res.status(201).json({
      message: "Reçu généré et envoyé avec succès",
      recu,
    });
  } catch (error) {
    console.error("genererRecu error:", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// =====================================
// GET RECU BY ID
// =====================================
export const getRecuById = async (req, res) => {
  try {
    const recu = await Recu.findById(req.params.id)
      .populate("paiement")
      .populate("client")
      .populate("facture");

    if (!recu) {
      return res.status(404).json({ message: "Reçu introuvable" });
    }

    res.json(recu);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// =====================================
// LISTE RECUS
// =====================================
export const getAllRecus = async (req, res) => {
  try {
    const recus = await Recu.find()
      .populate("client")
      .populate("facture")
      .sort({ createdAt: -1 });

    res.json(recus);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};