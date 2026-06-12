import express from "express";
import {
  getFactures,
  getFactureById,
  createFacture,
  updateFacture,
  deleteFacture,
  payerFacture,
  envoyerFacture,
  telechargerPDFFacture,
} from "./facture.controller.js";

const router = express.Router();

router.get("/", getFactures);
router.get("/:id", getFactureById);
router.post("/", createFacture);
router.put("/:id", updateFacture);
router.delete("/:id", deleteFacture);
router.post("/:id/payer", payerFacture);
router.post("/:id/email", envoyerFacture);
router.get("/:id/pdf", telechargerPDFFacture);

export default router;