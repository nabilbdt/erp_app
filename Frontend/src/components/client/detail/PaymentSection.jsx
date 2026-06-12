// components/client/PaymentSection.jsx
import React from "react";
import { CreditCard, Wallet, Clock, Banknote } from "lucide-react";

const PaymentItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
    <Icon size={18} className="mt-0.5 text-slate-400" />
    <div className="flex-1">
      <p className="text-xs text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-slate-700 mt-0.5">{value || "—"}</p>
    </div>
  </div>
);

const PaymentSection = ({ conditionPaiement }) => {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
      <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
        <div className="rounded-lg bg-[#e2f0d6] p-1.5 text-[#5a7c3c]">
          <CreditCard size={18} />
        </div>
        <h2 className="text-lg font-semibold text-slate-800">Conditions de paiement</h2>
      </div>
      
      <PaymentItem 
        icon={Wallet} 
        label="Mode de paiement" 
        value={conditionPaiement?.modePaiement || conditionPaiement?.mode} 
      />
      <PaymentItem 
        icon={Clock} 
        label="Délai de paiement" 
        value={conditionPaiement?.duree || conditionPaiement?.delai ? `${conditionPaiement?.duree || conditionPaiement?.delai} jours` : "—"} 
      />
      <PaymentItem 
        icon={Banknote} 
        label="Banque" 
        value={conditionPaiement?.banque?.nomBanque || conditionPaiement?.coordonneesBancaires?.banque} 
      />
      <PaymentItem 
        icon={CreditCard} 
        label="RIB" 
        value={conditionPaiement?.banque?.rib || conditionPaiement?.coordonneesBancaires?.rib} 
      />
      <PaymentItem 
        icon={CreditCard} 
        label="IBAN" 
        value={conditionPaiement?.banque?.iban || conditionPaiement?.coordonneesBancaires?.iban} 
      />
    </div>
  );
};

export default PaymentSection;