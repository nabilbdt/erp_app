import express from "express";

import {
  createClient,
  getClients,
  getClient,
  updateClient,
  deleteClient,
  getClientCommandes,
  getClientDevis,
  getClientFactures,
  getClientDashboard
} from "./client.controller.js";

import generateReference from "../middlewares/generateReference.js";
import Client from "./client.model.js";

const router = express.Router();

/* =========================
   CREATE
========================= */
router.post(
  "/",
  generateReference(Client, "CLI"),
  createClient
);

/* =========================
   READ
========================= */
router.get("/", getClients);
router.get("/:id", getClient);

/* =========================
   UPDATE / DELETE
========================= */
router.put("/:id", updateClient);
router.delete("/:id", deleteClient);

/* =========================
   🔥 ROUTES MÉTIER CLIENT
========================= */
router.get("/:id/commandes", getClientCommandes);
router.get("/:id/devis", getClientDevis);
router.get("/:id/factures", getClientFactures);

/* =========================
   📊 DASHBOARD
========================= */
router.get("/:id/dashboard", getClientDashboard);

export default router;