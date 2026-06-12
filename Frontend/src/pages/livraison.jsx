import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, CheckCircle, AlertTriangle } from 'lucide-react';
import LivraisonStats from '../components/livraison/LivraisonStats';
import LivraisonFilters from '../components/livraison/LivraisonFilters';
import LivraisonTable from '../components/livraison/LivraisonTable';
import LivraisonQuantityModal from '../components/livraison/LivraisonQuantityModal';
import DeleteConfirmModal from '../components/livraison/DeleteConfirmModal';
import { getAllLivraisons, updateLivraison, deleteLivraison, appliquerLivraison } from '../services/livraison.service';
import { getClients } from '../services/client.service';

const Livraisons = () => {
  const navigate = useNavigate();
  const [livraisons, setLivraisons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(10);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [stats, setStats] = useState({ total: 0, planifiee: 0, en_cours: 0, livree: 0 });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [clients, setClients] = useState([]);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [currentLivraison, setCurrentLivraison] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchLivraisons();
    fetchClients();
  }, []);

  const fetchLivraisons = async () => {
    try {
      setLoading(true);
      const data = await getAllLivraisons();
      setLivraisons(data);
      calculateStats(data);
    } catch (error) {
      setErrorMessage('Erreur lors du chargement des livraisons');
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const data = await getClients();
      setClients(data);
    } catch (error) {
      console.error(error);
    }
  };

  const calculateStats = (data) => {
    setStats({
      total: data.length,
      planifiee: data.filter(l => l.statut === 'planifiee').length,
      en_cours: data.filter(l => l.statut === 'en_cours').length,
      livree: data.filter(l => l.statut === 'livree').length,
    });
  };

  const filteredLivraisons = useMemo(() => {
    let filtered = livraisons.filter(l =>
      `${l.reference || ''} ${l.client?.nom || ''} ${l.client?.raisonSociale || ''}`.toLowerCase()
        .includes(searchTerm.toLowerCase()) &&
      (filterStatut === 'all' || l.statut === filterStatut)
    );
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return filtered;
  }, [livraisons, searchTerm, filterStatut]);

  const paginatedLivraisons = filteredLivraisons.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
  const totalPages = Math.ceil(filteredLivraisons.length / rowsPerPage);

  const openDeliveryModal = (livraison) => {
    setCurrentLivraison(livraison);
    setDeliveryModalOpen(true);
  };

  // 🔥 Gestion de la sauvegarde (avec withFacture)
  const handleSaveDelivery = async (livraisonId, produitsLivres, chauffeurId, vehiculeId, withFacture = false) => {
    setIsSaving(true);
    try {
      const dateLivraison = new Date().toISOString().split('T')[0];
      const result = await appliquerLivraison(
        livraisonId,
        produitsLivres,
        dateLivraison,
        vehiculeId,
        chauffeurId,
        withFacture
      );
      setSuccessMessage(result.message || 'Livraison effectuée avec succès');
      await fetchLivraisons();
      setDeliveryModalOpen(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Erreur lors de l\'enregistrement';
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteLivraison(deleteConfirm._id);
      setSuccessMessage('Livraison supprimée avec succès');
      fetchLivraisons();
      setDeleteConfirm(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setErrorMessage('Erreur lors de la suppression');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateLivraison(id, { statut: newStatus });
      setSuccessMessage(`Statut mis à jour : ${newStatus}`);
      fetchLivraisons();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setErrorMessage('Erreur lors du changement de statut');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const handleEdit = (livraison) => {
    navigate(`/livraisons/${livraison._id}/edit`);
  };

  const exportToCSV = () => {
    const headers = ['Référence', 'Client', 'Statut', 'Date création'];
    const rows = filteredLivraisons.map(l => [
      l.reference,
      l.client?.nom || l.client?.raisonSociale || '',
      l.statut,
      new Date(l.createdAt).toLocaleDateString(),
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `livraisons_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#e2f0d6] border-t-[#8bb56a]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 lg:p-6">
      {successMessage && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 rounded-lg bg-green-500 text-white px-4 py-2 shadow-lg">
          <CheckCircle size={18} /> {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 rounded-lg bg-red-500 text-white px-4 py-2 shadow-lg">
          <AlertTriangle size={18} /> {errorMessage}
        </div>
      )}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">Livraisons</h1>
          <p className="mt-1 text-slate-500">Gérez les livraisons associées aux commandes</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-gray-50"
          >
            <Download size={18} /> Exporter CSV
          </button>
        </div>
      </div>

      <LivraisonStats stats={stats} />
      <LivraisonFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterStatut={filterStatut}
        onFilterChange={setFilterStatut}
        onRefresh={fetchLivraisons}
      />

      <div className="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-gray-100">
        <LivraisonTable
          livraisons={paginatedLivraisons}
          onRowClick={(l) => navigate(`/livraisons/${l._id}`)}
          onDeleteClick={setDeleteConfirm}
          onEdit={handleEdit}
          onStatusChange={handleStatusChange}
          onDeliver={openDeliveryModal}
        />

        {filteredLivraisons.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-4 py-3">
            <div className="text-sm text-slate-500">
              <span className="font-medium">{page * rowsPerPage + 1}</span> -{' '}
              <span className="font-medium">{Math.min((page + 1) * rowsPerPage, filteredLivraisons.length)}</span> sur{' '}
              <span className="font-medium">{filteredLivraisons.length}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-gray-100 disabled:opacity-40"
              >
                ← Précédent
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-gray-100 disabled:opacity-40"
              >
                Suivant →
              </button>
            </div>
          </div>
        )}
      </div>

      {deliveryModalOpen && currentLivraison && (
        <LivraisonQuantityModal
          livraison={currentLivraison}
          onSave={handleSaveDelivery}
          onClose={() => setDeliveryModalOpen(false)}
          isSaving={isSaving}
        />
      )}

      {deleteConfirm && (
        <DeleteConfirmModal
          livraison={deleteConfirm}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
};

export default Livraisons;