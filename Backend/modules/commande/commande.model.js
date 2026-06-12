import mongoose from "mongoose";

const commandeSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      unique: true,
      required: true,
    },

    devis: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Devis",
      default: null,
    },

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },

    produits: [
      {
        produit: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Produit",
        },
        quantite: {
          type: Number,
          default: 1,
        },
        prixHT: {
          type: Number,
          default: 0,
        },
        prixTTC: {
          type: Number,
          default: 0,
        },
        tauxTVA: {
          type: Number,
          default: 20,
        },
        totalLigneHT: {
          type: Number,
          default: 0,
        },
        montantTVA: {
          type: Number,
          default: 0,
        },
        totalLigneTTC: {
          type: Number,
          default: 0,
        },
      },
    ],

    montantTotal: {
      type: Number,
      default: 0,
    },

    statut: {
      type: String,
      enum: [
        "en_cours",
        "confirme",
        "livree",
        "livree_partiellement",
        "annulee",
        "accepte",
      ],
      default: "en_cours",
    },
  },
  {
    timestamps: true,
  }
);

// ======================================================
// 🔥 CALCUL AUTOMATIQUE DES PRIX + TOTAL (CORRIGÉ)
// ======================================================
commandeSchema.pre("save", async function () {
  let totalGeneral = 0;

  for (let i = 0; i < this.produits.length; i++) {
    const item = this.produits[i];
    const tauxTVA = Number(item.tauxTVA || 20);
    let prixHT = Number(item.prixHT || 0);
    let prixTTC = Number(item.prixTTC || 0);
    const quantite = Number(item.quantite || 0);

    // Calcul HT à partir du TTC si HT manquant
    if ((!prixHT || prixHT === 0) && prixTTC > 0) {
      prixHT = Number((prixTTC / (1 + tauxTVA / 100)).toFixed(2));
    }
    // Calcul TTC à partir du HT si TTC manquant
    if ((!prixTTC || prixTTC === 0) && prixHT > 0) {
      prixTTC = Number((prixHT * (1 + tauxTVA / 100)).toFixed(2));
    }

    const totalLigneHT = Number((prixHT * quantite).toFixed(2));
    const montantTVA = Number((totalLigneHT * (tauxTVA / 100)).toFixed(2));
    const totalLigneTTC = Number((prixTTC * quantite).toFixed(2));

    // Mise à jour directe des champs
    item.prixHT = prixHT;
    item.prixTTC = prixTTC;
    item.totalLigneHT = totalLigneHT;
    item.montantTVA = montantTVA;
    item.totalLigneTTC = totalLigneTTC;

    totalGeneral += totalLigneTTC;
  }

  this.montantTotal = Number(totalGeneral.toFixed(2));

  // ✅ FORCE la détection des modifications sur les sous-documents
  this.markModified("produits");
});

export default mongoose.model("Commande", commandeSchema);