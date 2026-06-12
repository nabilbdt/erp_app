// pages/DetailCommande.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Edit, Trash2, User, Building, Mail, Phone, MapPin,
  CreditCard, Calendar, Loader2, AlertCircle, CheckCircle, X,
  Package, FileText, Receipt, DollarSign, Clock, Activity,
  Truck, FileCheck, Eye, Printer, Download
} from "lucide-react";
import {
  getCommandeById,
  updateCommande,
  deleteCommande,
  updateStatutCommande
} from "../services/commande.service";
import { getDevisById } from "../services/devis.service";
import { getBonCommandeById } from "../services/bonCommande.service";
import entrepriseService from "../services/entreprise.service";
import { generateDevisBlob, generateBonCommandeBlob } from "../utils/pdfGenerator";

// Composants internes (inchangés)
const StatCard = ({ title, value, icon: Icon, color, subValue }) => (
  <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
        {subValue && <p className="text-xs text-slate-400 mt-1">{subValue}</p>}
      </div>
      <div className={`rounded-xl ${color} p-3`}>
        <Icon size={22} className="text-white" />
      </div>
    </div>
  </div>
);

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between border-b border-gray-100 py-2 text-sm">
    <span className="text-slate-500">{label}</span>
    <span className="font-medium text-slate-800">{value || "—"}</span>
  </div>
);

const DocumentCard = ({ title, icon: Icon, color, items, renderItem, onGenerate, generating, noItemsMessage }) => (
  <div className="bg-gray-50 rounded-lg p-3">
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-3">
        <Icon size={20} className={color} />
        <p className="font-medium">{title}</p>
      </div>
      {items.length > 0 && <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">{items.length}</span>}
    </div>
    {items.length === 0 ? (
      <p className="text-xs text-gray-400 mt-2">{noItemsMessage || "Aucun élément"}</p>
    ) : (
      <div className="mt-2 space-y-2">
        {items.map((item, idx) => renderItem(item, idx))}
      </div>
    )}
    {onGenerate && (
      <button
        onClick={onGenerate}
        disabled={generating}
        className="mt-3 w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-white py-2 text-xs hover:bg-gray-50"
      >
        {generating ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
        {generating ? "Génération..." : `Générer ${title}`}
      </button>
    )}
  </div>
);

const StatusBadge = ({ status }) => {
  const config = {
    en_cours: "bg-amber-100 text-amber-800",
    accepte: "bg-green-100 text-green-800",
    confirme: "bg-blue-100 text-blue-800",
    livree_partiellement: "bg-purple-100 text-purple-800",
    livree: "bg-emerald-100 text-emerald-800",
    annulee: "bg-rose-100 text-rose-800"
  };
  const labels = {
    en_cours: "En cours",
    accepte: "Acceptée",
    confirme: "Confirmée",
    livree_partiellement: "Partielle",
    livree: "Livrée",
    annulee: "Annulée"
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${config[status] || "bg-gray-100"}`}>
      {labels[status] || status}
    </span>
  );
};

const DetailCommande = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [commande, setCommande] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [entreprise, setEntreprise] = useState(null);

  // Documents associés
  const [devis, setDevis] = useState(null);
  const [bonCommande, setBonCommande] = useState(null);
  // Pour ouvrir le PDF dans une modale
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfType, setPdfType] = useState(''); // 'devis' ou 'bonCommande'

  useEffect(() => {
    fetchCommande();
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

  const fetchCommande = async () => {
    try {
      setLoading(true);
      const data = await getCommandeById(id);
      setCommande(data);
      setEditData(data);
      if (data.devis) fetchDevis(data.devis);
      if (data.bonCommande) fetchBonCommande(data.bonCommande);
    } catch (err) {
      console.error(err);
      setError("Impossible de charger la commande");
    } finally {
      setLoading(false);
    }
  };

  const fetchDevis = async (devisId) => {
    try {
      const d = await getDevisById(devisId);
      setDevis(d);
    } catch (err) { console.error("Erreur chargement devis", err); }
  };
  const fetchBonCommande = async (bcId) => {
    try {
      const bc = await getBonCommandeById(bcId);
      setBonCommande(bc);
    } catch (err) { console.error("Erreur chargement bon commande", err); }
  };

  const handleEditField = (field, value) => setEditData(prev => ({ ...prev, [field]: value }));
  const handleSaveChanges = async () => {
    try {
      await updateCommande(id, editData);
      setSuccessMessage("Commande modifiée avec succès");
      setEditMode(false);
      fetchCommande();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError("Erreur lors de la modification");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCommande(id);
      setSuccessMessage("Commande supprimée");
      setTimeout(() => navigate("/commandes"), 1500);
    } catch (err) {
      setError("Erreur lors de la suppression");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleConfirm = async () => {
    try {
      await updateStatutCommande(id, 'confirme');
      setSuccessMessage("Commande confirmée");
      fetchCommande();
    } catch (err) { setError("Erreur confirmation"); }
  };
  const handleAnnuler = async () => {
    try {
      await updateStatutCommande(id, 'annulee');
      setSuccessMessage("Commande annulée");
      fetchCommande();
    } catch (err) { setError("Erreur annulation"); }
  };
  const handleLivrer = async () => {
    try {
      await updateStatutCommande(id, 'livree');
      setSuccessMessage("Commande livrée");
      fetchCommande();
    } catch (err) { setError("Erreur livraison"); }
  };

  // Génération du PDF et ouverture dans la modale
  const viewPDF = async (type, document) => {
    if (!document) {
      setError(`Aucun ${type} trouvé`);
      return;
    }
    setGeneratingPdf(true);
    try {
      let blob;
      if (type === 'devis') {
        blob = await generateDevisBlob({ devis: document, entreprise: entreprise || {} });
      } else if (type === 'bonCommande') {
        blob = await generateBonCommandeBlob({ bonCommande: document, entreprise: entreprise || {} });
      } else {
        throw new Error("Type de document non supporté");
      }
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setPdfType(type);
      setPdfModalOpen(true);
    } catch (err) {
      console.error(err);
      setError(`Erreur lors de la génération du ${type === 'devis' ? 'devis' : 'bon de commande'}`);
      setTimeout(() => setError(null), 3000);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const closePdfModal = () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
    setPdfModalOpen(false);
  };

  const downloadPDF = () => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `${pdfType === 'devis' ? 'devis' : 'bon_commande'}_${new Date().getTime()}.pdf`;
    a.click();
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-4 border-[#e2f0d6] border-t-[#8bb56a]" /></div>;
  if (error || !commande) return <div className="text-center p-8">Erreur : {error}</div>;

  const totalProduits = commande.produits?.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 lg:p-6">
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

      {/* En-tête */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/commandes")} className="rounded-full p-2 text-slate-400 hover:bg-gray-100">
            <ArrowLeft size={20} />
          </button>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <Package size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{commande.reference}</h1>
            <p className="text-sm text-slate-500">Créée le {new Date(commande.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!editMode ? (
            <>
              <button onClick={() => setEditMode(true)} className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-gray-50">
                <Edit size={16} /> Modifier
              </button>
              <button onClick={() => setDeleteConfirm(true)} className="flex items-center gap-2 rounded-xl border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600">
                <Trash2 size={16} /> Supprimer
              </button>
            </>
          ) : (
            <>
              <button onClick={handleSaveChanges} className="flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600">
                <CheckCircle size={16} /> Enregistrer
              </button>
              <button onClick={() => setEditMode(false)} className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-gray-50">
                <X size={16} /> Annuler
              </button>
            </>
          )}
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard title="Montant total" value={`${commande.montantTotal?.toLocaleString()} DH`} icon={DollarSign} color="bg-green-500" />
        <StatCard title="Nombre de produits" value={totalProduits} icon={Package} color="bg-blue-500" />
        <StatCard title="Statut" value={<StatusBadge status={commande.statut} />} icon={Activity} color="bg-purple-500" />
        <StatCard title="Date commande" value={new Date(commande.createdAt).toLocaleDateString()} icon={Calendar} color="bg-orange-500" />
      </div>

      {/* Contenu principal : 2 colonnes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Colonne gauche : infos client et produits */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="text-lg font-semibold border-b pb-2 mb-4 flex items-center gap-2"><User size={18} /> Client</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <div>
                <InfoRow label="Nom" value={commande.client?.nom || commande.client?.raisonSociale} />
                <InfoRow label="Email" value={commande.client?.email} />
                <InfoRow label="Téléphone" value={commande.client?.telephone} />
              </div>
              <div>
                <InfoRow label="ICE" value={commande.client?.ice || "—"} />
                <InfoRow label="RC" value={commande.client?.rc || "—"} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="text-lg font-semibold border-b pb-2 mb-4 flex items-center gap-2"><Package size={18} /> Produits</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 text-left">Produit</th>
                    <th className="p-2 text-center">Qté</th>
                    <th className="p-2 text-right">Prix unitaire HT</th>
                    <th className="p-2 text-right">TVA</th>
                    <th className="p-2 text-right">Total TTC</th>
                  </tr>
                </thead>
                <tbody>
                  {commande.produits?.map((p, idx) => (
                    <tr key={idx}>
                      <td className="p-2">{p.designation || p.produit?.designation || p.produit?.nom || 'Produit'}</td>
                      <td className="p-2 text-center">{p.quantite}</td>
                      <td className="p-2 text-right">{p.prixHT?.toLocaleString()} DH</td>
                      <td className="p-2 text-right">{p.tauxTVA || 0}%</td>
                      <td className="p-2 text-right font-semibold">{p.total?.toLocaleString()} DH</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="4" className="p-2 text-right font-bold">Total TTC</td>
                    <td className="p-2 text-right font-bold text-[#8bb56a]">{(commande.montantTotal || 0).toLocaleString()} DH</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Colonne droite : actions + documents */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="text-lg font-semibold border-b pb-2 mb-4">Actions</h2>
            <div className="flex flex-wrap gap-2">
              {commande.statut === 'en_cours' && (
                <>
                  <button onClick={handleConfirm} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md text-sm">Confirmer</button>
                  <button onClick={handleAnnuler} className="bg-rose-100 text-rose-700 px-3 py-1 rounded-md text-sm">Annuler</button>
                </>
              )}
              {commande.statut === 'confirme' && (
                <button onClick={handleLivrer} className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-md text-sm">Marquer livrée</button>
              )}
            </div>
            <div className="mt-4 pt-2 border-t">
              <InfoRow label="Statut actuel" value={<StatusBadge status={commande.statut} />} />
              <InfoRow label="Date de création" value={new Date(commande.createdAt).toLocaleDateString()} />
              <InfoRow label="Dernière modification" value={new Date(commande.updatedAt).toLocaleDateString()} />
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="text-lg font-semibold border-b pb-2 mb-4 flex items-center gap-2"><FileText size={18} /> Documents</h2>
            <div className="space-y-3">
              {/* Devis */}
              <DocumentCard
                title="Devis"
                icon={FileText}
                color="text-blue-600"
                items={devis ? [devis] : []}
                renderItem={(d) => (
                  <div key={d._id} className="flex justify-between items-center text-sm pl-2 border-l-2 border-blue-200">
                    <span>{d.reference}</span>
                    <button onClick={() => viewPDF('devis', d)} className="text-blue-600">
                      <Eye size={14} />
                    </button>
                  </div>
                )}
                noItemsMessage="Aucun devis associé"
              />

              {/* Bon de commande */}
              <DocumentCard
                title="Bon de commande"
                icon={FileCheck}
                color="text-green-600"
                items={bonCommande ? [bonCommande] : []}
                renderItem={(bc) => (
                  <div key={bc._id} className="flex justify-between items-center text-sm pl-2 border-l-2 border-green-200">
                    <span>{bc.reference}</span>
                    <button onClick={() => viewPDF('bonCommande', bc)} className="text-green-600">
                      <Eye size={14} />
                    </button>
                  </div>
                )}
                noItemsMessage="Aucun bon de commande"
              />

              <DocumentCard
                title="Bons de livraison"
                icon={Truck}
                color="text-purple-600"
                items={[]}
                renderItem={() => null}
                noItemsMessage="À venir"
              />

              <DocumentCard
                title="Factures"
                icon={Receipt}
                color="text-orange-600"
                items={[]}
                renderItem={() => null}
                noItemsMessage="À venir"
              />

              <DocumentCard
                title="Reçus"
                icon={CreditCard}
                color="text-teal-600"
                items={[]}
                renderItem={() => null}
                noItemsMessage="À venir"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modal PDF (réutilisable) */}
      {pdfModalOpen && pdfUrl && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/70 p-4">
          <div className="relative h-[90vh] w-full max-w-4xl rounded-2xl bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b p-4">
              <h3 className="text-lg font-semibold">
                {pdfType === 'devis' ? 'Devis' : 'Bon de commande'}
              </h3>
              <div className="flex gap-2">
                <button onClick={() => window.open(pdfUrl)} className="p-2 rounded hover:bg-gray-100">
                  <Printer size={20} />
                </button>
                <button onClick={downloadPDF} className="p-2 rounded hover:bg-gray-100">
                  <Download size={20} />
                </button>
                <button onClick={closePdfModal} className="p-2 rounded hover:bg-gray-100">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-2">
              <iframe src={pdfUrl} className="h-full w-full" title="Document PDF" />
            </div>
          </div>
        </div>
      )}

      {/* Modal suppression */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[350] flex items-center justify-center bg-black/50 backdrop-blur-sm">
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

export default DetailCommande;