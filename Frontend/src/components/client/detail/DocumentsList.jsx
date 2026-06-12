// components/client/DocumentsList.jsx
import React from "react";
import { Package, FileText, Receipt, Eye, ShoppingCart } from "lucide-react";

const StatusBadge = ({ status }) => {
  const statusConfig = {
    payée: "bg-green-100 text-green-700",
    impayée: "bg-red-100 text-red-700",
    en_attente: "bg-yellow-100 text-yellow-700",
    livrée: "bg-green-100 text-green-700",
    livree: "bg-green-100 text-green-700",
    en_cours: "bg-blue-100 text-blue-700",
    confirme: "bg-blue-100 text-blue-700",
    annulee: "bg-red-100 text-red-700",
    accepte: "bg-green-100 text-green-700",
    refuse: "bg-red-100 text-red-700",
    a_negocier: "bg-yellow-100 text-yellow-700",
    envoye: "bg-gray-100 text-gray-700",
  };
  const color = statusConfig[status] || "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${color}`}>
      {status}
    </span>
  );
};

const DocumentCard = ({ document, type, onView }) => {
  const icons = {
    commande: { icon: Package, color: "text-blue-500" },
    devis: { icon: FileText, color: "text-purple-500" },
    facture: { icon: Receipt, color: "text-green-500" },
  };
  const { icon: Icon, color } = icons[type] || icons.devis;

  const getProduits = () => {
    if (!document?.produits?.length) return [];

    return document.produits.map((prod) => {
      // Désignation : priorité à l'objet produit peuplé
      let designation = "Produit sans nom";
      if (prod.produit && typeof prod.produit === "object") {
        designation = prod.produit.designation || prod.produit.nom || designation;
      } else if (prod.designation) {
        designation = prod.designation;
      }

      const quantite = Number(prod.quantite) || 0;

      // PRIX UNITAIRE TTC
      let prixTTC = 0;
      if (prod.prixTTC !== undefined && prod.prixTTC !== null) {
        prixTTC = Number(prod.prixTTC);
      } else if (prod.prixHT !== undefined && prod.tauxTVA !== undefined) {
        prixTTC = Number(prod.prixHT) * (1 + Number(prod.tauxTVA) / 100);
      } else if (prod.produit && typeof prod.produit === "object") {
        if (prod.produit.prixTTC) prixTTC = Number(prod.produit.prixTTC);
        else if (prod.produit.prixVente) prixTTC = Number(prod.produit.prixVente);
        else if (prod.produit.prixHT && prod.produit.tauxTVA)
          prixTTC = Number(prod.produit.prixHT) * (1 + Number(prod.produit.tauxTVA) / 100);
      }
      prixTTC = prixTTC || 0;

      // TOTAL TTC
      let totalTTC = 0;
      if (prod.total !== undefined && prod.total !== null) {
        totalTTC = Number(prod.total);
      } else {
        totalTTC = quantite * prixTTC;
      }

      // TVA (affichage)
      let tva = 0;
      if (prod.tauxTVA !== undefined) tva = Number(prod.tauxTVA);
      else if (prod.produit?.tauxTVA) tva = Number(prod.produit.tauxTVA);

      return { designation, quantite, prixTTC, totalTTC, tva };
    });
  };

  const produits = getProduits();

  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      {/* En-tête */}
      <div className="bg-gray-50 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Icon size={20} className={color} />
          <div>
            <p className="font-semibold text-slate-800">
              {document.reference || "Sans référence"}
            </p>
            <p className="text-xs text-slate-500">
              {document.createdAt
                ? new Date(document.createdAt).toLocaleDateString()
                : "Date inconnue"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-slate-500">Montant total</p>
            <p className="font-bold text-slate-800">
              {(document.montantTotal || 0).toLocaleString()} DH
            </p>
          </div>
          <StatusBadge status={document.statut} />
          <button
            onClick={() => onView && onView(document)}
            className="rounded-lg p-2 text-slate-500 hover:bg-gray-200 transition"
          >
            <Eye size={18} />
          </button>
        </div>
      </div>

      {/* Tableau produits */}
      <div className="p-4 border-t border-gray-100">
        <p className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
          <ShoppingCart size={14} /> Produits ({produits.length})
        </p>

        {produits.length === 0 ? (
          <div className="text-center py-4 text-slate-400 text-sm">
            Aucun produit dans ce document
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left rounded-l-lg">Désignation</th>
                  <th className="px-3 py-2 text-center">Qté</th>
                  <th className="px-3 py-2 text-right">Prix U. TTC (DH)</th>
                  <th className="px-3 py-2 text-right">TVA (%)</th>
                  <th className="px-3 py-2 text-right rounded-r-lg">Total TTC (DH)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {produits.map((prod, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition">
                    <td className="px-3 py-2 font-medium text-slate-700">
                      {prod.designation}
                    </td>
                    <td className="px-3 py-2 text-center text-slate-600">
                      {prod.quantite}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-600">
                      {prod.prixTTC.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-600">
                      {prod.tva}%
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-800">
                      {prod.totalTTC.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan="4" className="px-3 py-2 text-right font-semibold text-slate-700">
                    Total général
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-slate-800">
                    {(document.montantTotal || 0).toLocaleString()} DH
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const DocumentsList = ({ documents, type, loading, onView }) => {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#e2f0d6] border-t-[#8bb56a]" />
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    const icons = {
      commande: <Package size={48} className="mx-auto mb-3 text-slate-300" />,
      devis: <FileText size={48} className="mx-auto mb-3 text-slate-300" />,
      facture: <Receipt size={48} className="mx-auto mb-3 text-slate-300" />,
    };
    const titles = {
      commande: "Aucune commande",
      devis: "Aucun devis",
      facture: "Aucune facture",
    };
    return (
      <div className="text-center py-12">
        {icons[type]}
        <p className="text-slate-500">{titles[type]}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {documents.map((document) => (
        <DocumentCard
          key={document._id}
          document={document}
          type={type}
          onView={onView}
        />
      ))}
    </div>
  );
};

export default DocumentsList;