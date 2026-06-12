// src/components/devis/DevisFilters.jsx
import React from 'react';
import { Search, RefreshCw } from 'lucide-react';

const DevisFilters = ({ searchTerm, onSearchChange, onRefresh }) => {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Rechercher par référence, client..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm focus:border-[#8bb56a] focus:outline-none"
        />
      </div>
      <button
        onClick={onRefresh}
        className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50"
      >
        <RefreshCw size={16} /> Rafraîchir
      </button>
    </div>
  );
};

export default DevisFilters;