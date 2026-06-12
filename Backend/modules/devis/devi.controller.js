import mongoose from "mongoose";
import Devis from "../devis/devi.model.js";
import {
  envoyerDevisParEmail,
  envoyerEmailEntrepriseNegociation
} from "./devi.midelware.js";

// CREATE
export const createDevis = async (req, res) => {
  try {
    console.log("\n🕐 [CREATE DEVIS] Début création...");
    
    const devis = new Devis(req.body);
    await devis.save();

    console.log("✅ Devis créé:", devis.reference, "| Statut:", devis.statut);

    let emailSent = false;
    let emailError = null;
    let message = "Devis créé.";

    if (devis.statut === "en_attente") {
      console.log("📧 Statut en_attente - tentative d'envoi email...");
      try {
        await envoyerDevisParEmail(devis);
        emailSent = true;
        message = "Devis créé et email envoyé.";
        console.log("✅ Email devis envoyé avec succès");
      } catch (err) {
        console.error("❌ Envoi du devis échoué :", err);
        emailError = err.message;
        message = "Devis créé, mais l'email n'a pas pu être envoyé.";
      }
    }

    res.status(201).json({
      devis,
      emailSent,
      message,
      emailError,
    });
  } catch (error) {
    console.error("❌ Erreur createDevis:", error);
    res.status(400).json({ message: error.message });
  }
};

// ACCEPT
export const acceptDevis = async (req, res) => {
  try {
    console.log("\n🕐 [ACCEPT DEVIS] ID:", req.params.id);
    
    const devis = await Devis.findById(req.params.id).populate("client");
    if (!devis) return res.status(404).send("Devis introuvable");

    console.log("📋 Devis trouvé:", devis.reference, "| Statut actuel:", devis.statut);
    
    devis.statut = "accepte";
    await devis.save();

    console.log("✅ Devis accepté et sauvegardé");
    res.send("<h1>Devis accepté</h1>");
  } catch (error) {
    console.error("❌ Erreur acceptDevis:", error);
    res.status(500).json({ message: error.message });
  }
};

// REFUSE
export const refuseDevis = async (req, res) => {
  try {
    const devis = await Devis.findById(req.params.id);
    if (!devis) return res.status(404).send("Devis introuvable");

    devis.statut = "refuse";
    await devis.save();

    res.send("<h1>Devis refusé</h1>");
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🟠 NEGOCIER
export const negocierDevis = async (req, res) => {
  try {
    const devis = await Devis.findById(req.params.id).populate("client");

    if (!devis) return res.status(404).send("Devis introuvable");

    devis.statut = "a_negocier";
    await devis.save();

    // 🔥 email entreprise dynamique via DB
    await envoyerEmailEntrepriseNegociation(devis);

    res.send("<h1>Demande de négociation envoyée</h1>");
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL
export const getAllDevis = async (req, res) => {
  let data = await Devis.find()
    .populate("client")
    .populate("produits.produit");

  // Enrichir les données avec les informations du produit
  data = data.map(d => {
    const devisObj = d.toObject();
    devisObj.produits = d.produits.map(prod => {
      const produitObj = prod.produit && typeof prod.produit === "object" ? prod.produit : {};
      
      // Extraire la désignation
      const designation = produitObj.designation || produitObj.nom || prod.designation || "Produit sans nom";
      
      return {
        produit: produitObj._id || prod.produit,
        designation: designation,
        nom: produitObj.nom || prod.nom,
        quantite: prod.quantite || 0,
        prixHT: prod.prixHT || produitObj.prixHT || 0,
        prixTTC: prod.prixTTC || (prod.prixHT && prod.tauxTVA ? prod.prixHT * (1 + prod.tauxTVA / 100) : produitObj.prixTTC || produitObj.prixVente || 0),
        tauxTVA: prod.tauxTVA || produitObj.tauxTVA || 20,
        total: prod.total || (prod.prixTTC ? prod.prixTTC * prod.quantite : (prod.prixHT ? prod.prixHT * (1 + (prod.tauxTVA || 20) / 100) * prod.quantite : 0)),
        reference: produitObj.reference || prod.reference || ""
      };
    });
    return devisObj;
  });

  res.json(data);
};

// GET ONE
export const getDevisById = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "ID de devis invalide" });
  }

  let data = await Devis.findById(req.params.id)
    .populate("client")
    .populate("produits.produit");

  if (!data) return res.status(404).json({ message: "Devis introuvable" });
  
  // Enrichir les données avec les informations du produit
  const devisObj = data.toObject();
  devisObj.produits = data.produits.map(prod => {
    const produitObj = prod.produit && typeof prod.produit === "object" ? prod.produit : {};
    
    // Extraire la désignation
    const designation = produitObj.designation || produitObj.nom || prod.designation || "Produit sans nom";
    
    return {
      produit: produitObj._id || prod.produit,
      designation: designation,
      nom: produitObj.nom || prod.nom,
      quantite: prod.quantite || 0,
      prixHT: prod.prixHT || produitObj.prixHT || 0,
      prixTTC: prod.prixTTC || (prod.prixHT && prod.tauxTVA ? prod.prixHT * (1 + prod.tauxTVA / 100) : produitObj.prixTTC || produitObj.prixVente || 0),
      tauxTVA: prod.tauxTVA || produitObj.tauxTVA || 20,
      total: prod.total || (prod.prixTTC ? prod.prixTTC * prod.quantite : (prod.prixHT ? prod.prixHT * (1 + (prod.tauxTVA || 20) / 100) * prod.quantite : 0)),
      reference: produitObj.reference || prod.reference || ""
    };
  });
  
  res.json(devisObj);
};

// UPDATE
export const updateDevis = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "ID de devis invalide" });
  }

  const data = await Devis.findOneAndUpdate(
    { _id: req.params.id },
    req.body,
    { returnDocument: "after", runValidators: true }
  );

  if (!data) return res.status(404).json({ message: "Devis introuvable" });
  res.json(data);
};

// DELETE
export const deleteDevis = async (req, res) => {
  try {
    const devis = await Devis.findByIdAndDelete(req.params.id);
    if (!devis) return res.status(404).send("Devis introuvable");

    res.send("Devis supprimé");
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};