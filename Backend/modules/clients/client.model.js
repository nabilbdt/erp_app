import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      unique: true,
      required: true,
    },

    // =========================
    // TYPE CLIENT
    // =========================
    type: {
      type: String,
      enum: ["particulier", "entreprise"],
      default: "particulier",
    },

    // =========================
    // INFOS PRINCIPALES
    // =========================
    nom: {
      type: String,
      required: true,
      trim: true,
    },

    raisonSociale: {
      type: String,
      trim: true,
      default: "",
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      required: true,
      match: [/^\S+@\S+\.\S+$/, "Email invalide"],
    },

    telephone: {
      type: String,
      trim: true,
      required: true,
    },

    // =========================
    // STATUT CLIENT
    // =========================
    statut: {
      type: String,
      enum: ["actif", "bloque", "archive"],
      default: "actif",
    },

    // =========================
    // SIÈGE SOCIAL
    // =========================
    siege: {
      rue: String,
      ville: String,
      codePostal: String,
      pays: {
        type: String,
        default: "Maroc",
      },
    },

    // =========================
    // MULTI-ADRESSES
    // =========================
    adresses: [
      {
        type: {
          type: String,
          enum: ["facturation", "livraison", "autre"],
          default: "livraison",
        },

        rue: String,
        ville: String,
        codePostal: String,

        pays: {
          type: String,
          default: "Maroc",
        },

        principale: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // =========================
    // INFOS LÉGALES
    // =========================
    ice: {
      type: String,
      default: "",
    },

    if: {
      type: String,
      default: "",
    },

    rc: {
      type: String,
      default: "",
    },

    // =========================
    // CONDITIONS PAIEMENT
    // =========================
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
        nomBanque: {
          type: String,
          trim: true,
          default: "",
        },

        rib: {
          type: String,
          trim: true,
          default: "",
        },

        iban: {
          type: String,
          trim: true,
          default: "",
        },

        swift: {
          type: String,
          trim: true,
          default: "",
        },
      },
    },

    // =========================
    // DETTE CLIENT
    // =========================

    detteClient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DetteClient",
      default: null,
    },

    // =========================
    // LIMITES FINANCIERES
    // =========================

    plafondCredit: {
      type: Number,
      default: 0,
      min: 0,
    },

    // =========================
    // HISTORIQUES
    // =========================

    commandes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Commande",
      },
    ],

    devis: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Devis",
      },
    ],

    note: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Client", clientSchema);