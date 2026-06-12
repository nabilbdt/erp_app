// Modules/paiement/paiement.routes.js
import express from "express";
import * as paiementCtrl from "./paiement.controller.js";

const router = express.Router();

// =========================
// CREATE PAIEMENT (la référence est générée automatiquement dans le controller)
// =========================
router.post("/", paiementCtrl.createPaiement);

// =========================
// GET ALL
// =========================
router.get("/", paiementCtrl.getPaiements);

// =========================
// GET ONE
// =========================
router.get("/:id", paiementCtrl.getPaiementById);

// =========================
// EFFECTUER PAIEMENT
// =========================
router.post("/:id/effectuer", paiementCtrl.effectuerPaiement);

// =========================
// UPDATE PAIEMENT
// =========================
router.put("/:id", paiementCtrl.updatePaiement);

// =========================
// DELETE PAIEMENT
// =========================
router.delete("/:id", paiementCtrl.deletePaiement);

export default router;