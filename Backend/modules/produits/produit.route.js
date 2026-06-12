import express from "express";

import {
  createProduit,
  getProduits,
  getProduit,
  updateProduit,
  deleteProduit,
} from "./produit.controller.js";

import generateReference from "../middlewares/generateReference.js";

import {
  normalizeProduit,
  validateProduit,
} from "./produit.midelware.js";

import Produit from "./produit.model.js";

const router = express.Router();


// ==========================
// 📦 CREATE PRODUIT
// ==========================
router.post(
  "/",
  normalizeProduit,
  generateReference(Produit, "PROD"),
  validateProduit,
  createProduit
);

// ==========================
// 📦 GET ALL PRODUITS
// ==========================
router.get("/", getProduits);


// ==========================
// 📦 GET ONE PRODUIT
// ==========================
router.get("/:id", getProduit);


// ==========================
// 📦 UPDATE PRODUIT
// ==========================
router.put(
  "/:id",
  updateProduit
);


// ==========================
// 📦 DELETE PRODUIT
// ==========================
router.delete("/:id", deleteProduit);


export default router;