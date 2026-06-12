// models/facture.model.js

import mongoose from "mongoose";

const factureSchema = new mongoose.Schema(
  {
    // =========================
    // REFERENCE FACTURE
    // =========================

    reference: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },

    // =========================
    // TYPE FACTURE
    // facture normale / avoir
    // =========================

    typeFacture: {
      type: String,
      enum: ["facture", "avoir"],
      default: "facture",
    },

    // =========================
    // CLIENT
    // =========================

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },

    // =========================
    // COMMANDE
    // =========================

    commande: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Commande",
      required: true,
    },

    // =========================
    // LIVRAISON
    // =========================

    livraison: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Livraison",
      required: true,
    },

    // =========================
    // ETAPE LIVRAISON
    // utile pour livraisons partielles
    // =========================

    etapeLivraison: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    // =========================
    // FACTURE D'AVOIR
    // lien vers facture originale
    // =========================

    factureOrigine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Facture",
      default: null,
    },

    // =========================
    // RETOUR LIVRAISON
    // =========================

    retourLivraison: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RetourLivraison",
      default: null,
    },

    // =========================
    // PRODUITS FACTURES
    // =========================

    produits: [
      {
        produit: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Produit",
          default: null,
        },

        nom: {
          type: String,
          required: true,
          trim: true,
        },

        quantite: {
          type: Number,
          required: true,
          min: 1,
        },

        prixUnitaire: {
          type: Number,
          required: true,
          min: 0,
        },

        totalLigne: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],

    // =========================
    // TOTAUX
    // =========================

    sousTotal: {
      type: Number,
      required: true,
      min: 0,
    },

    taxe: {
      type: Number,
      required: true,
      min: 0,
    },

    totalTTC: {
      type: Number,
      required: true,
      min: 0,
    },

    // =========================
    // MONTANTS PAIEMENT
    // =========================

    montantARegler: {
      type: Number,
      required: true,
      min: 0,
    },

    montantPaye: {
      type: Number,
      default: 0,
      min: 0,
    },

    resteAPayer: {
      type: Number,
      required: true,
      min: 0,
    },

    // =========================
    // STATUT PAIEMENT
    // =========================

    statutPaiement: {
      type: String,
      enum: [
        "non_paye",
        "partiel",
        "paye",
        "rembourse",
      ],
      default: "non_paye",
    },

    // =========================
    // STATUT FACTURE
    // =========================

    statut: {
      type: String,
      enum: [
        "brouillon",
        "envoyee",
        "validee",
        "annulee",
      ],
      default: "brouillon",
    },

    // =========================
    // DATE FACTURE
    // =========================

    dateFacture: {
      type: Date,
      required: true,
      default: Date.now,
    },

    // =========================
    // ECHEANCE
    // =========================

    dateEcheance: {
      type: Date,
      default: null,
    },

    // =========================
    // PAIEMENTS LIES
    // =========================

    paiements: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Paiement",
      },
    ],

    // =========================
    // ENVOI EMAIL
    // =========================

    emailEnvoye: {
      type: Boolean,
      default: false,
    },

    dateEnvoiEmail: {
      type: Date,
      default: null,
    },

    // =========================
    // PDF
    // =========================

    pdfUrl: {
      type: String,
      default: "",
    },

    // =========================
    // NOTES
    // =========================

    note: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "Facture",
  factureSchema
);