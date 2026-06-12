// controllers/livraison.controller.js
import Livraison from "./livraison.model.js";
import Commande from "../commande/commande.model.js";
import BonLivraison from "../bonLivraison/bonLivraison.model.js";
import { createBonLivraison } from "../bonLivraison/bonLivraison.controller.js";
import Client from "../clients/client.model.js";
import Facture from "../facture/facture.model.js";
import { generateBonLivraisonPDF, envoyerBonLivraisonParEmail } from "../Pdfs/BonLivraison.js";
import { generateFacturePDF, envoyerFactureParEmail } from "../Pdfs/Facture.js";
import { createPaiementFromFacture } from "../paiement/paiement.controller.js";
import { updateDetteClient } from "../DetteClient/DetteClient.service.js";

const generateReference = async (model, prefix) => {
  try {
    const last = await model.findOne({ reference: { $ne: null } }).sort({ reference: -1 }).select("reference");
    let nextNumber = 1;
    if (last?.reference) {
      const match = last.reference.match(/\d+$/);
      if (match) nextNumber = parseInt(match[0]) + 1;
    }
    return `${prefix}-${String(nextNumber).padStart(4, "0")}`;
  } catch (error) {
    console.error("❌ Erreur génération référence:", error);
    throw error;
  }
};

// ===================== CRUD STANDARD =====================
export const getLivraisons = async (req, res, next) => {
  try {
    const data = await Livraison.find().populate("commande").populate("client").populate("produits.produit");
    res.json(data);
  } catch (err) { next(err); }
};

export const getLivraisonById = async (req, res, next) => {
  try {
    const data = await Livraison.findById(req.params.id)
      .populate("commande")
      .populate("client")
      .populate("produits.produit")
      .populate("historiqueLivraisons.chauffeur")   // ✅ Ajout
      .populate("historiqueLivraisons.vehicule");   // ✅ Ajout

    if (!data) return res.status(404).json({ message: "Livraison introuvable" });
    res.json(data);
  } catch (err) { next(err); }
};
export const updateLivraison = async (req, res, next) => {
  try {
    const { produitsLivres, dateLivraison } = req.body;
    const livraison = await Livraison.findById(req.params.id).populate("commande").populate("produits.produit");
    if (!livraison) return res.status(404).json({ message: "Livraison introuvable" });

    const commande = await Commande.findById(livraison.commande._id);
    let totalComplet = true;

    livraison.produits = livraison.produits.map((p) => {
      const found = produitsLivres?.find((pl) => pl.produit === p.produit._id.toString());
      if (!found) {
        totalComplet = false;
        return p;
      }
      const reste = p.quantiteCommandee - found.quantiteLivree;
      if (reste > 0) totalComplet = false;
      return { ...p._doc, quantiteCommandee: p.quantiteCommandee, quantiteLivree: found.quantiteLivree };
    });

    livraison.dateLivraison = dateLivraison || new Date();
    livraison.statut = totalComplet ? "livree" : "livree_partiellement";
    commande.statut = livraison.statut;

    await livraison.save();
    await commande.save();
    res.json({ message: "Livraison mise à jour", livraison });
  } catch (err) { next(err); }
};

export const deleteLivraison = async (req, res, next) => {
  try {
    const data = await Livraison.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ message: "Livraison introuvable" });
    res.json({ message: "Livraison supprimée" });
  } catch (err) { next(err); }
};

export const getBonLivraisonFromLivraison = async (req, res, next) => {
  try {
    const livraison = await Livraison.findById(req.params.id).populate("produits.produit").populate("client");
    if (!livraison) return res.status(404).json({ message: "Livraison introuvable" });
    let bl = await BonLivraison.findOne({ livraison: livraison._id });
    if (!bl) {
      const produitsLivres = livraison.produits.map((p) => ({ produit: p.produit._id, quantite: p.quantiteLivree || 0 }));
      const livraisonData = { ...livraison.toObject(), produitsLivres };
      bl = await createBonLivraison(livraisonData);
    }
    res.json(bl);
  } catch (err) { next(err); }
};

// ===================== CRÉATION FACTURE (GÉNÉRIQUE) =====================
// =========================
// CREATE FACTURE FROM LIVRAISON
// =========================

export const createFactureFromLivraison = async (
  livraison,
  produitsFactures,
  etapeLivraisonId
) => {
  try {
    // =========================
    // CHECK DUPLICATE
    // =========================

    const existing = await Facture.findOne({
      etapeLivraison: etapeLivraisonId,
      typeFacture: "facture",
    });

    if (existing) {
      return {
        facture: existing,
        emailEnvoye: false,
      };
    }

    // =========================
    // CLIENT
    // =========================

    let clientDoc = livraison.client;

    if (
      typeof clientDoc === "string" ||
      clientDoc?._id
    ) {
      clientDoc = await Client.findById(
        clientDoc._id || clientDoc
      );
    }

    if (!clientDoc) {
      throw new Error("Client introuvable");
    }

    // =========================
    // REFERENCE FACTURE
    // =========================

    const referenceFacture =
      await generateReference(
        Facture,
        "FAC"
      );

    // =========================
    // CALCULS
    // =========================

    let sousTotal = 0;
    let taxe = 0;

    const produits = [];

    for (const p of produitsFactures) {
      const produit = p.produit;

      const quantite = Number(
        p.quantite || 0
      );

      const prixUnitaire = Number(
        produit.prixVente || 0
      );

      const totalLigne =
        quantite * prixUnitaire;

      const tauxTVA =
        produit.tauxTVA || 20;

      const montantTVA =
        (totalLigne * tauxTVA) / 100;

      sousTotal += totalLigne;

      taxe += montantTVA;

      produits.push({
        produit: produit._id,

        nom:
          produit.designation ||
          produit.nom,

        quantite,

        prixUnitaire,

        totalLigne,
      });
    }

    const totalTTC = sousTotal + taxe;

    // =========================
    // DATE ECHEANCE
    // =========================

    let dateEcheance = null;

    if (
      clientDoc.conditionPaiement
        ?.duree
    ) {
      dateEcheance = new Date();

      dateEcheance.setDate(
        dateEcheance.getDate() +
          clientDoc
            .conditionPaiement
            .duree
      );
    }

    // =========================
    // CREATION FACTURE
    // =========================

    const facture = await Facture.create({
      reference: referenceFacture,

      typeFacture: "facture",

      client: clientDoc._id,

      commande:
        livraison.commande?._id ||
        null,

      livraison: livraison._id,

      etapeLivraison:
        etapeLivraisonId,

      produits,

      sousTotal,

      taxe,

      totalTTC,

      montantARegler: totalTTC,

      montantPaye: 0,

      resteAPayer: totalTTC,

      statutPaiement:
        "non_paye",

      statut: "brouillon",

      dateFacture: new Date(),

      dateEcheance,

      emailEnvoye: false,
    });

    // =========================
    // LIAISON LIVRAISON
    // =========================

    if (!livraison.factures) {
      livraison.factures = [];
    }

    livraison.factures.push(
      facture._id
    );

    await livraison.save();

    // =========================
    // UPDATE DETTE CLIENT - FACTURE CRÉÉE
    // =========================
    try {
      await updateDetteClient({
        clientId: clientDoc._id,
        typeOperation: "facture",
        montant: totalTTC,
        reference: facture.reference,
        factureId: facture._id,
        remarque: `Facture créée depuis livraison ${livraison.reference}`,
      });
    } catch (detteError) {
      console.warn("⚠️ Erreur sync DetteClient (createFactureFromLivraison):", detteError.message);
    }

    // =========================
    // CREATION PAIEMENT AUTO
    // =========================

    const paiement =
      await createPaiementFromFacture(
        facture._id
      );

    // =========================
    // LIER PAIEMENT
    // =========================

    if (paiement?._id) {
      facture.paiements.push(
        paiement._id
      );

      await facture.save();
    }

    console.log(
      `✅ Paiement créé pour facture ${facture.reference}`
    );

    // =========================
    // ENVOI EMAIL FACTURE
    // =========================

    let emailEnvoye = false;

    try {
      if (clientDoc.email) {
        const pdfBuffer =
          await generateFacturePDF(
            facture._id
          );

        await envoyerFactureParEmail(
          clientDoc.email,
          pdfBuffer,
          facture.reference
        );

        emailEnvoye = true;

        facture.emailEnvoye = true;

        facture.dateEnvoiEmail =
          new Date();

        facture.statut = "envoyee";

        await facture.save();

        console.log(
          `📧 Facture ${facture.reference} envoyée à ${clientDoc.email}`
        );
      } else {
        console.warn(
          `⚠️ Client ${clientDoc._id} sans email`
        );
      }
    } catch (emailErr) {
      console.error(
        `❌ Erreur envoi facture ${facture.reference}:`,
        emailErr.message
      );
    }

    // =========================
    // RESPONSE
    // =========================

    return {
      facture,
      paiement,
      emailEnvoye,
    };
  } catch (error) {
    console.error(
      "createFactureFromLivraison error:",
      error
    );

    throw error;
  }
};
// ===================== APPLIQUER LIVRAISON =====================
// =========================
// APPLIQUER LIVRAISON
// =========================

export const appliquerLivraison = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;

    const {
      produitsLivres,
      dateLivraison,
      vehicule,
      chauffeur,
      withFacture = false,
      remarque,
    } = req.body;

    // =========================
    // VALIDATIONS
    // =========================

    if (!produitsLivres?.length) {
      return res.status(400).json({
        message:
          "La liste des produits livrés est requise",
      });
    }

    if (!vehicule || !chauffeur) {
      return res.status(400).json({
        message:
          "Véhicule et chauffeur sont obligatoires",
      });
    }

    // =========================
    // RECUPERATION LIVRAISON
    // =========================

    const livraison =
      await Livraison.findById(id)
        .populate("commande")
        .populate("client")
        .populate(
          "produits.produit"
        );

    if (!livraison) {
      return res.status(404).json({
        message:
          "Livraison introuvable",
      });
    }

    if (
      ["livree", "annulee"].includes(
        livraison.statut
      )
    ) {
      return res.status(400).json({
        message:
          "Action impossible sur une livraison terminée",
      });
    }

    // =========================
    // UPDATE QUANTITES
    // =========================

    let isComplete = true;

    livraison.produits =
      livraison.produits.map(
        (p) => {
          const found =
            produitsLivres.find(
              (pl) =>
                pl.produit ===
                (
                  p.produit?._id ||
                  p.produit
                ).toString()
            );

          if (!found) {
            if (
              (p.quantiteLivree ||
                0) <
              p.quantiteCommandee
            ) {
              isComplete = false;
            }

            return {
              ...p.toObject(),
              quantiteLivree:
                p.quantiteLivree ||
                0,
            };
          }

          const addition =
            Number(
              found.quantiteLivree ||
                0
            );

          const nouvelleQuantite =
            (p.quantiteLivree ||
              0) + addition;

          const quantiteLivree =
            Math.min(
              nouvelleQuantite,
              p.quantiteCommandee
            );

          if (
            quantiteLivree <
            p.quantiteCommandee
          ) {
            isComplete = false;
          }

          return {
            ...p.toObject(),
            quantiteLivree,
          };
        }
      );

    // =========================
    // UPDATE LIVRAISON
    // =========================

    livraison.dateLivraison =
      dateLivraison ||
      new Date();

    livraison.vehicule =
      vehicule;

    livraison.chauffeur =
      chauffeur;

    livraison.withFacture =
      withFacture;

    livraison.statut =
      isComplete
        ? "livree"
        : "livree_partiellement";

    // =========================
    // CONSTRUCTION PRODUITS BL
    // =========================

    let totalHT = 0;

    const produitsLivresPourBL =
      produitsLivres
        .map((item) => {
          const produitDoc =
            livraison.produits.find(
              (p) =>
                (
                  p.produit._id ||
                  p.produit
                ).toString() ===
                item.produit
            )?.produit;

          if (!produitDoc)
            return null;

          const quantite =
            Number(
              item.quantiteLivree
            );

          const prixUnitaire =
            produitDoc.prixVente ||
            0;

          const totalLigne =
            quantite *
            prixUnitaire;

          totalHT += totalLigne;

          return {
            produit:
              produitDoc._id,

            quantite,

            prixUnitaire,

            totalLigne,
          };
        })
        .filter(Boolean);

    if (
      !produitsLivresPourBL.length
    ) {
      return res.status(400).json({
        message:
          "Aucun produit valide à livrer",
      });
    }

    // =========================
    // CREATION BL
    // =========================

    const referenceBL =
      await generateReference(
        BonLivraison,
        "BL"
      );

    const bonLivraison =
      await BonLivraison.create({
        reference: referenceBL,

        livraison:
          livraison._id,

        commande:
          livraison.commande
            ?._id,

        client:
          livraison.client._id,

        chauffeur,

        vehicule,

        produitsLivres:
          produitsLivresPourBL,

        totalHT,

        dateEmission:
          new Date(),

        dateLivraison:
          livraison.dateLivraison,

        statut: "genere",
      });

    // =========================
    // HISTORIQUE
    // =========================

    livraison.historiqueLivraisons.push(
      {
        chauffeur,

        vehicule,

        produitsLivres:
          produitsLivres.map(
            (p) => ({
              produit:
                p.produit,

              quantiteLivree:
                Number(
                  p.quantiteLivree
                ),
            })
          ),

        dateLivraison:
          livraison.dateLivraison,

        remarque:
          remarque || "",

        bonLivraisonUrl:
          bonLivraison.pdfUrl ||
          `/api/bonlivraisons/${bonLivraison._id}/pdf`,
      }
    );

    // =========================
    // SAVE LIVRAISON
    // =========================

    await livraison.save();

    // =========================
    // ETAPE LIVRAISON
    // =========================

    const etapeLivraisonId =
      livraison
        .historiqueLivraisons.at(
          -1
        )._id;

    // =========================
    // UPDATE COMMANDE
    // =========================

    if (
      livraison.commande?._id
    ) {
      await Commande.findByIdAndUpdate(
        livraison.commande._id,
        {
          statut:
            livraison.statut,
        }
      );
    }

    // =========================
    // EMAIL BL
    // =========================

    let emailEnvoye = false;

    const client =
      await Client.findById(
        livraison.client._id
      );

    if (client?.email) {
      try {
        const pdfBLBuffer =
          await generateBonLivraisonPDF(
            bonLivraison._id
          );

        await envoyerBonLivraisonParEmail(
          client.email,
          pdfBLBuffer,
          referenceBL
        );

        emailEnvoye = true;

        await BonLivraison.findByIdAndUpdate(
          bonLivraison._id,
          {
            statut: "envoye",
          }
        );
      } catch (err) {
        console.error(
          "Erreur email BL:",
          err.message
        );
      }
    }

    // =========================
    // FACTURATION
    // =========================

    let facture = null;

    let paiement = null;

    let factureEmailEnvoye =
      false;

    // =========================
    // FACTURE PAR ETAPE
    // =========================

    if (withFacture) {
      const produitsFactures =
        produitsLivres
          .map((item) => {
            const produitDoc =
              livraison.produits.find(
                (p) =>
                  (
                    p.produit._id ||
                    p.produit
                  ).toString() ===
                  item.produit
              )?.produit;

            if (!produitDoc)
              return null;

            return {
              produit:
                produitDoc,

              quantite:
                Number(
                  item.quantiteLivree
                ),
            };
          })
          .filter(Boolean);

      if (
        produitsFactures.length
      ) {
        try {
          const result =
            await createFactureFromLivraison(
              livraison,
              produitsFactures,
              etapeLivraisonId
            );

          facture =
            result.facture;

          paiement =
            result.paiement;

          factureEmailEnvoye =
            result.emailEnvoye;
        } catch (err) {
          console.error(
            "Erreur création facture:",
            err.message
          );
        }
      }
    }

    // =========================
    // FACTURE FINALE
    // =========================

    else if (isComplete) {
      const produitsFacturesFinal =
        livraison.produits
          .filter(
            (p) =>
              p.quantiteLivree >
              0
          )
          .map((p) => ({
            produit: p.produit,

            quantite:
              p.quantiteLivree,
          }));

      if (
        produitsFacturesFinal.length
      ) {
        try {
          const result =
            await createFactureFromLivraison(
              livraison,
              produitsFacturesFinal,
              etapeLivraisonId
            );

          facture =
            result.facture;

          paiement =
            result.paiement;

          factureEmailEnvoye =
            result.emailEnvoye;
        } catch (err) {
          console.error(
            "Erreur facture finale:",
            err.message
          );
        }
      }
    }

    // =========================
    // RESPONSE
    // =========================

    return res.status(200).json({
      message:
        "Livraison appliquée avec succès",

      statut:
        livraison.statut,

      livraison,

      bonLivraison,

      emailEnvoye,

      facture,

      paiement,

      factureEmailEnvoye,
    });
  } catch (err) {
    console.error(
      "appliquerLivraison error:",
      err
    );

    next(err);
  }
};