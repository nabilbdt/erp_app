// pages/Paiements.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom'; // 👈 ajout pour la navigation
import { Plus, Download, CheckCircle, AlertTriangle } from 'lucide-react';
import PaiementStats from '../components/paiement/PaiementStats';
import PaiementFilters from '../components/paiement/PaiementFilters';
import PaiementTable from '../components/paiement/PaiementTable';
import PaiementFormModal from '../components/paiement/PaiementFormModal';
import PaiementPaymentModal from '../components/paiement/PaiementPaymentModal';
import PaiementDeleteConfirmModal from '../components/paiement/PaiementDeleteConfirmModal';
import {
  getPaiements,
  createPaiement,
  updatePaiement,
  effectuerPaiement,
  deletePaiement,
} from '../services/paiement.service';
import { getClients } from '../services/client.service';
import { getAllFactures } from '../services/facture.service';

const Paiements = () => {
  const navigate = useNavigate(); // 👈 initialisation

  const [paiements, setPaiements] = useState([]);
  const [clients, setClients] = useState([]);
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [stats, setStats] = useState({ totalDu: 0, totalPaye: 0, totalReste: 0, enRetard: 0 });

  const [modalOpen, setModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [currentPaiement, setCurrentPaiement] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [paiementsRes, clientsRes, facturesRes] = await Promise.all([
        getPaiements(),
        getClients(),
        getAllFactures(),
      ]);
      setPaiements(paiementsRes.data);
      setClients(clientsRes);
      setFactures(facturesRes);
      calculateStats(paiementsRes.data);
    } catch (err) {
      setErrorMessage('Erreur chargement des données');
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const totalDu = data.reduce((sum, p) => sum + (p.montantAPayer || 0), 0);
    const totalPaye = data.reduce((sum, p) => sum + (p.montantPaye || 0), 0);
    const totalReste = totalDu - totalPaye;
    const today = new Date();
    const enRetard = data.filter(p => p.statut !== 'paye' && new Date(p.datePaiementPrevue) < today).length;
    setStats({ totalDu, totalPaye, totalReste, enRetard });
  };

  const filteredPaiements = useMemo(() => {
    let filtered = paiements.filter((p) => {
      const matchSearch =
        `${p.reference || ''} ${p.client?.nom || ''} ${p.client?.raisonSociale || ''} ${p.facture?.reference || ''}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchStatut = filterStatut === 'all' || p.statut === filterStatut;
      return matchSearch && matchStatut;
    });
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return filtered;
  }, [paiements, searchTerm, filterStatut]);

  const handleSave = async (formData) => {
    setIsSaving(true);
    try {
      let updatedList;
      if (currentPaiement) {
        // Modification
        const response = await updatePaiement(currentPaiement._id, formData);
        const updated = response.data;
        updatedList = paiements.map(p => p._id === updated._id ? updated : p);
        setPaiements(updatedList);
        setSuccessMessage('Paiement modifié');
      } else {
        // Création
        const response = await createPaiement(formData);
        const created = response.data;
        updatedList = [created, ...paiements];
        setPaiements(updatedList);
        setSuccessMessage('Paiement créé');
      }
      calculateStats(updatedList); // 🔁 met à jour les statistiques immédiatement
      setModalOpen(false);
      setCurrentPaiement(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Erreur sauvegarde');
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePayment = async ({ montant, modePaiement, remarque }) => {
    if (!currentPaiement) return;
    setIsSaving(true);
    try {
      const response = await effectuerPaiement(currentPaiement._id, { montant, modePaiement, remarque });
      const updated = response.data;
      const newPaiements = paiements.map(p => p._id === updated._id ? updated : p);
      setPaiements(newPaiements);
      calculateStats(newPaiements); // 🔁 met à jour les stats
      setSuccessMessage(`Paiement de ${montant} DH enregistré`);
      setPaymentModalOpen(false);
      setCurrentPaiement(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setErrorMessage('Erreur lors du paiement');
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deletePaiement(deleteConfirm._id);
      const newPaiements = paiements.filter(p => p._id !== deleteConfirm._id);
      setPaiements(newPaiements);
      calculateStats(newPaiements); // 🔁 met à jour les stats
      setSuccessMessage('Paiement supprimé');
      setDeleteConfirm(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setErrorMessage('Erreur suppression');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const exportToCSV = () => {
    const headers = ['Référence', 'Client', 'Facture', 'Montant dû', 'Payé', 'Reste', 'Statut', 'Date prévue'];
    const rows = filteredPaiements.map((p) => [
      p.reference,
      p.client?.nom || p.client?.raisonSociale || '',
      p.facture?.reference || '',
      p.montantAPayer || 0,
      p.montantPaye || 0,
      p.resteAPayer || 0,
      p.statut,
      new Date(p.datePaiementPrevue).toLocaleDateString('fr-FR'),
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `paiements_${new Date().toISOString().split('T')[0]}.csv`;
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
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">Paiements</h1>
          <p className="mt-1 text-slate-500">Gérez les paiements de vos clients</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setCurrentPaiement(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <Plus size={18} /> Nouveau paiement
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-gray-50"
          >
            <Download size={18} /> Exporter CSV
          </button>
        </div>
      </div>

      <PaiementStats stats={stats} />
      <PaiementFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterStatut={filterStatut}
        onFilterStatutChange={setFilterStatut}
        onRefresh={fetchAllData}
      />

      <div className="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-gray-100">
        <PaiementTable
          paiements={filteredPaiements}
          onRowClick={(p) => navigate(`/paiements/${p._id}`)} // 👈 navigation vers le détail
          onEdit={(p) => {
            setCurrentPaiement(p);
            setModalOpen(true);
          }}
          onPay={(p) => {
            setCurrentPaiement(p);
            setPaymentModalOpen(true);
          }}
          onDelete={setDeleteConfirm}
          page={page}
          rowsPerPage={rowsPerPage}
          setPage={setPage}
          setRowsPerPage={setRowsPerPage}
        />
      </div>

      <PaiementFormModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setCurrentPaiement(null);
        }}
        onSubmit={handleSave}
        initialData={currentPaiement}
        clients={clients}
        factures={factures}
        isSaving={isSaving}
      />

      <PaiementPaymentModal
        isOpen={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setCurrentPaiement(null);
        }}
        onSubmit={handlePayment}
        paiement={currentPaiement}
        isSaving={isSaving}
      />

      {deleteConfirm && (
        <PaiementDeleteConfirmModal
          paiement={deleteConfirm}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
};

export default Paiements;