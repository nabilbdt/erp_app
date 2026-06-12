// components/client/DocumentModal.jsx
import React from "react";
import { Package, FileText, Receipt, X, Download, Printer, ShoppingCart } from "lucide-react";

const StatusBadge = ({ status }) => {
  const statusConfig = {
    payée: "bg-green-100 text-green-700",
    impayée: "bg-red-100 text-red-700",
    en_attente: "bg-yellow-100 text-yellow-700",
    livrée: "bg-green-100 text-green-700",
    en_cours: "bg-blue-100 text-blue-700",
    accepté: "bg-green-100 text-green-700"
  };
  const color = statusConfig[status] || statusConfig.en_attente;
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${color}`}>{status}</span>;
};

const DocumentModal = ({ item, type, onClose }) => {
  if (!item) return null;

  const handleDownload = () => {
    const docContent = `
${type.toUpperCase()} - ${item.reference}
Date: ${new Date(item.date).toLocaleDateString()}
Montant HT: ${(item.montantHT || item.montant / 1.2 || 0).toLocaleString()} DH
TVA: ${(item.tva || item.montant - (item.montantHT || item.montant / 1.2) || 0).toLocaleString()} DH
Total TTC: ${(item.montant || 0).toLocaleString()} DH
Statut: ${item.statut}

--- PRODUITS ---
${item.produits?.map(p => `${p.nom || p.designation}: ${p.quantite} x ${p.prixUnitaire} DH = ${p.total} DH`).join('\n')}

Total: ${item.montant} DH
    `;
    
    const blob = new Blob([docContent], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_${item.reference}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const icons = {
    commande: { icon: Package, title: "Détails de la commande", bg: "bg-blue-100 text-blue-600" },
    devis: { icon: FileText, title: "Détails du devis", bg: "bg-purple-100 text-purple-600" },
    facture: { icon: Receipt, title: "Détails de la facture", bg: "bg-green-100 text-green-600" }
  };
  const { icon: Icon, title, bg } = icons[type];

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b bg-white p-4">
          <div className="flex items-center gap-3">
            <div className={`rounded-lg ${bg} p-2`}>
              <Icon size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
              <p className="text-sm text-slate-500">{item.reference}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleDownload} className="rounded-lg p-2 text-slate-500 hover:bg-gray-100">
              <Download size={18} />
            </button>
            <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-gray-100">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-slate-400">Date</p>
              <p className="font-medium">{new Date(item.date).toLocaleDateString()}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-slate-400">Montant HT</p>
              <p className="font-medium">{(item.montantHT || item.montant / 1.2 || 0).toLocaleString()} DH</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-slate-400">TVA</p>
              <p className="font-medium">{(item.tva || item.montant - (item.montantHT || item.montant / 1.2) || 0).toLocaleString()} DH</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-slate-400">Total TTC</p>
              <p className="font-bold text-[#5a7c3c]">{(item.montant || 0).toLocaleString()} DH</p>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
            <p className="text-sm text-slate-600">Statut</p>
            <StatusBadge status={item.statut} />
          </div>

          {item.produits && item.produits.length > 0 && (
            <div>
              <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <ShoppingCart size={16} /> Produits
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Désignation</th>
                      <th className="px-3 py-2 text-center">Qté</th>
                      <th className="px-3 py-2 text-right">Prix U.</th>
                      <th className="px-3 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {item.produits.map((prod, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2">{prod.nom || prod.designation}</td>
                        <td className="px-3 py-2 text-center">{prod.quantite}</td>
                        <td className="px-3 py-2 text-right">{prod.prixUnitaire?.toLocaleString()} DH</td>
                        <td className="px-3 py-2 text-right font-medium">{prod.total?.toLocaleString()} DH</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan="3" className="px-3 py-2 text-right font-bold">Total TTC</td>
                      <td className="px-3 py-2 text-right font-bold text-[#5a7c3c]">{(item.montant || 0).toLocaleString()} DH</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 border-t bg-white p-4">
          <button onClick={onClose} className="rounded-lg bg-[#e2f0d6] px-4 py-2 text-sm font-medium text-[#5a7c3c]">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentModal;