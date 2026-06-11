// Modules/paiement/paiement.controller.js

import Paiement from "./paiement.model.js";
import Facture from "../facture/facture.model.js";
import Client from "../clients/client.model.js";
import Recu from "../Recu/recu.model.js";
import path from "path";
import fs from "fs";

import { generateRecuPDF, envoyerRecuParEmail } from "../Pdfs/Recu.js";
import { updateDetteClient } from "../DetteClient/DetteClient.service.js";

// ======================================================
// UTILITAIRE DE GÉNÉRATION DE RÉFÉRENCE
// ======================================================
const generateReference = async (model, prefix) => {
  try {
    const last = await model
      .findOne({ reference: { $ne: null } })
      .sort({ reference: -1 })
      .select("reference");

    let nextNumber = 1;
    if (last?.reference) {
      const match = last.reference.match(/\d+$/);
      if (match) nextNumber = parseInt(match[0], 10) + 1;
    }
    return `${prefix}-${String(nextNumber).padStart(4, "0")}`;
  } catch (error) {
    console.error("❌ Erreur génération référence paiement:", error);
    throw error;
  }
};

// ======================================================
// CREATE PAIEMENT PLANIFIÉ DEPUIS FACTURE
// ======================================================
export const createPaiementFromFacture = async (
  factureId,
  customConditionPaiement = null
) => {
  try {
    const facture = await Facture.findById(factureId)
      .populate("client")
      .populate("commande")
      .populate("livraison");

    if (!facture) throw new Error("Facture introuvable");

    const existingPaiement = await Paiement.findOne({ facture: facture._id });
    if (existingPaiement) return existingPaiement;

    let client = facture.client;
    if (!client?._id) client = await Client.findById(facture.client);
    if (!client) throw new Error("Client introuvable");

    const conditionPaiement = customConditionPaiement || {
      modePaiement: client?.conditionPaiement?.modePaiement || "virement",
      duree: client?.conditionPaiement?.duree || 0,
      banque: client?.conditionPaiement?.banque || {},
    };

    const datePaiementPrevue = new Date();
    datePaiementPrevue.setDate(datePaiementPrevue.getDate() + (conditionPaiement.duree || 0));

    const reference = await generateReference(Paiement, "PAY");

    const paiement = await Paiement.create({
      reference,
      facture: facture._id,
      client: client._id,
      commande: facture.commande?._id || null,
      livraison: facture.livraison?._id || null,
      montantAPayer: facture.totalTTC,
      montantPaye: 0,
      resteAPayer: facture.totalTTC,
      statut: "non_paye",
      conditionPaiement,
      datePaiementPrevue,
      historiquePaiements: [],
    });

    return paiement;
  } catch (error) {
    console.error("createPaiementFromFacture error:", error);
    throw error;
  }
};

// ======================================================
// CREATE MANUEL
// ======================================================
export const createPaiement = async (req, res) => {
  try {
    if (!req.body.reference) {
      req.body.reference = await generateReference(Paiement, "PAY");
    }
    const paiement = await Paiement.create(req.body);

    res.status(201).json(paiement);
  } catch (err) {
    console.error("createPaiement error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ======================================================
// GET ALL
// ======================================================
export const getPaiements = async (req, res) => {
  try {
    const paiements = await Paiement.find()
      .populate("client")
      .populate("facture")
      .populate("commande")
      .populate("livraison")
      .sort({ createdAt: -1 });
    res.json(paiements);
  } catch (err) {
    console.error("getPaiements error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ======================================================
// GET BY ID
// ======================================================
export const getPaiementById = async (req, res) => {
  try {
    const paiement = await Paiement.findById(req.params.id)
      .populate("client")
      .populate("facture")
      .populate("commande")
      .populate("livraison");
    if (!paiement) return res.status(404).json({ message: "Paiement introuvable" });
    res.json(paiement);
  } catch (err) {
    console.error("getPaiementById error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ======================================================
// EFFECTUER PAIEMENT (AVEC ENVOI DE REÇU ET SYNC FACTURE)
// ======================================================
// ======================================================
// EFFECTUER PAIEMENT (AVEC MODE DE PAIEMENT + REÇU PDF)
// ======================================================
export const effectuerPaiement = async (req, res) => {
  try {
    const { montant, remarque, modePaiement } = req.body;

    const paiement = await Paiement.findById(req.params.id)
      .populate("facture")
      .populate("client");

    if (!paiement) {
      return res.status(404).json({ message: "Paiement introuvable" });
    }
    if (paiement.statut === "paye") {
      return res.status(400).json({ message: "Ce paiement est déjà soldé" });
    }

    const montantNumber = Number(montant);
    if (!montantNumber || montantNumber <= 0) {
      return res.status(400).json({ message: "Montant invalide" });
    }
    if (montantNumber > paiement.resteAPayer) {
      return res.status(400).json({ message: "Le montant dépasse le reste à payer" });
    }

    // Mise à jour du paiement
    paiement.montantPaye += montantNumber;
    paiement.resteAPayer = paiement.montantAPayer - paiement.montantPaye;
    paiement.statut = paiement.resteAPayer <= 0 ? "paye" : "partiel";
    if (paiement.resteAPayer < 0) paiement.resteAPayer = 0;

    // Création du versement avec mode de paiement
    const versement = {
      montant: montantNumber,
      remarque: remarque || "",
      datePaiement: new Date(),
      modePaiement: modePaiement || paiement.conditionPaiement?.modePaiement || "virement",
      recuUrl: null, // sera mis à jour après génération du PDF
    };
    paiement.historiquePaiements.push(versement);
    await paiement.save();

    // =========================
    // UPDATE DETTE CLIENT - PAIEMENT EFFECTUÉ
    // =========================
    try {
      await updateDetteClient({
        clientId: paiement.client._id,
        typeOperation: "paiement",
        montant: montantNumber,
        reference: paiement.reference,
        paiementId: paiement._id,
        factureId: paiement.facture?._id,
        remarque: `Paiement reçu (${modePaiement || "virement"})`,
      });
    } catch (detteError) {
      console.warn("⚠️ Erreur sync DetteClient (effectuerPaiement):", detteError.message);
    }

    // Synchronisation de la facture
    let factureSynced = false;
    if (paiement.facture) {
      const facture = paiement.facture;
      facture.montantPaye = paiement.montantPaye;
      facture.resteAPayer = paiement.resteAPayer;
      facture.statutPaiement = paiement.statut;
      await facture.save();
      factureSynced = true;
    }

    // Génération du reçu PDF et enregistrement en base
    let recu = null;
    let pdfUrl = null;
    let reçuEnvoye = false;

    try {
      // Génération du PDF (fonction à implémenter côté backend)
      const pdfBuffer = await generateRecuPDF(paiement._id, versement);

      // Chemin où sauvegarder le fichier (dans votre serveur)
      const fileName = `recu_${paiement.reference}_${Date.now()}.pdf`;
      const filePath = path.join(process.cwd(), "uploads", "recus", fileName);
      await fs.promises.writeFile(filePath, pdfBuffer);
      pdfUrl = `/uploads/recus/${fileName}`;

      // Enregistrement dans la collection Recu
      recu = await Recu.create({
        reference: `REC-${Date.now()}`,
        paiement: paiement._id,
        client: paiement.client._id,
        facture: paiement.facture?._id,
        versement: {
          montant: montantNumber,
          datePaiement: new Date(),
          remarque: remarque || "",
          modePaiement: versement.modePaiement,
        },
        pdfUrl,
        envoyeParEmail: false,
      });

      // Mise à jour du versement avec le lien du reçu
      const lastIdx = paiement.historiquePaiements.length - 1;
      paiement.historiquePaiements[lastIdx].recuUrl = pdfUrl;
      await paiement.save();

      // Envoi par email
      if (paiement.client?.email) {
        await envoyerRecuParEmail(paiement.client.email, pdfBuffer, recu.reference);
        recu.envoyeParEmail = true;
        recu.dateEnvoiEmail = new Date();
        await recu.save();
        reçuEnvoye = true;
      }
    } catch (pdfErr) {
      console.error("Erreur génération ou envoi du reçu :", pdfErr);
      // On continue, le paiement est tout de même validé
    }

    res.json({
      message: "Paiement effectué avec succès",
      paiement,
      factureSynchronisee: factureSynced,
      reçuEnvoye,
      recuUrl: pdfUrl,
    });
  } catch (err) {
    console.error("effectuerPaiement error:", err);
    res.status(500).json({ message: err.message });
  }
};
// ======================================================
// UPDATE PAIEMENT
// ======================================================
export const updatePaiement = async (req, res) => {
  try {
    const paiementAncien = await Paiement.findById(req.params.id)
      .populate("client");

    if (!paiementAncien) return res.status(404).json({ message: "Paiement introuvable" });

    const paiement = await Paiement.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    // =========================
    // UPDATE DETTE CLIENT - PAIEMENT MODIFIÉ
    // =========================
    // Vérifier si le montant du paiement a changé
    if (req.body.montantPaye && paiementAncien.montantPaye !== req.body.montantPaye) {
      const difference = req.body.montantPaye - paiementAncien.montantPaye;
      try {
        await updateDetteClient({
          clientId: paiement.client._id,
          typeOperation: "paiement",
          montant: difference,
          reference: paiement.reference,
          paiementId: paiement._id,
          factureId: paiement.facture,
          remarque: `Ajustement paiement: ${paiementAncien.montantPaye} → ${req.body.montantPaye}`,
        });
      } catch (detteError) {
        console.warn("⚠️ Erreur sync DetteClient (updatePaiement):", detteError.message);
      }
    }

    if (!paiement) return res.status(404).json({ message: "Paiement introuvable" });
    res.json(paiement);
  } catch (err) {
    console.error("updatePaiement error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ======================================================
// DELETE PAIEMENT
// ======================================================
export const deletePaiement = async (req, res) => {
  try {
    const paiement = await Paiement.findByIdAndDelete(req.params.id)
      .populate("client");

    if (!paiement) return res.status(404).json({ message: "Paiement introuvable" });

    // =========================
    // UPDATE DETTE CLIENT - PAIEMENT SUPPRIMÉ
    // =========================
    try {
      await updateDetteClient({
        clientId: paiement.client._id,
        typeOperation: "paiement",
        montant: -paiement.montantPaye, // montant négatif pour annuler
        reference: paiement.reference,
        paiementId: paiement._id,
        factureId: paiement.facture,
        remarque: "Paiement supprimé (annulation)",
      });
    } catch (detteError) {
      console.warn("⚠️ Erreur sync DetteClient (deletePaiement):", detteError.message);
    }

    res.json({ message: "Paiement supprimé avec succès" });
  } catch (err) {
    console.error("deletePaiement error:", err);
    res.status(500).json({ message: err.message });
  }
};