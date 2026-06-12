import React, { useState } from 'react';
import {
  Eye, Trash2, Edit, Send, Download, FileText, CheckCircle,
  AlertCircle, XCircle, Users, DollarSign, Calendar, ChevronLeft, ChevronRight
} from 'lucide-react';

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString('fr-FR') : '—';

const formatMontant = (montant) => `${(montant || 0).toLocaleString()} DH`;

const StatutFactureBadge = ({ statut }) => {
  const config = {
    brouillon: { label: 'Brouillon', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    envoyee: { label: 'Envoyée', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
    annulee: { label: 'Annulée', color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400' },
  };
  const { label, color } = config[statut] || { label: statut, color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${color}`}>
      {label}
    </span>
  );
};

const PaiementBadge = ({ statut }) => {
  const config = {
    non_paye: { label: 'Non payée', color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400', icon: XCircle },
    partiel: { label: 'Partiel', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400', icon: AlertCircle },
    paye: { label: 'Payée', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle },
  };
  const { label, color, icon: Icon } = config[statut] || { label: statut, color: 'bg-gray-100 text-gray-700', icon: null };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${color}`}>
      {Icon && <Icon size={12} />}
      {label}
    </span>
  );
};

const isRecentlyAdded = (item) => {
  if (!item?.createdAt) return false;
  const createdAt = new Date(item.createdAt).getTime();
  const now = Date.now();
  const diffSeconds = (now - createdAt) / 1000;
  return diffSeconds < 30;
};

const FactureTable = ({
  factures,
  onRowClick,
  onDeleteClick,
  onEdit,
  onEnvoyerEmail,
  onDownloadPDF,
  page = 0,
  rowsPerPage = 10,
  setPage,
  setRowsPerPage
}) => {
  const hasPagination = setPage && setRowsPerPage;
  const start = hasPagination ? page * rowsPerPage : 0;
  const end = hasPagination ? start + rowsPerPage : factures.length;
  const paginatedFactures = hasPagination ? factures.slice(start, end) : factures;
  const totalPages = hasPagination ? Math.ceil(factures.length / rowsPerPage) : 1;

  if (factures.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 text-center shadow-lg ring-1 ring-gray-100 dark:bg-slate-900 dark:ring-slate-800">
        <FileText size={48} className="mx-auto mb-3 text-slate-300 opacity-30" />
        <p className="text-slate-500 dark:text-slate-400">Aucune facture trouvée</p>
        <p className="mt-1 text-sm text-slate-400">Les factures apparaîtront ici après création.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-gray-100 dark:bg-slate-900 dark:ring-slate-800">
        <div className="overflow-x-auto">
          <table className="min-w-[1000px] w-full border-collapse">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-slate-800 dark:to-slate-800/80">
              <tr className="border-b border-gray-200 dark:border-slate-700">
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Référence
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Client
                </th>
                <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Total TTC
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Statut
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Paiement
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Date
                </th>
                <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-36">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {paginatedFactures.map((f) => {
                const isNew = isRecentlyAdded(f);
                const isLocked = f.statut === 'annulee' || f.statut === 'payee';

                return (
                  <tr
                    key={f._id}
                    onClick={() => onRowClick(f)}
                    className={`group cursor-pointer transition-all duration-200 hover:bg-gray-50/80 dark:hover:bg-slate-800/50 ${
                      isNew ? 'bg-green-50/50 dark:bg-green-900/10' : ''
                    }`}
                  >
                    {/* Référence en badge pistache */}
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="inline-flex h-8 min-w-[80px] items-center justify-center rounded-full bg-gradient-to-r from-[#d4e6b0] to-[#c0db9a] px-3 text-center text-xs font-bold text-[#3a5a1e] shadow-sm">
                          {f.reference}
                        </div>
                        {isNew && (
                          <span className="animate-pulse rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-semibold text-white">
                            Nouveau
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Client avec icône */}
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-slate-400" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {f.client?.nom || f.client?.raisonSociale || 'Client inconnu'}
                        </span>
                      </div>
                    </td>

                    {/* Montant avec icône */}
                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <DollarSign size={14} className="text-green-600 dark:text-green-400" />
                        <span className="font-bold text-gray-900 dark:text-white text-base">
                          {formatMontant(f.totalTTC)}
                        </span>
                      </div>
                    </td>

                    {/* Statut facture */}
                    <td className="whitespace-nowrap px-5 py-4">
                      <StatutFactureBadge statut={f.statut} />
                    </td>

                    {/* Statut paiement */}
                    <td className="whitespace-nowrap px-5 py-4">
                      <PaiementBadge statut={f.statutPaiement} />
                    </td>

                    {/* Date avec icône */}
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <Calendar size={12} className="text-slate-400" />
                        <span className="font-medium">{formatDate(f.createdAt)}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="whitespace-nowrap px-5 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-center gap-1.5">
                        <button
                          onClick={() => onDownloadPDF(f._id)}
                          className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700"
                          title="Télécharger PDF"
                        >
                          <Download size={16} strokeWidth={1.7} />
                        </button>
                        <button
                          onClick={() => onEnvoyerEmail(f._id)}
                          className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-green-50 hover:text-green-600 dark:hover:bg-slate-700"
                          title="Envoyer par email"
                        >
                          <Send size={16} strokeWidth={1.7} />
                        </button>
                        {!isLocked && (
                          <>
                            <button
                              onClick={() => onEdit(f)}
                              className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-slate-700"
                              title="Modifier"
                            >
                              <Edit size={16} strokeWidth={1.7} />
                            </button>
                            <button
                              onClick={() => onDeleteClick(f)}
                              className="rounded-md p-1.5 text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-slate-700"
                              title="Supprimer"
                            >
                              <Trash2 size={16} strokeWidth={1.7} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination moderne (optionnelle) */}
        {hasPagination && factures.length > rowsPerPage && (
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
                  <option key={n} value={n}>{n}</option>
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
    </>
  );
};

export default FactureTable;