import express from "express";
import generateReference from "../middlewares/generateReference.js";
import * as commandeCtrl from "./commande.controller.js";
import { loadCommande, checkStatus, loadDevisForCommande } from "./commande.middleware.js";
import Commande from "./commande.model.js";

const router = express.Router();

// Toutes les routes nécessitent une authentification (si besoin)
// router.use(authMiddleware);

// Création d'une commande (manuelle ou depuis devis)
// Pour la création manuelle, on génère une référence automatiquement
router.post("/", generateReference(Commande, "CMD"), commandeCtrl.creerCommande);

// Lister toutes les commandes
router.get("/", commandeCtrl.getCommandes);

// Récupérer une commande par ID
router.get("/:id", commandeCtrl.getCommandeById);

// Mettre à jour une commande (avec validation du statut)
router.put("/:id", loadCommande, checkStatus, commandeCtrl.updateCommande);

// Supprimer une commande
router.delete("/:id", commandeCtrl.deleteCommande);

// Confirmer une commande (déclenche la génération du bon de commande)
router.patch("/:id/statut", commandeCtrl.editStatut);

// Route spécifique : créer une commande à partir d'un devis (avec vérification)
router.post(
  "/from-devis/:devisId",
  loadDevisForCommande,
  generateReference(Commande, "CMD"), // génère la référence pour la nouvelle commande
  commandeCtrl.creerCommande          // le contrôleur utilisera req.devis
);

export default router;