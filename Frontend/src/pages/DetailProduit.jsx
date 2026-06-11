// src/pages/DetailProduit.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Edit, Trash2, Package, DollarSign, Warehouse, Tag, Factory,
  Barcode, Weight, MapPin, Calendar, Loader2, AlertCircle, CheckCircle, X,
  Building, Truck, Percent, Save, RefreshCw, Plus, Trash2 as TrashIcon,
  ChevronRight, TrendingUp, PieChart, Activity, Eye, Printer, Download
} from "lucide-react";

import produitService from "../services/produit.Service";
import categorieService from "../services/categorie.Service";
import fournisseurService from "../services/fournisseur.Service";
import BarcodeDisplay from "../components/produit/BarcodeDisplay";

// ========== Composants internes ==========
const StatusBadge = ({ status }) => (
  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
    status ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
  }`}>
    {status ? "Actif" : "Inactif"}
  </span>
);

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition-all hover:shadow-md">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
      </div>
      <div className={`rounded-xl ${color} p-3`}>
        <Icon size={22} className="text-white" />
      </div>
    </div>
  </div>
);

const SectionCard = ({ title, icon: Icon, children, onEdit, editMode }) => (
  <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
    <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
      <div className="flex items-center gap-2">
        <div className="rounded-lg bg-[#e2f0d6] p-1.5 text-[#5a7c3c]">
          <Icon size={18} />
        </div>
        <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
      </div>
      {onEdit && !editMode && (
        <button onClick={onEdit} className="rounded-lg p-1.5 text-slate-400 hover:bg-gray-100">
          <Edit size={16} />
        </button>
      )}
    </div>
    {children}
  </div>
);

const EditableInfoItem = ({ icon: Icon, label, value, isEditing, onChange, field, type = "text", options = [] }) => {
  if (isEditing) {
    return (
      <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
        <Icon size={18} className="mt-1 text-slate-400" />
        <div className="flex-1">
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">{label}</p>
          {type === "select" ? (
            <select
              value={value || ""}
              onChange={(e) => onChange(field, e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#8bb56a] focus:outline-none focus:ring-1 focus:ring-[#8bb56a]"
            >
              <option value="">Sélectionner</option>
              {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : (
            <input
              type={type}
              value={value || ""}
              onChange={(e) => onChange(field, e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#8bb56a] focus:outline-none focus:ring-1 focus:ring-[#8bb56a]"
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
      <Icon size={18} className="mt-1 text-slate-400" />
      <div className="flex-1">
        <p className="text-xs text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-slate-700 mt-0.5">{value || "—"}</p>
      </div>
    </div>
  );
};

const ComposanteItem = ({ composante }) => {
  const produit = composante.produit;
  const designation = produit?.designation || (typeof produit === "string" ? produit : "Produit inconnu");
  const reference = produit?.reference || "";
  return (
    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
      <div>
        <p className="font-medium text-slate-700">{designation}</p>
        <p className="text-xs text-slate-400">{reference}</p>
      </div>
      <span className="font-semibold text-[#5a7c3c]">Qté: {composante.quantite}</span>
    </div>
  );
};

// ========== Composant principal ==========
const DetailProduit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [produit, setProduit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  
  // Données pour les sélecteurs
  const [categories, setCategories] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  
  // Mode édition
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Chargement initial
  useEffect(() => {
    fetchProduit();
    fetchCategories();
    fetchFournisseurs();
  }, [id]);

  const fetchProduit = async () => {
    try {
      setLoading(true);
      const data = await produitService.getProduitById(id);
      setProduit(data);
      setEditData(data);
    } catch (err) {
      console.error(err);
      setError("Impossible de charger le produit");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await categorieService.getAll();
      setCategories(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFournisseurs = async () => {
    try {
      const data = await fournisseurService.getAll();
      setFournisseurs(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Gestion de l'édition
  const handleEditField = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = async () => {
    setIsSubmitting(true);
    try {
      // Construire le payload en nettoyant les objets
      const payload = {
        designation: editData.designation,
        categorie: editData.categorie?._id || editData.categorie,
        typeProduit: editData.typeProduit,
        prixAchat: parseFloat(editData.prixAchat) || 0,
        prixVente: parseFloat(editData.prixVente) || 0,
        tauxTVA: parseFloat(editData.tauxTVA) || 20,
        stock: parseInt(editData.stock) || 0,
        stockMin: parseInt(editData.stockMin) || 0,
        uniteVente: editData.uniteVente || "pièce",
        uniteAchat: editData.uniteAchat || "pièce",
        fournisseur: editData.fournisseur?._id || editData.fournisseur || null,
        actif: editData.actif,
        codeBarre: editData.codeBarre || null,
        emplacement: editData.emplacement || null,
        poids: editData.poids ? parseFloat(editData.poids) : null,
        composantes: editData.composantes || []
      };
      // Supprimer les champs vides
      Object.keys(payload).forEach(key => {
        if (payload[key] === null || payload[key] === undefined || payload[key] === "") {
          delete payload[key];
        }
      });
      
      await produitService.updateProduit(id, payload);
      setSuccessMessage("Produit modifié avec succès !");
      setEditMode(false);
      fetchProduit(); // recharger après modification
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la modification");
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await produitService.deleteProduit(id);
      setSuccessMessage("Produit supprimé");
      setTimeout(() => navigate("/produits"), 1500);
    } catch (err) {
      setError("Erreur lors de la suppression");
      setTimeout(() => setError(null), 3000);
    }
  };

  const generateRandomBarcode = () => {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const barcode = `${timestamp}${random}`;
    handleEditField("codeBarre", barcode);
  };

  // Helper pour obtenir le nom de la catégorie / fournisseur
  const getCategorieName = () => {
    if (editMode) return "";
    const cat = produit?.categorie;
    return cat?.nom || (typeof cat === "string" ? cat : "—");
  };

  const getFournisseurName = () => {
    if (editMode) return "";
    const f = produit?.fournisseur;
    return f?.nom || (typeof f === "string" ? f : "—");
  };

  // Options pour les sélecteurs
  const categorieOptions = categories.map(c => ({ value: c._id, label: c.nom }));
  const fournisseurOptions = fournisseurs.map(f => ({ value: f._id, label: f.nom }));
  const typeOptions = [
    { value: "Produit_Fini", label: "Produit fini (vente)" },
    { value: "service", label: "Service" },
    { value: "production", label: "Production / Matière première" }
  ];

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 size={48} className="animate-spin text-[#8bb56a]" />
      </div>
    );
  }

  if (error || !produit) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
          <p className="text-slate-600">{error || "Produit non trouvé"}</p>
          <button onClick={() => navigate("/produits")} className="mt-4 rounded-lg bg-[#e2f0d6] px-4 py-2 text-[#5a7c3c]">Retour</button>
        </div>
      </div>
    );
  }

  const currentData = editMode ? editData : produit;
  const prixTTC = (currentData.prixVente || 0) * (1 + (currentData.tauxTVA || 0) / 100);
  const isService = currentData.typeProduit === "service";
  const isProduction = currentData.typeProduit === "production";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 lg:p-6">
      {/* Messages flottants */}
      {successMessage && (
        <div className="fixed top-20 right-4 z-[350] flex items-center gap-2 rounded-lg bg-green-500 text-white px-4 py-2 shadow-lg">
          <CheckCircle size={18} /> {successMessage}
        </div>
      )}
      {error && (
        <div className="fixed top-20 right-4 z-[350] flex items-center gap-2 rounded-lg bg-red-500 text-white px-4 py-2 shadow-lg">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/produits")} className="rounded-full p-2 text-slate-400 hover:bg-gray-100">
              <ArrowLeft size={20} />
            </button>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <Package size={28} />
            </div>
            <div>
              {editMode ? (
                <input
                  type="text"
                  value={editData.designation || ""}
                  onChange={(e) => handleEditField("designation", e.target.value)}
                  className="text-2xl font-bold text-slate-800 bg-gray-50 border rounded-lg px-2 py-1"
                />
              ) : (
                <h1 className="text-2xl font-bold text-slate-800">{produit.designation}</h1>
              )}
              <p className="text-sm text-slate-500">
                {produit.reference} • {getCategorieName()}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {!editMode ? (
              <>
                <button
                  onClick={() => setEditMode(true)}
                  className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-gray-50"
                >
                  <Edit size={16} /> Modifier
                </button>
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="flex items-center gap-2 rounded-xl border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600"
                >
                  <TrashIcon size={16} /> Supprimer
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSaveChanges}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600"
                >
                  <Save size={16} /> Enregistrer
                </button>
                <button
                  onClick={() => { setEditMode(false); setEditData(produit); }}
                  className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-gray-50"
                >
                  <X size={16} /> Annuler
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Cartes stats rapides */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Stock actuel" value={`${currentData.stock || 0} ${currentData.uniteVente || "pièce"}`} icon={Warehouse} color="bg-blue-500" />
        <StatCard title="Prix de vente (HT)" value={`${(currentData.prixVente || 0).toLocaleString()} DH`} icon={DollarSign} color="bg-green-500" />
        <StatCard title="Prix TTC" value={`${prixTTC.toLocaleString()} DH`} icon={Percent} color="bg-orange-500" />
        <StatCard title="Statut" value={currentData.actif ? "Actif" : "Inactif"} icon={Activity} color={currentData.actif ? "bg-teal-500" : "bg-gray-500"} />
      </div>

      {/* Grille d'informations */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Informations générales */}
        <SectionCard title="Informations générales" icon={Package} onEdit={() => setEditMode(true)} editMode={editMode}>
          {editMode ? (
            <>
              <EditableInfoItem icon={Tag} label="Type de produit" value={editData.typeProduit} isEditing={true} onChange={handleEditField} field="typeProduit" type="select" options={typeOptions} />
              <EditableInfoItem icon={Building} label="Catégorie" value={editData.categorie?._id || editData.categorie} isEditing={true} onChange={handleEditField} field="categorie" type="select" options={categorieOptions} />
              <EditableInfoItem icon={Truck} label="Fournisseur" value={editData.fournisseur?._id || editData.fournisseur} isEditing={true} onChange={handleEditField} field="fournisseur" type="select" options={fournisseurOptions} />
              <EditableInfoItem icon={Activity} label="Statut" value={editData.actif} isEditing={true} onChange={(field, val) => handleEditField(field, val === "true" || val === true)} field="actif" type="select" options={[{ value: true, label: "Actif" }, { value: false, label: "Inactif" }]} />
            </>
          ) : (
            <>
              <EditableInfoItem icon={Tag} label="Type de produit" value={produit.typeProduit === "Produit_Fini" ? "Produit fini" : produit.typeProduit === "service" ? "Service" : "Production"} />
              <EditableInfoItem icon={Building} label="Catégorie" value={getCategorieName()} />
              <EditableInfoItem icon={Truck} label="Fournisseur" value={getFournisseurName()} />
              <EditableInfoItem icon={Activity} label="Statut" value={<StatusBadge status={produit.actif} />} />
            </>
          )}
          <EditableInfoItem icon={Calendar} label="Créé le" value={new Date(produit.createdAt).toLocaleDateString()} />
        </SectionCard>

        {/* Prix & TVA */}
        <SectionCard title="Tarification" icon={DollarSign} onEdit={() => setEditMode(true)} editMode={editMode}>
          <EditableInfoItem icon={DollarSign} label="Prix d'achat (HT)" value={editMode ? editData.prixAchat : (produit.prixAchat || 0)} isEditing={editMode} onChange={handleEditField} field="prixAchat" type="number" />
          <EditableInfoItem icon={DollarSign} label="Prix de vente (HT)" value={editMode ? editData.prixVente : (produit.prixVente || 0)} isEditing={editMode} onChange={handleEditField} field="prixVente" type="number" />
          <EditableInfoItem icon={Percent} label="Taux TVA (%)" value={editMode ? editData.tauxTVA : (produit.tauxTVA || 20)} isEditing={editMode} onChange={handleEditField} field="tauxTVA" type="number" />
          <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
            <DollarSign size={18} className="mt-1 text-[#5a7c3c]" />
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Prix de vente (TTC)</p>
              <p className="text-sm font-bold text-[#5a7c3c] mt-0.5">{prixTTC.toLocaleString()} DH</p>
            </div>
          </div>
        </SectionCard>

        {/* Stock & Logistique (sauf pour les services) */}
        {!isService && (
          <SectionCard title="Stock & Logistique" icon={Warehouse} onEdit={() => setEditMode(true)} editMode={editMode}>
            <EditableInfoItem icon={Package} label="Stock actuel" value={editMode ? editData.stock : (produit.stock || 0)} isEditing={editMode} onChange={handleEditField} field="stock" type="number" />
            <EditableInfoItem icon={AlertCircle} label="Stock minimum" value={editMode ? editData.stockMin : (produit.stockMin || 0)} isEditing={editMode} onChange={handleEditField} field="stockMin" type="number" />
            <EditableInfoItem icon={MapPin} label="Emplacement" value={editMode ? editData.emplacement : (produit.emplacement || "—")} isEditing={editMode} onChange={handleEditField} field="emplacement" />
            <EditableInfoItem icon={Weight} label="Poids (kg)" value={editMode ? editData.poids : (produit.poids ? `${produit.poids} kg` : "—")} isEditing={editMode} onChange={handleEditField} field="poids" type="number" />
            <div className="grid grid-cols-2 gap-3 mt-2">
              <EditableInfoItem icon={Tag} label="Unité de vente" value={editMode ? editData.uniteVente : (produit.uniteVente || "pièce")} isEditing={editMode} onChange={handleEditField} field="uniteVente" />
              <EditableInfoItem icon={Tag} label="Unité d'achat" value={editMode ? editData.uniteAchat : (produit.uniteAchat || "pièce")} isEditing={editMode} onChange={handleEditField} field="uniteAchat" />
            </div>
          </SectionCard>
        )}

        {/* Code-barres */}
        <SectionCard title="Code-barres" icon={Barcode} onEdit={() => setEditMode(true)} editMode={editMode}>
          {editMode ? (
            <div>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={editData.codeBarre || ""}
                  onChange={(e) => handleEditField("codeBarre", e.target.value)}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  placeholder="Code barre"
                />
                <button type="button" onClick={generateRandomBarcode} className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200">
                  <RefreshCw size={18} />
                </button>
              </div>
              {editData.codeBarre && <BarcodeDisplay value={editData.codeBarre} width={2} height={60} />}
            </div>
          ) : (
            <BarcodeDisplay value={produit.codeBarre} width={2} height={60} />
          )}
        </SectionCard>
      </div>

      {/* Composantes (pour les produits de type production) */}
      {isProduction && (
        <div className="mt-6">
          <SectionCard title="Composantes (BOM)" icon={Factory} onEdit={() => setEditMode(true)} editMode={editMode}>
            {!editMode && (
              <div className="space-y-2">
                {produit.composantes && produit.composantes.length > 0 ? (
                  produit.composantes.map((comp, idx) => (
                    <ComposanteItem key={idx} composante={comp} />
                  ))
                ) : (
                  <p className="text-center text-slate-400 py-4">Aucune composante</p>
                )}
              </div>
            )}
            {editMode && (
              <div className="text-center text-slate-400 py-4 border-2 border-dashed rounded-lg">
                <p>La gestion des composantes est disponible dans le formulaire complet d'édition.</p>
                <p className="text-xs">Veuillez utiliser le stepper pour modifier les composantes.</p>
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {/* Modal de confirmation suppression */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[350] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                <TrashIcon size={24} />
              </div>
              <h3 className="text-lg font-semibold">Confirmer la suppression</h3>
            </div>
            <p className="text-slate-600 mb-6">Cette action est irréversible. Le produit sera définitivement supprimé.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(false)} className="rounded-lg px-4 py-2 text-sm hover:bg-gray-100">Annuler</button>
              <button onClick={handleDelete} className="rounded-lg bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailProduit;