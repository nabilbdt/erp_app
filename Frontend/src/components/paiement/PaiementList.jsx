// components/paiement/PaiementList.jsx
import React from "react";
import { formatCurrency, formatDate } from "../../utils/format";

const PaiementList = ({ paiements, onEdit, onPay, onDelete }) => {
  const getStatutBadge = (statut) => {
    const classes = {
      non_paye: "bg-red-100 text-red-800",
      partiel: "bg-yellow-100 text-yellow-800",
      paye: "bg-green-100 text-green-800",
    };
    const labels = {
      non_paye: "Non payé",
      partiel: "Partiel",
      paye: "Payé",
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${classes[statut]}`}>
        {labels[statut]}
      </span>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border">
        <thead>
          <tr className="bg-gray-100 border-b">
            <th className="px-4 py-2 text-left">Référence</th>
            <th className="px-4 py-2 text-left">Client</th>
            <th className="px-4 py-2 text-left">Facture</th>
            <th className="px-4 py-2 text-right">Montant dû</th>
            <th className="px-4 py-2 text-right">Payé</th>
            <th className="px-4 py-2 text-right">Reste</th>
            <th className="px-4 py-2 text-left">Statut</th>
            <th className="px-4 py-2 text-left">Date prévue</th>
            <th className="px-4 py-2">Actions</th>
           </tr>
        </thead>
        <tbody>
          {paiements.map((p) => (
            <tr key={p._id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-2">{p.reference}</td>
              <td className="px-4 py-2">{p.client?.nom || "N/C"}</td>
              <td className="px-4 py-2">{p.facture?.reference || "N/C"}</td>
              <td className="px-4 py-2 text-right">{formatCurrency(p.montantAPayer)}</td>
              <td className="px-4 py-2 text-right">{formatCurrency(p.montantPaye)}</td>
              <td className="px-4 py-2 text-right">{formatCurrency(p.resteAPayer)}</td>
              <td className="px-4 py-2">{getStatutBadge(p.statut)}</td>
              <td className="px-4 py-2">{p.datePaiementPrevue ? formatDate(p.datePaiementPrevue) : "-"}</td>
              <td className="px-4 py-2 space-x-2">
                <button onClick={() => onEdit(p)} className="text-blue-600 hover:underline">Éditer</button>
                {p.statut !== "paye" && (
                  <button onClick={() => onPay(p)} className="text-green-600 hover:underline">Payer</button>
                )}
                <button onClick={() => onDelete(p._id)} className="text-red-600 hover:underline">Supprimer</button>
              </td>
            </tr>
          ))}
          {paiements.length === 0 && (
            <tr>
              <td colSpan="9" className="text-center py-4 text-gray-500">Aucun paiement trouvé</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PaiementList;