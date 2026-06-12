import React, { useState } from 'react';
import {
  Eye, Trash2, Truck, Clock, CheckCircle, ChevronDown, AlertTriangle,
  Package, XCircle, Users, Calendar, Percent, ChevronLeft, ChevronRight
} from 'lucide-react';

const statusOptions = [
  { value: 'planifiee', label: 'Planifiée', color: 'bg-slate-100 text-slate-700', icon: Clock },
  { value: 'en_cours', label: 'En cours', color: 'bg-amber-100 text-amber-800', icon: Truck },
  { value: 'livree_partiellement', label: 'Partiellement livrée', color: 'bg-purple-100 text-purple-800', icon: AlertTriangle },
  { value: 'livree', label: 'Livrée', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
  { value: 'annulee', label: 'Annulée', color: 'bg-rose-100 text-rose-800', icon: XCircle },
];

const formatDate = (date) => date ? new Date(date).toLocaleDateString('fr-FR') : '—';

const isRecentlyAdded = (item) => {
  if (!item?.createdAt) return false;
  const createdAt = new Date(item.createdAt).getTime();
  const now = Date.now();
  const diffSeconds = (now - createdAt) / 1000;
  return diffSeconds < 30;
};

const getAllowedStatuses = (currentStatus) => {
  if (currentStatus === 'livree' || currentStatus === 'annulee') return [];
  if (currentStatus === 'planifiee') return statusOptions.filter(opt => opt.value === 'annulee');
  if (currentStatus === 'livree_partiellement') return [];
  return [];
};

const LivraisonTable = ({
  livraisons,
  onRowClick,
  onDeleteClick,
  onEdit,
  onStatusChange,
  onDeliver,
  page = 0,
  rowsPerPage = 10,
  setPage,
  setRowsPerPage
}) => {
  const [loadingStatus, setLoadingStatus] = useState(null);
  const [statusConfirm, setStatusConfirm] = useState(null);

  const hasPagination = setPage && setRowsPerPage;
  const start = hasPagination ? page * rowsPerPage : 0;
  const end = hasPagination ? start + rowsPerPage : livraisons.length;
  const paginatedLivraisons = hasPagination ? livraisons.slice(start, end) : livraisons;
  const totalPages = hasPagination ? Math.ceil(livraisons.length / rowsPerPage) : 1;

  const handleStatusChange = (id, newStatus, oldStatus) => {
    if (newStatus === 'annulee') {
      setStatusConfirm({ id, newStatus, oldStatus });
    } else {
      applyStatusChange(id, newStatus);
    }
  };

  const applyStatusChange = async (id, newStatus) => {
    setLoadingStatus(id);
    try {
      await onStatusChange(id, newStatus);
    } finally {
      setLoadingStatus(null);
    }
  };

  const confirmStatusChange = async () => {
    if (!statusConfirm) return;
    const { id, newStatus, oldStatus } = statusConfirm;
    setLoadingStatus(id);
    try {
      await onStatusChange(id, newStatus);
    } finally {
      setLoadingStatus(null);
      setStatusConfirm(null);
    }
  };

  const cancelStatusChange = () => setStatusConfirm(null);

  const isFullyDelivered = (livraison) => {
    const produits = livraison.produits || [];
    if (produits.length === 0) return false;
    return produits.every(p => (p.quantiteLivree || 0) >= (p.quantiteCommandee || p.quantite || 0));
  };

  const getDeliveryProgress = (livraison) => {
    const produits = livraison.produits || [];
    let totalCmd = 0, totalLiv = 0;
    produits.forEach(p => {
      totalCmd += p.quantiteCommandee || p.quantite || 0;
      totalLiv += p.quantiteLivree || 0;
    });
    if (totalCmd === 0) return 0;
    return Math.round((totalLiv / totalCmd) * 100);
  };

  if (livraisons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 text-center shadow-lg ring-1 ring-gray-100 dark:bg-slate-900 dark:ring-slate-800">
        <Truck size={48} className="mx-auto mb-3 text-slate-300 opacity-30" />
        <p className="text-slate-500 dark:text-slate-400">Aucune livraison trouvée</p>
        <p className="mt-1 text-sm text-slate-400">Les livraisons apparaîtront ici après création.</p>
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
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Statut
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Progression
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Date création
                </th>
                <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {paginatedLivraisons.map((l) => {
                const currentOption = statusOptions.find(opt => opt.value === l.statut) || statusOptions[0];
                const isLoading = loadingStatus === l._id;
                const fullyDelivered = isFullyDelivered(l);
                const progress = getDeliveryProgress(l);
                const showDeliverButton = l.statut !== 'livree' && l.statut !== 'annulee' && !fullyDelivered;
                const isNew = isRecentlyAdded(l);
                const allowedStatuses = getAllowedStatuses(l.statut);
                const canChangeStatus = allowedStatuses.length > 0;

                return (
                  <tr
                    key={l._id}
                    onClick={() => onRowClick(l)}
                    className={`group cursor-pointer transition-all duration-200 hover:bg-gray-50/80 dark:hover:bg-slate-800/50 ${
                      isNew ? 'bg-green-50/50 dark:bg-green-900/10' : ''
                    }`}
                  >
                    {/* Référence - badge pistache */}
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="inline-flex h-8 min-w-[80px] items-center justify-center rounded-full bg-gradient-to-r from-[#d4e6b0] to-[#c0db9a] px-3 text-center text-xs font-bold text-[#3a5a1e] shadow-sm">
                          {l.reference}
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
                          {l.client?.nom || l.client?.raisonSociale || 'Client inconnu'}
                        </span>
                      </div>
                    </td>

                    {/* Statut */}
                    <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="relative inline-block">
                        {canChangeStatus ? (
                          <>
                            <select
                              value={l.statut}
                              onChange={(e) => handleStatusChange(l._id, e.target.value, l.statut)}
                              disabled={isLoading || statusConfirm !== null}
                              className={`inline-flex items-center gap-2 rounded-full pl-3 pr-8 py-1.5 text-xs font-semibold appearance-none cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-400 disabled:opacity-60 ${currentOption.color}`}
                            >
                              {allowedStatuses.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-70" />
                          </>
                        ) : (
                          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${currentOption.color}`}>
                            {currentOption.icon && <currentOption.icon size={12} />}
                            {currentOption.label}
                          </span>
                        )}
                        {isLoading && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        )}
                      </div>
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

                    {/* Date création */}
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <Calendar size={12} className="text-slate-400" />
                        <span className="font-medium">{formatDate(l.createdAt)}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="whitespace-nowrap px-5 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-center gap-1.5">
                        <button
                          onClick={() => onRowClick(l)}
                          className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700"
                          title="Détails"
                        >
                          <Eye size={16} strokeWidth={1.7} />
                        </button>
                        {showDeliverButton && (
                          <button
                            onClick={() => onDeliver(l)}
                            className="rounded-md p-1.5 text-emerald-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-slate-700"
                            title="Effectuer une livraison partielle ou finale"
                          >
                            <Package size={16} strokeWidth={1.7} />
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteClick(l)}
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

        {/* Pagination moderne */}
        {hasPagination && livraisons.length > rowsPerPage && (
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

      {/* Modal confirmation annulation */}
      {statusConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-5 border-b border-amber-100">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-amber-100 p-2 shadow-sm">
                  <AlertTriangle size={22} className="text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Confirmer l'annulation</h3>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-600 leading-relaxed">
                Voulez-vous vraiment annuler cette livraison ?
              </p>
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
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 text-white font-medium hover:from-rose-700 hover:to-rose-800 shadow-sm hover:shadow transition-all duration-200"
              >
                Confirmer l'annulation
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LivraisonTable;