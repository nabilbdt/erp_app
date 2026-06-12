import express from "express";
import generateReference from "../middlewares/generateReference.js";
import Devis from "./devi.model.js";

import {
  createDevis,
  getAllDevis,
  getDevisById,
  updateDevis,
  deleteDevis,
  acceptDevis,
  refuseDevis,
  negocierDevis
} from "./devi.controller.js";

const router = express.Router();

router.post("/", generateReference(Devis, "DEV"), createDevis);

router.get("/", getAllDevis);
router.get("/:id", getDevisById);

router.get("/:id/accept", acceptDevis);
router.get("/:id/refuse", refuseDevis);
router.get("/:id/negocier", negocierDevis);

router.put("/:id", updateDevis);
router.delete("/:id", deleteDevis);

export default router;