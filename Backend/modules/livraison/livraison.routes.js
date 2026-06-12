import express from "express";
import Livraison from "./livraison.model.js";

import {
  getLivraisons,
  getLivraisonById,
  updateLivraison,
  deleteLivraison,
  getBonLivraisonFromLivraison ,
  appliquerLivraison
} from "./livraison.controller.js";


const router = express.Router();

/* =========================
   CREATE LIVRAISON
   (référence auto + création manuelle possible)
========================= */

/* =========================
   READ
========================= */
router.get("/", getLivraisons);
router.get("/:id", getLivraisonById);

/* =========================
   UPDATE (livraison partielle / complète)
========================= */
router.put("/:id", updateLivraison);

/* =========================
   DELETE
========================= */
router.delete("/:id", deleteLivraison);
router.get("/:id/bon-livraison", getBonLivraisonFromLivraison);
router.patch("/:id/appliquer", appliquerLivraison);


export default router;