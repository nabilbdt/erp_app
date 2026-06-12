import mongoose from "mongoose";
import Commande from "./commande.model.js";
import Devis from "../devis/devi.model.js";
import BonCommande from "../bonCommande/bonCommande.model.js";
import Client from "../clients/client.model.js";
import Livraison from "../livraison/livraison.model.js";
import { generateBonCommandePDF, envoyerPDFParEmail } from "../Pdfs/BonCommande.js";
import fs from "fs";
import path from "path";

/* ===============================================
   HELPER : générer une référence unique (améliorée)
=============================================== */
const generateReference = async (model, prefix) => {
  try {
    if (!model || typeof model.findOne !== "function") {
      throw new Error(`Modèle invalide pour generateReference : ${model}`);
    }
    const last = await model
      .findOne({ reference: { $ne: null } })
      .sort({ reference: -1 })
      .select("reference");

    let nextNumber = 1;
    if (last?.reference) {
      const match = last.reference.match(/\d+$/);
      if (match) nextNumber = parseInt(match[0]) + 1;
    }
    return `${prefix}-${String(nextNumber).padStart(4, "0")}`;
  } catch (error) {
    console.error("❌ Erreur génération référence:", error);
    throw error;
  }
};

/* -----------------------------------------------
   HELPER : créer un bon de commande (interne)
----------------------------------------------- */
export const creerBonCommande = async (commande) => {
  try {
    console.log("📦 [BON COMMANDE] Début création");
    console.log("➡️ Commande reçue :", commande?._id);
    console.log("➡️ Référence commande :", commande?.reference);
    console.log("➡️ Client ID :", commande?.client);

    if (!commande) {
      console.log("❌ Commande manquante");
      return null;
    }

    // ✅ Vérifier si bon de commande existe déjà
    const exist = await BonCommande.findOne({ commande: commande._id });
    console.log("🔎 BonCommande existant :", exist?._id || "Aucun");
    if (exist) return exist;

    if (!commande.reference) {
      console.log("❌ Référence manquante");
      throw new Error("Référence commande manquante");
    }

    // ✅ Création bon de commande
    console.log("🟢 Création BonCommande...");
    const bonCommande = await BonCommande.create({
      reference: commande.reference,
      commande: commande._id,
      client: commande.client,
      dateEmission: new Date(),
      statut: "genere",
    });

    console.log("✅ BonCommande créé :", bonCommande._id);

    // ✅ Génération dossier PDF
    const uploadDir = path.join("uploads", "bc");
    console.log("📁 Dossier PDF :", uploadDir);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log("📁 Dossier créé");
    }

    let pdfBuffer;
    try {
      console.log("📄 Génération PDF...");
      pdfBuffer = await generateBonCommandePDF(bonCommande._id);
      console.log("✅ PDF généré");
    } catch (pdfError) {
      console.error("❌ Erreur génération PDF:", pdfError);
      return bonCommande;
    }

    const pdfPath = path.join(uploadDir, `${bonCommande.reference}.pdf`);
    console.log("💾 Sauvegarde PDF :", pdfPath);
    fs.writeFileSync(pdfPath, pdfBuffer);

    bonCommande.fichierPDF = `/uploads/bc/${bonCommande.reference}.pdf`;
    await bonCommande.save();
    console.log("📎 PDF attaché au bon de commande");

    // ✅ Envoi email
    const clientData = await Client.findById(commande.client);
    console.log("👤 Client trouvé :", clientData?.email || "pas d'email");

    if (clientData?.email && pdfBuffer) {
      try {
        console.log("📧 Envoi email...");
        await envoyerPDFParEmail(clientData.email, pdfBuffer, bonCommande.reference);
        bonCommande.statut = "envoye";
        await bonCommande.save();
        console.log("📧 Email envoyé + statut mis à jour");
      } catch (mailError) {
        console.error("❌ Erreur envoi email:", mailError);
      }
    }

    console.log("🏁 Fin création bon de commande");
    return bonCommande;
  } catch (err) {
    console.error("❌ creerBonCommande GLOBAL ERROR:", err);
    return null;
  }
};

/* -----------------------------------------------
   HELPER : créer une livraison depuis une commande
----------------------------------------------- */
export const creerLivraisonDepuisCommande = async (commande) => {
  if (!commande) {
    throw new Error("Commande manquante pour créer la livraison");
  }

  try {
    // Vérifier si livraison existe déjà
    const exist = await Livraison.findOne({ commande: commande._id });
    if (exist) return exist;

    // Vérifier produits
    if (!commande.produits || commande.produits.length === 0) {
      throw new Error("Commande sans produits");
    }

    // Transformer produits pour livraison
    const produitsLivraison = commande.produits.map((p) => ({
      produit: p.produit?._id || p.produit,
      quantiteCommandee: p.quantite,
      quantiteLivree: 0,
    }));

    const clientId = commande.client?._id || commande.client;
    if (!clientId) {
      throw new Error("Commande sans client");
    }

    const referenceLivraison = await generateReference(Livraison, "LIV");

    const livraison = await Livraison.create({
      reference: referenceLivraison,
      commande: commande._id,
      client: clientId,
      produits: produitsLivraison,
      chauffeur: null,
      vehicule: null,
      statut: "planifiee",
    });

    return livraison;
  } catch (error) {
    console.error("❌ creerLivraisonDepuisCommande:", error.message);
    throw new Error(error.message);
  }
};

/* -----------------------------------------------
   HELPER : créer commande depuis devis (interne)
----------------------------------------------- */
export const creerCommandeDepuisDevis = async (devis) => {
  if (!devis || devis.statut !== "accepte") return null;
  const exist = await Commande.findOne({ devis: devis._id });
  if (exist) return exist;

  const produitsCommande = devis.produits.map(p => {
    const prixHT = p.prixHT || 0;
    const tauxTVA = p.tauxTVA || 0;
    const totalHT = prixHT * p.quantite;
    const totalTTC = totalHT * (1 + tauxTVA / 100);
    return {
      produit: p.produit,
      quantite: p.quantite,
      prixHT,
      tauxTVA,
      totalHT,
      totalTTC,
    };
  });
  const montantTotal = produitsCommande.reduce((sum, p) => sum + p.totalTTC, 0);

  // Générer une référence pour la commande issue du devis
  const reference = await generateReference(Commande, "CMD");

  const commande = await Commande.create({
    devis: devis._id,
    client: devis.client,
    reference,
    produits: produitsCommande,
    montantTotal,
    statut: "en_cours",
  });
  await creerBonCommande(commande);
  return commande;
};

/* ===============================================
   CONTROLEURS EXPORTÉS
=============================================== */

export const creerCommande = async (req, res, next) => {
  try {
    // Nettoyage des champs vides
    const cleanBody = { ...req.body };
    if (
      cleanBody.devis === '' ||
      cleanBody.devis === null ||
      cleanBody.devis === undefined ||
      cleanBody.devis === 'null'
    ) {
      delete cleanBody.devis;
    }
    if (cleanBody.devis && typeof cleanBody.devis === 'string' && !mongoose.Types.ObjectId.isValid(cleanBody.devis)) {
      delete cleanBody.devis;
    }

    const { devis: devisId } = cleanBody;

    // Cas 1 : Commande à partir d'un devis accepté
    if (devisId) {
      const devis = await Devis.findById(devisId).populate("client produits.produit");
      if (!devis) return res.status(404).json({ message: "Devis introuvable" });
      if (devis.statut !== "accepte")
        return res.status(400).json({ message: "Le devis doit être accepté" });
      const commande = await creerCommandeDepuisDevis(devis);
      return res.status(201).json(commande);
    }

    // Cas 2 : Création manuelle (sans devis)
    // Générer une référence unique pour la commande
    const reference = await generateReference(Commande, "CMD");
    cleanBody.reference = reference;

    // Définir un statut par défaut si absent
    if (!cleanBody.statut) cleanBody.statut = "en_cours";

    // Supprimer devis pour éviter l'erreur d'index unique (sera undefined => non inséré)
    delete cleanBody.devis;

    const commande = await Commande.create(cleanBody);

    // ✅ TOUJOURS créer le bon de commande (génération PDF + envoi email)
    await creerBonCommande(commande);

    // Si la commande est directement confirmée, créer la livraison associée
    if (commande.statut === "confirme") {
      try {
        const commandePopulated = await Commande.findById(commande._id).populate("produits.produit");
        await creerLivraisonDepuisCommande(commandePopulated);
      } catch (livraisonError) {
        console.error("❌ Erreur création livraison après création commande confirmée:", livraisonError);
      }
    }

    return res.status(201).json(commande);
  } catch (err) {
    next(err);
  }
};
export const getCommandes = async (req, res, next) => {
  try {
    let data = await Commande.find()
      .populate("client")
      .populate("produits.produit")
      .populate("devis");

    // Enrichir les données avec les informations du produit
    data = data.map(cmd => {
      const cmdObj = cmd.toObject();
      cmdObj.produits = cmd.produits.map(prod => {
        const produitObj = prod.produit && typeof prod.produit === "object" ? prod.produit : {};
        const designation = produitObj.designation || produitObj.nom || prod.designation || "Produit sans nom";
        return {
          produit: produitObj._id || prod.produit,
          designation: designation,
          nom: produitObj.nom || prod.nom,
          quantite: prod.quantite || 0,
          prixHT: prod.prixHT || produitObj.prixHT || 0,
          prixTTC: prod.prixTTC || (prod.prixHT && prod.tauxTVA ? prod.prixHT * (1 + prod.tauxTVA / 100) : produitObj.prixTTC || produitObj.prixVente || 0),
          tauxTVA: prod.tauxTVA || produitObj.tauxTVA || 20,
          total: prod.prixTTC ? prod.prixTTC * prod.quantite : (prod.prixHT ? prod.prixHT * (1 + (prod.tauxTVA || 20) / 100) * prod.quantite : 0),
          reference: produitObj.reference || prod.reference || ""
        };
      });
      return cmdObj;
    });

    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getCommandeById = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "ID de commande invalide" });
    }
    let data = await Commande.findById(req.params.id)
      .populate("client produits.produit devis");

    if (!data) return res.status(404).json({ message: "Commande introuvable" });

    // Enrichir les données
    const cmdObj = data.toObject();
    cmdObj.produits = data.produits.map(prod => {
      const produitObj = prod.produit && typeof prod.produit === "object" ? prod.produit : {};
      const designation = produitObj.designation || produitObj.nom || prod.designation || "Produit sans nom";
      return {
        produit: produitObj._id || prod.produit,
        designation: designation,
        nom: produitObj.nom || prod.nom,
        quantite: prod.quantite || 0,
        prixHT: prod.prixHT || produitObj.prixHT || 0,
        prixTTC: prod.prixTTC || (prod.prixHT && prod.tauxTVA ? prod.prixHT * (1 + prod.tauxTVA / 100) : produitObj.prixTTC || produitObj.prixVente || 0),
        tauxTVA: prod.tauxTVA || produitObj.tauxTVA || 20,
        total: prod.prixTTC ? prod.prixTTC * prod.quantite : (prod.prixHT ? prod.prixHT * (1 + (prod.tauxTVA || 20) / 100) * prod.quantite : 0),
        reference: produitObj.reference || prod.reference || ""
      };
    });

    res.json(cmdObj);
  } catch (err) {
    next(err);
  }
};

export const updateCommande = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "ID de commande invalide" });
    }

    const commande = await Commande.findById(req.params.id).populate("produits.produit");
    if (!commande) return res.status(400).json({ message: "Commande introuvable" });

    const willConfirm = req.body?.statut === "confirme" && commande.statut !== "confirme" && commande.statut !== "livree";

    const data = await Commande.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: "after", // Remplacer new: true
      runValidators: true,
    });
    if (!data) return res.status(404).json({ message: "Commande introuvable" });

    if (willConfirm) {
      await creerBonCommande(data);
      try {
        const commandePopulated = await Commande.findById(req.params.id).populate("produits.produit");
        await creerLivraisonDepuisCommande(commandePopulated);
      } catch (livraisonError) {
        console.error("❌ Erreur création livraison après mise à jour commande confirmée:", livraisonError);
      }
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const deleteCommande = async (req, res, next) => {
  try {
    const data = await Commande.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ message: "Commande introuvable" });
    res.json({ message: "Commande supprimée" });
  } catch (err) {
    next(err);
  }
};

export const editStatut = async (req, res, next) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ message: "Corps de requête invalide" });
    }

    let rawStatut = req.body.statut;
    if (rawStatut === undefined || rawStatut === null) {
      return res.status(400).json({ message: "Champ 'statut' manquant" });
    }

    let statutNormalise = String(rawStatut).trim().toLowerCase();
    const mapping = {
      'accepté': 'accepte',
      'accepte': 'accepte',
      'en_cours': 'en_cours',
      'encours': 'en_cours',
      'confirme': 'confirme',
      'livree': 'livree',
      'livree_partiellement': 'livree_partiellement',
      'annulee': 'annulee',
    };
    statutNormalise = mapping[statutNormalise] || statutNormalise;

    const allowed = ["en_cours", "confirme", "livree", "livree_partiellement", "annulee", "accepte"];
    if (!allowed.includes(statutNormalise)) {
      return res.status(400).json({
        message: `Statut invalide. Reçu: "${rawStatut}" (normalisé: "${statutNormalise}"). Autorisés: ${allowed.join(", ")}`,
      });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "ID invalide" });
    }
    let commande = await Commande.findById(req.params.id).populate("produits.produit");
    if (!commande) {
      return res.status(404).json({ message: "Commande introuvable" });
    }

    if (commande.statut === "livree") {
      return res.status(400).json({ message: "Commande déjà livrée" });
    }

    let warning = null;

    if (statutNormalise === "en_cours") {
      commande.statut = "en_cours";
    }

    if (statutNormalise === "confirme" || statutNormalise === "accepte") {
      // Vérifier stock
      for (const p of commande.produits) {
        let produit = p.produit;
        if (!produit || !produit.stock) {
          produit = await mongoose.model("Produit").findById(p.produit);
        }
        if (!produit) {
          return res.status(400).json({ message: `Produit introuvable (${p.produit})` });
        }
        if (produit.stock < p.quantite) {
          return res.status(400).json({ message: `Stock insuffisant pour ${produit.designation}` });
        }
      }

      // Déduire stock
      for (const p of commande.produits) {
        let produit = p.produit;
        if (!produit || !produit.stock) {
          produit = await mongoose.model("Produit").findById(p.produit);
        }
        produit.stock -= p.quantite;
        await produit.save();
      }

      await creerBonCommande(commande);

      const existLivraison = await Livraison.findOne({ commande: commande._id });
      if (!existLivraison) {
        try {
          const freshCommande = await Commande.findById(commande._id).populate("produits.produit");
          await creerLivraisonDepuisCommande(freshCommande);
        } catch (err) {
          console.error("❌ Livraison non créée:", err.message);
          warning = "Commande confirmée mais livraison non créée automatiquement.";
        }
      }

      commande.statut = "confirme";
    }

    if (statutNormalise === "livree") {
      await Livraison.updateMany({ commande: commande._id }, { statut: "livree" });
      commande.statut = "livree";
    }

    if (statutNormalise === "livree_partiellement") {
      await Livraison.updateMany({ commande: commande._id }, { statut: "livree_partiellement" });
      commande.statut = "livree_partiellement";
    }

    if (statutNormalise === "annulee") {
      // Restaurer le stock
      for (const p of commande.produits) {
        let produit = p.produit;
        if (!produit || !produit.stock) {
          produit = await mongoose.model("Produit").findById(p.produit);
        }
        if (produit) {
          produit.stock += p.quantite;
          await produit.save();
        }
      }
      await Livraison.updateMany({ commande: commande._id }, { statut: "annulee" });
      commande.statut = "annulee";
    }

    await commande.save();

    const response = { message: "Statut mis à jour avec succès", commande };
    if (warning) response.warning = warning;
    res.json(response);
  } catch (err) {
    console.error("❌ editStatut error:", err);
    next(err);
  }
};