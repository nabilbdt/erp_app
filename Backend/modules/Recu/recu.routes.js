import express from "express";
import {
  genererRecu,
  getRecuById,
  getAllRecus,
} from "./recu.controller.js";

const router = express.Router();

// Générer reçu après paiement
router.post("/generate/:paiementId", genererRecu);

// Get un reçu
router.get("/:id", getRecuById);

// Liste des reçus
router.get("/", getAllRecus);

export default router;