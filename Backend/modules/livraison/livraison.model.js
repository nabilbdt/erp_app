import mongoose from "mongoose";

const livraisonSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      unique: true,
      sparse: true,
    },

    commande: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Commande",
      required: true,
    },

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },

    chauffeur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chauffeur",
      default: null,
    },

    vehicule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicule",
      default: null,
    },

    dateLivraison: {
      type: Date,
      default: null,
    },

    statut: {
      type: String,
      enum: [
        "planifiee",
        "en_cours",
        "en_route",
        "livree_partiellement",
        "livree",
        "annulee",
      ],
      default: "planifiee",
    },

    produits: [
      {
        produit: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Produit",
          required: true,
        },

        quantiteCommandee: {
          type: Number,
          required: true,
          min: 1,
        },

        quantiteLivree: {
          type: Number,
          default: 0,
        },
      },
    ],

    // =========================
    // HISTORIQUE LIVRAISONS (SIMPLE comme paiement)
    // =========================
    historiqueLivraisons: [
      {
        chauffeur: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Chauffeur",
        },

        vehicule: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Vehicule",
        },

        produitsLivres: [
          {
            produit: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Produit",
            },

            quantiteLivree: Number,
          },
        ],

        dateLivraison: {
          type: Date,
          default: Date.now,
        },

        remarque: {
          type: String,
          default: "",
        },

        bonLivraisonUrl: {
          type: String,
          default: "",
        },
      },
    ],

    withFacture: {
      type: Boolean,
      default: false,
    },

    adresseLivraison: {
      type: String,
      trim: true,
    },

    remarque: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Livraison", livraisonSchema);