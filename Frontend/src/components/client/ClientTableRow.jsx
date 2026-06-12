// components/client/ClientTableRow.jsx
import React from "react";
import { User, Building, Mail, Phone, MapPin } from "lucide-react";

const getTypeBadge = (type) => {
  if (type === "particulier") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
        <User size={12} /> Particulier
      </span>
    );
  }
  if (type === "entreprise") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-700">
        <Building size={12} /> Entreprise
      </span>
    );
  }
  return <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">—</span>;
};

const ClientTableRow = ({ client, index, onClick }) => {
  const nomComplet = client.type === "particulier"
    ? `${client.prenom || ""} ${client.nom || ""}`.trim()
    : client.raisonSociale || "-";

  return (
    <tr
      onClick={() => onClick(client)}
      className="group cursor-pointer transition-all duration-200 hover:bg-gray-50/80 dark:hover:bg-slate-800/50"
    >
      {/* Référence avec badge circulaire pistache */}
      <td className="whitespace-nowrap px-5 py-4">
        <div className="inline-flex h-8 min-w-[80px] items-center justify-center rounded-full bg-gradient-to-r from-[#d4e6b0] to-[#c0db9a] px-3 text-center text-xs font-bold text-[#3a5a1e] shadow-sm">
          {client.reference || "—"}
        </div>
      </td>

      {/* Nom complet */}
      <td className="whitespace-nowrap px-5 py-4">
        <div className="font-semibold text-slate-800 dark:text-white">
          {nomComplet}
        </div>
      </td>

      {/* Type */}
      <td className="whitespace-nowrap px-5 py-4">{getTypeBadge(client.type)}</td>

      {/* Email */}
      <td className="whitespace-nowrap px-5 py-4">
        <div className="flex items-center gap-1">
          <Mail size={14} className="text-slate-400" />
          <span className="text-sm text-slate-600 dark:text-slate-300">
            {client.email || "—"}
          </span>
        </div>
      </td>

      {/* Téléphone */}
      <td className="whitespace-nowrap px-5 py-4">
        <div className="flex items-center gap-1">
          <Phone size={14} className="text-slate-400" />
          <span className="text-sm text-slate-600 dark:text-slate-300">
            {client.telephone || "—"}
          </span>
        </div>
      </td>

      {/* Ville */}
      <td className="whitespace-nowrap px-5 py-4">
        <div className="flex items-center gap-1">
          <MapPin size={14} className="text-slate-400" />
          <span className="text-sm text-slate-600 dark:text-slate-300">
            {client.siege?.ville || "—"}
          </span>
        </div>
      </td>
    </tr>
  );
};

export default ClientTableRow;