// pages/devis.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, CheckCircle, AlertTriangle } from 'lucide-react';
import { getAllDevis, createDevis, updateDevis, deleteDevis, acceptDevis, refuseDevis, negocierDevis } from '../services/devis.service';
import DevisStats from '../components/devis/DevisStats';
import DevisFilters from '../components/devis/DevisFilters';
import DevisTable from '../components/devis/DevisTable';
import DevisFormStepper from '../components/devis/DevisFormStepper';
import DeleteConfirmModal from '../components/devis/DeleteConfirmModal';

const DevisPage = () => {
  const navigate = useNavigate();
  const [devis, setDevis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(10);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDevis, setEditingDevis] = useState(null);
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchDevis();
  }, []);

  const fetchDevis = async () => {
    try {
      setLoading(true);
      const data = await getAllDevis();
      setDevis(data);
    } catch (error) {
      console.error(error);
      setErrorMessage('Erreur lors du chargement des devis');
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const filteredDevis = devis.filter(d =>
    `${d.reference || ''} ${d.client?.nom || ''} ${d.client?.raisonSociale || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRowClick = (devi) => {
    navigate(`/devis/${devi._id}`);
  };

  const handleInputChange = (path, value) => {
    setFormData(prev => {
      const keys = path.split('.');
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

  const openCreateModal = () => {
    setEditingDevis(null);
    setFormData({
      client: '',
      produits: [],
      dateValidite: '',
      statut: 'en_attente'
    });
    setModalOpen(true);
  };

  const openEditModal = (devi) => {
    setEditingDevis(devi);
    setFormData({
      client: devi.client?._id || devi.client,
      produits: devi.produits.map(p => ({
        produit: p.produit?._id || p.produit,
        quantite: p.quantite,
        prixUnitaire: p.prixUnitaire,
        tauxTVA: p.tauxTVA || 20,
        total: p.total
      })),
      dateValidite: devi.dateValidite ? devi.dateValidite.split('T')[0] : '',
      statut: devi.statut
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingDevis) {
        await updateDevis(editingDevis._id, formData);
        setSuccessMessage('Devis modifié avec succès');
      } else {
        await createDevis(formData);
        setSuccessMessage('Devis créé avec succès');
      }
      setModalOpen(false);
      fetchDevis();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.response?.data?.message || 'Erreur lors de l\'enregistrement');
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteDevis(deleteConfirm._id);
      setSuccessMessage('Devis supprimé avec succès');
      fetchDevis();
      setDeleteConfirm(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setErrorMessage('Erreur lors de la suppression');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const handleAccept = async (id) => {
    try {
      await acceptDevis(id);
      setSuccessMessage('Devis accepté avec succès');
      fetchDevis();
    } catch (err) {
      setErrorMessage('Erreur lors de l\'acceptation');
    }
  };

  const handleRefuse = async (id) => {
    try {
      await refuseDevis(id);
      setSuccessMessage('Devis refusé');
      fetchDevis();
    } catch (err) {
      setErrorMessage('Erreur lors du refus');
    }
  };

  const handleNegociate = async (id) => {
    try {
      await negocierDevis(id);
      setSuccessMessage('Devis marqué comme à négocier');
      fetchDevis();
    } catch (err) {
      setErrorMessage('Erreur lors de la mise à jour');
    }
  };

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-4 border-[#e2f0d6] border-t-[#8bb56a]" /></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 lg:p-6">
      {successMessage && (
        <div className="fixed top-20 right-4 z-[300] flex items-center gap-2 rounded-lg bg-green-500 text-white px-4 py-2 shadow-lg">
          <CheckCircle size={18} /> {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="fixed top-20 right-4 z-[300] flex items-center gap-2 rounded-lg bg-red-500 text-white px-4 py-2 shadow-lg">
          <AlertTriangle size={18} /> {errorMessage}
        </div>
      )}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">Devis</h1>
          <p className="mt-1 text-slate-500">Gérez vos devis et leurs statuts</p>
        </div>
        <button
          onClick={openCreateModal}
          className="group flex items-center gap-2 rounded-xl bg-[#e2f0d6] px-5 py-2.5 text-sm font-semibold text-[#5a7c3c] hover:bg-[#d4e6b0]"
        >
          <Plus size={18} /> Nouveau devis
        </button>
      </div>

      <DevisStats devis={devis} />
      <DevisFilters searchTerm={searchTerm} onSearchChange={setSearchTerm} onRefresh={fetchDevis} />

      <div className="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-gray-100">
        <DevisTable
          devis={filteredDevis}
          page={page}
          rowsPerPage={rowsPerPage}
          setPage={setPage}
          onRowClick={handleRowClick}
          onDeleteClick={setDeleteConfirm}
          onAccept={handleAccept}
          onRefuse={handleRefuse}
          onNegociate={handleNegociate}
          onEdit={openEditModal}
        />
      </div>

      {modalOpen && (
        <DevisFormStepper
          formData={formData}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
          onClose={() => setModalOpen(false)}
          isSubmitting={isSubmitting}
          editingDevis={editingDevis}
        />
      )}

      <DeleteConfirmModal devis={deleteConfirm} onConfirm={handleDelete} onCancel={() => setDeleteConfirm(null)} />
    </div>
  );
};

export default DevisPage;