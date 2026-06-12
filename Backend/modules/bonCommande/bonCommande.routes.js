import express from "express";
import BonCommande from "./bonCommande.model.js";
import generateReference from "../middlewares/generateReference.js";
import {
  getBonCommandes,
  getBonCommandeById,
  telechargerPDF,
  deleteBonCommande,
} from "./bonCommande.controller.js";

import { envoyerBCParEmail } from "./bonCommande.middleware.js";

const router = express.Router();

// CREATE
router.post(
  "/",
  generateReference(BonCommande, "BC"),
  async (req, res, next) => {
    try {
      const bc = await BonCommande.create(req.body);

      // 🔥 Générer PDF et envoyer email après création
      try {
        const { generateBonCommandePDF, envoyerPDFParEmail } = await import(
          "./bonCommande.service.js"
        );
        const Client = (await import("../clients/client.model.js")).default;

        // Populate le client pour avoir l'email
        const bcWithClient = await BonCommande.findById(bc._id)
          .populate("commande")
          .populate("client");

        const pdf = await generateBonCommandePDF(bc._id);

        // Sauvegarder le PDF sur le disque
        const fs = await import("fs");
        const path = await import("path");
        const pdfDir = path.resolve("uploads/bc");
        
        if (!fs.existsSync(pdfDir)) {
          fs.mkdirSync(pdfDir, { recursive: true });
        }
        
        const filePath = path.resolve(pdfDir, `${bc.reference}.pdf`);
        fs.writeFileSync(filePath, pdf);

        bc.fichierPDF = `/uploads/bc/${bc.reference}.pdf`;
        await bc.save();

        // Envoyer l'email avec le client peuplé
        const client = bcWithClient.client;
        if (client?.email) {
          await envoyerPDFParEmail(client.email, pdf, bc.reference);
          console.log("📧 BC envoyé:", bc.reference);
          
          // Mettre à jour le statut
          bc.statut = "envoye";
          await bc.save();
        }
      } catch (pdfErr) {
        console.error("Erreur génération PDF/email:", pdfErr);
        // On continue quand même - le BC est créé
      }

      res.status(201).json(bc);
    } catch (err) {
      next(err);
    }
  }
);
// READ
router.get("/", getBonCommandes);
router.get("/:id", getBonCommandeById);

// PDF
router.get("/:id/pdf", telechargerPDF);

// DELETE
router.delete("/:id", deleteBonCommande);

export default router;