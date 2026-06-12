import BonCommande from "./bonCommande.model.js";
import path from "path";
import fs from "fs";
import Client from "../clients/client.model.js";
import {
  generateBonCommandePDF,
  envoyerPDFParEmail,
} from "./bonCommande.service.js";

// GET ALL
export const getBonCommandes = async (req, res, next) => {
  try {
    const data = await BonCommande.find()
      .populate("commande")
      .populate("client");

    res.json(data);
  } catch (err) {
    next(err);
  }
};

// GET BY ID
export const getBonCommandeById = async (req, res, next) => {
  try {
    const data = await BonCommande.findById(req.params.id)
      .populate("commande")
      .populate("client");

    if (!data)
      return res.status(404).json({ message: "Introuvable" });

    res.json(data);
  } catch (err) {
    next(err);
  }
};

// DOWNLOAD PDF
export const telechargerPDF = async (req, res, next) => {
  try {
    const bc = await BonCommande.findById(req.params.id).populate("client");

    if (!bc)
      return res.status(404).json({ message: "Introuvable" });

    const filePath = path.resolve(
      `uploads/bc/${bc.reference}.pdf`
    );

    if (!fs.existsSync(filePath)) {
      const pdf = await generateBonCommandePDF(bc._id);

      if (bc.client?.email) {
        await envoyerPDFParEmail(bc.client.email, pdf, bc.reference);
      }
    }

    res.download(filePath);
  } catch (err) {
    next(err);
  }
};

// DELETE
export const deleteBonCommande = async (req, res, next) => {
  try {
    const deleted = await BonCommande.findByIdAndDelete(req.params.id);

    if (!deleted)
      return res.status(404).json({ message: "Introuvable" });

    res.json({ message: "Supprimé" });
  } catch (err) {
    next(err);
  }
};