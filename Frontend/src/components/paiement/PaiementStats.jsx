// components/paiement/PaiementStats.jsx
import React from 'react';
import { CreditCard, DollarSign, Clock, TrendingUp } from 'lucide-react';

const formatCurrency = (value) => `${(value || 0).toLocaleString()} DH`;

const PaiementStats = ({ stats = { totalDu: 0, totalPaye: 0, totalReste: 0, enRetard: 0 } }) => {
  const cards = [
    { title: 'Total dû', value: formatCurrency(stats.totalDu), icon: DollarSign, color: 'blue' },
    { title: 'Total payé', value: formatCurrency(stats.totalPaye), icon: TrendingUp, color: 'green' },
    { title: 'Reste à payer', value: formatCurrency(stats.totalReste), icon: Clock, color: 'amber' },
    { title: 'Échéances', value: `${stats.enRetard} en retard`, icon: CreditCard, color: 'rose' },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      {cards.map((card, idx) => (
        <div key={idx} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">{card.title}</p>
              <p className="text-2xl font-bold text-slate-800">{card.value}</p>
            </div>
            <div className={`rounded-full bg-${card.color}-100 p-3`}>
              <card.icon size={22} className={`text-${card.color}-600`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PaiementStats;