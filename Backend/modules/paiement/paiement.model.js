// Modules/paiement/paiement.model.js

import mongoose from "mongoose";

const paiementSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      unique: true,
      required: true,
    },

    facture: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Facture",
      required: true,
    },

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },

    commande: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Commande",
      default: null,
    },

    livraison: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Livraison",
      default: null,
    },

    montantAPayer: {
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

    statut: {
      type: String,
      enum: ["non_paye", "partiel", "paye"],
      default: "non_paye",
    },

    // snapshot modifiable
    conditionPaiement: {
      modePaiement: {
        type: String,
        enum: ["virement", "cheque", "especes"],
        default: "virement",
      },

      duree: {
        type: Number,
        default: 0,
      },

      banque: {
        nomBanque: String,
        rib: String,
        iban: String,
        swift: String,
      },
    },

    datePaiementPrevue: {
      type: Date,
      default: null,
    },

historiquePaiements: [
  {
    montant: Number,
    datePaiement: { type: Date, default: Date.now },
    remarque: String,
    modePaiement: { type: String, enum: ["virement", "cheque", "especes"], default: "virement" },
    recuUrl: String,
  },
],
    note: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Paiement", paiementSchema);