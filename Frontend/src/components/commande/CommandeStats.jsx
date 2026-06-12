import React from 'react';
import { ShoppingCart, CheckCircle, Package, XCircle, RefreshCw } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
    <div className="flex items-center justify-between">
      <div><p className="text-sm text-slate-500">{title}</p><p className="text-2xl font-bold text-slate-800">{value}</p></div>
      <div className={`rounded-xl ${color} p-3`}><Icon size={22} className="text-white" /></div>
    </div>
  </div>
);

const CommandeStats = ({ stats }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 mt-6 mb-6">
    <StatCard title="Total commandes" value={stats.total} icon={ShoppingCart} color="bg-blue-500" />
    <StatCard title="En cours" value={stats.en_cours} icon={RefreshCw} color="bg-yellow-500" />
    <StatCard title="Confirmées" value={stats.confirme} icon={CheckCircle} color="bg-blue-500" />
    <StatCard title="Livrées" value={stats.livree} icon={Package} color="bg-green-500" />
    <StatCard title="Annulées" value={stats.annulee} icon={XCircle} color="bg-red-500" />
  </div>
);

export default CommandeStats;