// src/components/devis/DevisFormStepper.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, Loader2, Plus, Trash2, Check, User, Package, DollarSign, Percent, FileText } from 'lucide-react';
import { getClients } from '../../services/client.service';
import produitService from '../../services/produit.service';

// Composants d'input avec icône (réutilisés)
const InputIcon = ({ icon: Icon, error, ...props }) => (
  <div className="relative group">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#5a7c3c] transition-colors">
      <Icon size={18} />
    </div>
    <input
      {...props}
      className={`w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-[#d4e6b0] focus:border-[#8bb56a] bg-white/90 backdrop-blur-sm ${
        error ? "border-red-500 focus:ring-red-200" : "border-gray-200 hover:border-[#8bb56a]"
      }`}
    />
  </div>
);

const SelectIcon = ({ icon: Icon, children, error, ...props }) => (
  <div className="relative group">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#5a7c3c]">
      <Icon size={18} />
    </div>
    <select
      {...props}
      className={`w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm outline-none appearance-none bg-white/90 backdrop-blur-sm transition-all duration-200 focus:ring-2 focus:ring-[#d4e6b0] focus:border-[#8bb56a] ${
        error ? "border-red-500" : "border-gray-200"
      }`}
    >
      {children}
    </select>
  </div>
);

const steps = [
  { id: 0, name: "Client", icon: User, description: "Sélection du client" },
  { id: 1, name: "Produits", icon: Package, description: "Ajout des produits" },
];

const DevisFormStepper = ({
  formData,
  currentStep = 0,
  onInputChange,
  onPrev,
  onNext,
  onSubmit,
  onClose,
  isSubmitting,
  editingDevis = null,
}) => {
  const [step, setStep] = useState(currentStep);
  const [clients, setClients] = useState([]);
  const [produits, setProduits] = useState([]);
  const [errors, setErrors] = useState({});
  const [loadingProducts, setLoadingProducts] = useState(false);

  const progress = ((step + 1) / steps.length) * 100;

  useEffect(() => {
    fetchClients();
    fetchProduits();
  }, []);

  const fetchClients = async () => {
    try {
      const data = await getClients();
      setClients(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchProduits = async () => {
    setLoadingProducts(true);
    try {
      const data = await produitService.getProduits();
      setProduits(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleNext = () => {
    if (step === 0) {
      if (!formData.client) {
        setErrors({ client: "Veuillez sélectionner un client" });
        return;
      }
      setErrors({});
      setStep(1);
      if (onNext) onNext();
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
      if (onPrev) onPrev();
    }
  };

  const handleChange = (path, value) => {
    if (onInputChange) onInputChange(path, value);
    if (path === 'client') setErrors(prev => ({ ...prev, client: undefined }));
  };

  const handleProductChange = useCallback((index, field, value) => {
    const newProduits = [...(formData.produits || [])];
    const current = { ...newProduits[index] };
    
    switch (field) {
      case 'produit':
        current.produit = value;
        const produit = produits.find(p => p._id === value);
        if (produit) {
          current.prixHT = produit.prixVente || 0;
          current.tauxTVA = produit.tauxTVA || 20;
          current.prixTTC = current.prixHT * (1 + current.tauxTVA / 100);
          current.total = (current.quantite || 1) * current.prixTTC;
        }
        break;
      case 'quantite':
        current.quantite = Math.max(1, parseInt(value) || 1);
        if (current.prixTTC) current.total = current.quantite * current.prixTTC;
        break;
      case 'prixHT':
        current.prixHT = parseFloat(value) || 0;
        current.prixTTC = current.prixHT * (1 + (current.tauxTVA || 0) / 100);
        current.total = (current.quantite || 1) * current.prixTTC;
        break;
      case 'tauxTVA':
        current.tauxTVA = parseFloat(value) || 0;
        current.prixTTC = (current.prixHT || 0) * (1 + current.tauxTVA / 100);
        current.total = (current.quantite || 1) * current.prixTTC;
        break;
      default:
        break;
    }
    
    newProduits[index] = current;
    handleChange('produits', newProduits);
  }, [formData.produits, produits, handleChange]);

  const addProduct = useCallback(() => {
    const newProduits = [...(formData.produits || []), {
      produit: '',
      quantite: 1,
      prixHT: 0,
      tauxTVA: 20,
      prixTTC: 0,
      total: 0
    }];
    handleChange('produits', newProduits);
  }, [formData.produits, handleChange]);

  const removeProduct = useCallback((index) => {
    const newProduits = [...(formData.produits || [])];
    newProduits.splice(index, 1);
    handleChange('produits', newProduits);
  }, [formData.produits, handleChange]);

  const calculateTotal = useMemo(() => {
    const produitsList = formData.produits || [];
    return produitsList.reduce((sum, p) => sum + (p.total || 0), 0);
  }, [formData.produits]);

  const getClientName = useMemo(() => {
    const client = clients.find(c => c._id === formData.client);
    return client ? (client.type === 'particulier' ? `${client.nom} ${client.prenom}` : client.raisonSociale) : '—';
  }, [clients, formData.client]);

  const renderError = (fieldName) => {
    const error = errors[fieldName];
    return error ? <p className="text-xs text-red-500 mt-1 animate-pulse">{error}</p> : null;
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white/95 shadow-2xl backdrop-blur-sm animate-in zoom-in-95 duration-300 border border-white/20 relative">
        
        {/* Bouton fermeture */}
        <button onClick={onClose} className="absolute top-4 right-4 rounded-full p-1.5 text-slate-400 hover:bg-gray-100 transition z-20">
          <X size={18} />
        </button>

        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-100 rounded-t-3xl">
          <div className="px-6 pt-6 pb-3 text-center">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-[#5a7c3c] to-[#8bb56a] bg-clip-text text-transparent">
              {editingDevis ? "✏️ Modifier le devis" : "✨ Nouveau devis"}
            </h2>
            <p className="text-sm text-slate-500 mt-1 flex items-center justify-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-[#8bb56a] animate-pulse"></span>
              {steps[step].description}
            </p>
          </div>

          {/* Barre de progression */}
          <div className="flex justify-center px-6 mt-1 mb-2">
            <div className="h-1 w-48 md:w-64 bg-gray-100 rounded-full overflow-hidden shadow-inner">
              <div className="h-full bg-gradient-to-r from-[#8bb56a] to-[#5a7c3c] rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Stepper visuel */}
          <div className="px-6 py-4 bg-gray-50/50">
            <div className="flex items-center justify-between">
              {steps.map((stepItem, idx) => {
                const isActive = step === idx;
                const isCompleted = step > idx;
                return (
                  <div key={stepItem.id} className="flex flex-col items-center flex-1 relative">
                    {idx < steps.length - 1 && (
                      <div className="absolute left-[50%] top-4 w-full h-[2px] bg-gray-200 -z-0">
                        <div className={`h-full bg-gradient-to-r from-[#8bb56a] to-[#5a7c3c] transition-all duration-500 ${isCompleted ? "w-full" : "w-0"}`} />
                      </div>
                    )}
                    <div className="relative z-10">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300 ${
                        isActive ? "bg-[#5a7c3c] text-white ring-4 ring-[#d4e6b0]/50 shadow-md scale-105" :
                        isCompleted ? "bg-white border-2 border-[#8bb56a] text-[#5a7c3c] shadow-sm" :
                        "bg-gray-100 text-gray-400 border border-gray-200"
                      }`}>
                        {isCompleted ? <Check size={14} /> : <stepItem.icon size={14} />}
                      </div>
                    </div>
                    <span className={`text-[11px] font-medium mt-2 transition-all ${isActive ? "text-[#5a7c3c] font-bold" : "text-slate-400"}`}>
                      {stepItem.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Corps du formulaire */}
        <div className="p-6">
          {/* Étape 0 : Client */}
          {step === 0 && (
            <div className="space-y-5 animate-in slide-in-from-right-5 duration-300">
              <SelectIcon
                icon={User}
                value={formData.client || ''}
                onChange={(e) => handleChange('client', e.target.value)}
                error={errors.client}
              >
                <option value="">Sélectionner un client</option>
                {clients.map(client => (
                  <option key={client._id} value={client._id}>
                    {client.type === 'particulier' ? `${client.nom} ${client.prenom}` : client.raisonSociale}
                  </option>
                ))}
              </SelectIcon>
              {renderError('client')}
            </div>
          )}

          {/* Étape 1 : Produits */}
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-5 duration-300">
              {/* Liste des produits */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold text-[#5a7c3c] flex items-center gap-2">
                    <Package size={16} /> Produits
                  </h3>
                  <button
                    onClick={addProduct}
                    type="button"
                    className="inline-flex items-center gap-1 rounded-lg bg-[#e2f0d6] px-3 py-1.5 text-xs font-medium text-[#5a7c3c] hover:bg-[#d4e6b0] transition-colors"
                  >
                    <Plus size={14} /> Ajouter un produit
                  </button>
                </div>

                {loadingProducts && (
                  <div className="text-center py-8 text-slate-400">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                    <p className="text-sm">Chargement des produits...</p>
                  </div>
                )}

                {(formData.produits || []).length === 0 && !loadingProducts && (
                  <div className="text-center py-12 text-slate-400 border-2 border-dashed rounded-xl bg-white/50">
                    <Package size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Aucun produit</p>
                    <p className="text-xs mt-1">Cliquez sur "Ajouter un produit"</p>
                  </div>
                )}

                <div className="space-y-4">
                  {(formData.produits || []).map((prod, idx) => {
                    const produitDetail = produits.find(p => p._id === prod.produit);
                    return (
                      <div key={idx} className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                          <div className="md:col-span-1">
                            <label className="text-xs text-slate-500 mb-1 block">Produit</label>
                            <select
                              value={prod.produit}
                              onChange={(e) => handleProductChange(idx, 'produit', e.target.value)}
                              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4e6b0] focus:border-[#8bb56a]"
                            >
                              <option value="">Choisir un produit</option>
                              {produits.map(p => (
                                <option key={p._id} value={p._id}>
                                  {p.designation} - {(p.prixVente || 0).toLocaleString()} DH HT
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 mb-1 block">Quantité</label>
                            <input
                              type="number"
                              min="1"
                              value={prod.quantite}
                              onChange={(e) => handleProductChange(idx, 'quantite', e.target.value)}
                              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4e6b0] focus:border-[#8bb56a]"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 mb-1 block flex items-center gap-1">
                              <DollarSign size={12} /> Prix HT
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={prod.prixHT}
                              onChange={(e) => handleProductChange(idx, 'prixHT', e.target.value)}
                              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4e6b0] focus:border-[#8bb56a]"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 mb-1 block flex items-center gap-1">
                              <Percent size={12} /> TVA
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              value={prod.tauxTVA}
                              onChange={(e) => handleProductChange(idx, 'tauxTVA', e.target.value)}
                              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4e6b0] focus:border-[#8bb56a]"
                            />
                          </div>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                          <div className="text-sm text-slate-600">
                            Prix TTC unitaire : <strong className="text-[#5a7c3c]">{(prod.prixTTC || 0).toLocaleString()} DH</strong>
                          </div>
                          <div className="text-sm font-semibold text-slate-800">
                            Total : {(prod.total || 0).toLocaleString()} DH
                          </div>
                          <button
                            onClick={() => removeProduct(idx)}
                            className="text-red-500 hover:text-red-700 transition-colors p-1 rounded-md hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Récapitulatif */}
              <div className="rounded-xl bg-gradient-to-br from-[#e2f0d6]/10 to-white p-5 border border-[#d4e6b0]">
                <h3 className="font-semibold text-[#5a7c3c] mb-3 flex items-center gap-2">
                  <FileText size={16} /> Récapitulatif du devis
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Client :</span>
                    <span className="font-medium text-slate-700">{getClientName}</span>
                  </div>
                  <div className="flex justify-between pt-2 mt-2 border-t border-[#d4e6b0]">
                    <span className="font-bold text-slate-700">Total TTC :</span>
                    <span className="font-bold text-[#5a7c3c] text-xl">{calculateTotal.toLocaleString()} DH</span>
                  </div>
                  <p className="text-xs text-slate-400 text-right">* TVA incluse selon taux appliqué par produit</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 bg-white/80">
          <button
            onClick={handlePrev}
            disabled={step === 0}
            className="flex items-center gap-2 rounded-xl bg-gray-100 px-5 py-2 text-sm font-medium text-slate-600 hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} /> Précédent
          </button>
          <div className="flex-1" />
          {step === 0 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#e2f0d6] to-[#d4e6b0] px-5 py-2 text-sm font-semibold text-[#5a7c3c] hover:shadow-md transition"
            >
              Suivant <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={onSubmit}
              disabled={isSubmitting || (formData.produits || []).length === 0}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#5a7c3c] to-[#4a6b2e] px-6 py-2 text-sm font-semibold text-white hover:shadow-lg transition disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {isSubmitting ? "Enregistrement..." : (editingDevis ? "Mettre à jour" : "Créer le devis")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DevisFormStepper;