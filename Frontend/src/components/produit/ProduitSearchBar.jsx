// components/produit/ProduitSearchBar.js
import React from "react";
import { Search } from "lucide-react";

const ProduitSearchBar = ({ searchTerm, setSearchTerm }) => {
  return (
    <div className="group relative max-w-md">
      <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#8bb56a]" />
      <input
        type="text"
        placeholder="Rechercher (réf, désignation, code barre, catégorie)..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="h-12 w-full rounded-2xl bg-gray-100 pl-11 pr-5 text-sm text-slate-700 outline-none ring-1 ring-transparent focus:bg-white focus:ring-2 focus:ring-[#d4e6b0]"
      />
    </div>
  );
};

export default ProduitSearchBar;