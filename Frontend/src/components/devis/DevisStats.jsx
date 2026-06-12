// src/components/devis/DevisStats.jsx
import React from 'react';
import { FileText, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react';

const DevisStats = ({ devis }) => {
  const total = devis.length;
  const enAttente = devis.filter(d => d.statut === 'en_attente').length;
  const acceptes = devis.filter(d => d.statut === 'accepte').length;
  const refuses = devis.filter(d => d.statut === 'refuse').length;
  const aNegocier = devis.filter(d => d.statut === 'a_negocier').length;
  const montantTotal = devis.reduce((sum, d) => sum + (d.montantTotal || 0), 0);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 mt-6 mb-6">
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Total devis</p>
            <p className="text-2xl font-bold text-slate-800">{total}</p>
          </div>
          <FileText size={28} className="text-blue-500" />
        </div>
      </div>
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">En attente</p>
            <p className="text-2xl font-bold text-yellow-600">{enAttente}</p>
          </div>
          <Clock size={28} className="text-yellow-500" />
        </div>
      </div>
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Acceptés</p>
            <p className="text-2xl font-bold text-green-600">{acceptes}</p>
          </div>
          <CheckCircle size={28} className="text-green-500" />
        </div>
      </div>
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Refusés / À négocier</p>
            <p className="text-2xl font-bold text-red-600">{refuses + aNegocier}</p>
          </div>
          <XCircle size={28} className="text-red-500" />
        </div>
      </div>
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Montant total</p>
            <p className="text-2xl font-bold text-purple-600">{montantTotal.toLocaleString()} DH</p>
          </div>
          <TrendingUp size={28} className="text-purple-500" />
        </div>
      </div>
    </div>
  );
};

export default DevisStats;