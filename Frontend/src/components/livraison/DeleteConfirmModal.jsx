import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const DeleteConfirmModal = ({ livraison, onConfirm, onCancel }) => {
  if (!livraison) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3 text-amber-600">
            <AlertTriangle size={24} />
            <h3 className="text-lg font-semibold">Confirmer la suppression</h3>
          </div>
          <button onClick={onCancel} className="p-1 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>
        <p className="mb-6">
          Êtes-vous sûr de vouloir supprimer la livraison <strong>{livraison.reference}</strong> ?<br />
          Cette action est irréversible.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
            Annuler
          </button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;