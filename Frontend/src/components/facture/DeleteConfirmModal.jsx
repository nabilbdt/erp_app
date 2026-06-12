import React from "react";
import { Trash2, X } from "lucide-react";

const DeleteConfirmModal = ({ facture, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        <div className="p-5 border-b">
          <h3 className="text-lg font-semibold">Confirmer la suppression</h3>
        </div>
        <div className="p-5">
          <p className="text-gray-600">
            Voulez-vous vraiment supprimer la facture <strong>{facture.reference}</strong> ?
          </p>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t bg-gray-50">
          <button
            onClick={onCancel}
            className="px-4 py-2 border rounded-xl hover:bg-gray-100"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 flex items-center gap-2"
          >
            <Trash2 size={16} /> Supprimer
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;