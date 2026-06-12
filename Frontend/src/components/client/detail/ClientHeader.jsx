// components/client/ClientHeader.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Trash2, User, Building } from "lucide-react";

const ClientHeader = ({ client, onEdit, onDelete, editMode }) => {
  const navigate = useNavigate();

  return (
    <div className="mb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/client")} className="rounded-full p-2 text-slate-400 hover:bg-gray-100">
            <ArrowLeft size={20} />
          </button>
          <div className={`flex h-14 w-14 items-center justify-center rounded-full ${
            client?.type === "particulier" ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"
          }`}>
            {client?.type === "particulier" ? <User size={28} /> : <Building size={28} />}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              {client?.type === "particulier"
                ? `${client?.nom || ""} ${client?.prenom || ""}`.trim()
                : client?.raisonSociale || client?.nom}
            </h1>
            <p className="text-sm text-slate-500">
              {client?.reference} • Client depuis {client?.createdAt ? new Date(client.createdAt).toLocaleDateString() : ""}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!editMode ? (
            <>
              <button onClick={onEdit} className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-gray-50">
                <Edit size={16} /> Modifier
              </button>
              <button onClick={onDelete} className="flex items-center gap-2 rounded-xl border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600">
                <Trash2 size={16} /> Supprimer
              </button>
            </>
          ) : (
            <>
              <button onClick={() => onEdit()} className="flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-white">
                Enregistrer
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientHeader;