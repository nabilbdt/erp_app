// components/client/ClientFilters.jsx
import React from "react";
import { Search, RefreshCw } from "lucide-react";

const ClientFilters = ({ 
  searchTerm, 
  onSearchChange, 
  filterType, 
  onFilterChange, 
  onRefresh 
}) => {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row">
      <div className="group relative flex-1">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#8bb56a]" />
        <input
          type="text"
          placeholder="Rechercher par nom, email, référence..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-12 w-full rounded-2xl bg-gray-100 pl-11 pr-5 text-sm text-slate-700 outline-none ring-1 ring-transparent transition-all focus:bg-white focus:ring-2 focus:ring-[#d4e6b0] dark:bg-slate-800 dark:text-slate-300"
        />
      </div>
      <div className="flex gap-2">
        <div className="w-48">
          <select
            value={filterType}
            onChange={(e) => onFilterChange(e.target.value)}
            className="h-12 w-full rounded-2xl bg-gray-100 px-4 text-sm text-slate-700 outline-none ring-1 ring-transparent focus:bg-white focus:ring-2 focus:ring-[#d4e6b0] dark:bg-slate-800 dark:text-slate-300"
          >
            <option value="all">Tous les types</option>
            <option value="particulier">Particuliers</option>
            <option value="entreprise">Entreprises</option>
          </select>
        </div>
        <button 
          onClick={onRefresh} 
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-slate-600 transition hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
          title="Rafraîchir"
        >
          <RefreshCw size={18} />
        </button>
      </div>
    </div>
  );
};

export default ClientFilters;