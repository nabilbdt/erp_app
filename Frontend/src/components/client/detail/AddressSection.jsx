// components/client/AddressSection.jsx
import React from "react";
import { MapPin, Home, Globe } from "lucide-react";

const AddressItem = ({ address }) => (
  <div className={`rounded-xl border p-4 ${address?.principale ? 'border-[#d4e6b0] bg-[#e2f0d6]/10' : 'border-gray-100'}`}>
    <div className="flex items-center gap-2 mb-2">
      <span className="text-sm font-semibold text-slate-700">
        {address?.type === "facturation" ? "📍 Facturation" : "🚚 Livraison"}
      </span>
      {address?.principale && (
        <span className="text-xs bg-[#e2f0d6] text-[#5a7c3c] px-2 py-0.5 rounded-full">Principale</span>
      )}
    </div>
    <p className="text-sm text-slate-600">{address?.rue}</p>
    <p className="text-sm text-slate-600">{address?.ville} {address?.codePostal}</p>
    <p className="text-sm text-slate-600">{address?.pays}</p>
  </div>
);

const AddressSection = ({ addresses }) => {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
      <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
        <div className="rounded-lg bg-[#e2f0d6] p-1.5 text-[#5a7c3c]">
          <MapPin size={18} />
        </div>
        <h2 className="text-lg font-semibold text-slate-800">Adresses</h2>
      </div>
      
      <div className="space-y-3">
        {addresses && addresses.length > 0 ? (
          addresses.map((address, idx) => (
            <AddressItem key={address._id || idx} address={address} />
          ))
        ) : (
          <p className="text-center text-slate-400 py-4">Aucune adresse</p>
        )}
      </div>
    </div>
  );
};

export default AddressSection;