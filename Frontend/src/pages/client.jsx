// pages/client.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Download, CheckCircle, AlertTriangle } from "lucide-react";
import * as clientService from "../services/client.service";
import ClientFormStepper from "../components/client/ClientFormStepper";
import ClientStatsCards from "../components/client/ClientStatsCards";
import ClientFilters from "../components/client/ClientFilters";
import ClientTable from "../components/client/ClientTable";
import ClientPagination from "../components/client/ClientPagination";
import DeleteConfirmModal from "../components/client/DeleteConfirmModal";

const ClientsPage = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterType, setFilterType] = useState("all");
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [stats, setStats] = useState({ total: 0, particuliers: 0, entreprises: 0, actifs: 0 });

  // Modale création/édition
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const data = await clientService.getClients();
      setClients(data);
      calculateStats(data);
    } catch (error) {
      console.error("Erreur chargement clients:", error);
      setErrorMessage("Erreur lors du chargement des clients");
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (clientsData) => {
    setStats({
      total: clientsData.length,
      particuliers: clientsData.filter(c => c.type === "particulier").length,
      entreprises: clientsData.filter(c => c.type === "entreprise").length,
      actifs: clientsData.filter(c => c.statut !== "inactif").length
    });
  };

  const handleRowClick = (client) => {
    navigate(`/client/${client._id}`);
  };

  // Filtrer et trier
  const filteredAndSortedClients = React.useMemo(() => {
    let filtered = clients.filter((client) => {
      const searchString = `${client.reference || ""} ${client.nom || ""} ${client.prenom || ""} ${client.raisonSociale || ""} ${client.email || ""}`.toLowerCase();
      const matchesSearch = searchString.includes(searchTerm.toLowerCase());
      const matchesType = filterType === "all" || client.type === filterType;
      return matchesSearch && matchesType;
    });

    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (sortField === "nomComplet") {
        aVal = a.type === "particulier" ? `${a.nom} ${a.prenom}` : a.raisonSociale;
        bVal = b.type === "particulier" ? `${b.nom} ${b.prenom}` : b.raisonSociale;
      }
      
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [clients, searchTerm, filterType, sortField, sortOrder]);

  const paginatedClients = filteredAndSortedClients.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const exportToCSV = () => {
    const headers = ["Référence", "Nom/Raison sociale", "Type", "Email", "Téléphone", "Ville"];
    const csvData = filteredAndSortedClients.map(client => [
      client.reference || `CL-${client._id?.slice(-6)}`,
      client.type === "particulier" ? `${client.nom || ""} ${client.prenom || ""}` : client.raisonSociale,
      client.type === "particulier" ? "Particulier" : "Entreprise",
      client.email || "",
      client.telephone || "",
      client.siege?.ville || ""
    ]);
    
    const csvContent = [headers, ...csvData].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `clients_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
    URL.revokeObjectURL(url);
  };

  // Handlers formulaire (générique pour chemins pointés)
  const handleInputChange = (path, value) => {
    const keys = path.split(".");
    setFormData((prev) => {
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

  // Validation simple pour l'étape 1 (inchangée, mais les clés sont cohérentes)
  const validateStep = () => {
    const errors = {};
    if (currentStep === 1) {
      if (formData.type === "particulier") {
        if (!formData.nom?.trim()) errors.nom = "Le nom est requis";
        if (!formData.prenom?.trim()) errors.prenom = "Le prénom est requis";
      } else {
        if (!formData.raisonSociale?.trim()) errors.raisonSociale = "La raison sociale est requise";
      }
      if (!formData.email?.trim()) {
        errors.email = "L'email est requis";
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        errors.email = "Email invalide";
      }
      if (!formData.telephone?.trim()) errors.telephone = "Le téléphone est requis";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateStep()) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => setCurrentStep((prev) => prev - 1);

  // Soumission – plus de transformation lourde, on envoie formData directement
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (currentStep !== 4) {
      nextStep();
      return;
    }
    
    if (!validateStep()) return;

    setIsSubmitting(true);
    
    try {
      // Copie des données
      const clientData = { ...formData };

      // Si particulier, fusionner nom et prénom dans le champ "nom" (schéma requis)
      if (clientData.type === "particulier") {
        clientData.nom = `${clientData.nom || ""} ${clientData.prenom || ""}`.trim();
        delete clientData.prenom; // facultatif, car schéma n'a pas prenom
      } else {
        // Pour entreprise, le champ "nom" est obligatoire, on met la raison sociale
        clientData.nom = clientData.raisonSociale;
      }

      // Nettoyer les champs vides si nécessaire (optionnel)
      if (clientData.adresses && clientData.adresses.length === 0) delete clientData.adresses;
      
      // Debug : afficher ce qui est envoyé
      console.log("🚀 Données envoyées au backend :", JSON.stringify(clientData, null, 2));

      if (editingClient) {
        await clientService.updateClient(editingClient._id, clientData);
        setSuccessMessage("Client modifié avec succès !");
      } else {
        await clientService.createClient(clientData);
        setSuccessMessage("Client créé avec succès !");
      }
      resetModal();
      await fetchClients();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      console.error("Détails backend:", error.response?.data);
      setErrorMessage(error.response?.data?.message || "Erreur lors de l'enregistrement");
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetModal = () => {
    setModalOpen(false);
    setEditingClient(null);
    setCurrentStep(0);
    setFormData({
      type: "particulier",
      nom: "",
      prenom: "",
      raisonSociale: "",
      email: "",
      telephone: "",
      siege: { rue: "", ville: "", codePostal: "", pays: "Maroc" },
      adresses: [],
      ice: "",
      if: "",
      rc: "",
      conditionPaiement: {
        modePaiement: "virement",
        duree: 30,
        banque: { nomBanque: "", rib: "", iban: "", swift: "" }
      }
    });
    setFormErrors({});
  };

  const openCreateModal = () => {
    resetModal();
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await clientService.deleteClient(deleteConfirm._id);
      setDeleteConfirm(null);
      await fetchClients();
      setSuccessMessage("Client supprimé avec succès !");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Erreur suppression:", error);
      setErrorMessage("Erreur lors de la suppression");
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#e2f0d6] border-t-[#8bb56a]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 dark:from-slate-900 dark:to-slate-800 lg:p-6">
      {/* Toasts */}
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

      {/* En-tête */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white">Clients</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Gérez votre portefeuille clients</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-gray-50"
          >
            <Download size={18} /> Exporter
          </button>
          <button 
            onClick={openCreateModal} 
            className="group flex items-center gap-2 rounded-xl bg-[#e2f0d6] px-5 py-2.5 text-sm font-semibold text-[#5a7c3c] transition-all hover:bg-[#d4e6b0] hover:shadow-md"
          >
            <Plus size={18} className="transition-transform group-hover:scale-110" /> Nouveau client
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <ClientStatsCards stats={stats} />

      {/* Filtres */}
      <ClientFilters 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterType={filterType}
        onFilterChange={setFilterType}
        onRefresh={fetchClients}
      />

      {/* Tableau */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-gray-100 dark:bg-slate-900">
        <ClientTable 
          clients={paginatedClients}
          onRowClick={handleRowClick}
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
        
        <ClientPagination 
          total={filteredAndSortedClients.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(value) => {
            setRowsPerPage(value);
            setPage(0);
          }}
        />
      </div>

      {/* Modal formulaire (stepper) */}
      {modalOpen && (
        <ClientFormStepper
          editingClient={editingClient}
          formData={formData}
          formErrors={formErrors}
          currentStep={currentStep}
          onInputChange={handleInputChange}
          onPrev={prevStep}
          onNext={nextStep}
          onSubmit={handleSubmit}
          onClose={resetModal}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Modal suppression */}
      <DeleteConfirmModal 
        client={deleteConfirm}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
};

export default ClientsPage;