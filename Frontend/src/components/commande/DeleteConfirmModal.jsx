import React from 'react';
import { Trash2 } from 'lucide-react';

const DeleteConfirmModal = ({ commande, onConfirm, onCancel }) => {
  if (!commande) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full"><div className="flex items-center gap-3 text-red-600"><Trash2 size={24} /><h3>Confirmer la suppression</h3></div>
        <p className="my-4">Supprimer la commande <strong>{commande.reference}</strong> ? Cette action est irréversible.</p>
        <div className="flex justify-end gap-3"><button onClick={onCancel} className="px-4 py-2 border rounded">Annuler</button><button onClick={onConfirm} className="px-4 py-2 bg-red-500 text-white rounded">Supprimer</button></div>
      </div>
    </div>
  );
};
export default DeleteConfirmModal;