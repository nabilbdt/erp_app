// pages/ProduitsPage.js
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, CheckCircle, AlertTriangle } from "lucide-react";
import produitService from "../services/produit.Service";
import ProduitStats from "../components/produit/ProduitStats";
import ProduitSearchBar from "../components/produit/ProduitSearchBar";
import ProduitTable from "../components/produit/ProduitTable";
import ProduitFormStepper from "../components/produit/ProduitFormStepper";

const ProduitsPage = () => {
  const navigate = useNavigate();
  const [produits, setProduits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduit, setEditingProduit] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchProduits();
    fetchCategories();
    fetchFournisseurs();
  }, []);

  const fetchProduits = async () => {
    try {
      setLoading(true);
      const data = await produitService.getProduits();
      setProduits(data);
    } catch (error) {
      console.error(error);
      setErrorMessage("Erreur lors du chargement");
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const categorieService = (await import("../services/categorie.Service")).default;
      const data = await categorieService.getAll();
      setCategories(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchFournisseurs = async () => {
    try {
      const fournisseurService = (await import("../services/fournisseur.Service")).default;
      const data = await fournisseurService.getAll();
      setFournisseurs(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleRowClick = (produit) => {
    navigate(`/produit/${produit._id}`);
  };

  const resetModal = () => {
    setModalOpen(false);
    setEditingProduit(null);
    setCurrentStep(0);
    setFormData({
      designation: "",
      reference: "",
      categorie: "",
      typeProduit: "vente",
      prixAchat: 0,
      prixVente: 0,
      tauxTVA: 20,
      stock: 0,
      stockMin: 0,
      emplacement: "",
      uniteVente: "pièce",
      uniteAchat: "pièce",
      fournisseur: "",
      poids: "",
      codeBarre: "",
      composantes: [],
      actif: true,
    });
    setFormErrors({});
  };

  const openCreateModal = () => {
    resetModal();
    setModalOpen(true);
  };

  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: val }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  }, []);

  const handleArrayChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const validateStep = useCallback(() => {
    const errors = {};
    if (currentStep === 0) {
      if (!formData.designation?.trim()) errors.designation = "Désignation requise";
      if (!formData.categorie) errors.categorie = "Catégorie requise";
    }
    if (currentStep === 1) {
      if (!formData.prixVente || formData.prixVente <= 0) errors.prixVente = "Prix de vente > 0 requis";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [currentStep, formData.designation, formData.categorie, formData.prixVente]);

  const nextStep = useCallback(() => {
    if (validateStep()) setCurrentStep((s) => s + 1);
  }, [validateStep]);

  const prevStep = useCallback(() => setCurrentStep((s) => s - 1), []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentStep !== 2) {
      nextStep();
      return;
    }
    if (!validateStep()) return;
    setIsSubmitting(true);
    try {
      if (editingProduit) {
        await produitService.updateProduit(editingProduit._id, formData);
        setSuccessMessage("Produit modifié");
      } else {
        await produitService.createProduit(formData);
        setSuccessMessage("Produit créé");
      }
      resetModal();
      fetchProduits();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setErrorMessage("Erreur lors de l'enregistrement");
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = {
    total: produits.length,
    stockFaible: produits.filter(p => p.typeProduit !== "service" && p.stock <= p.stockMin && p.actif).length,
    valeurStock: produits.reduce((sum, p) => sum + ((p.prixAchat || 0) * (p.stock || 0)), 0),
    actifs: produits.filter(p => p.actif).length,
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#e2f0d6] border-t-[#8bb56a]" />
      </div>
    );
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

      <div className="mb-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800">Produits</h1>
            <p className="mt-1 text-slate-500">Gérez votre catalogue produits</p>
          </div>
          <button onClick={openCreateModal} className="group flex items-center gap-2 rounded-xl bg-[#e2f0d6] px-5 py-2.5 text-sm font-semibold text-[#5a7c3c] hover:bg-[#d4e6b0]">
            <Plus size={18} /> Nouveau produit
          </button>
        </div>
        <ProduitStats stats={stats} />
      </div>

      <div className="mb-6">
        <ProduitSearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      </div>

      <ProduitTable
        produits={produits.filter(p =>
          `${p.reference || ""} ${p.designation} ${p.codeBarre || ""} ${p.categorie?.nom || ""}`
            .toLowerCase().includes(searchTerm.toLowerCase())
        )}
        page={page}
        rowsPerPage={rowsPerPage}
        setPage={setPage}
        onRowClick={handleRowClick}
      />

      {modalOpen && (
        <ProduitFormStepper
          editingProduit={editingProduit}
          formData={formData}
          formErrors={formErrors}
          currentStep={currentStep}
          onInputChange={handleInputChange}
          onArrayChange={handleArrayChange}
          onPrev={prevStep}
          onNext={nextStep}
          onSubmit={handleSubmit}
          onClose={resetModal}
          isSubmitting={isSubmitting}
          categories={categories}
          fournisseurs={fournisseurs}
        />
      )}
    </div>
  );
};

export default ProduitsPage;