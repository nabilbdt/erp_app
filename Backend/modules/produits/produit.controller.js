// produit.controller.js
import Produit from "./produit.model.js";

// ==========================
// ➕ CREATE
// ==========================
export const createProduit = async (req, res) => {
  try {
    const produit = await Produit.create(req.body);
    res.status(201).json(produit);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ==========================
// 📋 GET ALL (avec populations)
// ==========================
export const getProduits = async (req, res) => {
  try {
    const data = await Produit.find()
      .populate("categorie")
      .populate("fournisseur")
      .populate("composantes.produit");
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================
// 📄 GET ONE (détail complet)
// ==========================
export const getProduit = async (req, res) => {
  try {
    const data = await Produit.findById(req.params.id)
      .populate("categorie")
      .populate("fournisseur")
      .populate("composantes.produit");
    if (!data) {
      return res.status(404).json({ message: "Produit non trouvé" });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================
// ✏️ UPDATE (retourne l'objet peuplé)
// ==========================
export const updateProduit = async (req, res) => {
  try {
    const data = await Produit.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("categorie")
      .populate("fournisseur")
      .populate("composantes.produit");

    if (!data) {
      return res.status(404).json({ message: "Produit non trouvé" });
    }
    res.json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ==========================
// ❌ DELETE
// ==========================
export const deleteProduit = async (req, res) => {
  try {
    const deleted = await Produit.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Produit non trouvé" });
    }
    res.json({ message: "Produit supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};