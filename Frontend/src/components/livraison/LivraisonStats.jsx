import React from 'react';
import { Package, Truck, CheckCircle, Clock, XCircle } from 'lucide-react';

const LivraisonStats = ({ stats }) => {
  const items = [
    { label: 'Total', value: stats.total, icon: Package, color: 'bg-gray-100 text-gray-700' },
    { label: 'Planifiée', value: stats.planifiee, icon: Clock, color: 'bg-slate-100 text-slate-700' },
    { label: 'En cours', value: stats.en_cours, icon: Truck, color: 'bg-amber-100 text-amber-800' },
    { label: 'Livrée', value: stats.livree, icon: CheckCircle, color: 'bg-emerald-100 text-emerald-800' },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-6">
      {items.map((item, idx) => (
        <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{item.label}</p>
            <p className="text-2xl font-bold text-gray-800">{item.value}</p>
          </div>
          <div className={`p-3 rounded-full ${item.color}`}>
            <item.icon size={22} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default LivraisonStats;