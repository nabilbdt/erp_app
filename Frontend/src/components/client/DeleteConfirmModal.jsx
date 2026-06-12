// components/client/DeleteConfirmModal.jsx
import React from "react";
import { Trash2, X } from "lucide-react";

const DeleteConfirmModal = ({ client, onConfirm, onCancel }) => {
  if (!client) return null;

  const clientName = client.type === "particulier" 
    ? `${client.nom || ""} ${client.prenom || ""}`.trim()
    : client.raisonSociale;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
            <Trash2 size={24} />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Confirmer la suppression</h3>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Êtes-vous sûr de vouloir supprimer <strong className="text-slate-800 dark:text-white">{clientName}</strong> ?
        </p>
        <p className="text-xs text-red-500 mt-2">Cette action est irréversible.</p>
        <div className="mt-6 flex justify-end gap-3">
          <button 
            onClick={onCancel} 
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Annuler
          </button>
          <button 
            onClick={onConfirm} 
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;