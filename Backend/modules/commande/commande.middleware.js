import Commande from "./commande.model.js";
import Devis from "../devis/devi.model.js";

// Utilisez :
import { creerCommandeDepuisDevis } from "../commande/commande.controller.js";
/**
 * Charge une commande par son ID et l'attache à req.commande
 * Utilisé avant les opérations qui ont besoin de l'objet commande
 */
export const loadCommande = async (req, res, next) => {
  try {
    const commande = await Commande.findById(req.params.id)
      .populate("client produits.produit devis");
    if (!commande) return res.status(404).json({ message: "Commande non trouvée" });
    req.commande = commande;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Valide le statut envoyé dans le body
 */
export const checkStatus = (req, res, next) => {
  const allowed = ["en_cours", "confirme", "livree", "livree_partiellement", "annulee"];
  const newStatus = req.body.statut;
  if (newStatus && !allowed.includes(newStatus)) {
    return res.status(400).json({ message: `Statut invalide. Autorisés: ${allowed.join(", ")}` });
  }
  next();
};

/**
 * Crée une commande à partir d'un devis (charge le devis et appelle le contrôleur interne)
 * Note : ce middleware ne fait que préparer req.devis ; la création reste dans le contrôleur
 */
export const loadDevisForCommande = async (req, res, next) => {
  try {
    const { devisId } = req.params;
    const devis = await Devis.findById(devisId).populate("client produits.produit");
    if (!devis) return res.status(404).json({ message: "Devis introuvable" });
    if (devis.statut !== "accepte") {
      return res.status(400).json({ message: "Le devis doit être accepté pour créer une commande" });
    }
    req.devis = devis;
    next();
  } catch (err) {
    next(err);
  }
};