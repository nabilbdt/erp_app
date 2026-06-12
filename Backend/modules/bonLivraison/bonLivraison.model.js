import mongoose from "mongoose";

const bonLivraisonSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      unique: true,
      sparse: true,
    },

    livraison: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Livraison",
      required: true,
    },

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },

    // 🚚 snapshot logistique
    chauffeur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chauffeur",
      required: true,
    },

    vehicule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicule",
      required: true,
    },

    produitsLivres: [
      {
        produit: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Produit",
          required: true,
        },

        quantite: {
          type: Number,
          required: true,
          min: 1,
        },

        // 🔥 IMPORTANT : prix figé au moment de livraison
        prixUnitaire: {
          type: Number,
          required: true,
          min: 0,
        },

        // 💰 total ligne (optionnel mais pratique)
        totalLigne: {
          type: Number,
          default: 0,
        },
      },
    ],

    totalHT: {
      type: Number,
      default: 0,
    },

    dateEmission: {
      type: Date,
      default: Date.now,
    },

    dateLivraison: {
      type: Date,
      default: null,
    },

    statut: {
      type: String,
      enum: ["genere", "envoye", "livre"],
      default: "genere",
    },
  },
  { timestamps: true }
);

export default mongoose.model("BonLivraison", bonLivraisonSchema);