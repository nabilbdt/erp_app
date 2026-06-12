// components/paiement/PaiementForm.jsx
import React, { useState, useEffect } from "react";

// ==================== Composant Modal local ====================
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6 max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
// ================================================================

const PaiementForm = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    reference: "",
    facture: "",
    client: "",
    commande: "",
    livraison: "",
    montantAPayer: "",
    montantPaye: 0,
    resteAPayer: "",
    conditionPaiement: {
      modePaiement: "virement",
      duree: 0,
      banque: {},
    },
    datePaiementPrevue: "",
    note: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        reference: initialData.reference || "",
        facture: initialData.facture?._id || initialData.facture || "",
        client: initialData.client?._id || initialData.client || "",
        commande: initialData.commande?._id || initialData.commande || "",
        livraison: initialData.livraison?._id || initialData.livraison || "",
        montantAPayer: initialData.montantAPayer || "",
        montantPaye: initialData.montantPaye || 0,
        resteAPayer: initialData.resteAPayer || "",
        conditionPaiement: initialData.conditionPaiement || {
          modePaiement: "virement",
          duree: 0,
          banque: {},
        },
        datePaiementPrevue: initialData.datePaiementPrevue?.split("T")[0] || "",
        note: initialData.note || "",
      });
    } else {
      setFormData({
        reference: "",
        facture: "",
        client: "",
        commande: "",
        livraison: "",
        montantAPayer: "",
        montantPaye: 0,
        resteAPayer: "",
        conditionPaiement: { modePaiement: "virement", duree: 0, banque: {} },
        datePaiementPrevue: "",
        note: "",
      });
    }
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("condition.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        conditionPaiement: { ...prev.conditionPaiement, [field]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Modifier le paiement" : "Nouveau paiement"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Référence *</label>
          <input
            type="text"
            name="reference"
            value={formData.reference}
            onChange={handleChange}
            className="w-full border rounded px-2 py-1"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">ID Facture *</label>
          <input
            type="text"
            name="facture"
            value={formData.facture}
            onChange={handleChange}
            className="w-full border rounded px-2 py-1"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">ID Client *</label>
          <input
            type="text"
            name="client"
            value={formData.client}
            onChange={handleChange}
            className="w-full border rounded px-2 py-1"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Montant à payer</label>
            <input
              type="number"
              step="0.01"
              name="montantAPayer"
              value={formData.montantAPayer}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Montant déjà payé</label>
            <input
              type="number"
              step="0.01"
              name="montantPaye"
              value={formData.montantPaye}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Date prévue</label>
          <input
            type="date"
            name="datePaiementPrevue"
            value={formData.datePaiementPrevue}
            onChange={handleChange}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Mode de paiement</label>
          <select
            name="condition.modePaiement"
            value={formData.conditionPaiement.modePaiement}
            onChange={handleChange}
            className="w-full border rounded px-2 py-1"
          >
            <option value="virement">Virement</option>
            <option value="cheque">Chèque</option>
            <option value="especes">Espèces</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Note</label>
          <textarea
            name="note"
            value={formData.note}
            onChange={handleChange}
            className="w-full border rounded px-2 py-1"
            rows="2"
          />
        </div>
        <div className="flex justify-end space-x-2 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded">
            Annuler
          </button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
            Enregistrer
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default PaiementForm;