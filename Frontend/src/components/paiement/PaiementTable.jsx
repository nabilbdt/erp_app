// components/paiement/PaiementTable.jsx
import React from 'react';
import {
  Eye,
  Trash2,
  Edit,
  CreditCard,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Users,
  DollarSign,
  CheckCircle,
  AlertCircle,
  XCircle,
} from 'lucide-react';

const formatCurrency = (value) => `${(value || 0).toLocaleString()} DH`;
const formatDate = (date) => (date ? new Date(date).toLocaleDateString('fr-FR') : '—');

const isRecentlyAdded = (item) => {
  if (!item?.createdAt) return false;
  const createdAt = new Date(item.createdAt).getTime();
  const now = Date.now();
  const diffSeconds = (now - createdAt) / 1000;
  return diffSeconds < 30;
};

const getPaymentProgress = (paiement) => {
  const total = paiement.montantAPayer || 0;
  const paye = paiement.montantPaye || 0;
  if (total === 0) return 0;
  return Math.round((paye / total) * 100);
};

const StatutPaiement = ({ statut }) => {
  const config = {
    non_paye: { label: 'Non payé', color: 'bg-rose-100 text-rose-800', icon: XCircle },
    partiel: { label: 'Partiel', color: 'bg-amber-100 text-amber-800', icon: AlertCircle },
    paye: { label: 'Payé', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
  };
  const { label, color, icon: Icon } = config[statut] || { label: statut, color: 'bg-gray-100 text-gray-700', icon: null };
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${color}`}>
      {Icon && <Icon size={12} />}
      {label}
    </span>
  );
};

const PaiementTable = ({
  paiements,
  onRowClick,
  onEdit,
  onPay,
  onDelete,
  page = 0,
  rowsPerPage = 10,
  setPage,
  setRowsPerPage,
}) => {
  const hasPagination = setPage && setRowsPerPage;
  const start = hasPagination ? page * rowsPerPage : 0;
  const end = hasPagination ? start + rowsPerPage : paiements.length;
  const paginated = hasPagination ? paiements.slice(start, end) : paiements;
  const totalPages = hasPagination ? Math.ceil(paiements.length / rowsPerPage) : 1;

  if (paiements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 text-center shadow-lg ring-1 ring-gray-100 dark:bg-slate-900 dark:ring-slate-800">
        <CreditCard size={48} className="mx-auto mb-3 text-slate-300 opacity-30" />
        <p className="text-slate-500 dark:text-slate-400">Aucun paiement trouvé</p>
        <p className="mt-1 text-sm text-slate-400">Les paiements apparaîtront ici après création.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-gray-100 dark:bg-slate-900 dark:ring-slate-800">
      <div className="overflow-x-auto">
        <table className="min-w-[1000px] w-full border-collapse">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-slate-800 dark:to-slate-800/80">
            <tr className="border-b border-gray-200 dark:border-slate-700">
              <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Référence</th>
              <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Client</th>
              <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Facture</th>
              <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Montant dû</th>
              <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Statut</th>
              <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Progression</th>
              <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date prévue</th>
              <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-36">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {paginated.map((p) => {
              const isNew = isRecentlyAdded(p);
              const progress = getPaymentProgress(p);
              const canPay = p.statut !== 'paye';

              return (
                <tr
                  key={p._id}
                  onClick={() => onRowClick?.(p)}
                  className={`group cursor-pointer transition-all duration-200 hover:bg-gray-50/80 dark:hover:bg-slate-800/50 ${
                    isNew ? 'bg-green-50/50 dark:bg-green-900/10' : ''
                  }`}
                >
                  {/* Référence */}
                  <td className="whitespace-nowrap px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="inline-flex h-8 min-w-[80px] items-center justify-center rounded-full bg-gradient-to-r from-[#d4e6b0] to-[#c0db9a] px-3 text-center text-xs font-bold text-[#3a5a1e] shadow-sm">
                        {p.reference}
                      </div>
                      {isNew && (
                        <span className="animate-pulse rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-semibold text-white">
                          Nouveau
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Client */}
                  <td className="whitespace-nowrap px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-slate-400" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {p.client?.nom || p.client?.raisonSociale || '—'}
                      </span>
                    </div>
                  </td>

                  {/* Facture */}
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600 dark:text-slate-400">
                    {p.facture?.reference || '—'}
                  </td>

                  {/* Montant dû */}
                  <td className="whitespace-nowrap px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <DollarSign size={14} className="text-green-600 dark:text-green-400" />
                      <span className="font-bold text-gray-900 dark:text-white">
                        {formatCurrency(p.montantAPayer)}
                      </span>
                    </div>
                  </td>

                  {/* Statut */}
                  <td className="whitespace-nowrap px-5 py-4">
                    <StatutPaiement statut={p.statut} />
                  </td>

                  {/* Progression */}
                  <td className="whitespace-nowrap px-5 py-4">
                    {progress === 100 ? (
                      <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle size={14} /> Complété
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 dark:bg-slate-700 rounded-full h-1.5">
                          <div
                            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{progress}%</span>
                      </div>
                    )}
                  </td>

                  {/* Date prévue */}
                  <td className="whitespace-nowrap px-5 py-4">
                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <Calendar size={12} className="text-slate-400" />
                      <span className="font-medium">{formatDate(p.datePaiementPrevue)}</span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="whitespace-nowrap px-5 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-center gap-1.5">
                      <button
                        onClick={() => onRowClick?.(p)}
                        className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700"
                        title="Détails"
                      >
                        <Eye size={16} strokeWidth={1.7} />
                      </button>
                      {canPay && (
                        <button
                          onClick={() => onPay(p)}
                          className="rounded-md p-1.5 text-emerald-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-slate-700"
                          title="Effectuer un paiement"
                        >
                          <CreditCard size={16} strokeWidth={1.7} />
                        </button>
                      )}
                      <button
                        onClick={() => onEdit(p)}
                        className="rounded-md p-1.5 text-amber-600 transition-colors hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-slate-700"
                        title="Modifier"
                      >
                        <Edit size={16} strokeWidth={1.7} />
                      </button>
                      <button
                        onClick={() => onDelete(p)}
                        className="rounded-md p-1.5 text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-slate-700"
                        title="Supprimer"
                      >
                        <Trash2 size={16} strokeWidth={1.7} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {hasPagination && paiements.length > rowsPerPage && (
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
                <option key={n}>{n}</option>
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

export default PaiementTable;