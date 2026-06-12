// components/client/ClientInfoSection.jsx
import React from "react";
import { User, Mail, Phone, Briefcase, FileCheck, Settings, Calendar, Building } from "lucide-react";

const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
    <Icon size={18} className="mt-0.5 text-slate-400" />
    <div className="flex-1">
      <p className="text-xs text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-slate-700 mt-0.5">{value || "—"}</p>
    </div>
  </div>
);

const ClientInfoSection = ({ client }) => {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
      <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
        <div className="rounded-lg bg-[#e2f0d6] p-1.5 text-[#5a7c3c]">
          <User size={18} />
        </div>
        <h2 className="text-lg font-semibold text-slate-800">Informations générales</h2>
      </div>
      
      <InfoItem icon={Mail} label="Email" value={client?.email} />
      <InfoItem icon={Phone} label="Téléphone" value={client?.telephone} />
      
      {client?.type === "particulier" ? (
        <>
          <InfoItem icon={User} label="Nom" value={client?.nom} />
          <InfoItem icon={User} label="Prénom" value={client?.prenom} />
        </>
      ) : (
        <>
          <InfoItem icon={Building} label="Raison sociale" value={client?.raisonSociale || client?.nom} />
          <InfoItem icon={Briefcase} label="ICE" value={client?.ice} />
          <InfoItem icon={FileCheck} label="IF" value={client?.if} />
          <InfoItem icon={Settings} label="RC" value={client?.rc} />
        </>
      )}
      <InfoItem icon={Calendar} label="Date d'ajout" value={client?.createdAt ? new Date(client.createdAt).toLocaleDateString() : ""} />
    </div>
  );
};

export default ClientInfoSection;