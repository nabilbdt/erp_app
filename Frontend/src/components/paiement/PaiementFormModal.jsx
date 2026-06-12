// components/paiement/PaiementFormModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

const PaiementFormModal = ({ isOpen, onClose, onSubmit, initialData, clients, factures, isSaving }) => {
  const [formData, setFormData] = useState({
    reference: '',
    client: '',
    facture: '',
    montantAPayer: '',
    datePaiementPrevue: '',
    note: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        reference: initialData.reference || '',
        client: initialData.client?._id || initialData.client || '',
        facture: initialData.facture?._id || initialData.facture || '',
        montantAPayer: initialData.montantAPayer || '',
        datePaiementPrevue: initialData.datePaiementPrevue?.split('T')[0] || '',
        note: initialData.note || '',
      });
    } else {
      setFormData({
        reference: '',
        client: '',
        facture: '',
        montantAPayer: '',
        datePaiementPrevue: '',
        note: '',
      });
    }
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between border-b p-5">
          <h2 className="text-xl font-bold">{initialData ? 'Modifier le paiement' : 'Nouveau paiement'}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Référence *</label>
            <input
              type="text"
              name="reference"
              value={formData.reference}
              onChange={handleChange}
              className="w-full border rounded-lg p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Client *</label>
            <select
              name="client"
              value={formData.client}
              onChange={handleChange}
              className="w-full border rounded-lg p-2"
              required
            >
              <option value="">Sélectionner un client</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.nom || c.raisonSociale}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Facture associée *</label>
            <select
              name="facture"
              value={formData.facture}
              onChange={handleChange}
              className="w-full border rounded-lg p-2"
              required
            >
              <option value="">Sélectionner une facture</option>
              {factures.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.reference} - {(f.totalTTC || 0).toLocaleString()} DH
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Montant à payer (DH) *</label>
            <input
              type="number"
              step="0.01"
              name="montantAPayer"
              value={formData.montantAPayer}
              onChange={handleChange}
              className="w-full border rounded-lg p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date d'échéance prévue</label>
            <input
              type="date"
              name="datePaiementPrevue"
              value={formData.datePaiementPrevue}
              onChange={handleChange}
              className="w-full border rounded-lg p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Note</label>
            <textarea
              name="note"
              rows="2"
              value={formData.note}
              onChange={handleChange}
              className="w-full border rounded-lg p-2"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-xl hover:bg-gray-100"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2"
            >
              {isSaving ? 'Enregistrement...' : <Save size={16} />}
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaiementFormModal;