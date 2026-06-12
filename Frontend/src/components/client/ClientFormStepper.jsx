// components/client/ClientFormStepper.jsx
import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import {
  User, Building, Mail, Phone, MapPin, CreditCard,
  ChevronLeft, ChevronRight, Check, X,
  Home, Briefcase, Plus, Trash2, Globe, FileText, Hash, Calendar,
  Shield, Building2, Flag, LocateFixed, Sparkles, PartyPopper
} from "lucide-react";

// Composants d'input avec icône
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

InputIcon.propTypes = {
  icon: PropTypes.elementType.isRequired,
  error: PropTypes.bool,
};

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

SelectIcon.propTypes = {
  icon: PropTypes.elementType.isRequired,
  children: PropTypes.node,
  error: PropTypes.bool,
};

// Composant cercle de progression
const CircularProgress = ({ percentage, size = 48, strokeWidth = 4 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#gradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-200 ease-out"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8bb56a" />
            <stop offset="100%" stopColor="#5a7c3c" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute text-xs font-bold text-[#5a7c3c]">{percentage}%</span>
    </div>
  );
};

CircularProgress.propTypes = {
  percentage: PropTypes.number.isRequired,
  size: PropTypes.number,
  strokeWidth: PropTypes.number,
};

// Composant toast de succès
const SuccessToast = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-5 duration-300">
      <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 text-white shadow-xl backdrop-blur-sm">
        <PartyPopper size={20} className="animate-bounce" />
        <span className="font-medium">{message}</span>
        <Sparkles size={16} className="animate-pulse" />
      </div>
    </div>
  );
};

SuccessToast.propTypes = {
  message: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

const ClientFormStepper = ({
  editingClient,
  formData,
  formErrors: externalErrors,
  currentStep,
  onInputChange,
  onPrev,
  onNext,
  onSubmit,
  onClose,
  isSubmitting,
  submitError, // nouvelle prop optionnelle pour gérer les erreurs de soumission
}) => {
  const [stepErrors, setStepErrors] = useState({});
  const [showAdressesSection, setShowAdressesSection] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const progressIntervalRef = useRef(null);
  const wasSubmittingRef = useRef(false);

  const steps = [
    { id: 0, name: "Type", icon: User, description: "Particulier ou professionnel" },
    { id: 1, name: "Identité", icon: Briefcase, description: "Coordonnées principales" },
    { id: 2, name: "Adresse", icon: Home, description: "Siège social" },
    { id: 3, name: "Paiement", icon: CreditCard, description: "Modalités bancaires" },
    { id: 4, name: "Récap", icon: Check, description: "Validation finale" },
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  // Gestion de l'animation de progression circulaire pendant la soumission
  useEffect(() => {
    if (isSubmitting && !wasSubmittingRef.current) {
      // Démarrage de la soumission : reset progression
      setSubmitProgress(0);
      wasSubmittingRef.current = true;
      
      // Intervalle pour incrémenter jusqu'à 95% (attendre la réponse finale)
      progressIntervalRef.current = setInterval(() => {
        setSubmitProgress(prev => {
          if (prev >= 95) return prev;
          // Incrément dynamique : plus on avance, plus c'est lent
          const increment = Math.max(1, Math.floor((100 - prev) / 20));
          return Math.min(95, prev + increment);
        });
      }, 80);
    } 
    else if (!isSubmitting && wasSubmittingRef.current) {
      // Fin de soumission : compléter à 100% si succès
      clearInterval(progressIntervalRef.current);
      
      if (!submitError) {
        // Succès : on monte rapidement à 100%
        let currentProgress = submitProgress;
        const completeInterval = setInterval(() => {
          currentProgress += 5;
          setSubmitProgress(Math.min(100, currentProgress));
          if (currentProgress >= 100) {
            clearInterval(completeInterval);
            // Afficher le toast de succès
            setShowSuccessToast(true);
            // Déclencher la fermeture après un court délai pour voir l'animation
            setTimeout(() => {
              onClose();
            }, 1500);
          }
        }, 30);
      } else {
        // En cas d'erreur, on réinitialise la progression
        setSubmitProgress(0);
      }
      wasSubmittingRef.current = false;
    }
    
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isSubmitting, submitError, onClose]);

  const validateStep = () => {
    const errors = {};
    if (currentStep === 0 && !formData.type) {
      errors.type = "Veuillez choisir un type de client";
    }
    if (currentStep === 1) {
      if (formData.type === "particulier") {
        if (!formData.nom?.trim()) errors.nom = "Nom requis";
        if (!formData.prenom?.trim()) errors.prenom = "Prénom requis";
      } else {
        if (!formData.raisonSociale?.trim()) errors.raisonSociale = "Raison sociale requise";
      }
      if (!formData.email?.trim()) {
        errors.email = "Email requis";
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        errors.email = "Email invalide";
      }
      if (!formData.telephone?.trim()) errors.telephone = "Téléphone requis";
    }
    if (currentStep === 2) {
      if (!formData.siege?.ville?.trim()) errors.ville = "Ville requise";
    }
    if (currentStep === 3) {
      if (!formData.conditionPaiement?.modePaiement) errors.modePaiement = "Mode de paiement requis";
      if (formData.conditionPaiement?.duree === undefined || formData.conditionPaiement?.duree === null)
        errors.duree = "Délai requis (0 si comptant)";
    }
    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) onNext();
  };

  const handlePrev = () => {
    setStepErrors({});
    onPrev();
  };

  const handleNestedChange = (path, value) => {
    onInputChange(path, value);
    const errorKey = path.split('.').pop();
    if (stepErrors[errorKey]) setStepErrors(prev => ({ ...prev, [errorKey]: undefined }));
  };

  const addAdresse = () => {
    const newAdresse = { type: "livraison", rue: "", ville: "", codePostal: "", pays: "Maroc", principale: false };
    onInputChange("adresses", [...(formData.adresses || []), newAdresse]);
  };
  
  const removeAdresse = (index) => {
    const current = [...(formData.adresses || [])];
    current.splice(index, 1);
    onInputChange("adresses", current);
  };
  
  const updateAdresse = (index, field, value) => {
    const current = [...(formData.adresses || [])];
    current[index][field] = value;
    onInputChange("adresses", current);
  };

  const renderError = (fieldName) => {
    const error = stepErrors[fieldName] || (externalErrors && externalErrors[fieldName]);
    return error ? <p className="text-xs text-red-500 mt-1 animate-pulse">{error}</p> : null;
  };

  // Rendu du bouton de soumission avec progression circulaire
  const renderSubmitButton = () => {
    if (isSubmitting) {
      return (
        <button
          type="button"
          disabled
          className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-[#5a7c3c] to-[#4a6b2e] px-5 py-2 text-sm font-semibold text-white shadow-lg"
        >
          <CircularProgress percentage={submitProgress} size={28} strokeWidth={3} />
          <span>Envoi en cours... {submitProgress}%</span>
        </button>
      );
    }
    
    return (
      <button
        type="submit"
        disabled={isSubmitting}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#5a7c3c] to-[#4a6b2e] px-6 py-2 text-sm font-semibold text-white hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-70"
      >
        <Check size={16} />
        {editingClient ? "Mettre à jour" : "Créer le client"}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
      {/* Toast de succès */}
      {showSuccessToast && (
        <SuccessToast 
          message={editingClient ? "Client modifié avec succès ! 🎉" : "Client ajouté avec succès ! 🎉"} 
          onClose={() => setShowSuccessToast(false)} 
        />
      )}
      
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white/95 shadow-2xl backdrop-blur-sm animate-in zoom-in-95 duration-300 border border-white/20 relative">
        
        {/* Bouton fermeture */}
        <button onClick={onClose} className="absolute top-4 right-4 rounded-full p-1.5 text-slate-400 hover:bg-gray-100 transition z-20">
          <X size={18} />
        </button>

        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-100 rounded-t-3xl">
          <div className="px-6 pt-6 pb-3 text-center">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-[#5a7c3c] to-[#8bb56a] bg-clip-text text-transparent">
              {editingClient ? "✏️ Modifier le client" : "✨ Nouveau client"}
            </h2>
            <p className="text-sm text-slate-500 mt-1 flex items-center justify-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-[#8bb56a] animate-pulse"></span>
              {steps[currentStep].description}
            </p>
          </div>
          
          {/* Barre de progression améliorée */}
          <div className="flex justify-center px-6 mt-1 mb-2">
            <div className="h-1 w-48 md:w-64 bg-gray-100 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-[#8bb56a] to-[#5a7c3c] rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          
          {/* Stepper "track" */}
          <div className="px-6 py-4 bg-gray-50/50">
            <div className="flex items-center justify-between">
              {steps.map((step, idx) => {
                const isActive = currentStep === idx;
                const isCompleted = currentStep > idx;
                return (
                  <div key={step.id} className="flex flex-col items-center flex-1 relative">
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
                        {isCompleted ? <Check size={14} /> : <step.icon size={14} />}
                      </div>
                    </div>
                    <span className={`text-[11px] font-medium mt-2 transition-all ${isActive ? "text-[#5a7c3c] font-bold" : "text-slate-400"}`}>
                      {step.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Corps du formulaire */}
        <div className="p-6 space-y-5">
          <form onSubmit={onSubmit}>
            {/* Étape 0 : Type */}
            {currentStep === 0 && (
              <div className="space-y-5 animate-in slide-in-from-right-5 duration-300">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className={`relative cursor-pointer rounded-2xl border p-5 transition-all hover:shadow-md ${formData.type === "particulier" ? "border-[#5a7c3c] bg-[#e2f0d6]/10 shadow-md" : "border-gray-200"}`}>
                    <input type="radio" name="type" value="particulier" checked={formData.type === "particulier"} onChange={(e) => handleNestedChange("type", e.target.value)} className="absolute top-3 right-3 h-4 w-4 text-[#5a7c3c]" />
                    <div className="text-center">
                      <div className={`mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full ${formData.type === "particulier" ? "bg-[#5a7c3c] text-white" : "bg-gray-100 text-gray-500"}`}><User size={24} /></div>
                      <h3 className="font-semibold text-slate-800">Particulier</h3>
                      <p className="text-xs text-slate-500">Client individuel</p>
                    </div>
                  </label>
                  <label className={`relative cursor-pointer rounded-2xl border p-5 transition-all hover:shadow-md ${formData.type === "entreprise" ? "border-[#5a7c3c] bg-[#e2f0d6]/10 shadow-md" : "border-gray-200"}`}>
                    <input type="radio" name="type" value="entreprise" checked={formData.type === "entreprise"} onChange={(e) => handleNestedChange("type", e.target.value)} className="absolute top-3 right-3 h-4 w-4 text-[#5a7c3c]" />
                    <div className="text-center">
                      <div className={`mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full ${formData.type === "entreprise" ? "bg-[#5a7c3c] text-white" : "bg-gray-100 text-gray-500"}`}><Building size={24} /></div>
                      <h3 className="font-semibold text-slate-800">Entreprise</h3>
                      <p className="text-xs text-slate-500">Société, association</p>
                    </div>
                  </label>
                </div>
                {renderError("type")}
              </div>
            )}

            {/* Étape 1 : Identité */}
            {currentStep === 1 && (
              <div className="grid grid-cols-1 gap-4 animate-in slide-in-from-right-5 duration-300">
                {formData.type === "particulier" ? (
                  <>
                    <InputIcon icon={User} type="text" value={formData.nom || ""} onChange={(e) => handleNestedChange("nom", e.target.value)} placeholder="Nom *" error={stepErrors.nom} />
                    {renderError("nom")}
                    <InputIcon icon={User} type="text" value={formData.prenom || ""} onChange={(e) => handleNestedChange("prenom", e.target.value)} placeholder="Prénom *" error={stepErrors.prenom} />
                    {renderError("prenom")}
                  </>
                ) : (
                  <>
                    <InputIcon icon={Building2} type="text" value={formData.raisonSociale || ""} onChange={(e) => handleNestedChange("raisonSociale", e.target.value)} placeholder="Raison sociale *" error={stepErrors.raisonSociale} />
                    {renderError("raisonSociale")}
                    <div className="grid grid-cols-3 gap-3">
                      <InputIcon icon={Hash} type="text" value={formData.ice || ""} onChange={(e) => handleNestedChange("ice", e.target.value)} placeholder="ICE" />
                      <InputIcon icon={FileText} type="text" value={formData.if || ""} onChange={(e) => handleNestedChange("if", e.target.value)} placeholder="IF" />
                      <InputIcon icon={Shield} type="text" value={formData.rc || ""} onChange={(e) => handleNestedChange("rc", e.target.value)} placeholder="RC" />
                    </div>
                  </>
                )}
                <InputIcon icon={Mail} type="email" value={formData.email || ""} onChange={(e) => handleNestedChange("email", e.target.value)} placeholder="Email *" error={stepErrors.email} />
                {renderError("email")}
                <InputIcon icon={Phone} type="tel" value={formData.telephone || ""} onChange={(e) => handleNestedChange("telephone", e.target.value)} placeholder="Téléphone *" error={stepErrors.telephone} />
                {renderError("telephone")}
              </div>
            )}

            {/* Étape 2 : Siège social + adresses supplémentaires */}
            {currentStep === 2 && (
              <div className="space-y-5 animate-in slide-in-from-right-5 duration-300">
                <div className="space-y-3">
                  <InputIcon icon={LocateFixed} type="text" value={formData.siege?.rue || ""} onChange={(e) => handleNestedChange("siege.rue", e.target.value)} placeholder="Rue, avenue, boulevard" />
                  <div className="grid grid-cols-2 gap-3">
                    <InputIcon icon={MapPin} type="text" value={formData.siege?.ville || ""} onChange={(e) => handleNestedChange("siege.ville", e.target.value)} placeholder="Ville *" error={stepErrors.ville} />
                    <InputIcon icon={Hash} type="text" value={formData.siege?.codePostal || ""} onChange={(e) => handleNestedChange("siege.codePostal", e.target.value)} placeholder="Code postal" />
                  </div>
                  {renderError("ville")}
                  <InputIcon icon={Flag} type="text" value={formData.siege?.pays || "Maroc"} onChange={(e) => handleNestedChange("siege.pays", e.target.value)} placeholder="Pays" />
                </div>

                {/* Adresses supplémentaires */}
                <div className="border-t pt-4">
                  <button type="button" onClick={() => setShowAdressesSection(!showAdressesSection)} className="flex items-center gap-2 text-sm text-[#5a7c3c] hover:underline">
                    <Plus size={16} /> {showAdressesSection ? "Masquer" : "Ajouter d'autres adresses"}
                  </button>
                  {showAdressesSection && (
                    <div className="mt-3 space-y-4">
                      {(formData.adresses || []).map((addr, idx) => (
                        <div key={idx} className="relative rounded-xl border p-4 bg-gray-50/50">
                          <button type="button" onClick={() => removeAdresse(idx)} className="absolute top-2 right-2 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                          <div className="grid grid-cols-1 gap-3">
                            <SelectIcon icon={MapPin} value={addr.type || "livraison"} onChange={(e) => updateAdresse(idx, "type", e.target.value)}>
                              <option value="livraison">Livraison</option>
                              <option value="facturation">Facturation</option>
                              <option value="autre">Autre</option>
                            </SelectIcon>
                            <input type="text" value={addr.rue || ""} onChange={(e) => updateAdresse(idx, "rue", e.target.value)} placeholder="Rue" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                            <div className="grid grid-cols-2 gap-3">
                              <input type="text" value={addr.ville || ""} onChange={(e) => updateAdresse(idx, "ville", e.target.value)} placeholder="Ville" className="rounded-lg border px-3 py-2 text-sm" />
                              <input type="text" value={addr.codePostal || ""} onChange={(e) => updateAdresse(idx, "codePostal", e.target.value)} placeholder="Code postal" className="rounded-lg border px-3 py-2 text-sm" />
                            </div>
                            <input type="text" value={addr.pays || "Maroc"} onChange={(e) => updateAdresse(idx, "pays", e.target.value)} placeholder="Pays" className="rounded-lg border px-3 py-2 text-sm" />
                            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={addr.principale || false} onChange={(e) => updateAdresse(idx, "principale", e.target.checked)} /> Adresse principale</label>
                          </div>
                        </div>
                      ))}
                      <button type="button" onClick={addAdresse} className="flex items-center gap-1 text-xs text-[#5a7c3c] border border-[#d4e6b0] rounded-lg px-3 py-1.5"><Plus size={14} /> Ajouter une adresse</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Étape 3 : Paiement */}
            {currentStep === 3 && (
              <div className="space-y-5 animate-in slide-in-from-right-5 duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <SelectIcon icon={CreditCard} value={formData.conditionPaiement?.modePaiement || "virement"} onChange={(e) => handleNestedChange("conditionPaiement.modePaiement", e.target.value)} error={stepErrors.modePaiement}>
                    <option value="virement">Virement bancaire</option>
                    <option value="cheque">Chèque</option>
                    <option value="especes">Espèces</option>
                  </SelectIcon>
                  {renderError("modePaiement")}
                  <InputIcon icon={Calendar} type="number" value={formData.conditionPaiement?.duree ?? 30} onChange={(e) => handleNestedChange("conditionPaiement.duree", parseInt(e.target.value) || 0)} placeholder="Délai (jours) *" error={stepErrors.duree} />
                  {renderError("duree")}
                </div>
                <div className="border-t pt-4 space-y-3">
                  <InputIcon icon={Building} type="text" value={formData.conditionPaiement?.banque?.nomBanque || ""} onChange={(e) => handleNestedChange("conditionPaiement.banque.nomBanque", e.target.value)} placeholder="Nom de la banque" />
                  <div className="grid grid-cols-2 gap-3">
                    <InputIcon icon={FileText} type="text" value={formData.conditionPaiement?.banque?.rib || ""} onChange={(e) => handleNestedChange("conditionPaiement.banque.rib", e.target.value)} placeholder="RIB" />
                    <InputIcon icon={Globe} type="text" value={formData.conditionPaiement?.banque?.iban || ""} onChange={(e) => handleNestedChange("conditionPaiement.banque.iban", e.target.value)} placeholder="IBAN" />
                  </div>
                  <InputIcon icon={Shield} type="text" value={formData.conditionPaiement?.banque?.swift || ""} onChange={(e) => handleNestedChange("conditionPaiement.banque.swift", e.target.value)} placeholder="SWIFT/BIC" />
                </div>
              </div>
            )}

            {/* Étape 4 : Récapitulatif */}
            {currentStep === 4 && (
              <div className="space-y-5 animate-in slide-in-from-right-5 duration-300">
                <div className="rounded-2xl bg-gradient-to-br from-[#e2f0d6]/10 to-white p-5 border border-[#d4e6b0] shadow-inner">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full ${formData.type === "particulier" ? "bg-blue-100" : "bg-purple-100"}`}>
                      {formData.type === "particulier" ? <User size={22} className="text-blue-600" /> : <Building size={22} className="text-purple-600" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">
                        {formData.type === "particulier" ? `${formData.nom || "?"} ${formData.prenom || "?"}` : formData.raisonSociale || "?"}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${formData.type === "particulier" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                        {formData.type === "particulier" ? "Particulier" : "Entreprise"}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2"><Mail size={14} className="text-slate-400"/><span>{formData.email || "—"}</span></div>
                    <div className="flex items-center gap-2"><Phone size={14} className="text-slate-400"/><span>{formData.telephone || "—"}</span></div>
                    <div className="col-span-2 flex items-start gap-2"><MapPin size={14} className="text-slate-400 mt-0.5"/><span>{formData.siege?.rue ? `${formData.siege.rue}, ` : ""}{formData.siege?.ville} {formData.siege?.codePostal} ({formData.siege?.pays})</span></div>
                    <div className="flex items-center gap-2"><CreditCard size={14} className="text-slate-400"/><span className="capitalize">{formData.conditionPaiement?.modePaiement || "—"}</span></div>
                    <div className="flex items-center gap-2"><Calendar size={14} className="text-slate-400"/><span>{formData.conditionPaiement?.duree || 0} jours</span></div>
                    {formData.type === "entreprise" && (
                      <>
                        <div className="flex items-center gap-2"><Hash size={14} className="text-slate-400"/><span>ICE: {formData.ice || "—"}</span></div>
                        <div className="flex items-center gap-2"><Shield size={14} className="text-slate-400"/><span>RC: {formData.rc || "—"}</span></div>
                      </>
                    )}
                  </div>
                  {formData.adresses?.length > 0 && (
                    <div className="mt-3 pt-2 border-t text-xs">
                      <p className="font-semibold mb-1">Autres adresses :</p>
                      {formData.adresses.map((a,i) => <div key={i} className="text-slate-600">• {a.type} : {a.rue}, {a.ville}</div>)}
                    </div>
                  )}
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center text-green-700 text-sm flex items-center justify-center gap-2"><Check size={16} /> Vérifiez avant de créer</div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8 pt-4 border-t">
              {currentStep > 0 && (
                <button type="button" onClick={handlePrev} className="flex items-center gap-2 rounded-xl bg-gray-100 px-5 py-2 text-sm font-medium text-slate-600 hover:bg-gray-200 transition">
                  <ChevronLeft size={16} /> Précédent
                </button>
              )}
              <div className="flex-1" />
              {currentStep < 4 ? (
                <button type="button" onClick={handleNext} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#e2f0d6] to-[#d4e6b0] px-5 py-2 text-sm font-semibold text-[#5a7c3c] hover:shadow-md transition">
                  Suivant <ChevronRight size={16} />
                </button>
              ) : (
                renderSubmitButton()
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

ClientFormStepper.propTypes = {
  editingClient: PropTypes.bool,
  formData: PropTypes.object.isRequired,
  formErrors: PropTypes.object,
  currentStep: PropTypes.number.isRequired,
  onInputChange: PropTypes.func.isRequired,
  onPrev: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
  submitError: PropTypes.string,
};

export default ClientFormStepper;