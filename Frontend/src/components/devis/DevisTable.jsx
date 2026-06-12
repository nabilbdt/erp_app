// src/components/devis/DevisTable.jsx
import React from 'react';
import {
  Eye, Edit, Trash2, CheckCircle, XCircle, RefreshCw, Calendar, Clock,
  FileText, Users, Package, DollarSign, ChevronLeft, ChevronRight
} from 'lucide-react';

const getStatusConfig = (statut) => {
  const config = {
    en_attente: { color: 'amber', label: 'En attente', icon: Clock },
    envoye: { color: 'blue', label: 'Envoyé', icon: RefreshCw },
    accepte: { color: 'emerald', label: 'Accepté', icon: CheckCircle },
    refuse: { color: 'rose', label: 'Refusé', icon: XCircle },
    a_negocier: { color: 'orange', label: 'Négocier', icon: RefreshCw },
  };
  return config[statut] || { color: 'gray', label: statut, icon: null };
};

const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getProductNames = (produits) => {
  if (!produits?.length) return '—';
  const names = produits.map(p => p.produit?.designation || p.produit?.nom || 'Produit');
  if (names.length === 1) return names[0];
  return `${names[0]} + ${names.length - 1} autre(s)`;
};

const isRecentlyAdded = (item) => {
  if (!item?.createdAt) return false;
  const createdAt = new Date(item.createdAt).getTime();
  const now = Date.now();
  const diffSeconds = (now - createdAt) / 1000;
  return diffSeconds < 30;
};

const ExpirationProgress = ({ dateExpiration, statut }) => {
  if (statut === 'refuse') {
    return (
      <div className="flex items-center gap-1 text-rose-600">
        <XCircle size={12} />
        <span className="text-xs font-medium">Refusé</span>
      </div>
    );
  }
  if (statut === 'accepte') {
    return (
      <div className="flex items-center gap-1 text-emerald-600">
        <CheckCircle size={12} />
        <span className="text-xs font-medium">Accepté</span>
      </div>
    );
  }
  if (statut === 'a_negocier') {
    return (
      <div className="flex items-center gap-1 text-orange-600">
        <RefreshCw size={12} className="animate-spin-slow" />
        <span className="text-xs font-medium">En pause</span>
      </div>
    );
  }
  if (!dateExpiration) return <span className="text-xs text-gray-400">—</span>;

  const now = new Date();
  const exp = new Date(dateExpiration);
  const totalDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
  const isExpired = totalDays < 0;

  if (isExpired) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1 text-rose-600">
          <XCircle size={12} />
          <span className="text-xs font-medium">Expiré</span>
        </div>
        <div className="h-1.5 w-20 rounded-full bg-rose-100">
          <div className="h-full w-full rounded-full bg-rose-500" />
        </div>
      </div>
    );
  }

  const maxDays = 90;
  const percentRemaining = Math.min(100, (totalDays / maxDays) * 100);
  let barColor = 'emerald';
  if (percentRemaining < 30) barColor = 'rose';
  else if (percentRemaining < 60) barColor = 'amber';

  const colorClasses = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-gray-700">{totalDays} jour{totalDays > 1 ? 's' : ''}</span>
        <span className="text-gray-400">{formatDate(dateExpiration)}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full ${colorClasses[barColor]} transition-all duration-700 ease-out`}
          style={{ width: `${percentRemaining}%` }}
        />
      </div>
    </div>
  );
};

const StatusBadge = ({ statut }) => {
  const { color, label, icon: Icon } = getStatusConfig(statut);
  const colorMap = {
    amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    blue: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    rose: 'bg-rose-50 text-rose-700 ring-rose-600/20',
    orange: 'bg-orange-50 text-orange-700 ring-orange-600/20',
    gray: 'bg-gray-50 text-gray-700 ring-gray-600/20',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${colorMap[color]}`}>
      {Icon && <Icon size={12} />}
      {label}
    </span>
  );
};

const ActionButton = ({ onClick, icon, label, color }) => {
  const colors = {
    green: 'hover:bg-green-50 text-green-600',
    red: 'hover:bg-red-50 text-red-600',
    blue: 'hover:bg-blue-50 text-blue-600',
    amber: 'hover:bg-amber-50 text-amber-600',
    slate: 'hover:bg-gray-100 text-gray-600',
  };
  return (
    <button
      onClick={onClick}
      className={`rounded-md p-1.5 transition-colors ${colors[color]}`}
      title={label}
    >
      {icon}
    </button>
  );
};

const DevisTable = ({ devis, page, rowsPerPage, setPage, onRowClick, onDeleteClick, onAccept, onRefuse, onNegociate, onEdit }) => {
  const sortedDevis = React.useMemo(() => {
    return [...devis].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [devis]);

  const start = page * rowsPerPage;
  const paginated = sortedDevis.slice(start, start + rowsPerPage);
  const totalPages = Math.ceil(sortedDevis.length / rowsPerPage);

  if (sortedDevis.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 text-center shadow-lg ring-1 ring-gray-100 dark:bg-slate-900 dark:ring-slate-800">
        <FileText size={48} className="mx-auto mb-3 text-slate-300 opacity-30" />
        <p className="text-slate-500 dark:text-slate-400">Aucun devis trouvé</p>
        <p className="mt-1 text-sm text-slate-400">Créez votre premier devis en cliquant sur "Nouveau devis".</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-gray-100 dark:bg-slate-900 dark:ring-slate-800">
      <div className="overflow-x-auto">
        <table className="min-w-[1200px] w-full border-collapse">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-slate-800 dark:to-slate-800/80">
            <tr className="border-b border-gray-200 dark:border-slate-700">
              <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Référence
              </th>
              <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Client
              </th>
              <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Produits
              </th>
              <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Montant
              </th>
              <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Expiration
              </th>
              <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Acceptation
              </th>
              <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Statut
              </th>
              <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {paginated.map((devi) => {
              const isNew = isRecentlyAdded(devi);
              return (
                <tr
                  key={devi._id}
                  onClick={() => onRowClick(devi)}
                  className={`group cursor-pointer transition-all duration-200 hover:bg-gray-50/80 dark:hover:bg-slate-800/50 ${
                    isNew ? 'bg-green-50/50 dark:bg-green-900/10' : ''
                  }`}
                >
                  {/* Référence - badge circulaire pistache */}
                  <td className="whitespace-nowrap px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="inline-flex h-8 min-w-[80px] items-center justify-center rounded-full bg-gradient-to-r from-[#d4e6b0] to-[#c0db9a] px-3 text-center text-xs font-bold text-[#3a5a1e] shadow-sm">
                        {devi.reference || 'N/A'}
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
                        {devi.client?.nom || devi.client?.raisonSociale || 'N/A'}
                      </span>
                    </div>
                  </td>

                  {/* Produits */}
                  <td className="whitespace-nowrap px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Package size={14} className="text-slate-400" />
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {getProductNames(devi.produits)}
                      </span>
                    </div>
                  </td>

                  {/* Montant */}
                  <td className="whitespace-nowrap px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <DollarSign size={14} className="text-green-600" />
                      <span className="font-semibold text-green-700 dark:text-green-400">
                        {(devi.montantTotal || 0).toLocaleString()} DH
                      </span>
                    </div>
                  </td>

                  {/* Expiration */}
                  <td className="min-w-[160px] px-5 py-4">
                    <ExpirationProgress dateExpiration={devi.dateExpiration} statut={devi.statut} />
                  </td>

                  {/* Date d'acceptation */}
                  <td className="whitespace-nowrap px-5 py-4">
                    {devi.dateAcceptation ? (
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Calendar size={12} className="text-slate-400" />
                        {formatDate(devi.dateAcceptation)}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>

                  {/* Statut */}
                  <td className="whitespace-nowrap px-5 py-4 text-center">
                    <StatusBadge statut={devi.statut} />
                  </td>

                  {/* Actions */}
                  <td className="whitespace-nowrap px-5 py-4 text-center">
                    <div className="flex justify-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                      {devi.statut === 'en_attente' && (
                        <>
                          <ActionButton onClick={() => onAccept(devi._id)} icon={<CheckCircle size={16} />} label="Accepter" color="green" />
                          <ActionButton onClick={() => onRefuse(devi._id)} icon={<XCircle size={16} />} label="Refuser" color="red" />
                          <ActionButton onClick={() => onNegociate(devi._id)} icon={<RefreshCw size={16} />} label="Négocier" color="blue" />
                          <ActionButton onClick={() => onEdit(devi)} icon={<Edit size={16} />} label="Modifier" color="amber" />
                        </>
                      )}
                      <ActionButton onClick={() => onRowClick(devi)} icon={<Eye size={16} />} label="Voir" color="slate" />
                      <ActionButton onClick={() => onDeleteClick(devi)} icon={<Trash2 size={16} />} label="Supprimer" color="red" />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {sortedDevis.length > rowsPerPage && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 px-5 py-4 dark:border-slate-800 sm:flex-row">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">{start + 1}</span> -{' '}
            <span className="font-medium">{Math.min(start + rowsPerPage, sortedDevis.length)}</span> sur{' '}
            <span className="font-medium">{sortedDevis.length}</span> devis
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm transition-colors hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-slate-800"
            >
              <ChevronLeft size={16} /> Précédent
            </button>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Page {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
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

export default DevisTable;