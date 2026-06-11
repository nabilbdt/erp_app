// components/produit/ProduitStats.js
import React from "react";
import { Package, AlertTriangle, DollarSign, ShoppingCart } from "lucide-react";

const ProduitStats = ({ stats }) => {
  const items = [
    { label: "Total produits", value: stats.total, icon: Package, color: "bg-[#e2f0d6] text-[#5a7c3c]" },
    { label: "Stock faible", value: stats.stockFaible, icon: AlertTriangle, color: "bg-red-100 text-red-600" },
    { label: "Valeur stock", value: `${stats.valeurStock.toLocaleString()} DH`, icon: DollarSign, color: "bg-green-100 text-green-600" },
    { label: "Produits actifs", value: stats.actifs, icon: ShoppingCart, color: "bg-blue-100 text-blue-600" },
  ];

  return (
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item, idx) => (
        <div key={idx} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className={`rounded-xl ${item.color} p-2`}>
              <item.icon size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className="text-2xl font-bold text-slate-800">{item.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProduitStats;