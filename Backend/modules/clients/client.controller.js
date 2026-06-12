import Client from "./client.model.js";
import Commande from "../commande/commande.model.js";
import Devis from "../devis/devi.model.js";
import Facture from "../facture/facture.model.js";
import DetteClient from "../DetteClient/DetteClient.model.js";

/* =========================
   CREATE CLIENT + DETTE CLIENT AUTO
========================= */
export const createClient = async (req, res) => {
  try {
    // =========================
    // CREATION CLIENT
    // =========================

    const client = await Client.create({
      reference: req.body.reference,
      type: req.body.type,
      nom: req.body.nom,
      raisonSociale: req.body.raisonSociale,
      email: req.body.email,
      telephone: req.body.telephone,

      siege: req.body.siege,

      adresses: req.body.adresses || [],

      ice: req.body.ice,
      if: req.body.if,
      rc: req.body.rc,

      conditionPaiement: req.body.conditionPaiement,

      plafondCredit:
        req.body.plafondCredit || 0,

      note: req.body.note || "",
    });

    // =========================
    // CREATION DETTE CLIENT
    // =========================

    const detteClient =
      await DetteClient.create({
        client: client._id,

        plafondCredit:
          req.body.plafondCredit || 0,

        totalFactures: 0,
        totalPaiements: 0,
        totalAvoirs: 0,
        totalRemboursements: 0,

        soldeActuel: 0,

        creditDisponible: 0,

        statutCompte: "solde",

        mouvements: [],
      });

    // =========================
    // LIAISON CLIENT -> DETTE
    // =========================

    client.detteClient =
      detteClient._id;

    await client.save();

    // =========================
    // RESPONSE
    // =========================

    res.status(201).json({
      success: true,

      message:
        "Client et compte dette créés avec succès",

      client,

      detteClient,
    });

  } catch (error) {

    console.error(
      "Erreur création client :",
      error
    );

    res.status(400).json({
      success: false,

      message:
        "Erreur lors de la création du client",

      error: error.message,
    });
  }
};
/* =========================
   GET ALL
========================= */
export const getClients = async (req, res) => {
  try {
    const data = await Client.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   GET ONE
========================= */
export const getClient = async (req, res) => {
  try {
    const data = await Client.findById(req.params.id);

    if (!data) {
      return res.status(404).json({ message: "Client introuvable" });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   UPDATE
========================= */
export const updateClient = async (req, res) => {
  try {
    const data = await Client.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!data) {
      return res.status(404).json({ message: "Client introuvable" });
    }

    res.json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/* =========================
   DELETE
========================= */
export const deleteClient = async (req, res) => {
  try {
    const data = await Client.findByIdAndDelete(req.params.id);

    if (!data) {
      return res.status(404).json({ message: "Client introuvable" });
    }

    res.json({ message: "Client supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   📦 COMMANDES DU CLIENT (CORRIGÉ)
========================= */
export const getClientCommandes = async (req, res) => {
  try {
    let commandes = await Commande.find({
      client: req.params.id,
    })
      .populate("produits.produit")
      .populate("devis")
      .sort({ createdAt: -1 });

    // Enrichir les données avec les informations du produit
    commandes = commandes.map(cmd => {
      const cmdObj = cmd.toObject();
      cmdObj.produits = cmd.produits.map(prod => {
        const produitObj = prod.produit && typeof prod.produit === "object" ? prod.produit : {};
        
        // Extraire la désignation - utiliser d'abord les données enrichies du produit
        const designation = produitObj.designation || produitObj.nom || prod.designation || "Produit sans nom";
        
        return {
          produit: produitObj._id || prod.produit,
          designation: designation,
          nom: produitObj.nom || prod.nom,
          quantite: prod.quantite || 0,
          prixHT: prod.prixHT || produitObj.prixHT || 0,
          prixTTC: prod.prixTTC || (prod.prixHT && prod.tauxTVA ? prod.prixHT * (1 + prod.tauxTVA / 100) : produitObj.prixTTC || produitObj.prixVente || 0),
          tauxTVA: prod.tauxTVA || produitObj.tauxTVA || 20,
          total: prod.prixTTC ? prod.prixTTC * prod.quantite : (prod.prixHT ? prod.prixHT * (1 + (prod.tauxTVA || 20) / 100) * prod.quantite : 0),
          reference: produitObj.reference || prod.reference || ""
        };
      });
      return cmdObj;
    });

    res.json(commandes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   📄 DEVIS DU CLIENT (CORRIGÉ)
========================= */
export const getClientDevis = async (req, res) => {
  try {
    let devis = await Devis.find({
      client: req.params.id,
    })
      .populate("produits.produit")
      .sort({ createdAt: -1 });

    // Enrichir les données avec les informations du produit
    devis = devis.map(d => {
      const devisObj = d.toObject();
      devisObj.produits = d.produits.map(prod => {
        const produitObj = prod.produit && typeof prod.produit === "object" ? prod.produit : {};
        
        // Extraire la désignation - utiliser d'abord les données enrichies du produit
        const designation = produitObj.designation || produitObj.nom || prod.designation || "Produit sans nom";
        
        return {
          produit: produitObj._id || prod.produit,
          designation: designation,
          nom: produitObj.nom || prod.nom,
          quantite: prod.quantite || 0,
          prixHT: prod.prixHT || produitObj.prixHT || 0,
          prixTTC: prod.prixTTC || (prod.prixHT && prod.tauxTVA ? prod.prixHT * (1 + prod.tauxTVA / 100) : produitObj.prixTTC || produitObj.prixVente || 0),
          tauxTVA: prod.tauxTVA || produitObj.tauxTVA || 20,
          total: prod.total || (prod.prixTTC ? prod.prixTTC * prod.quantite : (prod.prixHT ? prod.prixHT * (1 + (prod.tauxTVA || 20) / 100) * prod.quantite : 0)),
          reference: produitObj.reference || prod.reference || ""
        };
      });
      return devisObj;
    });

    res.json(devis);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   💰 FACTURES DU CLIENT
========================= */
export const getClientFactures = async (req, res) => {
  try {
    const factures = await Facture.find({
      client: req.params.id,
    })
      .populate("commande")
      .sort({ createdAt: -1 });

    res.json(factures);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   📊 DASHBOARD CLIENT (BONUS PRO)
========================= */
export const getClientDashboard = async (req, res) => {
  try {
    const clientId = req.params.id;

    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ message: "Client introuvable" });
    }

    const [commandes, devis, factures] = await Promise.all([
      Commande.find({ client: clientId }),
      Devis.find({ client: clientId }),
      Facture.find({ client: clientId }),
    ]);

    // =========================
    // 📦 STATS COMMANDES (ADAPTÉ AU MODEL)
    // =========================
    const commandesEnCours = commandes.filter(c => c.statut === "en_cours").length;
    const commandesConfirmees = commandes.filter(c => c.statut === "confirme").length;
    const commandesLivrees = commandes.filter(c => c.statut === "livree").length;
    const commandesPartielles = commandes.filter(c => c.statut === "livree_partiellement").length;
    const commandesAnnulees = commandes.filter(c => c.statut === "annulee").length;

    // =========================
    // 📄 STATS DEVIS (BONUS 🔥)
    // =========================
    const devisEnAttente = devis.filter(d => d.statut === "en_attente").length;
    const devisAcceptes = devis.filter(d => d.statut === "accepte").length;
    const devisRefuses = devis.filter(d => d.statut === "refuse").length;
    const devisEnvoyes = devis.filter(d => d.statut === "envoye").length;

    // =========================
    // 💰 CALCULS FINANCIERS
    // =========================
    const totalCA = factures.reduce((acc, f) => acc + (f.totalTTC || 0), 0);
    const totalPaye = factures.reduce((acc, f) => acc + (f.montantPaye || 0), 0);
    const resteAPayer = factures.reduce((acc, f) => acc + (f.resteAPayer || 0), 0);

    res.json({
      client,
      stats: {
        // GLOBAL
        totalCommandes: commandes.length,
        totalDevis: devis.length,
        totalFactures: factures.length,

        // 📦 COMMANDES
        commandes: {
          enCours: commandesEnCours,
          confirmees: commandesConfirmees,
          livrees: commandesLivrees,
          partielles: commandesPartielles,
          annulees: commandesAnnulees,
        },

        // 📄 DEVIS
        devis: {
          enAttente: devisEnAttente,
          acceptes: devisAcceptes,
          refuses: devisRefuses,
          envoyes: devisEnvoyes,
        },

        // 💰 FINANCE
        totalCA,
        totalPaye,
        resteAPayer,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};