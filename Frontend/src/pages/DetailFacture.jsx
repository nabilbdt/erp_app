// src/pages/DetailFacture.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit, Trash2, FileText, Send, Download,
  AlertCircle, CheckCircle, X, Loader2, Eye, Calendar,
  User, Mail, Phone, DollarSign, CreditCard, Building2,
  FileCheck, Package, Truck, Printer
} from 'lucide-react';
import {
  getAllFactures,
  getFactureById,
  updateFacture,
  deleteFacture,
  envoyerFactureEmail,
  telechargerPDFFacture,
} from "../services/facture.service";
import { getCommandeById } from '../services/commande.service';
import { getLivraisonById } from '../services/livraison.service';
import entrepriseService from '../services/entreprise.service';

const StatusBadge = ({ status }) => {
  const config = {
    brouillon: 'bg-slate-100 text-slate-700',
    envoyee: 'bg-blue-100 text-blue-800',
    annulee: 'bg-rose-100 text-rose-800'
  };
  const labels = { brouillon: 'Brouillon', envoyee: 'Envoyée', annulee: 'Annulée' };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${config[status] || 'bg-gray-100'}`}>
      {labels[status] || status}
    </span>
  );
};

const PaiementBadge = ({ statut }) => {
  const config = {
    non_paye: 'bg-rose-100 text-rose-800',
    partiel: 'bg-amber-100 text-amber-800',
    paye: 'bg-emerald-100 text-emerald-800'
  };
  const labels = { non_paye: 'Non payée', partiel: 'Partiellement payée', paye: 'Payée' };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${config[statut] || 'bg-gray-100'}`}>
      {labels[statut] || statut}
    </span>
  );
};

const InfoRow = ({ label, value, icon: Icon }) => (
  <div className="flex items-center justify-between border-b border-gray-100 py-2 text-sm">
    <div className="flex items-center gap-2 text-slate-500">
      {Icon && <Icon size={14} />}
      <span>{label}</span>
    </div>
    <span className="font-medium text-slate-800">{value || '—'}</span>
  </div>
);

const DetailFacture = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [facture, setFacture] = useState(null);
  const [commande, setCommande] = useState(null);
  const [livraison, setLivraison] = useState(null);
  const [entreprise, setEntreprise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    fetchFacture();
    fetchEntreprise();
  }, [id]);

  const fetchEntreprise = async () => {
    try {
      const data = await entrepriseService.getEntreprise();
      setEntreprise(data);
    } catch (err) {
      console.error("Erreur chargement entreprise", err);
    }
  };

  const fetchFacture = async () => {
    try {
      setLoading(true);
      const data = await getFactureById(id);
      setFacture(data);
      setEditData({
        statut: data.statut,
        statutPaiement: data.statutPaiement,
        dateEcheance: data.dateEcheance ? data.dateEcheance.split('T')[0] : '',
        note: data.note || '',
      });
      if (data.commande) {
        const cmd = await getCommandeById(data.commande);
        setCommande(cmd);
      }
      if (data.livraison) {
        const liv = await getLivraisonById(data.livraison);
        setLivraison(liv);
      }
    } catch (err) {
      console.error(err);
      setError("Impossible de charger la facture");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const payload = {
        statut: editData.statut,
        statutPaiement: editData.statutPaiement,
        dateEcheance: editData.dateEcheance || null,
        note: editData.note,
      };
      await updateFacture(id, payload);
      setSuccessMessage('Facture mise à jour');
      setEditMode(false);
      fetchFacture();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Erreur lors de la modification');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteFacture(id);
      setSuccessMessage('Facture supprimée');
      setTimeout(() => navigate('/factures'), 1500);
    } catch (err) {
      setError('Erreur suppression');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleSendEmail = async () => {
    setSendingEmail(true);
    try {
      await envoyerFactureEmail(id);
      setSuccessMessage('Email envoyé avec succès');
      fetchFacture();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError("Erreur lors de l'envoi de l'email");
      setTimeout(() => setError(null), 3000);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleViewPDF = async () => {
    setGeneratingPDF(true);
    try {
      const blob = await telechargerPDFFacture(id);
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setPdfModalOpen(true);
    } catch (err) {
      setError("Erreur lors de la génération du PDF");
      setTimeout(() => setError(null), 3000);
    } finally {
      setGeneratingPDF(false);
    }
  };

  const downloadPDF = () => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `facture_${facture?.reference || id}.pdf`;
    a.click();
  };

  const closePdfModal = () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
    setPdfModalOpen(false);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!facture) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <p className="text-gray-600">Facture introuvable</p>
        <button onClick={() => navigate('/factures')} className="mt-4 text-blue-600 hover:underline">
          Retour à la liste
        </button>
      </div>
    );
  }

  const devise = entreprise?.settings?.devise || 'MAD';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 lg:p-6">
      {/* Notifications */}
      {successMessage && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 rounded-lg bg-green-500 text-white px-4 py-2 shadow-lg">
          <CheckCircle size={18} /> {successMessage}
        </div>
      )}
      {error && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 rounded-lg bg-red-500 text-white px-4 py-2 shadow-lg">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/factures')} className="rounded-full p-2 text-slate-400 hover:bg-gray-100">
            <ArrowLeft size={20} />
          </button>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{facture.reference}</h1>
            <p className="text-sm text-slate-500">Créée le {new Date(facture.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!editMode ? (
            <>
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {sendingEmail ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Envoyer email
              </button>
              <button
                onClick={handleViewPDF}
                disabled={generatingPDF}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {generatingPDF ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
                Voir PDF
              </button>
              <button onClick={() => setEditMode(true)} className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-gray-50">
                <Edit size={16} /> Modifier
              </button>
              <button onClick={() => setDeleteConfirm(true)} className="flex items-center gap-2 rounded-xl border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600">
                <Trash2 size={16} /> Supprimer
              </button>
            </>
          ) : (
            <>
              <button onClick={handleSave} className="flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600">
                <CheckCircle size={16} /> Enregistrer
              </button>
              <button onClick={() => setEditMode(false)} className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-gray-50">
                <X size={16} /> Annuler
              </button>
            </>
          )}
        </div>
      </div>

      {/* Grille principale (inchangée) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Colonne de gauche - Produits et documents liés */}
        <div className="lg:col-span-2 space-y-6">
          {/* Produits facturés */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="text-lg font-semibold border-b pb-2 mb-4 flex items-center gap-2">
              <Package size={18} /> Produits facturés
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 text-left">Produit</th>
                    <th className="p-2 text-center">Qté</th>
                    <th className="p-2 text-right">PU (HT)</th>
                    <th className="p-2 text-right">TVA</th>
                    <th className="p-2 text-right">Total TTC</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {facture.produits?.map((prod, idx) => (
                    <tr key={idx}>
                      <td className="p-2">{prod.nom || "Produit"}</td>
                      <td className="p-2 text-center">{prod.quantite}</td>
                      <td className="p-2 text-right">{prod.prixUnitaire?.toFixed(2)}</td>
                      <td className="p-2 text-right">{(prod.tauxTVA || 0)}%</td>
                      <td className="p-2 text-right font-semibold">{prod.totalLigne?.toFixed(2)} {devise}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr><td colSpan="4" className="p-2 text-right font-semibold">Sous-total HT :</td><td className="p-2 text-right">{facture.sousTotal?.toFixed(2)} {devise}</td></tr>
                  <tr><td colSpan="4" className="p-2 text-right font-semibold">TVA :</td><td className="p-2 text-right">{facture.taxe?.toFixed(2)} {devise}</td></tr>
                  <tr className="border-t"><td colSpan="4" className="p-2 text-right font-bold">Total TTC :</td><td className="p-2 text-right font-bold text-lg">{facture.totalTTC?.toFixed(2)} {devise}</td></tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Documents associés (commande, livraison) - inchangés */}
          {commande && (
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h2 className="text-lg font-semibold border-b pb-2 mb-4 flex items-center gap-2"><FileCheck size={18} /> Commande associée</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow label="Référence" value={commande.reference} icon={FileText} />
                <InfoRow label="Montant total" value={`${commande.montantTotal?.toLocaleString()} ${devise}`} icon={DollarSign} />
                <InfoRow label="Date commande" value={new Date(commande.createdAt).toLocaleDateString()} icon={Calendar} />
                <InfoRow label="Statut" value={commande.statut} icon={AlertCircle} />
              </div>
              <button onClick={() => navigate(`/commandes/${commande._id}`)} className="mt-4 text-sm text-blue-600 hover:underline flex items-center gap-1">
                Voir la commande <ArrowLeft size={14} className="rotate-180" />
              </button>
            </div>
          )}

          {livraison && (
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h2 className="text-lg font-semibold border-b pb-2 mb-4 flex items-center gap-2"><Truck size={18} /> Livraison associée</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow label="Référence livraison" value={livraison.reference} icon={Package} />
                <InfoRow label="Date livraison" value={livraison.dateLivraison ? new Date(livraison.dateLivraison).toLocaleDateString() : '-'} icon={Calendar} />
                <InfoRow label="Statut livraison" value={livraison.statut} icon={Truck} />
              </div>
              <button onClick={() => navigate(`/livraisons/${livraison._id}`)} className="mt-4 text-sm text-blue-600 hover:underline flex items-center gap-1">
                Voir la livraison <ArrowLeft size={14} className="rotate-180" />
              </button>
            </div>
          )}
        </div>

        {/* Colonne de droite - Infos générales, état, client, paiement (inchangée) */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="text-lg font-semibold border-b pb-2 mb-4">État</h2>
            {!editMode ? (
              <>
                <InfoRow label="Statut facture" value={<StatusBadge status={facture.statut} />} icon={FileText} />
                <InfoRow label="Paiement" value={<PaiementBadge statut={facture.statutPaiement} />} icon={CreditCard} />
                <InfoRow label="Date d'échéance" value={facture.dateEcheance ? new Date(facture.dateEcheance).toLocaleDateString() : 'Non définie'} icon={Calendar} />
                <InfoRow label="Reste à payer" value={`${facture.resteAPayer?.toFixed(2)} ${devise}`} icon={DollarSign} />
                <InfoRow label="Montant payé" value={`${facture.montantPaye?.toFixed(2)} ${devise}`} icon={CheckCircle} />
              </>
            ) : (
              <div className="space-y-4">
                <div><label className="text-sm text-slate-500">Statut facture</label><select value={editData.statut} onChange={e => setEditData({ ...editData, statut: e.target.value })} className="mt-1 w-full border rounded-lg p-2"><option value="brouillon">Brouillon</option><option value="envoyee">Envoyée</option><option value="annulee">Annulée</option></select></div>
                <div><label className="text-sm text-slate-500">Statut paiement</label><select value={editData.statutPaiement} onChange={e => setEditData({ ...editData, statutPaiement: e.target.value })} className="mt-1 w-full border rounded-lg p-2"><option value="non_paye">Non payée</option><option value="partiel">Partiel</option><option value="paye">Payée</option></select></div>
                <div><label className="text-sm text-slate-500">Date d'échéance</label><input type="date" value={editData.dateEcheance} onChange={e => setEditData({ ...editData, dateEcheance: e.target.value })} className="mt-1 w-full border rounded-lg p-2" /></div>
                <div><label className="text-sm text-slate-500">Note</label><textarea rows="2" value={editData.note} onChange={e => setEditData({ ...editData, note: e.target.value })} className="mt-1 w-full border rounded-lg p-2" /></div>
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="text-lg font-semibold border-b pb-2 mb-4 flex items-center gap-2"><User size={18} /> Client</h2>
            <InfoRow label="Nom" value={facture.client?.nom || facture.client?.raisonSociale} icon={Building2} />
            <InfoRow label="Email" value={facture.client?.email} icon={Mail} />
            <InfoRow label="Téléphone" value={facture.client?.telephone} icon={Phone} />
            <InfoRow label="Adresse" value={facture.client?.adresse || '—'} icon={Building2} />
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="text-lg font-semibold border-b pb-2 mb-4">Détails</h2>
            <InfoRow label="Référence document" value={facture.reference} icon={FileText} />
            <InfoRow label="Date de création" value={new Date(facture.createdAt).toLocaleDateString()} icon={Calendar} />
            <InfoRow label="Note" value={facture.note || '—'} icon={FileText} />
          </div>
        </div>
      </div>

      {/* Modal PDF de la facture */}
      {pdfModalOpen && pdfUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[85vh] shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText size={20} /> Facture {facture.reference}
              </h3>
              <div className="flex gap-2">
                <button onClick={() => window.open(pdfUrl)} className="p-2 rounded hover:bg-gray-100" title="Imprimer">
                  <Printer size={20} />
                </button>
                <button onClick={downloadPDF} className="p-2 rounded hover:bg-gray-100" title="Télécharger">
                  <Download size={20} />
                </button>
                <button onClick={closePdfModal} className="p-2 rounded hover:bg-gray-100">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-2">
              <iframe src={pdfUrl} className="w-full h-full rounded-xl" title="Facture PDF" />
            </div>
          </div>
        </div>
      )}

      {/* Modal suppression (inchangé) */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600"><Trash2 size={24} /></div>
              <h3 className="text-lg font-semibold">Confirmer la suppression</h3>
            </div>
            <p className="text-slate-600 mb-6">Cette action est irréversible.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(false)} className="rounded-lg px-4 py-2 text-sm hover:bg-gray-100">Annuler</button>
              <button onClick={handleDelete} className="rounded-lg bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailFacture;