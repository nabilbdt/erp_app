import BonLivraison from "./bonLivraison.model.js";
import { generateBonLivraisonPDF } from "../Pdfs/BonLivraison.js";

/* =========================
   CREATE AUTO BL
========================= */
export const createBonLivraison = async (livraison) => {
  try {
    const exist = await BonLivraison.findOne({
      livraison: livraison._id,
    });

    if (exist) return exist;

    const bl = await BonLivraison.create({
      reference: "", // auto via middleware
      livraison: livraison._id,
      commande: livraison.commande,
      client: livraison.client,
      dateLivraison: new Date(),
    });

    const pdfBuffer = await generateBonLivraisonPDF(bl._id);
    bl.fichierPDF = `/uploads/bl/${bl.reference}.pdf`;
    await bl.save();

    return bl;
  } catch (err) {
    console.error("❌ BL error:", err);
    return null;
  }
};

/* =========================
   GET ALL
========================= */
export const getBonLivraisons = async (req, res, next) => {
  try {
    const data = await BonLivraison.find()
      .populate("livraison")
      .populate("client");
    res.json(data);
  } catch (err) {
    next(err);
  }
};

/* =========================
   GET BY ID
========================= */
export const getBonLivraisonById = async (req, res, next) => {
  try {
    const data = await BonLivraison.findById(req.params.id)
      .populate("livraison")
      .populate("client");
    if (!data) return res.status(404).json({ message: "BL introuvable" });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

/* =========================
   DELETE
========================= */
export const deleteBonLivraison = async (req, res, next) => {
  try {
    const data = await BonLivraison.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ message: "BL introuvable" });
    res.json({ message: "BL supprimé" });
  } catch (err) {
    next(err);
  }
};

/* =========================
   GET PDF FILE
========================= */
import path from 'path';
import fs from 'fs';

export const getBonLivraisonPDF = async (req, res, next) => {
  try {
    const bonLivraison = await BonLivraison.findById(req.params.id);
    if (!bonLivraison) {
      return res.status(404).json({ message: "Bon de livraison introuvable" });
    }

    const filename = `${bonLivraison.reference}.pdf`;
    const filePath = path.join(process.cwd(), 'uploads', 'bon-livraisons', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Fichier PDF non trouvé" });
    }

    res.sendFile(filePath);
  } catch (err) {
    console.error("Erreur envoi PDF BL :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};