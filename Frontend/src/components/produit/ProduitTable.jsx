// src/components/produit/ProduitTable.jsx
import React from "react";
import { Package, Tag, Factory, ShoppingCart, DollarSign, Barcode, ChevronLeft, ChevronRight, AlertCircle, ShoppingBag } from "lucide-react";

const getTypeBadge = (type) => {
  switch (type) {
    case "Produit_Fini":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
          <ShoppingCart size={12} /> Produit fini
        </span>
      );
    case "service":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-700">
          <Tag size={12} /> Service
        </span>
      );
    case "production":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
          <Factory size={12} /> Production
        </span>
      );
    default:
      return <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">—</span>;
  }
};

const ProduitTable = ({ produits, page, rowsPerPage, setPage, setRowsPerPage, onRowClick, onRequestPurchase }) => {
  const paginatedProduits = produits.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
  const totalPages = Math.ceil(produits.length / rowsPerPage);

  return (
    <div className="overflow-hidden rounded-2xl bg-[#f4f9ef] shadow-lg ring-1 ring-[#d0e2c0] dark:bg-slate-900 dark:ring-slate-800">
      <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full border-collapse">
          <thead className="bg-[#e8f3e0] dark:from-slate-800 dark:to-slate-800/80">
            <tr className="border-b border-[#d0e2c0] dark:border-slate-700">
              <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#5d7b44]">
                Produit
              </th>
              <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#5d7b44]">
                Type
              </th>
              <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#5d7b44]">
                Prix vente HT
              </th>
              <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#5d7b44]">
                Stock
              </th>
              <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#5d7b44]">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#d0e2c0] dark:divide-slate-800">
            {paginatedProduits.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-16 text-center text-sm text-[#5d7b44]/60">
                  <Package size={32} className="mx-auto mb-2 opacity-40" />
                  Aucun produit trouvé
                </td>
              </tr>
            ) : (
              paginatedProduits.map((produit) => {
                const showPurchaseRequest = produit.typeProduit !== "service" && 
                                            produit.stockMin !== undefined && 
                                            produit.stock <= produit.stockMin;

                return (
                  <tr
                    key={produit._id}
                    onClick={() => onRowClick(produit)}
                    className="group cursor-pointer transition-all duration-200 hover:bg-[#e8f3e0] dark:hover:bg-slate-800/50"
                  >
                    {/* Produit */}
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex items-center gap-2">
                        {produit.codeBarre && <Barcode size={16} className="text-[#5d7b44]/60" />}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-6 items-center justify-center rounded-full bg-[#d0e2c0] px-2 text-xs font-bold text-[#3a5a1e]">
                              {produit.reference || "—"}
                            </span>
                            <span className="font-semibold text-[#2c3e1f] dark:text-white">
                              {produit.designation}
                            </span>
                          </div>
                          {produit.codeBarre && (
                            <div className="font-mono text-xs text-[#5d7b44]/60">Code: {produit.codeBarre}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="whitespace-nowrap px-5 py-4">{getTypeBadge(produit.typeProduit)}</td>

                    {/* Prix */}
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex items-center gap-1">
                        <DollarSign size={14} className="text-[#5d7b44]" />
                        <span className="font-semibold text-[#5d7b44]">
                          {produit.prixVente?.toLocaleString()} DH
                        </span>
                      </div>
                    </td>

                    {/* Stock */}
                    <td className="whitespace-nowrap px-5 py-4">
                      {produit.typeProduit !== "service" ? (
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1">
                            <Package size={14} className="text-[#5d7b44]/60" />
                            <span
                              className={`text-sm font-semibold ${
                                produit.stock <= produit.stockMin ? "text-red-600 dark:text-red-400" : "text-[#2c3e1f]"
                              }`}
                            >
                              {produit.stock} {produit.uniteVente}
                            </span>
                            {produit.stock <= produit.stockMin && (
                              <AlertCircle size={14} className="text-red-500" />
                            )}
                          </div>
                          {produit.stockMin > 0 && (
                            <div className="text-xs text-[#5d7b44]/60">Min : {produit.stockMin}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[#5d7b44]/50">—</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="whitespace-nowrap px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      {showPurchaseRequest ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRequestPurchase && onRequestPurchase(produit);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition-all hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50"
                        >
                          <ShoppingBag size={14} />
                          Demande d'achat
                        </button>
                      ) : (
                        <span className="text-xs text-[#5d7b44]/30">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {produits.length > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-[#d0e2c0] px-5 py-4 dark:border-slate-800 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-[#5d7b44]">
            <span>Lignes par page :</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setPage(0);
              }}
              className="rounded-lg border-0 bg-[#e8f3e0] py-1.5 pl-2 pr-8 text-sm text-[#2c3e1f] focus:ring-2 focus:ring-[#d0e2c0] dark:bg-slate-800 dark:text-white"
            >
              {[5, 10, 25].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-[#5d7b44] transition-colors hover:bg-[#e8f3e0] disabled:opacity-40 dark:hover:bg-slate-800"
            >
              <ChevronLeft size={16} /> Précédent
            </button>
            <span className="text-sm font-medium text-[#2c3e1f]">
              Page {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page + 1 >= totalPages}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-[#5d7b44] transition-colors hover:bg-[#e8f3e0] disabled:opacity-40 dark:hover:bg-slate-800"
            >
              Suivant <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProduitTable;