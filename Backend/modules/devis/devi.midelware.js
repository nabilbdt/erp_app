import Produit from "../produits/produit.model.js";
import { getTransporter } from "../services/mailService.js";
import { generateDevisPDF } from "../Pdfs/Devis.js";

// =========================
// 🌐 HELPERS
// =========================
const getBaseUrl = () => {
  const base = process.env.BASE_URL || "http://localhost:5000";
  return base.replace(/\/+$/, "");
};

const buildActionUrl = (id, action) => {
  return `${getBaseUrl()}/api/devis/${id}/${action}`;
};

// =========================
// 🔥 CALCUL + SNAPSHOT
// =========================
export const calculerMontantDevis = async function () {
  let totalGlobal = 0;

  for (let item of this.produits) {
    const produit = await Produit.findById(item.produit);
    if (!produit) continue;

    const prixHT = produit.prixVente;
    const tva = produit.tauxTVA || 0;
    const prixTTC = prixHT + (prixHT * tva) / 100;

    item.prixHT = prixHT;
    item.tauxTVA = tva;
    item.prixTTC = prixTTC;
    item.total = item.quantite * prixTTC;

    totalGlobal += item.total;
  }

  this.montantTotal = totalGlobal;
};

// =========================
// 📅 GESTION DATES
// =========================
export const applyDevisDates = function () {
  // expiration +20 jours
  if (!this.dateExpiration) {
    const now = new Date();
    this.dateExpiration = new Date(now.setDate(now.getDate() + 20));
  }

  // acceptation
  if (this.statut === "accepte" && !this.dateAcceptation) {
    this.dateAcceptation = new Date();
  }
};

// =========================
// 🔄 UPDATE HANDLER
// =========================
export const handleDevisUpdate = function (update) {
  if (!update) return update;

  if (update.statut === "accepte") {
    update.dateAcceptation = new Date();
  }

  if (!update.dateExpiration) {
    const now = new Date();
    update.dateExpiration = new Date(now.setDate(now.getDate() + 20));
  }

  return update;
};

// =========================
// 📩 EMAIL CLIENT
// =========================
export const envoyerDevisParEmail = async (doc) => {
  const devis = await doc.populate("client");

  if (!devis.client?.email) {
    throw new Error("Client sans email");
  }

  const pdfBuffer = await generateDevisPDF(devis);
  const transporter = getTransporter();

  const acceptUrl = buildActionUrl(devis._id, "accept");
  const refuseUrl = buildActionUrl(devis._id, "refuse");
  const negocierUrl = buildActionUrl(devis._id, "negocier");

  await transporter.sendMail({
    from: `"ERP" <${process.env.EMAIL_USER}>`,
    to: devis.client.email,
    subject: `Devis ${devis.reference}`,
    html: `
      <h2>Devis ${devis.reference}</h2>
      <a href="${acceptUrl}">Accepter</a><br/>
      <a href="${refuseUrl}">Refuser</a><br/>
      <a href="${negocierUrl}">Négocier</a>
    `,
    attachments: [
      {
        filename: `devis-${devis.reference}.pdf`,
        content: pdfBuffer,
      },
    ],
  });

  // 🔥 statut envoye
  await doc.model("Devis").findByIdAndUpdate(doc._id, {
    statut: "envoye",
  });
};

// =========================
// 🏢 EMAIL NEGOCIATION
// =========================
export const envoyerEmailEntrepriseNegociation = async (devis) => {
  const transporter = getTransporter();

  const emailEntreprise =
    devis?.client?.entreprise?.email ||
    process.env.ENTREPRISE_EMAIL;

  await transporter.sendMail({
    from: `"ERP" <${process.env.EMAIL_USER}>`,
    to: emailEntreprise,
    subject: `Négociation devis ${devis.reference}`,
    html: `<p>${devis.client.nom} demande une négociation</p>`,
  });
};