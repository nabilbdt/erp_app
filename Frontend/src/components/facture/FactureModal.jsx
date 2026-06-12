import React, { useState, useEffect } from "react";
import { X, Save } from "lucide-react";

const FactureModal = ({ facture, clients, onSave, onClose, isSaving }) => {
  const [formData, setFormData] = useState({
    client: "",
    dateEcheance: "",
    note: "",
  });

  useEffect(() => {
    if (facture) {
      setFormData({
        client: facture.client?._id || facture.client || "",
        dateEcheance: facture.dateEcheance?.split("T")[0] || "",
        note: facture.note || "",
      });
    } else {
      setFormData({ client: "", dateEcheance: "", note: "" });
    }
  }, [facture]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between border-b p-5">
          <h2 className="text-xl font-bold">{facture ? "Modifier" : "Nouvelle"} facture</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Client *</label>
            <select
              required
              value={formData.client}
              onChange={(e) => setFormData({ ...formData, client: e.target.value })}
              className="w-full border rounded-lg p-2"
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
            <label className="block text-sm font-medium mb-1">Date d'échéance</label>
            <input
              type="date"
              value={formData.dateEcheance}
              onChange={(e) => setFormData({ ...formData, dateEcheance: e.target.value })}
              className="w-full border rounded-lg p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Note</label>
            <textarea
              rows="3"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
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
              {isSaving ? "Enregistrement..." : <Save size={16} />}
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FactureModal;