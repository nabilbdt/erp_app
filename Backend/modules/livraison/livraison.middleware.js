import mongoose from "mongoose";
import Livraison from "./livraison.model.js";

// ==============================
// 🔒 ANTI DEPASSEMENT
// ==============================
export const verifierQuantitesMultiLivraisons = async function () {
  const Commande = mongoose.model("Commande");
  const commande = await Commande.findById(this.commande).lean();

  for (const p of commande.produits) {

    const livraisons = await Livraison.find({
      commande: this.commande,
      _id: { $ne: this._id },
    });

    let total = 0;

    livraisons.forEach(liv => {
      liv.produitsLivres.forEach(x => {
        if (x.produit.toString() === p.produit.toString()) {
          total += x.quantiteLivree;
        }
      });
    });

    const current = (this.produitsLivres || [])
      .filter(x => x.produit.toString() === p.produit.toString())
      .reduce((s, x) => s + x.quantiteLivree, 0);

    if (total + current > p.quantite) {
      throw new Error(`❌ Dépassement produit ${p.produit}`);
    }
  }
};

// ==============================
// 🔥 CALCUL RESTANT + STATUT
// ==============================
export const recalculerStatutAvecRestant = async function (commande) {

  const Livraison = mongoose.model("Livraison");

  const autresLivraisons = await Livraison.find({
    commande: this.commande,
    _id: { $ne: this._id },
  });

  for (const item of this.produitsLivres) {

    const produitCommande = commande.produits.find(
      p => p.produit.toString() === item.produit.toString()
    );

    const quantiteCommande = produitCommande?.quantite || 0;

    let dejaLivree = 0;

    autresLivraisons.forEach(liv => {
      liv.produitsLivres.forEach(x => {
        if (x.produit.toString() === item.produit.toString()) {
          dejaLivree += x.quantiteLivree;
        }
      });
    });

    const totalLivree = dejaLivree + item.quantiteLivree;

    // 🔥 TA LOGIQUE
    item.quantite = quantiteCommande;
    item.quantiteRestante = quantiteCommande - totalLivree;
  }

  // ======================
  // STATUT LIVRAISON
  // ======================
  let allZero = true;
  let any = false;

  this.produitsLivres.forEach(p => {
    if (p.quantiteRestante > 0) allZero = false;
    if (p.quantiteLivree > 0) any = true;
  });

  if (allZero) this.statut = "livree";
  else if (any) this.statut = "livree_partiellement";
  else this.statut = "en_cours";
};