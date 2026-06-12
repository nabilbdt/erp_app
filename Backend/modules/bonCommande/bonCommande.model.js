import mongoose from "mongoose";

const bonCommandeSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      unique: true,
      required: true,
      trim: true,
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

    dateEmission: {
      type: Date,
      default: Date.now,
    },

    statut: {
      type: String,
      enum: ["genere", "envoye", "signe", "annule"],
      default: "genere",
    },

    fichierPDF: {
      type: String,
    },
  },
  { timestamps: true }
);

// 🔧 Middleware pour générer référence si manquante
bonCommandeSchema.pre("save", async function () {
  if (this.reference) return;

  try {
    const last = await mongoose
      .model("BonCommande")
      .findOne({ reference: { $ne: null } })
      .sort({ reference: -1 })
      .select("reference");

    let nextNumber = 1;
    if (last?.reference) {
      const match = last.reference.match(/\d+$/);
      if (match) nextNumber = parseInt(match[0]) + 1;
    }

    this.reference = `BC-${String(nextNumber).padStart(4, "0")}`;
  } catch (err) {
    console.error("Erreur génération référence BC:", err);
  }
});

export default mongoose.model("BonCommande", bonCommandeSchema);