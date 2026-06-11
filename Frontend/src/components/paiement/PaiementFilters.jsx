// components/paiement/PaiementFilters.jsx
import React from 'react';
import { Search, RefreshCw } from 'lucide-react';

const PaiementFilters = ({
  searchTerm,
  onSearchChange,
  filterStatut,
  onFilterStatutChange,
  onRefresh,
}) => {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher par référence, client, facture..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>
      <div className="flex gap-2">
        <select
          value={filterStatut}
          onChange={(e) => onFilterStatutChange(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm"
        >
          <option value="all">Tous statuts</option>
          <option value="non_paye">Non payé</option>
          <option value="partiel">Partiel</option>
          <option value="paye">Payé</option>
        </select>
        <button
          onClick={onRefresh}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm hover:bg-gray-50"
        >
          <RefreshCw size={18} />
        </button>
      </div>
    </div>
  );
};

export default PaiementFilters;