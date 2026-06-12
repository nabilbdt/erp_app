import React, { useState } from 'react';
import {
  Eye, Edit, Trash2, Check, RefreshCw,
  Package, AlertTriangle, ChevronDown, XCircle,
  Users, DollarSign, Calendar, ChevronLeft, ChevronRight
} from 'lucide-react';

const statusOptions = [
  { value: 'en_cours',  label: 'En cours',             color: 'bg-amber-100 text-amber-800',   icon: RefreshCw },
  { value: 'accepte',   label: 'Acceptée',            color: 'bg-green-100 text-green-800',   icon: Check     },
  { value: 'confirme',  label: 'Confirmée',           color: 'bg-blue-100 text-blue-800',     icon: Check     },
  { value: 'livree_partiellement', label: 'Livrée partielle', color: 'bg-purple-100 text-purple-800', icon: AlertTriangle },
  { value: 'livree',    label: 'Livrée',              color: 'bg-emerald-100 text-emerald-800', icon: Package },
  { value: 'annulee',   label: 'Annulée',             color: 'bg-rose-100 text-rose-800',      icon: XCircle  },
];

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    : '—';

const formatMontant = (montant) =>
  new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(montant || 0);

const isRecentlyAdded = (item) => {
  if (!item?.createdAt) return false;
  const createdAt = new Date(item.createdAt).getTime();
  const now = Date.now();
  const diffSeconds = (now - createdAt) / 1000;
  return diffSeconds < 30;
};

const resolveId = (commande) => {
  if (!commande) throw new Error('Commande manquante');
  const raw = commande._id ?? commande.id ?? null;
  if (!raw) throw new Error('Impossible de résoudre l\'ID de la commande');
  if (typeof raw === 'string') return raw.trim();
  if (typeof raw === 'number') return String(raw);
  if (raw._id) return String(raw._id).trim();
  if (raw.id)  return String(raw.id).trim();
  throw new Error(`ID non résolu : ${JSON.stringify(raw)}`);
};

const CommandeTable = ({ 
  commandes, 
  onRowClick, 
  onDeleteClick, 
  onEdit, 
  onStatusChange,
  page = 0,
  rowsPerPage = 10,
  setPage,
  setRowsPerPage
}) => {
  const [loadingStatus, setLoadingStatus] = useState(null);
  const [statusConfirm, setStatusConfirm] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);
  const [stockErrorModal, setStockErrorModal] = useState({ open: false, message: '' });

  const hasPagination = setPage && setRowsPerPage;
  const start = hasPagination ? page * rowsPerPage : 0;
  const end = hasPagination ? start + rowsPerPage : commandes.length;
  const paginatedCommandes = hasPagination ? commandes.slice(start, end) : commandes;
  const totalPages = hasPagination ? Math.ceil(commandes.length / rowsPerPage) : 1;

  const needsConfirmation = (oldStatus, newStatus) => {
    const freeTransitions = [
      ['en_cours', 'confirme'],
      ['confirme', 'en_cours'],
    ];
    return !freeTransitions.some(([from, to]) => from === oldStatus && to === newStatus);
  };

  const handleStatusChange = (commande, newStatus) => {
    setErrorStatus(null);
    setStockErrorModal({ open: false, message: '' });
    if (needsConfirmation(commande.statut, newStatus)) {
      setStatusConfirm({ commande, newStatus, oldStatus: commande.statut });
    } else {
      applyStatusChange(commande, newStatus);
    }
  };

  const applyStatusChange = async (commande, newStatus) => {
    let commandeId;
    try {
      commandeId = resolveId(commande);
    } catch (err) {
      console.error(err);
      return;
    }
    setLoadingStatus(commandeId);
    try {
      await onStatusChange(commandeId, newStatus.toLowerCase().trim());
      setErrorStatus(null);
      setStockErrorModal({ open: false, message: '' });
    } catch (error) {
      const message = error.message || 'Erreur inconnue';
      const isStockError = /stock|insuffisant|quantité/i.test(message);
      if (isStockError) {
        setStockErrorModal({ open: true, message });
      } else {
        setErrorStatus({ id: commandeId, message });
        setTimeout(() => setErrorStatus(null), 5000);
      }
    } finally {
      setLoadingStatus(null);
    }
  };

  const confirmStatusChange = async () => {
    if (!statusConfirm) return;
    const { commande, newStatus } = statusConfirm;
    setStatusConfirm(null);
    await applyStatusChange(commande, newStatus);
  };

  const cancelStatusChange = () => setStatusConfirm(null);

  if (!commandes || commandes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 text-center shadow-lg ring-1 ring-gray-100 dark:bg-slate-900 dark:ring-slate-800">
        <Package size={48} className="mx-auto mb-3 text-slate-300 opacity-30" />
        <p className="text-slate-500 dark:text-slate-400">Aucune commande trouvée</p>
        <p className="mt-1 text-sm text-slate-400">Commencez par créer votre première commande.</p>
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
                  Montant
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Statut
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Date
                </th>
                <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {paginatedCommandes.map((c) => {
                const currentOption = statusOptions.find((opt) => opt.value === c.statut) ?? statusOptions[0];
                let rowId;
                try { rowId = resolveId(c); } catch { rowId = null; }
                const isLoading = rowId !== null && loadingStatus === rowId;
                const hasError = errorStatus?.id === rowId;
                const isDisabled = isLoading || statusConfirm !== null;
                const isNew = isRecentlyAdded(c);
                const isLocked = c.statut === 'livree' || c.statut === 'annulee';

                return (
                  <tr
                    key={rowId ?? c.reference}
                    onClick={() => onRowClick(c)}
                    className={`group cursor-pointer transition-all duration-200 hover:bg-gray-50/80 dark:hover:bg-slate-800/50 ${
                      hasError ? 'bg-red-50/30 dark:bg-red-900/10' : ''
                    } ${isNew ? 'bg-green-50/50 dark:bg-green-900/10' : ''}`}
                  >
                    {/* Référence */}
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="inline-flex h-8 min-w-[80px] items-center justify-center rounded-full bg-gradient-to-r from-[#d4e6b0] to-[#c0db9a] px-3 text-center text-xs font-bold text-[#3a5a1e] shadow-sm">
                          {c.reference}
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
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 line-clamp-1 max-w-[200px]">
                          {c.client?.nom ?? c.client?.raisonSociale ?? 'Client inconnu'}
                        </span>
                      </div>
                    </td>
                    {/* Montant */}
                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <DollarSign size={14} className="text-green-600 dark:text-green-400" />
                        <span className="font-bold text-gray-900 dark:text-white text-base">
                          {formatMontant(c.montantTotal)} <span className="text-xs font-normal text-gray-500">DH</span>
                        </span>
                      </div>
                    </td>
                    {/* Statut */}
                    <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="relative inline-block">
                        <select
                          value={c.statut}
                          onChange={(e) => handleStatusChange(c, e.target.value)}
                          disabled={isDisabled || isLocked}
                          className={`inline-flex items-center gap-2 rounded-full pl-3 pr-8 py-1.5 text-xs font-semibold appearance-none cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-400 disabled:opacity-60 disabled:cursor-not-allowed ${currentOption.color} ${
                            hasError ? 'ring-2 ring-red-400' : ''
                          }`}
                        >
                          {statusOptions.map((opt) => (
                            <option key={opt.value} value={opt.value} className="text-gray-900">
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={14}
                          className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-200 ${
                            isDisabled || isLocked ? 'opacity-40' : 'opacity-70'
                          }`}
                        />
                        {isLoading && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          </div>
                        )}
                      </div>
                      {hasError && (
                        <div className="mt-1 text-xs text-red-600 max-w-[200px]">{errorStatus.message}</div>
                      )}
                    </td>
                    {/* Date */}
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <Calendar size={12} className="text-slate-400" />
                        <span className="font-medium">{formatDate(c.createdAt)}</span>
                      </div>
                    </td>
                    {/* Actions */}
                    <td className="whitespace-nowrap px-5 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-center gap-1.5">
                        <button
                          onClick={() => onRowClick(c)}
                          className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700"
                          title="Voir les détails"
                        >
                          <Eye size={16} strokeWidth={1.7} />
                        </button>
                        {!isLocked && (
                          <>
                            <button
                              onClick={() => onEdit(c)}
                              className="rounded-md p-1.5 text-amber-600 transition-colors hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-slate-700"
                              title="Modifier la commande"
                            >
                              <Edit size={16} strokeWidth={1.7} />
                            </button>
                            <button
                              onClick={() => onDeleteClick(c)}
                              className="rounded-md p-1.5 text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-slate-700"
                              title="Supprimer la commande"
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

        {/* Pagination */}
        {hasPagination && commandes.length > rowsPerPage && (
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

      {/* Modal de confirmation */}
      {statusConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-5 border-b border-amber-100">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-amber-100 p-2 shadow-sm">
                  <AlertTriangle size={22} className="text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Confirmer le changement de statut</h3>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-600 leading-relaxed">
                Voulez-vous vraiment passer cette commande du statut{' '}
                <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                  {statusOptions.find((o) => o.value === statusConfirm.oldStatus)?.label}
                </span>{' '}
                vers{' '}
                <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  {statusOptions.find((o) => o.value === statusConfirm.newStatus)?.label}
                </span>{' '}
                ?
              </p>
              {statusConfirm.newStatus === 'livree' && (
                <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex gap-2 text-sm text-emerald-700">
                  <Package size={18} className="flex-shrink-0 mt-0.5" />
                  <span>La commande sera marquée comme livrée et ne pourra plus être modifiée.</span>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50/80 border-t border-gray-100">
              <button
                onClick={cancelStatusChange}
                className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-all duration-200"
              >
                Annuler
              </button>
              <button
                onClick={confirmStatusChange}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium hover:from-blue-700 hover:to-blue-800 shadow-sm hover:shadow transition-all duration-200"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'erreur stock */}
      {stockErrorModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-red-50 to-rose-50 p-5 border-b border-red-100">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-red-100 p-2 shadow-sm">
                  <XCircle size={22} className="text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Stock insuffisant</h3>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-700 leading-relaxed">
                {stockErrorModal.message || "La quantité demandée dépasse le stock disponible."}
              </p>
            </div>
            <div className="flex justify-end px-6 py-4 bg-gray-50/80 border-t border-gray-100">
              <button
                onClick={() => setStockErrorModal({ open: false, message: '' })}
                className="px-4 py-2 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-all duration-200"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CommandeTable;