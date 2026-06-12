// pages/Commandes.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Download, CheckCircle, AlertTriangle, Package } from 'lucide-react';
import {
  getAllCommandes,
  createCommande,
  updateCommande,
  updateStatutCommande,
  deleteCommande,
} from '../services/commande.service';
import { getClients } from '../services/client.service';
import { getAllDevis } from '../services/devis.service';
import { getAllProduits } from '../services/produit.service';
import CommandeStats from '../components/commande/CommandeStats';
import CommandeFilters from '../components/commande/CommandeFilters';
import CommandeTable from '../components/commande/CommandeTable';
import CommandeFormStepper from '../components/commande/CommandeFormStepper';
import DeleteConfirmModal from '../components/commande/DeleteConfirmModal';

const CommandesPage = () => {
  const navigate = useNavigate();
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(10);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [stats, setStats] = useState({ total: 0, en_cours: 0, confirme: 0, livree: 0, annulee: 0 });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCommande, setEditingCommande] = useState(null);
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [clients, setClients] = useState([]);
  const [devisList, setDevisList] = useState([]);
  const [produits, setProduits] = useState([]);

  useEffect(() => {
    fetchCommandes();
    fetchClients();
    fetchDevis();
    fetchProduits();
  }, []);

  const fetchCommandes = async () => {
    try {
      setLoading(true);
      const data = await getAllCommandes();
      setCommandes(data);
      calculateStats(data);
    } catch (error) {
      setErrorMessage('Erreur lors du chargement des commandes');
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const data = await getClients();
      setClients(data);
    } catch (error) { console.error(error); }
  };
  const fetchDevis = async () => {
    try {
      const data = await getAllDevis();
      setDevisList(data);
    } catch (error) { console.error(error); }
  };
  const fetchProduits = async () => {
    try {
      const data = await getAllProduits();
      setProduits(data);
    } catch (error) { console.error(error); }
  };

  const calculateStats = (data) => {
    setStats({
      total: data.length,
      en_cours: data.filter(c => c.statut === 'en_cours').length,
      confirme: data.filter(c => c.statut === 'confirme').length,
      livree: data.filter(c => c.statut === 'livree').length,
      annulee: data.filter(c => c.statut === 'annulee').length,
    });
  };

  const filteredCommandes = useMemo(() => {
    let filtered = commandes.filter(c =>
      `${c.reference || ''} ${c.client?.nom || ''} ${c.client?.raisonSociale || ''}`.toLowerCase()
        .includes(searchTerm.toLowerCase()) &&
      (filterStatut === 'all' || c.statut === filterStatut)
    );
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return filtered;
  }, [commandes, searchTerm, filterStatut]);

  const paginatedCommandes = filteredCommandes.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
  const totalPages = Math.ceil(filteredCommandes.length / rowsPerPage);

  const openCreateModal = () => {
    setEditingCommande(null);
    setFormData({ devis: '', client: '', statut: 'en_cours', produits: [] });
    setModalOpen(true);
  };
  const openEditModal = (commande) => {
    setEditingCommande(commande);
    setFormData({
      devis: commande.devis?._id || commande.devis || '',
      client: commande.client?._id || commande.client || '',
      statut: commande.statut,
      produits: commande.produits.map(p => ({
        produit: p.produit?._id || p.produit,
        quantite: p.quantite,
        prixUnitaire: p.prixUnitaire,
        total: p.total
      }))
    });
    setModalOpen(true);
  };

  const handleInputChange = (path, value) => {
    const keys = path.split('.');
    setFormData(prev => {
      const newData = { ...prev };
      let current = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const submitData = {
        devis: formData.devis,
        client: formData.client,
        statut: formData.statut,
        produits: formData.produits.map(p => ({
          produit: p.produit,
          quantite: p.quantite,
          prixUnitaire: p.prixUnitaire
        }))
      };
      if (editingCommande) {
        await updateCommande(editingCommande._id, submitData);
        setSuccessMessage('Commande modifiée avec succès');
      } else {
        await createCommande(submitData);
        setSuccessMessage('Commande créée avec succès');
      }
      setModalOpen(false);
      fetchCommandes();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Erreur lors de l\'enregistrement');
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteCommande(deleteConfirm._id);
      setSuccessMessage('Commande supprimée avec succès');
      fetchCommandes();
      setDeleteConfirm(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setErrorMessage('Erreur lors de la suppression');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // 🟢 handleStatusChange mis à jour pour gérer le warning (ex: échec création livraison)
  const handleStatusChange = async (id, newStatus) => {
    try {
      const response = await updateStatutCommande(id, newStatus);
      setSuccessMessage(`Statut mis à jour : ${newStatus}`);
      if (response.warning) {
        // Afficher le warning comme une erreur temporaire (ou créez un état warningMessage dédié)
        setErrorMessage(`⚠️ ${response.warning}`);
        setTimeout(() => setErrorMessage(null), 6000);
      } else {
        setTimeout(() => setSuccessMessage(null), 3000);
      }
      fetchCommandes();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Erreur lors du changement de statut');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const exportToCSV = () => {
    const headers = ['Référence', 'Client', 'Montant (DH)', 'Statut', 'Date'];
    const rows = filteredCommandes.map(c => [
      c.reference,
      c.client?.nom || c.client?.raisonSociale || '',
      c.montantTotal || 0,
      c.statut,
      new Date(c.createdAt).toLocaleDateString()
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `commandes_${new Date().toISOString().split('T')[0]}.csv`;
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
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 rounded-lg bg-green-500 text-white px-4 py-2 shadow-lg animate-in slide-in-from-top-5">
          <CheckCircle size={18} /> {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 rounded-lg bg-red-500 text-white px-4 py-2 shadow-lg animate-in slide-in-from-top-5">
          <AlertTriangle size={18} /> {errorMessage}
        </div>
      )}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white">Commandes</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Gérez l'ensemble de vos commandes clients</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-gray-50"
          >
            <Download size={18} /> Exporter CSV
          </button>
          <button
            onClick={openCreateModal}
            className="group flex items-center gap-2 rounded-xl bg-[#e2f0d6] px-5 py-2.5 text-sm font-semibold text-[#5a7c3c] transition-all hover:bg-[#d4e6b0] hover:shadow-md"
          >
            <Plus size={18} className="transition-transform group-hover:scale-110" /> Nouvelle commande
          </button>
        </div>
      </div>

      <CommandeStats stats={stats} />
      <CommandeFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterStatut={filterStatut}
        onFilterChange={setFilterStatut}
        onRefresh={fetchCommandes}
      />

      <div className="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-gray-100">
        <CommandeTable
          commandes={paginatedCommandes}
          onRowClick={(c) => navigate(`/commandes/${c._id}`)}
          onDeleteClick={setDeleteConfirm}
          onEdit={openEditModal}
          onStatusChange={handleStatusChange}
        />

        {filteredCommandes.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-4 py-3">
            <div className="text-sm text-slate-500">
              <span className="font-medium">{page * rowsPerPage + 1}</span> -{' '}
              <span className="font-medium">{Math.min((page + 1) * rowsPerPage, filteredCommandes.length)}</span> sur{' '}
              <span className="font-medium">{filteredCommandes.length}</span>
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

      {modalOpen && (
        <CommandeFormStepper
          formData={formData}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
          onClose={() => setModalOpen(false)}
          isSubmitting={isSubmitting}
          editingCommande={editingCommande}
          clients={clients}
          devisList={devisList}
          produits={produits}
        />
      )}

      {deleteConfirm && (
        <DeleteConfirmModal
          commande={deleteConfirm}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
};

export default CommandesPage;