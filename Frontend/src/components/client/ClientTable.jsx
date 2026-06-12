// components/client/ClientTable.jsx
import React from "react";
import { ArrowUpDown, Search, ChevronLeft, ChevronRight, Users } from "lucide-react";
import ClientTableRow from "./ClientTableRow";

const SortIcon = ({ field, sortField, sortOrder }) => {
  if (sortField !== field) return <ArrowUpDown size={14} className="opacity-50" />;
  return (
    <ArrowUpDown
      size={14}
      className={`transform transition-transform duration-200 ${
        sortOrder === "desc" ? "rotate-180" : ""
      }`}
    />
  );
};

const ClientTable = ({
  clients,
  onRowClick,
  sortField,
  sortOrder,
  onSort,
  // Paramètres de pagination (optionnels pour compatibilité)
  page = 0,
  rowsPerPage = 10,
  setPage,
  setRowsPerPage,
}) => {
  const hasPagination = setPage && setRowsPerPage;
  const start = hasPagination ? page * rowsPerPage : 0;
  const end = hasPagination ? start + rowsPerPage : clients.length;
  const paginatedClients = hasPagination ? clients.slice(start, end) : clients;
  const totalPages = hasPagination ? Math.ceil(clients.length / rowsPerPage) : 1;

  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 text-center shadow-lg ring-1 ring-gray-100 dark:bg-slate-900 dark:ring-slate-800">
        <Search size={48} className="mx-auto mb-3 text-slate-300 opacity-30" />
        <p className="text-slate-500 dark:text-slate-400">Aucun client trouvé</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-gray-100 dark:bg-slate-900 dark:ring-slate-800">
      <div className="overflow-x-auto">
        <table className="min-w-[1200px] w-full border-collapse">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-slate-800 dark:to-slate-800/80">
            <tr className="border-b border-gray-200 dark:border-slate-700">
              <th
                className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                onClick={() => onSort("reference")}
              >
                <div className="flex cursor-pointer items-center gap-1 hover:text-slate-700 dark:hover:text-slate-300">
                  Référence <SortIcon field="reference" sortField={sortField} sortOrder={sortOrder} />
                </div>
              </th>
              <th
                className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                onClick={() => onSort("nomComplet")}
              >
                <div className="flex cursor-pointer items-center gap-1 hover:text-slate-700 dark:hover:text-slate-300">
                  Client <SortIcon field="nomComplet" sortField={sortField} sortOrder={sortOrder} />
                </div>
              </th>
              <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Type
              </th>
              <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Email
              </th>
              <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Téléphone
              </th>
              <th
                className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                onClick={() => onSort("adresse.ville")}
              >
                <div className="flex cursor-pointer items-center gap-1 hover:text-slate-700 dark:hover:text-slate-300">
                  Ville <SortIcon field="adresse.ville" sortField={sortField} sortOrder={sortOrder} />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {paginatedClients.map((client, idx) => (
              <ClientTableRow
                key={client._id}
                client={client}
                index={idx}
                onClick={onRowClick}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination (visible uniquement si les props sont fournies et si plus d'une page) */}
      {hasPagination && clients.length > rowsPerPage && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 px-5 py-4 dark:border-slate-800 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <span>Lignes par page :</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setPage(0);
              }}
              className="rounded-lg border-0 bg-gray-100 py-1.5 pl-2 pr-8 text-sm focus:ring-2 focus:ring-[#d4e6b0] dark:bg-slate-800 dark:text-white"
            >
              {[5, 10, 25, 50].map((n) => (
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
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm transition-colors hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-slate-800"
            >
              <ChevronLeft size={16} /> Précédent
            </button>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Page {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page + 1 >= totalPages}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm transition-colors hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-slate-800"
            >
              Suivant <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientTable;