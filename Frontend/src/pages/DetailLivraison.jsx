// src/pages/DetailLivraison.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Edit, Trash2, Truck, Package, User,
  AlertCircle, CheckCircle, X, FileText, FileCheck,
  Printer, Download, History, Users, Truck as TruckIcon, PackageOpen, FileBadge
} from 'lucide-react';
import { getLivraisonById, updateLivraison, deleteLivraison } from '../services/livraison.service';
import { getCommandeById } from '../services/commande.service';
import { getChauffeurById } from '../services/chauffeur.service';
import { getVehiculeById } from '../services/vehicule.service';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const formatDate = (date) => date ? new Date(date).toLocaleDateString('fr-FR') : '—';
const formatDateTime = (date) => date ? new Date(date).toLocaleString('fr-FR') : '—';

const StatusBadge = ({ status }) => {
  const config = {
    planifiee: { label: 'Planifiée', color: 'bg-slate-100 text-slate-700' },
    en_cours: { label: 'En cours', color: 'bg-amber-100 text-amber-800' },
    en_route: { label: 'En route', color: 'bg-blue-100 text-blue-800' },
    livree_partiellement: { label: 'Partielle', color: 'bg-purple-100 text-purple-800' },
    livree: { label: 'Livrée', color: 'bg-emerald-100 text-emerald-800' },
    annulee: { label: 'Annulée', color: 'bg-rose-100 text-rose-800' }
  };
  const { label, color } = config[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${color}`}>{label}</span>;
};

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between border-b border-gray-100 py-2 text-sm">
    <span className="text-slate-500">{label}</span>
    <span className="font-medium text-slate-800">{value || '—'}</span>
  </div>
);

const DetailLivraison = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [livraison, setLivraison] = useState(null);
  const [commande, setCommande] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({ statut: '', dateLivraison: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);

  // États pour stocker les noms des chauffeurs et véhicules de l'historique
  const [chauffeurNames, setChauffeurNames] = useState({});
  const [vehiculeNames, setVehiculeNames] = useState({});

  useEffect(() => {
    fetchAll();
  }, [id]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const data = await getLivraisonById(id);
      setLivraison(data);
      setEditData({
        statut: data.statut,
        dateLivraison: data.dateLivraison ? data.dateLivraison.split('T')[0] : '',
      });
      if (data.commande) {
        const cmd = await getCommandeById(data.commande);
        setCommande(cmd);
      }
    } catch (err) {
      console.error(err);
      setError('Impossible de charger la livraison');
    } finally {
      setLoading(false);
    }
  };

  // Charger les noms des chauffeurs et véhicules de l'historique
  useEffect(() => {
    const loadHistoriqueNames = async () => {
      if (!livraison?.historiqueLivraisons) return;
      const chauffeurMap = { ...chauffeurNames };
      const vehiculeMap = { ...vehiculeNames };
      let changed = false;

      for (const entry of livraison.historiqueLivraisons) {
        if (entry.chauffeur && typeof entry.chauffeur === 'string' && !chauffeurMap[entry.chauffeur]) {
          try {
            const chauffeur = await getChauffeurById(entry.chauffeur);
            chauffeurMap[entry.chauffeur] = `${chauffeur.prenom || ''} ${chauffeur.nom || ''}`.trim() || chauffeur.nom || 'Chauffeur';
            changed = true;
          } catch {
            chauffeurMap[entry.chauffeur] = 'Inconnu';
          }
        }
        if (entry.vehicule && typeof entry.vehicule === 'string' && !vehiculeMap[entry.vehicule]) {
          try {
            const vehicule = await getVehiculeById(entry.vehicule);
            vehiculeMap[entry.vehicule] = vehicule.immatriculation || vehicule.nom || 'Véhicule';
            changed = true;
          } catch {
            vehiculeMap[entry.vehicule] = 'Inconnu';
          }
        }
      }

      if (changed) {
        setChauffeurNames(chauffeurMap);
        setVehiculeNames(vehiculeMap);
      }
    };

    loadHistoriqueNames();
  }, [livraison]);

  const handleSave = async () => {
    try {
      const payload = {
        statut: editData.statut,
        dateLivraison: editData.dateLivraison || null,
      };
      const updated = await updateLivraison(id, payload);
      setLivraison(updated);
      setSuccessMessage('Livraison mise à jour');
      setEditMode(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Erreur lors de la modification');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteLivraison(id);
      setSuccessMessage('Livraison supprimée');
      setTimeout(() => navigate('/livraisons'), 1500);
    } catch (err) {
      setError('Erreur suppression');
      setTimeout(() => setError(null), 3000);
    }
  };

  const openPdfModal = async (url) => {
    if (!url) return;
    const match = url.match(/\/api\/bonlivraisons?\/([a-f0-9]+)\/pdf/i);
    if (match) {
      const bonId = match[1];
      try {
        const response = await fetch(`${API_BASE}/api/bonlivraisons/${bonId}`);
        if (!response.ok) throw new Error('Bon introuvable');
        const bon = await response.json();
        const reference = bon.reference; // ex: "BL-0006"
        const statiqueUrl = `${API_BASE}/uploads/bon-livraisons/${reference}.pdf`;
        setPdfUrl(statiqueUrl);
        setPdfModalOpen(true);
      } catch (err) {
        console.error("Erreur chargement BL :", err);
        setError("Impossible de charger le bon de livraison");
      }
      return;
    }
    const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
    setPdfUrl(fullUrl);
    setPdfModalOpen(true);
  };

  const downloadPDF = () => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `document_${Date.now()}.pdf`;
    a.click();
  };

  const closePdfModal = () => {
    setPdfUrl(null);
    setPdfModalOpen(false);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#e2f0d6] border-t-[#8bb56a]" />
      </div>
    );
  }

  if (!livraison) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <p className="text-gray-600">Livraison introuvable</p>
        <button onClick={() => navigate('/livraisons')} className="mt-4 text-blue-600 hover:underline">Retour à la liste</button>
      </div>
    );
  }

  const totalCommandee = livraison.produits?.reduce((acc, p) => acc + (p.quantiteCommandee || 0), 0) || 0;
  const totalLivree = livraison.produits?.reduce((acc, p) => acc + (p.quantiteLivree || 0), 0) || 0;
  const progress = totalCommandee ? (totalLivree / totalCommandee) * 100 : 0;

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

      <button onClick={() => navigate('/livraisons')} className="mb-4 flex items-center gap-2 text-slate-600 hover:text-slate-900">
        <ArrowLeft size={20} /> Retour à la liste
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <Truck size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800">{livraison.reference}</h1>
            <p className="text-sm text-slate-500">Créée le {formatDate(livraison.createdAt)}</p>
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
              <button onClick={handleSave} className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">
                <CheckCircle size={16} /> Enregistrer
              </button>
              <button onClick={() => setEditMode(false)} className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-gray-50">
                <X size={16} /> Annuler
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne de gauche (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bloc Produits */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="text-lg font-semibold border-b pb-2 mb-4 flex items-center gap-2"><Package size={18} /> Produits</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 text-left">Produit</th>
                    <th className="p-2 text-center">Quantité commandée</th>
                    <th className="p-2 text-center">Quantité livrée</th>
                  </tr>
                </thead>
                <tbody>
                  {(livraison.produits || []).map((p, idx) => (
                    <tr key={idx}>
                      <td className="p-2">{p.produit?.nom || p.produit?.designation || 'Produit'}</td>
                      <td className="p-2 text-center">{p.quantiteCommandee || '-'}</td>
                      <td className="p-2 text-center">{p.quantiteLivree || 0}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td className="p-2 text-right font-medium">Totaux :</td>
                    <td className="p-2 text-center font-semibold">{totalCommandee}</td>
                    <td className="p-2 text-center font-semibold">{totalLivree}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-sm text-slate-600 mb-1">
                <span>Progression de la livraison</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>

          {/* Bloc Commande associée */}
          {commande && (
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h2 className="text-lg font-semibold border-b pb-2 mb-4 flex items-center gap-2"><FileText size={18} /> Commande associée</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow label="Référence" value={commande.reference} />
                <InfoRow label="Montant total" value={`${commande.montantTotal?.toLocaleString()} DH`} />
                <InfoRow label="Date commande" value={formatDate(commande.createdAt)} />
                <InfoRow label="Statut commande" value={<StatusBadge status={commande.statut} />} />
              </div>
              <button onClick={() => navigate(`/commandes/${commande._id}`)} className="mt-4 text-sm text-blue-600 hover:underline flex items-center gap-1">
                Voir le détail <ArrowLeft size={14} className="rotate-180" />
              </button>
            </div>
          )}

          {/* TABLEAU HISTORIQUE DES LIVRAISONS (uniquement : Chauffeur, Véhicule, Produits livrés, BL PDF) */}
          {livraison.historiqueLivraisons?.length > 0 && (
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h2 className="text-lg font-semibold border-b pb-2 mb-4 flex items-center gap-2">
                <History size={18} /> Historique des livraisons
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        <div className="flex items-center gap-1"><Users size={14} /> Chauffeur</div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        <div className="flex items-center gap-1"><TruckIcon size={14} /> Véhicule</div>
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        <div className="flex items-center justify-center gap-1"><PackageOpen size={14} /> Produits livrés</div>
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        <div className="flex items-center justify-center gap-1"><FileBadge size={14} /> BL PDF</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {livraison.historiqueLivraisons.map((h, idx) => {
                      const chauffeurDisplay = chauffeurNames[h.chauffeur] || h.chauffeur || '—';
                      const vehiculeDisplay = vehiculeNames[h.vehicule] || h.vehicule || '—';
                      const produitsCount = h.produitsLivres?.length || 0;
                      return (
                        <tr key={idx} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3 text-sm font-medium text-slate-800 whitespace-nowrap">
                            {chauffeurDisplay}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                            {vehiculeDisplay}
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-slate-600">
                            <span className="inline-flex items-center justify-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-emerald-700 font-medium text-xs">
                              {produitsCount} référence(s)
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {h.bonLivraisonUrl ? (
                              <button
                                onClick={() => openPdfModal(h.bonLivraisonUrl)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition text-sm font-medium"
                                title="Voir le bon de livraison"
                              >
                                <FileCheck size={16} /> BL PDF
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400">Non disponible</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Colonne de droite (1/3) – inchangée */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="text-lg font-semibold border-b pb-2 mb-4">État</h2>
            {!editMode ? (
              <>
                <InfoRow label="Statut" value={<StatusBadge status={livraison.statut} />} />
                <InfoRow label="Date de livraison" value={livraison.dateLivraison ? formatDate(livraison.dateLivraison) : 'Non définie'} />
              </>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-slate-500">Statut</label>
                  <select
                    value={editData.statut}
                    onChange={e => setEditData({ ...editData, statut: e.target.value })}
                    className="mt-1 w-full border rounded-lg p-2"
                  >
                    <option value="planifiee">Planifiée</option>
                    <option value="en_cours">En cours</option>
                    <option value="en_route">En route</option>
                    <option value="livree_partiellement">Partielle</option>
                    <option value="livree">Livrée</option>
                    <option value="annulee">Annulée</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-slate-500">Date de livraison</label>
                  <input
                    type="date"
                    value={editData.dateLivraison || ''}
                    onChange={e => setEditData({ ...editData, dateLivraison: e.target.value })}
                    className="mt-1 w-full border rounded-lg p-2"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="text-lg font-semibold border-b pb-2 mb-4 flex items-center gap-2"><User size={18} /> Client</h2>
            <InfoRow label="Nom" value={livraison.client?.nom || livraison.client?.raisonSociale} />
            <InfoRow label="Email" value={livraison.client?.email} />
            <InfoRow label="Téléphone" value={livraison.client?.telephone} />
            <InfoRow label="Adresse livraison" value={livraison.adresseLivraison || livraison.client?.adresse || '—'} />
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="text-lg font-semibold border-b pb-2 mb-4">Informations</h2>
            <InfoRow label="Référence" value={livraison.reference} />
            <InfoRow label="Création" value={formatDate(livraison.createdAt)} />
            <InfoRow label="Dernière modification" value={formatDate(livraison.updatedAt)} />
            {livraison.remarque && <InfoRow label="Remarque" value={livraison.remarque} />}
          </div>
        </div>
      </div>

      {/* Modale PDF */}
      {pdfModalOpen && pdfUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[85vh] shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold flex items-center gap-2"><FileCheck size={20} /> Bon de livraison</h3>
              <div className="flex gap-2">
                <button onClick={() => window.open(pdfUrl)} className="p-2 rounded hover:bg-gray-100"><Printer size={20} /></button>
                <button onClick={downloadPDF} className="p-2 rounded hover:bg-gray-100"><Download size={20} /></button>
                <button onClick={closePdfModal} className="p-2 rounded hover:bg-gray-100"><X size={20} /></button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-2">
              <iframe src={pdfUrl} className="w-full h-full rounded-xl" title="Bon de livraison" />
            </div>
          </div>
        </div>
      )}

      {/* Modale suppression */}
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

export default DetailLivraison;