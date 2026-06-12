// src/components/produit/ProduitFormStepper.jsx
import React, { useState, useEffect } from "react";
import {
  X, ChevronLeft, ChevronRight, Check, Package, DollarSign, Warehouse,
  Factory, Plus, Trash2, RefreshCw, Info, Tag, Barcode, ShoppingCart,
  Scale, MapPin, Box, Percent, Building, Loader2, AlertTriangle
} from "lucide-react";
import BarcodeDisplay from "./BarcodeDisplay";
import produitService from "../../services/produit.service";

// ============================================================
// Composants d'input réutilisables avec icône
// ============================================================
const InputIcon = ({ icon: Icon, error, ...props }) => (
  <div className="relative group">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#5d7b44] transition-colors">
      <Icon size={18} />
    </div>
    <input
      {...props}
      className={`w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-[#d0e2c0] focus:border-[#5d7b44] bg-[#f4f9ef]/50 backdrop-blur-sm ${
        error ? "border-red-500 focus:ring-red-200" : "border-gray-200 hover:border-[#5d7b44]"
      }`}
    />
  </div>
);

const SelectIcon = ({ icon: Icon, children, error, ...props }) => (
  <div className="relative group">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#5d7b44]">
      <Icon size={18} />
    </div>
    <select
      {...props}
      className={`w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm outline-none appearance-none bg-[#f4f9ef]/50 backdrop-blur-sm transition-all duration-200 focus:ring-2 focus:ring-[#d0e2c0] focus:border-[#5d7b44] ${
        error ? "border-red-500" : "border-gray-200"
      }`}
    >
      {children}
    </select>
  </div>
);

// Options d'unités conformes au schéma Mongoose
const uniteOptions = [
  "pièce", "unité", "kg", "g", "mg", "L", "mL", "boîte", "paquet",
  "carton", "sachet", "bouteille", "barquette", "palette", "mètre", "cm"
];

const steps = [
  { id: 0, name: "Général", icon: Package, description: "Identité & catégorie" },
  { id: 1, name: "Prix & Taxes", icon: DollarSign, description: "Tarifs et TVA" },
  { id: 2, name: "Stock", icon: Warehouse, description: "Logistique & composantes" },
];

// Génération automatique d'une référence unique (format REF-ANNEE-MOIS-JOUR-XXXX)
const generateReference = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `REF-${year}${month}${day}-${random}`;
};

const ProduitFormStepper = ({
  editingProduit,
  formData,
  formErrors,
  currentStep = 0,
  onInputChange,
  onArrayChange,
  onPrev,
  onNext,
  onSubmit,
  onClose,
  isSubmitting,
  categories = [],
  fournisseurs = [],
  produitsList: externalProduitsList = null,
}) => {
  const [step, setStep] = useState(currentStep);
  const [allProduits, setAllProduits] = useState(externalProduitsList || []);
  const [referenceGenerated, setReferenceGenerated] = useState(false);

  // Génération auto de la référence pour un nouveau produit
  useEffect(() => {
    if (!editingProduit && !referenceGenerated && !formData.reference) {
      const newRef = generateReference();
      if (onInputChange) {
        onInputChange({ target: { name: "reference", value: newRef } });
        setReferenceGenerated(true);
      }
    }
  }, [editingProduit, formData.reference, onInputChange, referenceGenerated]);

  // Chargement des produits pour les composantes (si non fourni)
  useEffect(() => {
    if (!externalProduitsList) {
      const fetchProduits = async () => {
        try {
          const data = await produitService.getProduits();
          setAllProduits(data);
        } catch (error) {
          console.error("Impossible de charger les produits pour les composantes", error);
        }
      };
      fetchProduits();
    }
  }, [externalProduitsList]);

  useEffect(() => {
    setStep(currentStep);
  }, [currentStep]);

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
      if (onNext) onNext();
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
      if (onPrev) onPrev();
    }
  };

  const handleFinalSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  const addComposante = () => {
    const newComposantes = [...(formData.composantes || []), { produit: "", quantite: 1 }];
    if (onArrayChange) onArrayChange("composantes", newComposantes);
  };

  const removeComposante = (index) => {
    const newComposantes = [...(formData.composantes || [])];
    newComposantes.splice(index, 1);
    if (onArrayChange) onArrayChange("composantes", newComposantes);
  };

  const updateComposante = (index, field, value) => {
    const newComposantes = [...(formData.composantes || [])];
    newComposantes[index][field] = value;
    if (onArrayChange) onArrayChange("composantes", newComposantes);
  };

  const generateRandomBarcode = () => {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const barcode = `${timestamp}${random}`;
    if (onInputChange) onInputChange({ target: { name: "codeBarre", value: barcode } });
  };

  const progress = ((step + 1) / steps.length) * 100;

  const renderStepContent = () => {
    const showStockFields = formData.typeProduit !== "service";
    const showComposantes = formData.typeProduit === "production";

    switch (step) {
      case 0:
        return (
          <div className="space-y-5 animate-in slide-in-from-right-5 duration-300">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Désignation */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Désignation *</label>
                <InputIcon
                  icon={Tag}
                  type="text"
                  name="designation"
                  value={formData.designation || ""}
                  onChange={onInputChange}
                  error={formErrors.designation}
                />
                {formErrors.designation && <p className="text-xs text-red-500 mt-1">{formErrors.designation}</p>}
              </div>

              {/* Catégorie */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Catégorie *</label>
                <SelectIcon
                  icon={Box}
                  name="categorie"
                  value={formData.categorie || ""}
                  onChange={onInputChange}
                  error={formErrors.categorie}
                >
                  <option value="">Sélectionner</option>
                  {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.nom}</option>)}
                </SelectIcon>
                {formErrors.categorie && <p className="text-xs text-red-500 mt-1">{formErrors.categorie}</p>}
              </div>

              {/* Type produit */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Type de produit *</label>
                <SelectIcon
                  icon={Package}
                  name="typeProduit"
                  value={formData.typeProduit || "Produit_Fini"}
                  onChange={(e) => {
                    if (onInputChange) onInputChange({ target: { name: "typeProduit", value: e.target.value } });
                  }}
                >
                  <option value="Produit_Fini">Produit fini (vente)</option>
                  <option value="service">Service (prestation)</option>
                  <option value="production">Production (matière première / composé)</option>
                </SelectIcon>
              </div>

              {/* Code barre */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Code barre</label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <InputIcon
                      icon={Barcode}
                      type="text"
                      name="codeBarre"
                      value={formData.codeBarre || ""}
                      onChange={onInputChange}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={generateRandomBarcode}
                    className="px-3 py-2 rounded-xl bg-[#f4f9ef] hover:bg-[#d0e2c0] transition-colors"
                  >
                    <RefreshCw size={18} className="text-[#5d7b44]" />
                  </button>
                </div>
                {formData.codeBarre && (
                  <div className="mt-2 flex justify-center">
                    <BarcodeDisplay value={formData.codeBarre} width={1.5} height={40} />
                  </div>
                )}
              </div>

              {/* Fournisseur */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Fournisseur</label>
                <SelectIcon icon={Building} name="fournisseur" value={formData.fournisseur || ""} onChange={onInputChange}>
                  <option value="">Sélectionner</option>
                  {fournisseurs.map(frs => <option key={frs._id} value={frs._id}>{frs.nom}</option>)}
                </SelectIcon>
              </div>

              {/* Actif */}
              <div className="flex items-end pb-2">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    name="actif"
                    checked={formData.actif !== false}
                    onChange={onInputChange}
                    className="h-4 w-4 rounded border-gray-300 text-[#5d7b44] focus:ring-[#d0e2c0]"
                  />
                  <span className="text-sm text-slate-700">Produit actif</span>
                </label>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-5 animate-in slide-in-from-right-5 duration-300">
            <div className="rounded-xl bg-gradient-to-br from-[#f4f9ef] to-white p-5 border border-[#d0e2c0]">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-[#5d7b44] mb-4">
                <DollarSign size={16} /> Tarification
              </h3>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Prix d'achat (HT)</label>
                  <InputIcon icon={ShoppingCart} type="number" name="prixAchat" value={formData.prixAchat || 0} onChange={onInputChange} min="0" step="0.01" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Prix de vente (HT) *</label>
                  <InputIcon icon={DollarSign} type="number" name="prixVente" value={formData.prixVente || 0} onChange={onInputChange} min="0" step="0.01" error={formErrors.prixVente} />
                  {formErrors.prixVente && <p className="text-xs text-red-500 mt-1">{formErrors.prixVente}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Taux TVA (%)</label>
                  <InputIcon icon={Percent} type="number" name="tauxTVA" value={formData.tauxTVA || 20} onChange={onInputChange} min="0" max="100" step="1" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Prix de vente (TTC)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <DollarSign size={18} />
                    </div>
                    <div className="w-full rounded-xl bg-[#f4f9ef] border border-gray-200 pl-10 pr-4 py-2.5 text-sm text-slate-600">
                      {((formData.prixVente || 0) * (1 + (formData.tauxTVA || 0) / 100)).toLocaleString()} DH
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-5 animate-in slide-in-from-right-5 duration-300">
            {!showStockFields && (
              <div className="rounded-xl bg-blue-50 p-4 border border-blue-200 flex items-center gap-2 text-blue-700">
                <Info size={18} />
                <span className="text-sm">Les champs de stock ne sont pas applicables pour un service.</span>
              </div>
            )}

            {showStockFields && (
              <div className="rounded-xl bg-gradient-to-br from-[#f4f9ef] to-white p-5 border border-[#d0e2c0]">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-[#5d7b44] mb-4">
                  <Warehouse size={16} /> Gestion des stocks
                </h3>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <InputIcon icon={Box} type="number" name="stock" value={formData.stock || 0} onChange={onInputChange} min="0" placeholder="Stock initial" />
                  <InputIcon icon={AlertTriangle} type="number" name="stockMin" value={formData.stockMin || 0} onChange={onInputChange} min="0" placeholder="Stock minimum" />
                  
                  <SelectIcon icon={Scale} name="uniteVente" value={formData.uniteVente || "pièce"} onChange={onInputChange}>
                    {uniteOptions.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                  </SelectIcon>
                  
                  <SelectIcon icon={Scale} name="uniteAchat" value={formData.uniteAchat || "pièce"} onChange={onInputChange}>
                    {uniteOptions.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                  </SelectIcon>
                  
                  <InputIcon icon={MapPin} type="text" name="emplacement" value={formData.emplacement || ""} onChange={onInputChange} placeholder="Emplacement (entrepôt)" />
                  <InputIcon icon={Scale} type="number" name="poids" value={formData.poids || ""} onChange={onInputChange} min="0" step="0.01" placeholder="Poids (kg)" />
                </div>
              </div>
            )}

            {showComposantes && (
              <div className="rounded-xl bg-gradient-to-br from-[#f4f9ef] to-white p-5 border border-[#d0e2c0]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-[#5d7b44]">
                    <Factory size={16} /> Composantes (nomenclature)
                  </h3>
                  <button
                    type="button"
                    onClick={addComposante}
                    className="flex items-center gap-1 rounded-lg bg-[#f4f9ef] px-3 py-1.5 text-xs font-medium text-[#5d7b44] hover:bg-[#d0e2c0] transition-colors"
                  >
                    <Plus size={14} /> Ajouter
                  </button>
                </div>
                {(!formData.composantes || formData.composantes.length === 0) && (
                  <div className="text-center py-8 text-slate-400 border-2 border-dashed rounded-xl bg-white/50">
                    <Factory size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Aucune composante</p>
                    <p className="text-xs mt-1">Ajoutez des matières premières ou sous-produits</p>
                  </div>
                )}
                <div className="space-y-3">
                  {formData.composantes?.map((comp, idx) => (
                    <div key={idx} className="flex gap-3 items-center p-3 bg-white rounded-xl border shadow-sm">
                      <div className="flex-1">
                        <select
                          value={comp.produit || ""}
                          onChange={(e) => updateComposante(idx, "produit", e.target.value)}
                          className="w-full rounded-lg bg-[#f4f9ef] px-3 py-2 text-sm border focus:ring-2 focus:ring-[#d0e2c0] focus:border-[#5d7b44] outline-none"
                        >
                          <option value="">Sélectionner un produit</option>
                          {allProduits.filter(p => p._id !== editingProduit?._id).map(p => (
                            <option key={p._id} value={p._id}>
                              {p.designation} (ref: {p.reference})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-32">
                        <input
                          type="number"
                          value={comp.quantite}
                          onChange={(e) => updateComposante(idx, "quantite", parseInt(e.target.value) || 1)}
                          min="1"
                          className="w-full rounded-lg bg-[#f4f9ef] px-3 py-2 text-sm border focus:ring-2 focus:ring-[#d0e2c0] focus:border-[#5d7b44] outline-none"
                          placeholder="Qté"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeComposante(idx)}
                        className="text-red-500 hover:bg-red-50 rounded-lg p-2 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!showStockFields && !showComposantes && (
              <div className="text-center py-12 text-slate-400 border-2 border-dashed rounded-xl bg-white/50">
                <Package size={48} className="mx-auto mb-2 opacity-50" />
                <p>Aucune information de stock requise pour ce type de produit.</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-[#f4f9ef] shadow-2xl backdrop-blur-sm animate-in zoom-in-95 duration-300 border border-white/20 relative">
        
        <button onClick={onClose} className="absolute top-4 right-4 rounded-full p-1.5 text-slate-400 hover:bg-[#d0e2c0] transition z-20">
          <X size={18} />
        </button>

        <div className="sticky top-0 z-10 bg-[#f4f9ef] backdrop-blur-sm border-b border-[#d0e2c0] rounded-t-3xl">
          <div className="px-6 pt-6 pb-3 text-center">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-[#5d7b44] to-[#8bb56a] bg-clip-text text-transparent">
              {editingProduit ? "✏️ Modifier le produit" : "✨ Nouveau produit"}
            </h2>
            <p className="text-sm text-slate-500 mt-1 flex items-center justify-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-[#5d7b44] animate-pulse"></span>
              {steps[step].description}
            </p>
          </div>

          <div className="flex justify-center px-6 mt-1 mb-2">
            <div className="h-1 w-48 md:w-64 bg-gray-200 rounded-full overflow-hidden shadow-inner">
              <div className="h-full bg-gradient-to-r from-[#5d7b44] to-[#8bb56a] rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="px-6 py-4 bg-[#f4f9ef]">
            <div className="flex items-center justify-between">
              {steps.map((stepItem, idx) => {
                const isActive = step === idx;
                const isCompleted = step > idx;
                return (
                  <div key={stepItem.id} className="flex flex-col items-center flex-1 relative">
                    {idx < steps.length - 1 && (
                      <div className="absolute left-[50%] top-4 w-full h-[2px] bg-gray-200 -z-0">
                        <div className={`h-full bg-gradient-to-r from-[#5d7b44] to-[#8bb56a] transition-all duration-500 ${isCompleted ? "w-full" : "w-0"}`} />
                      </div>
                    )}
                    <div className="relative z-10">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300 ${
                        isActive ? "bg-[#5d7b44] text-white ring-4 ring-[#d0e2c0]/50 shadow-md scale-105" :
                        isCompleted ? "bg-white border-2 border-[#5d7b44] text-[#5d7b44] shadow-sm" :
                        "bg-gray-100 text-gray-400 border border-gray-200"
                      }`}>
                        {isCompleted ? <Check size={14} /> : <stepItem.icon size={14} />}
                      </div>
                    </div>
                    <span className={`text-[11px] font-medium mt-2 transition-all ${isActive ? "text-[#5d7b44] font-bold" : "text-slate-400"}`}>
                      {stepItem.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleFinalSubmit}>
            {renderStepContent()}
          </form>
        </div>

        <div className="flex items-center justify-between border-t border-[#d0e2c0] px-6 py-4 bg-[#f4f9ef]">
          <button
            onClick={handlePrev}
            disabled={step === 0}
            className="flex items-center gap-2 rounded-xl bg-white px-5 py-2 text-sm font-medium text-slate-600 hover:bg-[#d0e2c0] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} /> Précédent
          </button>
          <div className="flex-1" />
          {step < 2 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#f4f9ef] to-[#d0e2c0] px-5 py-2 text-sm font-semibold text-[#5d7b44] hover:shadow-md transition"
            >
              Suivant <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#5d7b44] to-[#4a6b2e] px-6 py-2 text-sm font-semibold text-white hover:shadow-lg transition disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {isSubmitting ? "Enregistrement..." : (editingProduit ? "Mettre à jour" : "Créer")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProduitFormStepper;