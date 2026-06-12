import React from 'react';
import { Search, RefreshCw } from 'lucide-react';

const statusOptions = [
  { value: 'all', label: 'Tous' },
  { value: 'planifiee', label: 'Planifiée' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'livree', label: 'Livrée' },
];

const LivraisonFilters = ({ searchTerm, onSearchChange, filterStatut, onFilterChange, onRefresh }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 mb-6">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Rechercher par référence, client..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition"
        />
      </div>
      <div className="flex items-center gap-3">
        <select
          value={filterStatut}
          onChange={(e) => onFilterChange(e.target.value)}
          className="rounded-xl border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
        >
          {statusOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button
          onClick={onRefresh}
          className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition"
          title="Actualiser"
        >
          <RefreshCw size={18} className="text-gray-500" />
        </button>
      </div>
    </div>
  );
};

export default LivraisonFilters;