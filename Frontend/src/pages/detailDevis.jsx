// pages/detailDevis.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Printer, Download, FileText, User, Calendar, Euro, Package, 
  CheckCircle, XCircle, RefreshCw, Edit, Trash2, Loader2, AlertCircle, Clock
} from 'lucide-react';
import { getDevisById, acceptDevis, refuseDevis, negocierDevis, deleteDevis } from '../services/devis.service';
import entrepriseService from '../services/entreprise.service';
import { generateDevisBlob } from '../utils/pdfGenerator';

const DetailDevis = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [devis, setDevis] = useState(null);
  const [entreprise, setEntreprise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    fetchEntreprise();
    fetchDevis();
  }, [id]);

  const fetchEntreprise = async () => {
    try {
      const data = await entrepriseService.getAll();
      setEntreprise(Array.isArray(data) && data.length > 0 ? data[0] : null);
    } catch (err) {
      console.error("Erreur chargement entreprise", err);
    }
  };

  const fetchDevis = async () => {
    try {
      setLoading(true);
      const data = await getDevisById(id);
      setDevis(data);
    } catch (err) {
      console.error(err);
      setError("Impossible de charger le devis");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    try {
      await acceptDevis(id);
      setSuccessMessage("Devis accepté avec succès");
      fetchDevis();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError("Erreur lors de l'acceptation");
    }
  };

  const handleRefuse = async () => {
    try {
      await refuseDevis(id);
      setSuccessMessage("Devis refusé");
      fetchDevis();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError("Erreur lors du refus");
    }
  };

  const handleNegociate = async () => {
    try {
      await negocierDevis(id);
      setSuccessMessage("Devis marqué comme à négocier");
      fetchDevis();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError("Erreur lors de la mise à jour");
    }
  };

  // ✏️ MODIFIER
  const handleEdit = () => {
    navigate(`/devis/edit/${id}`);
  };

  // 🗑️ SUPPRIMER
  const handleDelete = async () => {
    try {
      await deleteDevis(id);
      setSuccessMessage("Devis supprimé avec succès");
      setTimeout(() => {
        navigate("/devis");
      }, 1500);
    } catch (err) {
      setError("Erreur lors de la suppression");
      setShowDeleteConfirm(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!entreprise || !devis) {
      alert("Informations entreprise ou devis manquantes");
      return;
    }
    try {
      setGeneratingPdf(true);
      const blob = await generateDevisBlob({ entreprise, devis });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setPdfModalOpen(true);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la génération du PDF");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const closePdfModal = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
    setPdfModalOpen(false);
  };

  const handleDownloadPdf = () => {
    if (pdfUrl) {
      const a = document.createElement("a");
      a.href = pdfUrl;
      a.download = `Devis_${devis.reference}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handlePrintPdf = () => {
    if (pdfUrl) {
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = pdfUrl;
      document.body.appendChild(iframe);
      iframe.contentWindow.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }
  };

  const getStatusColor = (statut) => {
    const colors = {
      en_attente: 'bg-yellow-100 text-yellow-800',
      envoye: 'bg-blue-100 text-blue-800',
      accepte: 'bg-green-100 text-green-800',
      refuse: 'bg-red-100 text-red-800',
      a_negocier: 'bg-orange-100 text-orange-800',
    };
    return colors[statut] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (statut) => {
    const labels = {
      en_attente: 'En attente',
      envoye: 'Envoyé',
      accepte: 'Accepté',
      refuse: 'Refusé',
      a_negocier: 'À négocier',
    };
    return labels[statut] || statut;
  };

  const formatDate = (date) => date ? new Date(date).toLocaleDateString('fr-FR') : 'N/A';

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-4 border-[#e2f0d6] border-t-[#8bb56a]" /></div>;
  }

  if (error || !devis) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">{error || "Devis non trouvé"}</p>
          <button onClick={() => navigate("/devis")} className="mt-4 rounded-lg bg-[#e2f0d6] px-4 py-2 text-[#5a7c3c]">Retour</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 lg:p-6">
      {successMessage && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 rounded-lg bg-green-500 text-white px-4 py-2 shadow-lg">
          <CheckCircle size={18} /> {successMessage}
        </div>
      )}

      {/* Header avec boutons Modifier / Supprimer */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/devis")} className="rounded-full p-2 text-slate-400 hover:bg-gray-100">
            <ArrowLeft size={20} />
          </button>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{devis.reference || `Devis ${id.slice(-6)}`}</h1>
            <p className="text-sm text-slate-500">Créé le {formatDate(devis.createdAt)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleEdit}
            className="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-100"
          >
            <Edit size={16} /> Modifier
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
          >
            <Trash2 size={16} /> Supprimer
          </button>
        </div>
      </div>

      {/* Cartes statuts */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* ... (inchangé) ... */}
        <div className={`rounded-2xl p-4 shadow-sm ring-1 ring-gray-100 ${devis.statut === 'en_attente' ? 'bg-yellow-50 border-l-4 border-yellow-500' : 'bg-white'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">État actuel</p>
              <p className="text-xl font-bold text-yellow-700">En attente</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <Clock size={20} className="text-yellow-600" />
            </div>
          </div>
          {devis.statut === 'en_attente' && <p className="text-xs text-yellow-600 mt-2">En cours de validation</p>}
        </div>
        <div className={`rounded-2xl p-4 shadow-sm ring-1 ring-gray-100 ${devis.statut === 'accepte' ? 'bg-green-50 border-l-4 border-green-500' : 'bg-white'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Accepté</p>
              <p className="text-xl font-bold text-green-700">{devis.statut === 'accepte' ? '✓' : '0'}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle size={20} className="text-green-600" />
            </div>
          </div>
        </div>
        <div className={`rounded-2xl p-4 shadow-sm ring-1 ring-gray-100 ${devis.statut === 'refuse' ? 'bg-red-50 border-l-4 border-red-500' : 'bg-white'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Refusé</p>
              <p className="text-xl font-bold text-red-700">{devis.statut === 'refuse' ? '✗' : '0'}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle size={20} className="text-red-600" />
            </div>
          </div>
        </div>
        <div className={`rounded-2xl p-4 shadow-sm ring-1 ring-gray-100 ${devis.statut === 'a_negocier' ? 'bg-orange-50 border-l-4 border-orange-500' : 'bg-white'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">À négocier</p>
              <p className="text-xl font-bold text-orange-700">{devis.statut === 'a_negocier' ? '↻' : '0'}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
              <RefreshCw size={20} className="text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Le reste de la page (corps, modal PDF) est strictement identique */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Client */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2"><User size={18} /> Informations client</h2>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex"><span className="w-32 font-medium">Nom :</span><span>{devis.client?.nom || devis.client?.raisonSociale || 'N/A'}</span></div>
              <div className="flex"><span className="w-32 font-medium">Email :</span><span>{devis.client?.email || 'N/A'}</span></div>
              <div className="flex"><span className="w-32 font-medium">Téléphone :</span><span>{devis.client?.telephone || 'N/A'}</span></div>
            </div>
          </div>

          {/* Produits */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="text-lg font-semibold flex items-center gap-2 border-b pb-3 mb-4"><Package size={18} /> Produits</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left rounded-l-lg">Produit</th>
                    <th className="px-4 py-3 text-center">Qté</th>
                    <th className="px-4 py-3 text-right">Prix unitaire HT</th>
                    <th className="px-4 py-3 text-right">TVA</th>
                    <th className="px-4 py-3 text-right rounded-r-lg">Total TTC</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {devis.produits?.map((p, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-medium">
                        {p.designation || p.produit?.designation || p.produit?.nom || 'Produit'}
                      </td>
                      <td className="px-4 py-3 text-center">{p.quantite}</td>
                      <td className="px-4 py-3 text-right">{p.prixHT?.toLocaleString()} DH</td>
                      <td className="px-4 py-3 text-right">{p.tauxTVA || 0}%</td>
                      <td className="px-4 py-3 text-right font-semibold">{p.total?.toLocaleString()} DH</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="4" className="px-4 py-3 text-right font-bold">Total TTC</td>
                    <td className="px-4 py-3 text-right font-bold text-[#8bb56a] text-lg">{(devis.montantTotal || 0).toLocaleString()} DH</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Détails */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="text-lg font-semibold border-b pb-3 mb-4">Détails</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Date expiration :</span><span className="font-medium">{formatDate(devis.dateExpiration)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Statut :</span><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(devis.statut)}`}>{getStatusLabel(devis.statut)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Créé le :</span><span>{formatDate(devis.createdAt)}</span></div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="text-lg font-semibold border-b pb-3 mb-4">Actions rapides</h2>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleGeneratePDF} disabled={generatingPdf} className="flex items-center gap-2 rounded-lg bg-[#e2f0d6] px-3 py-2 text-sm text-[#5a7c3c] hover:bg-[#d4e6b0]">
                {generatingPdf ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />} {generatingPdf ? "Génération..." : "Générer PDF"}
              </button>
              {devis.statut === 'en_attente' && (
                <>
                  <button onClick={handleAccept} className="flex items-center gap-2 rounded-lg bg-green-100 text-green-700 px-3 py-2 text-sm hover:bg-green-200"><CheckCircle size={16} /> Accepter</button>
                  <button onClick={handleRefuse} className="flex items-center gap-2 rounded-lg bg-red-100 text-red-700 px-3 py-2 text-sm hover:bg-red-200"><XCircle size={16} /> Refuser</button>
                  <button onClick={handleNegociate} className="flex items-center gap-2 rounded-lg bg-orange-100 text-orange-700 px-3 py-2 text-sm hover:bg-orange-200"><RefreshCw size={16} /> Négocier</button>
                </>
              )}
            </div>
          </div>

          {/* Document PDF */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="text-lg font-semibold border-b pb-3 mb-4">Document</h2>
            <button onClick={handleGeneratePDF} className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#8bb56a] bg-[#e2f0d6]/20 p-4 hover:bg-[#e2f0d6]/40 transition">
              <FileText size={24} className="text-[#8bb56a]" />
              <span className="text-sm font-semibold text-slate-700">Générer / voir le devis PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal PDF (inchangée) */}
      {pdfModalOpen && pdfUrl && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative h-[90vh] w-full max-w-4xl rounded-2xl bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b p-4">
              <h3 className="text-lg font-semibold">Aperçu du devis</h3>
              <div className="flex gap-2">
                <button onClick={handlePrintPdf} className="rounded-lg p-2 text-slate-500 hover:bg-gray-100" title="Imprimer">
                  <Printer size={20} />
                </button>
                <button onClick={handleDownloadPdf} className="rounded-lg p-2 text-slate-500 hover:bg-gray-100" title="Télécharger">
                  <Download size={20} />
                </button>
                <button onClick={closePdfModal} className="rounded-lg p-2 text-slate-500 hover:bg-gray-100">
                  <XCircle size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-2">
              <iframe src={pdfUrl} title="Aperçu du devis" className="h-full w-full" style={{ border: "none" }} />
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle size={28} />
              <h3 className="text-xl font-semibold">Confirmer la suppression</h3>
            </div>
            <p className="mt-4 text-slate-600">
              Êtes-vous sûr de vouloir supprimer le devis <strong>{devis.reference}</strong> ? Cette action est irréversible.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-gray-100"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailDevis;