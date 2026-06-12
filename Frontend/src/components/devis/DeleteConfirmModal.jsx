// src/components/devis/DeleteConfirmModal.jsx
import React from 'react';
import { Trash2, X } from 'lucide-react';

const DeleteConfirmModal = ({ devis, onConfirm, onCancel }) => {
  if (!devis) return null;
  return (
    <div className="fixed inset-0 z-[350] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600"><Trash2 size={24} /></div>
          <h3 className="text-lg font-semibold">Confirmer la suppression</h3>
        </div>
        <p className="text-slate-600 mb-6">Supprimer le devis <strong>{devis.reference}</strong> ? Cette action est irréversible.</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="rounded-lg px-4 py-2 text-sm hover:bg-gray-100">Annuler</button>
          <button onClick={onConfirm} className="rounded-lg bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600">Supprimer</button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;