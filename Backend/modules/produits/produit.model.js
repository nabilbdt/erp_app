// produit.model.js

import mongoose from "mongoose";

const produitSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      unique: true,
      required: true,
    },

    codeBarre: {
      type: String,
      unique: true,
      sparse: true,
    },

    designation: {
      type: String,
      required: true,
      trim: true,
    },

    categorie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Categorie",
      required: true,
    },

    typeProduit: {
      type: String,
      enum: ["Produit_Fini", "service", "production"],
      required: true,
    },

    prixAchat: {
      type: Number,
      min: 0,
      default: 0,
    },

    prixVente: {
      type: Number,
      required: true,
      min: 0,
    },

    tauxTVA: {
      type: Number,
      default: 20,
    },

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    stockMin: {
      type: Number,
      default: 0,
    },

    uniteVente: {
      type: String,
      enum: [
        "pièce",
        "unité",
        "kg",
        "g",
        "mg",
        "L",
        "mL",
        "boîte",
        "paquet",
        "carton",
        "sachet",
        "bouteille",
        "barquette",
        "palette",
        "mètre",
        "cm",
      ],
      default: "pièce",
    },

    uniteAchat: {
      type: String,
      enum: [
        "pièce",
        "unité",
        "kg",
        "g",
        "mg",
        "L",
        "mL",
        "boîte",
        "paquet",
        "carton",
        "sachet",
        "bouteille",
        "barquette",
        "palette",
        "mètre",
        "cm",
      ],
      default: "pièce",
    },

    fournisseur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Fournisseur",
    },

    emplacement: {
      type: String,
      default: null,
    },

    poids: {
      type: Number,
      default: null,
    },

    actif: {
      type: Boolean,
      default: true,
    },

    composantes: [
      {
        produit: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Produit",
        },

        quantite: {
          type: Number,
          default: 1,
          min: 0,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// ======================================================
// 🔥 NORMALISATION AUTOMATIQUE
// ======================================================

produitSchema.pre("save", function () {
  switch (this.typeProduit) {
    // ==========================
    // SERVICE
    // ==========================
    case "service":
      this.stock = undefined;
      this.stockMin = undefined;
      this.emplacement = undefined;
      this.poids = undefined;
      this.composantes = [];
      break;

    // ==========================
    // PRODUCTION
    // ==========================
    case "production":
      this.stock = this.stock || 0;
      this.stockMin = this.stockMin || 0;
      break;

    // ==========================
    // PRODUIT FINI
    // ==========================
    case "Produit_Fini":
      this.composantes = [];
      break;

    default:
      break;
  }
});

export default mongoose.model("Produit", produitSchema);