import express from "express";
import BonLivraison from "./bonLivraison.model.js";

import generateReference from "../middlewares/generateReference.js";

import {
  getBonLivraisons,
  getBonLivraisonById,
  deleteBonLivraison,
  getBonLivraisonPDF,
} from "./bonLivraison.controller.js";

const router = express.Router();

/* =========================
   READ
========================= */
router.get("/", getBonLivraisons);
router.get("/:id", getBonLivraisonById);

/* =========================
   DELETE
========================= */
router.delete("/:id", deleteBonLivraison);

/* =========================
   POST DISABLED (AUTO SYSTEM)
========================= */
router.post(
  "/",
  generateReference(BonLivraison, "BL"),
  (req, res) => {
    return res.status(400).json({
      message: "BL généré automatiquement via livraison",
    });
  }
);
router.get('/:id/pdf', getBonLivraisonPDF);


export default router;