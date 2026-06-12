// components/client/ClientStats.jsx
import React from "react";
import { Package, FileText, Receipt, DollarSign } from "lucide-react";

const StatCard = ({ title, value, icon: Icon, color, onClick, subValue, badge }) => (
  <div 
    onClick={onClick}
    className={`group cursor-pointer rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition-all hover:shadow-md ${onClick ? 'hover:scale-105' : ''}`}
  >
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
        {subValue && <p className="text-xs text-slate-400 mt-1">{subValue}</p>}
        {badge && <span className="inline-block mt-2 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">{badge}</span>}
      </div>
      <div className={`rounded-xl ${color} p-3 transition-transform group-hover:scale-110`}>
        <Icon size={22} className="text-white" />
      </div>
    </div>
  </div>
);

const ClientStats = ({ stats, onTabChange }) => {
  // Sécurité : stats peut être undefined
  if (!stats) return null;

  // Extraction des valeurs fournies par le dashboard
  const {
    totalCommandes = 0,
    totalDevis = 0,
    totalFactures = 0,
    totalCA = 0,
    totalPaye = 0,
    resteAPayer = 0,
    commandes = {}   // contient enAttente, confirmees, livrees, partielles, refusees
  } = stats;

  const {
    enAttente = 0,
    confirmees = 0,
    livrees = 0,
    partielles = 0,
    refusees = 0
  } = commandes;

  // Construction du sous‑texte pour la carte Commandes
  const statutLabels = [];
  if (enAttente) statutLabels.push(`${enAttente} en attente`);
  if (confirmees) statutLabels.push(`${confirmees} confirmée(s)`);
  if (livrees) statutLabels.push(`${livrees} livrée(s)`);
  if (partielles) statutLabels.push(`${partielles} partielle(s)`);
  if (refusees) statutLabels.push(`${refusees} refusée(s)`);
  const commandesDetail = statutLabels.length ? statutLabels.join(', ') : "Aucune commande";

  // Badge financier (optionnel)
  let badgeText = '';
  let badgeColor = 'bg-gray-100 text-gray-700';
  if (totalCA > 0) {
    if (totalPaye >= totalCA) {
      badgeText = 'Soldé';
      badgeColor = 'bg-green-100 text-green-700';
    } else if (totalPaye === 0) {
      badgeText = 'Non payé';
      badgeColor = 'bg-red-100 text-red-700';
    } else {
      badgeText = 'En cours';
      badgeColor = 'bg-yellow-100 text-yellow-700';
    }
  }

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Commandes */}
      <StatCard 
        title="Commandes" 
        value={totalCommandes} 
        icon={Package} 
        color="bg-blue-500" 
        onClick={() => onTabChange("commandes")}
        subValue={commandesDetail}
      />
      
      {/* Devis */}
      <StatCard 
        title="Devis" 
        value={totalDevis} 
        icon={FileText} 
        color="bg-purple-500" 
        onClick={() => onTabChange("devis")}
      />
      
      {/* Factures */}
      <StatCard 
        title="Factures" 
        value={totalFactures} 
        icon={Receipt} 
        color="bg-green-500" 
        onClick={() => onTabChange("factures")}
      />
      
      {/* Chiffre d'affaires */}
      <StatCard 
        title="Chiffre d'affaires" 
        value={`${totalCA.toLocaleString()} DH`} 
        icon={DollarSign} 
        color="bg-orange-500" 
        onClick={() => onTabChange("analytics")}
        subValue={`Payé : ${totalPaye.toLocaleString()} DH | Reste : ${resteAPayer.toLocaleString()} DH`}
        badge={badgeText ? <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>{badgeText}</span> : null}
      />
    </div>
  );
};

export default ClientStats;