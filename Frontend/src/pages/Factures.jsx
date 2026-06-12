import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Download, CheckCircle, AlertTriangle, Plus } from "lucide-react";
import FactureStats from "../components/facture/FactureStats";
import FactureFilters from "../components/facture/FactureFilters";
import FactureTable from "../components/facture/FactureTable";
import FactureModal from "../components/facture/FactureModal";
import DeleteConfirmModal from "../components/facture/DeleteConfirmModal";
import {
  getAllFactures,
  getFactureById,
  updateFacture,
  deleteFacture,
  envoyerFactureEmail,
  telechargerPDFFacture,
} from "../services/facture.service";
import { getClients } from "../services/client.service";

const Factures = () => {
  const navigate = useNavigate();
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatut, setFilterStatut] = useState("all");
  const [filterPaiement, setFilterPaiement] = useState("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(10);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    brouillon: 0,
    envoyee: 0,
    payee: 0,
  });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentFacture, setCurrentFacture] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [clients, setClients] = useState([]);

  useEffect(() => {
    fetchFactures();
    fetchClients();
  }, []);

  const fetchFactures = async () => {
    try {
      setLoading(true);
      const data = await getAllFactures();
      setFactures(data);
      calculateStats(data);
    } catch (error) {
      setErrorMessage("Erreur chargement factures");
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
      brouillon: data.filter((f) => f.statut === "brouillon").length,
      envoyee: data.filter((f) => f.statut === "envoyee").length,
      payee: data.filter((f) => f.statutPaiement === "paye").length,
    });
  };

  const filteredFactures = useMemo(() => {
    let filtered = factures.filter((f) => {
      const matchSearch =
        `${f.reference || ""} ${f.client?.nom || ""} ${f.client?.raisonSociale || ""}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchStatut = filterStatut === "all" || f.statut === filterStatut;
      const matchPaiement =
        filterPaiement === "all" || f.statutPaiement === filterPaiement;
      return matchSearch && matchStatut && matchPaiement;
    });
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return filtered;
  }, [factures, searchTerm, filterStatut, filterPaiement]);

  const paginatedFactures = filteredFactures.slice(
    page * rowsPerPage,
    (page + 1) * rowsPerPage
  );
  const totalPages = Math.ceil(filteredFactures.length / rowsPerPage);

  const handleOpenModal = (facture = null) => {
    setCurrentFacture(facture);
    setModalOpen(true);
  };

  const handleSave = async (formData) => {
    setIsSaving(true);
    try {
      if (currentFacture) {
        await updateFacture(currentFacture._id, formData);
        setSuccessMessage("Facture modifiée");
      } else {
        await createFacture(formData);
        setSuccessMessage("Facture créée");
      }
      await fetchFactures();
      setModalOpen(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Erreur");
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteFacture(deleteConfirm._id);
      setSuccessMessage("Facture supprimée");
      fetchFactures();
      setDeleteConfirm(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setErrorMessage("Erreur suppression");
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const handleEnvoyerEmail = async (id) => {
    try {
      await envoyerFactureEmail(id);
      setSuccessMessage("Email envoyé");
      fetchFactures();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setErrorMessage("Erreur envoi email");
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const handleDownloadPDF = async (id) => {
    try {
      const blob = await telechargerPDFFacture(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `facture_${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setErrorMessage("Erreur téléchargement PDF");
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const exportToCSV = () => {
    const headers = ["Référence", "Client", "Total TTC", "Statut", "Paiement", "Date"];
    const rows = filteredFactures.map((f) => [
      f.reference,
      f.client?.nom || f.client?.raisonSociale || "",
      f.totalTTC || 0,
      f.statut,
      f.statutPaiement,
      new Date(f.createdAt).toLocaleDateString(),
    ]);
    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `factures_${new Date().toISOString().split("T")[0]}.csv`;
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
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">Factures</h1>
          <p className="mt-1 text-slate-500">Gérez vos factures clients</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <Plus size={18} /> Nouvelle facture
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-gray-50"
          >
            <Download size={18} /> Exporter CSV
          </button>
        </div>
      </div>

      <FactureStats stats={stats} />
      <FactureFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterStatut={filterStatut}
        onFilterStatutChange={setFilterStatut}
        filterPaiement={filterPaiement}
        onFilterPaiementChange={setFilterPaiement}
        onRefresh={fetchFactures}
      />

      <div className="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-gray-100">
        <FactureTable
          factures={paginatedFactures}
          onRowClick={(f) => navigate(`/factures/${f._id}`)}
          onDeleteClick={setDeleteConfirm}
          onEdit={handleOpenModal}
          onEnvoyerEmail={handleEnvoyerEmail}
          onDownloadPDF={handleDownloadPDF}
        />

        {filteredFactures.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-4 py-3">
            <div className="text-sm text-slate-500">
              <span className="font-medium">{page * rowsPerPage + 1}</span> -{" "}
              <span className="font-medium">
                {Math.min((page + 1) * rowsPerPage, filteredFactures.length)}
              </span>{" "}
              sur <span className="font-medium">{filteredFactures.length}</span>
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
        <FactureModal
          facture={currentFacture}
          clients={clients}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
          isSaving={isSaving}
        />
      )}

      {deleteConfirm && (
        <DeleteConfirmModal
          facture={deleteConfirm}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
};

export default Factures;