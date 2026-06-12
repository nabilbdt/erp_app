// pages/PaiementDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, CreditCard, Building2, FileText, Package,
  Calendar, DollarSign, CheckCircle, AlertCircle, XCircle,
  History, Banknote, Receipt, FileDown, X, Download
} from 'lucide-react';
import { getPaiementById, effectuerPaiement } from '../services/paiement.service';
import PaiementPaymentModal from '../components/paiement/PaiementPaymentModal';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0) + ' DH';
};

const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('fr-FR');
};

const StatutBadge = ({ statut }) => {
  const config = {
    non_paye: { label: 'Non payé', color: 'bg-rose-100 text-rose-800', icon: XCircle },
    partiel: { label: 'Partiel', color: 'bg-amber-100 text-amber-800', icon: AlertCircle },
    paye: { label: 'Payé', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
  };
  const { label, color, icon: Icon } = config[statut] || { label: statut, color: 'bg-gray-100 text-gray-700', icon: null };
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${color}`}>
      {Icon && <Icon size={14} />}
      {label}
    </span>
  );
};

const PaiementDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [paiement, setPaiement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');

  useEffect(() => {
    fetchPaiement();
  }, [id]);

  const fetchPaiement = async () => {
    try {
      setLoading(true);
      const response = await getPaiementById(id);
      setPaiement(response.data);
    } catch (err) {
      setError("Impossible de charger le paiement");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async ({ montant, modePaiement, remarque }) => {
    if (!paiement) return;
    setIsSaving(true);
    try {
      const response = await effectuerPaiement(paiement._id, { montant, modePaiement, remarque });
      setPaiement(response.data);
      setSuccessMessage(`Paiement de ${formatCurrency(montant)} enregistré`);
      setPaymentModalOpen(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors du paiement");
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const openPdfModal = (recuUrl) => {
    if (!recuUrl) {
      alert("Aucun reçu disponible pour ce versement.");
      return;
    }
    const fullUrl = recuUrl.startsWith('http') ? recuUrl : `${API_BASE}${recuUrl}`;
    setPdfUrl(fullUrl);
    setPdfModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#e2f0d6] border-t-[#8bb56a]" />
      </div>
    );
  }

  if (error || !paiement) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error || "Paiement introuvable"}</div>
      </div>
    );
  }

  const totalPaye = paiement.montantPaye || 0;
  const reste = paiement.resteAPayer || 0;
  const progress = paiement.montantAPayer ? (totalPaye / paiement.montantAPayer) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 lg:p-6">
      {successMessage && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 rounded-lg bg-green-500 text-white px-4 py-2 shadow-lg">
          <CheckCircle size={18} /> {successMessage}
        </div>
      )}

      <button
        onClick={() => navigate('/paiements')}
        className="mb-4 flex items-center gap-2 text-slate-600 hover:text-slate-900 transition"
      >
        <ArrowLeft size={20} /> Retour à la liste
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">
            Paiement {paiement.reference}
          </h1>
          <p className="mt-1 text-slate-500">
            {paiement.statut === 'paye' ? 'Intégralement réglé' : 'Suivi du règlement'}
          </p>
        </div>
        <div className="flex gap-3">
          {paiement.statut !== 'paye' && (
            <button
              onClick={() => setPaymentModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              <CreditCard size={18} /> Effectuer un paiement
            </button>
          )}
        </div>
      </div>

      {/* Grille des cartes (identique à avant) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl ring-1 ring-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Receipt size={20} /> Informations générales</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><p className="text-sm text-slate-500">Référence</p><p className="font-medium">{paiement.reference}</p></div>
            <div><p className="text-sm text-slate-500">Client</p><p className="font-medium">{paiement.client?.nom || paiement.client?.raisonSociale || '—'}</p></div>
            <div>
              <p className="text-sm text-slate-500">Facture associée</p>
              {paiement.facture ? (
                <Link to={`/factures/${paiement.facture._id}`} className="text-blue-600 hover:underline flex items-center gap-1">
                  <FileText size={14} /> {paiement.facture.reference}
                </Link>
              ) : <span className="text-slate-500">—</span>}
            </div>
            <div>
              <p className="text-sm text-slate-500">Commande associée</p>
              {paiement.commande ? (
                <Link to={`/commandes/${paiement.commande._id}`} className="text-blue-600 hover:underline flex items-center gap-1">
                  <Package size={14} /> {paiement.commande.reference}
                </Link>
              ) : <span className="text-slate-500">—</span>}
            </div>
            <div>
              <p className="text-sm text-slate-500">Date prévue</p>
              <div className="flex items-center gap-2"><Calendar size={14} className="text-slate-400" /><span>{formatDate(paiement.datePaiementPrevue)}</span></div>
            </div>
            <div><p className="text-sm text-slate-500">Statut</p><StatutBadge statut={paiement.statut} /></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl ring-1 ring-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold flex items-center gap-2"><DollarSign size={20} /> Montants</h2>
          </div>
          <div className="p-6 space-y-4">
            <div><p className="text-sm text-slate-500">Montant total à payer</p><p className="text-2xl font-bold text-gray-900">{formatCurrency(paiement.montantAPayer)}</p></div>
            <div><p className="text-sm text-slate-500">Déjà payé</p><p className="text-xl font-semibold text-green-600">{formatCurrency(totalPaye)}</p></div>
            <div><p className="text-sm text-slate-500">Reste à payer</p><p className="text-xl font-semibold text-amber-600">{formatCurrency(reste)}</p></div>
            <div className="pt-2">
              <div className="flex justify-between text-sm text-slate-600 mb-1"><span>Progression</span><span>{Math.round(progress)}%</span></div>
              <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} /></div>
            </div>
          </div>
        </div>
      </div>

      {/* Conditions de paiement (inchangé) */}
      {paiement.conditionPaiement && (
        <div className="bg-white rounded-2xl shadow-xl ring-1 ring-gray-100 overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Banknote size={20} /> Conditions de paiement</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div><p className="text-sm text-slate-500">Mode de paiement</p><p className="font-medium capitalize">{paiement.conditionPaiement.modePaiement || '—'}</p></div>
            <div><p className="text-sm text-slate-500">Délai (jours)</p><p className="font-medium">{paiement.conditionPaiement.duree || 0} jour(s)</p></div>
            {paiement.conditionPaiement.banque && Object.values(paiement.conditionPaiement.banque).some(v => v) && (
              <div className="md:col-span-2 lg:col-span-1">
                <p className="text-sm text-slate-500">Coordonnées bancaires</p>
                <div className="text-sm space-y-0.5">
                  {paiement.conditionPaiement.banque.nomBanque && <p>Banque : {paiement.conditionPaiement.banque.nomBanque}</p>}
                  {paiement.conditionPaiement.banque.rib && <p>RIB : {paiement.conditionPaiement.banque.rib}</p>}
                  {paiement.conditionPaiement.banque.iban && <p>IBAN : {paiement.conditionPaiement.banque.iban}</p>}
                  {paiement.conditionPaiement.banque.swift && <p>SWIFT : {paiement.conditionPaiement.banque.swift}</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Historique des paiements – avec bouton "Voir PDF" */}
      {paiement.historiquePaiements && paiement.historiquePaiements.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl ring-1 ring-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold flex items-center gap-2"><History size={20} /> Historique des versements</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Montant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Mode</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Remarque</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Reçu PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paiement.historiquePaiements.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3 whitespace-nowrap text-sm">{formatDate(item.datePaiement)}</td>
                    <td className="px-6 py-3 whitespace-nowrap text-right font-semibold text-green-600">{formatCurrency(item.montant)}</td>
                    <td className="px-6 py-3 capitalize text-sm">{item.modePaiement || '—'}</td>
                    <td className="px-6 py-3 text-sm text-slate-600">{item.remarque || '—'}</td>
                    <td className="px-6 py-3 text-center">
                      {item.recuUrl ? (
                        <button
                          onClick={() => openPdfModal(item.recuUrl)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition text-sm font-medium"
                          title="Voir le reçu PDF"
                        >
                          <FileDown size={16} /> Voir PDF
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">Non disponible</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan="5" className="px-6 py-3 text-right font-semibold">
                    Total versé : {formatCurrency(totalPaye)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Modal PDF */}
      {pdfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[85vh] shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Receipt size={20} /> Reçu de paiement
              </h3>
              <button onClick={() => setPdfModalOpen(false)} className="p-1 rounded-full hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 p-1">
              <iframe
                src={`${pdfUrl}#toolbar=0`}
                className="w-full h-full rounded-xl"
                title="Reçu PDF"
              />
            </div>
            <div className="flex justify-end p-4 border-t gap-3">
              <a
                href={pdfUrl}
                download
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2"
              >
                <Download size={16} /> Télécharger
              </a>
              <button
                onClick={() => setPdfModalOpen(false)}
                className="px-4 py-2 border rounded-xl hover:bg-gray-100"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      <PaiementPaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSubmit={handlePayment}
        paiement={paiement}
        isSaving={isSaving}
      />
    </div>
  );
};

export default PaiementDetail;