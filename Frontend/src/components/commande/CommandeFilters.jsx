import React from 'react';
import { Search, RefreshCw } from 'lucide-react';

const CommandeFilters = ({ searchTerm, onSearchChange, filterStatut, onFilterChange, onRefresh }) => (
  <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
    <div className="relative flex-1 max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
      <input type="text" placeholder="Rechercher par référence, client..." value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm focus:border-[#8bb56a] focus:outline-none" />
    </div>
    <div className="flex gap-2">
      <select value={filterStatut} onChange={(e) => onFilterChange(e.target.value)} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#8bb56a]">
        <option value="all">Tous statuts</option>
        <option value="en_cours">En cours</option>
        <option value="confirme">Confirmée</option>
        <option value="livree">Livrée</option>
        <option value="annulee">Annulée</option>
      </select>
      <button onClick={onRefresh} className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm ring-1 ring-gray-200"><RefreshCw size={16} /> Rafraîchir</button>
    </div>
  </div>
);

export default CommandeFilters;