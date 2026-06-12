import Facture from "../facture/facture.model.js";
import Commande from "../commande/commande.model.js";
import Client from "../clients/client.model.js";
import { generateFacturePDF, envoyerFactureParEmail } from "../Pdfs/Facture.js";
import { updateDetteClient } from "../DetteClient/DetteClient.service.js";

// =========================
// GET ALL FACTURES
// =========================
export const getFactures = async (req, res) => {
  try {
    const factures = await Facture.find()
      .populate("client")
      .populate("commande")
      .populate("livraison")
      .sort({ createdAt: -1 });
    res.json(factures);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =========================
// GET ONE FACTURE
// =========================
export const getFactureById = async (req, res) => {
  try {
    const facture = await Facture.findById(req.params.id)
      .populate("client")
      .populate("commande")
      .populate("livraison");
    if (!facture) return res.status(404).json({ message: "Facture introuvable" });
    res.json(facture);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =========================
// CREATE FACTURE (à partir d'une commande)
// =========================
export const createFacture = async (req, res) => {
  try {
    const { commandeId, reference } = req.body;

    const commande = await Commande.findById(commandeId)
      .populate("client")
      .populate("produits.produit");

    if (!commande) return res.status(404).json({ message: "Commande introuvable" });

    // Construction des produits avec TVA et calculs
    let sousTotal = 0;
    let taxe = 0;
    const produits = commande.produits.map((p) => {
      const produit = p.produit;
      const quantite = p.quantite;
      const prixHT = produit.prixVente || 0;
      const tauxTVA = produit.tauxTVA || 20;
      const totalHT = quantite * prixHT;
      const montantTVA = (totalHT * tauxTVA) / 100;
      const totalTTC = totalHT + montantTVA;
      sousTotal += totalHT;
      taxe += montantTVA;
      return {
        nom: produit.designation || produit.nom,
        quantite,
        prixUnitaire: prixHT,
        tauxTVA,
        totalLigne: totalTTC,
      };
    });

    const totalTTC = sousTotal + taxe;
    const dateEcheance = new Date();
    dateEcheance.setDate(dateEcheance.getDate() + 30);

    const facture = await Facture.create({
      reference: reference || `FAC-${Date.now()}`,
      client: commande.client._id,
      commande: commande._id,
      livraison: commande.livraison?._id || null,
      produits,
      sousTotal,
      taxe,
      totalTTC,
      montantARegler: totalTTC,
      montantPaye: 0,
      resteAPayer: totalTTC,
      statutPaiement: "non_paye",
      statut: "brouillon",
      dateFacture: new Date(),
      dateEcheance,
    });

    // =========================
    // UPDATE DETTE CLIENT - FACTURE CRÉÉE
    // =========================
    try {
      const typeOp = facture.typeFacture === "avoir" ? "avoir" : "facture";
      await updateDetteClient({
        clientId: commande.client._id,
        typeOperation: typeOp,
        montant: totalTTC,
        reference: facture.reference,
        factureId: facture._id,
        remarque: `${typeOp} créée automatiquement`,
      });
    } catch (detteError) {
      console.warn("⚠️ Erreur sync DetteClient:", detteError.message);
      // On continue, la facture est créée mais pas synchronisée
    }

    res.status(201).json(facture);
  } catch (err) {
    console.error("createFacture error:", err);
    res.status(500).json({ message: err.message });
  }
};

// =========================
// UPDATE FACTURE
// =========================
export const updateFacture = async (req, res) => {
  try {
    const factureAncienne = await Facture.findById(req.params.id)
      .populate("client");

    if (!factureAncienne) return res.status(404).json({ message: "Facture introuvable" });

    const facture = await Facture.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    // =========================
    // UPDATE DETTE CLIENT - FACTURE MODIFIÉE
    // =========================
    // Vérifier si le montant a changé
    if (factureAncienne.totalTTC !== req.body.totalTTC && req.body.totalTTC) {
      const difference = req.body.totalTTC - factureAncienne.totalTTC;
      try {
        const typeOp = facture.typeFacture === "avoir" ? "avoir" : "facture";
        await updateDetteClient({
          clientId: facture.client._id,
          typeOperation: typeOp,
          montant: difference, // différence positive ou négative
          reference: facture.reference,
          factureId: facture._id,
          remarque: `Ajustement ${typeOp}: ${factureAncienne.totalTTC} → ${req.body.totalTTC}`,
        });
      } catch (detteError) {
        console.warn("⚠️ Erreur sync DetteClient (update):", detteError.message);
      }
    }

    res.json(facture);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =========================
// DELETE FACTURE
// =========================
export const deleteFacture = async (req, res) => {
  try {
    const facture = await Facture.findByIdAndDelete(req.params.id)
      .populate("client");

    if (!facture) return res.status(404).json({ message: "Facture introuvable" });

    // =========================
    // UPDATE DETTE CLIENT - FACTURE SUPPRIMÉE
    // =========================
    try {
      const typeOp = facture.typeFacture === "avoir" ? "avoir" : "facture";
      await updateDetteClient({
        clientId: facture.client._id,
        typeOperation: typeOp,
        montant: -facture.totalTTC, // montant négatif pour annuler
        reference: facture.reference,
        factureId: facture._id,
        remarque: `${typeOp} supprimée (annulation)`,
      });
    } catch (detteError) {
      console.warn("⚠️ Erreur sync DetteClient (delete):", detteError.message);
    }

    res.json({ message: "Facture supprimée" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =========================
// ENREGISTRER UN PAIEMENT
// =========================
export const payerFacture = async (req, res) => {
  try {
    const { montant } = req.body;
    const facture = await Facture.findById(req.params.id);
    if (!facture) return res.status(404).json({ message: "Facture introuvable" });

    facture.montantPaye += montant;
    facture.resteAPayer = facture.totalTTC - facture.montantPaye;

    if (facture.resteAPayer <= 0) {
      facture.statutPaiement = "paye";
      facture.resteAPayer = 0;
    } else if (facture.montantPaye > 0) {
      facture.statutPaiement = "partiel";
    }

    await facture.save();
    res.json(facture);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =========================
// ENVOYER FACTURE PAR EMAIL (avec PDF)
// =========================
export const envoyerFacture = async (req, res) => {
  try {
    const facture = await Facture.findById(req.params.id).populate("client");
    if (!facture) return res.status(404).json({ message: "Facture introuvable" });

    // Génération du PDF
    let pdfBuffer;
    try {
      pdfBuffer = await generateFacturePDF(facture._id);
    } catch (err) {
      return res.status(500).json({ message: "Erreur génération PDF", error: err.message });
    }

    // Envoi email
    const client = facture.client;
    if (client?.email) {
      await envoyerFactureParEmail(client.email, pdfBuffer, facture.reference);
    }

    facture.statut = "envoyee";
    await facture.save();

    res.json({ message: "Facture envoyée", facture });
  } catch (err) {
    console.error("envoyerFacture error:", err);
    res.status(500).json({ message: err.message });
  }
};

// =========================
// TÉLÉCHARGER PDF
// =========================
export const telechargerPDFFacture = async (req, res) => {
  try {
    const pdfBuffer = await generateFacturePDF(req.params.id);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=facture_${req.params.id}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};