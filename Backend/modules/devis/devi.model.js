import mongoose from "mongoose";
import {
  calculerMontantDevis,
  applyDevisDates,
  handleDevisUpdate
} from "./devi.midelware.js";
import { creerCommandeDepuisDevis } from "../commande/commande.controller.js";
const devisSchema = new mongoose.Schema(
  {
    reference: { type: String, unique: true },

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },

    produits: [
      {
        produit: { type: mongoose.Schema.Types.ObjectId, ref: "Produit" },
        quantite: Number,
        prixHT: Number,
        prixTTC: Number,
        tauxTVA: Number,
        total: Number,
      },
    ],

    montantTotal: Number,

    statut: {
      type: String,
      enum: ["en_attente", "envoye", "accepte", "refuse", "a_negocier"],
      default: "en_attente",
    },

    dateExpiration: Date,
    dateAcceptation: Date,
  },
  { timestamps: true }
);

// 🔥 SAVE
devisSchema.pre("save", async function () {
  await calculerMontantDevis.call(this);
  applyDevisDates.call(this);
});

// 🔥 UPDATE
devisSchema.pre("findOneAndUpdate", function () {
  let update = this.getUpdate();
  update = handleDevisUpdate(update);
  this.setUpdate(update);
});

// 🔥 POST SAVE
devisSchema.post("save", async function () {
  if (this.statut === "accepte") {
    await creerCommandeDepuisDevis(this);
  }
});

// 🔥 POST UPDATE
devisSchema.post("findOneAndUpdate", async function (doc) {
  if (doc?.statut === "accepte") {
    await creerCommandeDepuisDevis(doc);
  }
});

export default mongoose.model("Devis", devisSchema);