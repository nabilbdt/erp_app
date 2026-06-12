// components/client/ClientPagination.jsx
import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ClientPagination = ({ 
  total, 
  page, 
  rowsPerPage, 
  onPageChange, 
  onRowsPerPageChange 
}) => {
  const totalPages = Math.ceil(total / rowsPerPage);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 dark:border-slate-800 sm:flex-row">
      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
        <span>Lignes par page :</span>
        <select 
          value={rowsPerPage} 
          onChange={(e) => onRowsPerPageChange(Number(e.target.value))} 
          className="rounded-lg border-0 bg-gray-100 py-1 pl-2 pr-8 text-sm focus:ring-2 focus:ring-[#d4e6b0] dark:bg-slate-800"
        >
          {[5, 10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <span className="ml-2">{total} client{total > 1 ? 's' : ''}</span>
      </div>
      <div className="flex items-center gap-3">
        <button 
          onClick={() => onPageChange(Math.max(0, page - 1))} 
          disabled={page === 0} 
          className="rounded-lg px-3 py-1 text-sm transition disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-slate-800"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Page {page + 1} / {totalPages}
        </span>
        <button 
          onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))} 
          disabled={page + 1 >= totalPages} 
          className="rounded-lg px-3 py-1 text-sm transition disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-slate-800"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default ClientPagination;