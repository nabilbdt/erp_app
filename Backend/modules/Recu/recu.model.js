import mongoose from "mongoose";

const recuSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      required: true,
      unique: true,
    },

    paiement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Paiement",
      required: true,
    },

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },

    facture: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Facture",
      required: true,
    },

    pdfUrl: {
      type: String,
      default: "",
    },

    envoyeParEmail: {
      type: Boolean,
      default: false,
    },

    dateEnvoiEmail: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Recu", recuSchema);