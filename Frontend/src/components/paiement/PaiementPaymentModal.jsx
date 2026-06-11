// components/paiement/PaiementPaymentModal.jsx
import React, { useState, useEffect } from 'react';
import { X, CreditCard, DollarSign, FileText, AlertCircle } from 'lucide-react';

// Composant Input avec icône (identique à celui du stepper)
const InputIcon = ({ icon: Icon, error, ...props }) => (
  <div className="relative group">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#5a7c3c] transition-colors">
      <Icon size={18} />
    </div>
    <input
      {...props}
      className={`w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-[#d4e6b0] focus:border-[#8bb56a] bg-white/90 ${
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
      className={`w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm outline-none appearance-none bg-white/90 transition-all duration-200 focus:ring-2 focus:ring-[#d4e6b0] focus:border-[#8bb56a] ${
        error ? "border-red-500" : "border-gray-200"
      }`}
    >
      {children}
    </select>
  </div>
);

const formatCurrency = (value) => `${(value || 0).toLocaleString()} DH`;

const PaiementPaymentModal = ({ isOpen, onClose, onSubmit, paiement, isSaving }) => {
  const [montant, setMontant] = useState('');
  const [modePaiement, setModePaiement] = useState('virement');
  const [remarque, setRemarque] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMontant('');
      setModePaiement('virement');
      setRemarque('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!montant || parseFloat(montant) <= 0) {
      setError('Montant invalide');
      return;
    }
    if (parseFloat(montant) > paiement?.resteAPayer) {
      setError(`Le montant ne peut pas dépasser ${formatCurrency(paiement.resteAPayer)}`);
      return;
    }
    onSubmit({ montant: parseFloat(montant), modePaiement, remarque });
  };

  if (!isOpen || !paiement) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white/95 shadow-2xl backdrop-blur-sm animate-in zoom-in-95 duration-300 border border-white/20 relative">
        
        {/* Bouton fermeture */}
        <button onClick={onClose} className="absolute top-4 right-4 rounded-full p-1.5 text-slate-400 hover:bg-gray-100 transition z-20">
          <X size={18} />
        </button>

        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-100 rounded-t-3xl">
          <div className="px-6 pt-6 pb-3 text-center">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-[#5a7c3c] to-[#8bb56a] bg-clip-text text-transparent">
              Effectuer un paiement
            </h2>
            <p className="text-sm text-slate-500 mt-1 flex items-center justify-center gap-1">
              <CreditCard size={14} /> Enregistrer un versement
            </p>
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Carte d'information sur le paiement */}
          <div className="rounded-xl bg-[#e2f0d6]/10 p-4 border border-[#d4e6b0]">
            <h3 className="text-sm font-semibold text-[#5a7c3c] mb-2 flex items-center gap-2">
              <AlertCircle size={16} /> Paiement pour
            </h3>
            <p className="font-semibold text-slate-800">{paiement.reference}</p>
            <p className="text-sm mt-1 text-slate-600">
              Reste à payer : <span className="font-bold text-amber-600">{formatCurrency(paiement.resteAPayer)}</span>
            </p>
          </div>

          {/* Montant */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Montant à payer *</label>
            <InputIcon
              icon={DollarSign}
              type="number"
              step="0.01"
              value={montant}
              onChange={(e) => {
                setMontant(e.target.value);
                setError('');
              }}
              max={paiement.resteAPayer}
              error={error}
              placeholder="0,00 DH"
            />
            {error && <p className="text-xs text-red-500 mt-1 animate-pulse">{error}</p>}
          </div>

          {/* Mode de paiement */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mode de paiement *</label>
            <SelectIcon icon={CreditCard} value={modePaiement} onChange={(e) => setModePaiement(e.target.value)}>
              <option value="virement">Virement bancaire</option>
              <option value="cheque">Chèque</option>
              <option value="especes">Espèces</option>
              <option value="carte">Carte bancaire</option>
              <option value="prelevement">Prélèvement automatique</option>
            </SelectIcon>
          </div>

          {/* Remarque */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Remarque (optionnelle)</label>
            <InputIcon
              icon={FileText}
              type="text"
              value={remarque}
              onChange={(e) => setRemarque(e.target.value)}
              placeholder="Information complémentaire..."
            />
          </div>

          {/* Boutons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-gray-200 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#5a7c3c] to-[#4a6b2e] px-6 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition disabled:opacity-70"
            >
              {isSaving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <CreditCard size={16} />
              )}
              {isSaving ? "Traitement..." : "Confirmer le paiement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaiementPaymentModal;