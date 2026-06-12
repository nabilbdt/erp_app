// pages/detailClient.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Edit, Trash2, User, Building, Mail, Phone, MapPin,
  CreditCard, Calendar, Loader2, AlertCircle, CheckCircle, X,
  Package, FileText, Receipt, DollarSign, Clock, Activity,
  TrendingUp, PieChart, Wallet, Banknote, Globe, Home,
  Briefcase, FileCheck, Settings, Eye, Printer, Download,
  ChevronRight, RefreshCw, Plus, Search, Filter, ShoppingCart,
  FileDown, FileSpreadsheet
} from "lucide-react";
import * as clientService from "../services/client.service";
import entrepriseService from "../services/entreprise.service";
import { generateContratClientBlob } from "../utils/pdfGenerator";

// Composant pour les cartes de statistiques
const StatCard = ({ title, value, icon: Icon, color, onClick, subValue }) => (
  <div 
    onClick={onClick}
    className={`group cursor-pointer rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition-all hover:shadow-md dark:bg-slate-900 dark:ring-slate-800 ${onClick ? 'hover:scale-105' : ''}`}
  >
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
        <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{value}</p>
        {subValue && <p className="text-xs text-slate-400 mt-1">{subValue}</p>}
      </div>
      <div className={`rounded-xl ${color} p-3 transition-transform group-hover:scale-110`}>
        <Icon size={22} className="text-white" />
      </div>
    </div>
  </div>
);

// Composant pour les sections
const SectionCard = ({ title, icon: Icon, children, className = "", onEdit, editMode }) => (
  <div className={`rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-slate-900 dark:ring-slate-800 ${className}`}>
    <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4 dark:border-slate-800">
      <div className="flex items-center gap-2">
        <div className="rounded-lg bg-[#e2f0d6] p-1.5 text-[#5a7c3c]">
          <Icon size={18} />
        </div>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">{title}</h2>
      </div>
      {onEdit && !editMode && (
        <button onClick={onEdit} className="rounded-lg p-1.5 text-slate-400 hover:bg-gray-100 transition">
          <Edit size={16} />
        </button>
      )}
    </div>
    {children}
  </div>
);

// Composant pour les items de liste modifiables
const EditableInfoItem = ({ icon: Icon, label, value, isEditing, onChange, field, type = "text", options = [] }) => {
  if (isEditing) {
    return (
      <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-800">
        <Icon size={18} className="mt-2 text-slate-400" />
        <div className="flex-1">
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">{label}</p>
          {type === "select" ? (
            <select
              value={value || ""}
              onChange={(e) => onChange(field, e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#8bb56a] focus:outline-none focus:ring-1 focus:ring-[#8bb56a]"
            >
              {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : (
            <input
              type={type}
              value={value || ""}
              onChange={(e) => onChange(field, e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#8bb56a] focus:outline-none focus:ring-1 focus:ring-[#8bb56a]"
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors group">
      <Icon size={18} className="mt-0.5 text-slate-400" />
      <div className="flex-1">
        <p className="text-xs text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-0.5">{value || "—"}</p>
      </div>
    </div>
  );
};

// Composant pour les adresses
const AddressCard = ({ address, isEditing, onChange }) => {
  const [localEditing, setLocalEditing] = useState(false);

  if (localEditing) {
    return (
      <div className="rounded-xl border border-[#d4e6b0] bg-[#e2f0d6]/20 p-4">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#5a7c3c]">{address.type === "facturation" ? "📍 Adresse de facturation" : "🚚 Adresse de livraison"}</span>
            {address.principale && <span className="text-xs bg-[#5a7c3c] text-white px-2 py-0.5 rounded-full">Principale</span>}
          </div>
          <button onClick={() => setLocalEditing(false)} className="rounded p-1 text-green-600 hover:bg-green-50">
            <CheckCircle size={16} />
          </button>
        </div>
        <div className="space-y-2">
          <input
            type="text"
            value={address.rue || ""}
            onChange={(e) => onChange(address._id, "rue", e.target.value)}
            placeholder="Rue"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={address.ville || ""}
              onChange={(e) => onChange(address._id, "ville", e.target.value)}
              placeholder="Ville"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <input
              type="text"
              value={address.codePostal || ""}
              onChange={(e) => onChange(address._id, "codePostal", e.target.value)}
              placeholder="Code postal"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <input
            type="text"
            value={address.pays || ""}
            onChange={(e) => onChange(address._id, "pays", e.target.value)}
            placeholder="Pays"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border p-4 ${address.principale ? 'border-[#d4e6b0] bg-[#e2f0d6]/10' : 'border-gray-100'}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-700">{address.type === "facturation" ? "📍 Facturation" : "🚚 Livraison"}</span>
          {address.principale && <span className="text-xs bg-[#e2f0d6] text-[#5a7c3c] px-2 py-0.5 rounded-full">Principale</span>}
        </div>
      </div>
      <p className="text-sm text-slate-600">{address.rue}</p>
      <p className="text-sm text-slate-600">{address.ville} {address.codePostal}</p>
      <p className="text-sm text-slate-600">{address.pays}</p>
    </div>
  );
};

// Badge de statut
const StatusBadge = ({ status }) => {
  const statusConfig = {
    payée: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    impayée: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    en_attente: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    livrée: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    en_cours: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    annulée: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
    accepté: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    refusé: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
  };
  const color = statusConfig[status] || statusConfig.en_attente;
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${color}`}>{status}</span>;
};

// Modal détails avec produits et téléchargement
const DetailModal = ({ item, type, onClose }) => {
  if (!item) return null;

  const handleDownload = () => {
    // Simuler le téléchargement du document
    const docContent = `
      ${type.toUpperCase()} - ${item.reference}
      Date: ${new Date(item.date).toLocaleDateString()}
      Client: ${item.client?.nom || item.client?.raisonSociale || ""}
      Montant: ${(item.montant || 0).toLocaleString()} DH
      Statut: ${item.statut}
      
      Produits:
      ${item.produits?.map(p => `- ${p.nom || p.designation}: ${p.quantite} x ${p.prixUnitaire} DH = ${p.total} DH`).join('\n')}
      
      Total: ${item.montant} DH
    `;
    
    const blob = new Blob([docContent], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_${item.reference}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b bg-white p-4 dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[#e2f0d6] p-2 text-[#5a7c3c]">
              {type === "commande" && <Package size={20} />}
              {type === "devis" && <FileText size={20} />}
              {type === "facture" && <Receipt size={20} />}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                {type === "commande" && "Détails de la commande"}
                {type === "devis" && "Détails du devis"}
                {type === "facture" && "Détails de la facture"}
              </h3>
              <p className="text-sm text-slate-500">{item.reference}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="rounded-lg p-2 text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-800">
              <Printer size={18} />
            </button>
            <button onClick={handleDownload} className="rounded-lg p-2 text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-800">
              <Download size={18} />
            </button>
            <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-800">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-6 space-y-6">
          {/* Informations générales */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-slate-800">
              <p className="text-xs text-slate-400">Date</p>
              <p className="font-medium text-slate-700 dark:text-slate-300">{new Date(item.createdAt || item.date).toLocaleDateString()}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-slate-800">
              <p className="text-xs text-slate-400">Montant HT</p>
              <p className="font-medium text-slate-700 dark:text-slate-300">{item.produits.reduce((sum, p) => {
                const prixTTC = p.prixTTC || 0;
                const tauxTVA = p.tauxTVA || 20;
                const prixHT = prixTTC / (1 + tauxTVA / 100);
                return sum + (prixHT * p.quantite);
              }, 0).toLocaleString()} DH</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-slate-800">
              <p className="text-xs text-slate-400">TVA</p>
              <p className="font-medium text-slate-700 dark:text-slate-300">{item.produits.reduce((sum, p) => {
                const prixTTC = p.prixTTC || 0;
                const tauxTVA = p.tauxTVA || 20;
                const prixHT = prixTTC / (1 + tauxTVA / 100);
                const montantTVA = (prixHT * p.quantite * tauxTVA) / 100;
                return sum + montantTVA;
              }, 0).toLocaleString()} DH</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-slate-800">
              <p className="text-xs text-slate-400">Total TTC</p>
              <p className="font-bold text-[#5a7c3c]">{(item.montant || item.montantTotal || item.produits.reduce((sum, p) => sum + (p.total || 0), 0)).toLocaleString()} DH</p>
            </div>
          </div>

          {/* Statut */}
          <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-slate-800">
            <p className="text-sm text-slate-600">Statut</p>
            <StatusBadge status={item.statut} />
          </div>

          {/* Produits */}
          {item.produits && item.produits.length > 0 && (
            <div>
              <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <ShoppingCart size={16} /> Produits
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-slate-800">
                    <tr>
                      <th className="px-3 py-2 text-left">Désignation</th>
                      <th className="px-3 py-2 text-center">Référence</th>
                      <th className="px-3 py-2 text-center">Quantité</th>
                      <th className="px-3 py-2 text-right">Prix U. HT</th>
                      <th className="px-3 py-2 text-right">TVA</th>
                      <th className="px-3 py-2 text-right">Total TTC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {item.produits.map((prod, idx) => {
                      const designationProd = prod.designation || prod.nom || (prod.produit && typeof prod.produit === "object" ? (prod.produit.designation || prod.produit.nom) : "") || prod.reference || "Produit";
                      return (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                        <td className="px-3 py-2 font-medium">{designationProd}</td>
                        <td className="px-3 py-2 text-center text-xs font-mono text-slate-500">{prod.reference || "—"}</td>
                        <td className="px-3 py-2 text-center">{prod.quantite}</td>
                        <td className="px-3 py-2 text-right">{(prod.prixTTC || prod.prixUnitaire || 0).toLocaleString()} DH</td>
                        <td className="px-3 py-2 text-right">{prod.tauxTVA || 20}%</td>
                        <td className="px-3 py-2 text-right font-medium">{(prod.total || prod.quantite * (prod.prixTTC || prod.prixUnitaire || 0) * (1 + (prod.tauxTVA || 20) / 100)).toLocaleString()} DH</td>
                      </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50 dark:bg-slate-800">
                    <tr>
                      <td colSpan="5" className="px-3 py-2 text-right font-semibold">Total HT</td>
                      <td className="px-3 py-2 text-right font-bold">{item.produits.reduce((sum, p) => {
                        const prixTTC = p.prixTTC || p.prixUnitaire || 0;
                        const tauxTVA = p.tauxTVA || 20;
                        const prixHT = prixTTC / (1 + tauxTVA / 100);
                        return sum + (prixHT * p.quantite);
                      }, 0).toLocaleString()} DH</td>
                    </tr>
                    <tr>
                      <td colSpan="5" className="px-3 py-2 text-right font-semibold">TVA (20%)</td>
                      <td className="px-3 py-2 text-right font-bold">{item.produits.reduce((sum, p) => {
                        const prixTTC = p.prixTTC || p.prixUnitaire || 0;
                        const tauxTVA = p.tauxTVA || 20;
                        const prixHT = prixTTC / (1 + tauxTVA / 100);
                        const montantTVA = (prixHT * p.quantite * tauxTVA) / 100;
                        return sum + montantTVA;
                      }, 0).toLocaleString()} DH</td>
                    </tr>
                    <tr className="bg-[#e2f0d6]/20">
                      <td colSpan="5" className="px-3 py-2 text-right font-bold text-[#5a7c3c]">Total TTC</td>
                      <td className="px-3 py-2 text-right font-bold text-[#5a7c3c]">{(item.montant || item.produits.reduce((sum, p) => sum + (p.total || 0), 0)).toLocaleString()} DH</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Notes */}
          {item.notes && (
            <div className="rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20">
              <p className="text-xs text-yellow-600 dark:text-yellow-400">Notes</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{item.notes}</p>
            </div>
          )}
        </div>

        {/* Footer avec actions */}
        <div className="sticky bottom-0 flex justify-end gap-3 border-t bg-white p-4 dark:bg-slate-900 dark:border-slate-800">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-slate-700"
          >
            <FileDown size={16} /> Télécharger PDF
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-[#e2f0d6] px-4 py-2 text-sm font-medium text-[#5a7c3c] hover:bg-[#d4e6b0]"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

// Composant principal
const DetailClient = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [commandes, setCommandes] = useState([]);
  const [devis, setDevis] = useState([]);
  const [factures, setFactures] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [loadingData, setLoadingData] = useState({
    commandes: false,
    devis: false,
    factures: false
  });
  
  // États pour l'édition
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [editAdresses, setEditAdresses] = useState([]);
  const [editConditionPaiement, setEditConditionPaiement] = useState({});

  // États pour le contrat PDF
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [entreprise, setEntreprise] = useState(null);

  useEffect(() => {
    fetchEntreprise();
    fetchClientDetails();
  }, [id]);

  useEffect(() => {
    if (activeTab === "commandes") fetchCommandes();
    if (activeTab === "devis") fetchDevis();
    if (activeTab === "factures") fetchFactures();
  }, [activeTab, id]);

  const fetchEntreprise = async () => {
    try {
      const data = await entrepriseService.getAll();
      setEntreprise(Array.isArray(data) && data.length > 0 ? data[0] : null);
    } catch (err) {
      console.error("Erreur chargement entreprise", err);
      setEntreprise(null);
    }
  };

  const fetchClientDetails = async () => {
    try {
      setLoading(true);
      const response = await clientService.getClientById(id);
      const clientData = response.client || response;
      const statsData = response.stats || {};
      setClient(clientData);
      setStats(statsData);
      setEditData(clientData);
      setEditAdresses(clientData.adresses || []);
      setEditConditionPaiement(clientData.conditionPaiement || clientData.conditionsPaiement || {});
    } catch (err) {
      console.error("Erreur chargement client:", err);
      setError("Impossible de charger les détails du client");
    } finally {
      setLoading(false);
    }
  };

  const fetchCommandes = async () => {
    try {
      setLoadingData(prev => ({ ...prev, commandes: true }));
      const data = await clientService.getClientCommandes(id);
      setCommandes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erreur chargement commandes:", err);
      setCommandes([]);
    } finally {
      setLoadingData(prev => ({ ...prev, commandes: false }));
    }
  };

  const fetchDevis = async () => {
    try {
      setLoadingData(prev => ({ ...prev, devis: true }));
      const data = await clientService.getClientDevis(id);
      setDevis(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erreur chargement devis:", err);
      setDevis([]);
    } finally {
      setLoadingData(prev => ({ ...prev, devis: false }));
    }
  };

  const fetchFactures = async () => {
    try {
      setLoadingData(prev => ({ ...prev, factures: true }));
      const data = await clientService.getClientFactures(id);
      setFactures(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erreur chargement factures:", err);
      setFactures([]);
    } finally {
      setLoadingData(prev => ({ ...prev, factures: false }));
    }
  };

  const handleEditField = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleEditAddress = (addressId, field, value) => {
    setEditAdresses(prev => prev.map(addr => 
      addr._id === addressId ? { ...addr, [field]: value } : addr
    ));
  };

  const handleEditConditionPaiementField = (field, value) => {
    if (field === "nomBanque" || field === "rib" || field === "iban" || field === "swift") {
      setEditConditionPaiement(prev => ({ 
        ...prev, 
        banque: { ...prev.banque, [field]: value } 
      }));
    } else {
      setEditConditionPaiement(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSaveChanges = async () => {
    try {
      const updateData = {
        type: editData.type,
        nom: editData.nom,
        prenom: editData.prenom,
        raisonSociale: editData.raisonSociale,
        email: editData.email,
        telephone: editData.telephone,
        ice: editData.ice,
        if: editData.if,
        rc: editData.rc,
        adresses: editAdresses,
        conditionPaiement: editConditionPaiement
      };
      
      await clientService.updateClient(id, updateData);
      setSuccessMessage("Client modifié avec succès !");
      setEditMode(false);
      fetchClientDetails();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Erreur sauvegarde:", err);
      setError("Erreur lors de la modification");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDeleteClient = async () => {
    try {
      await clientService.deleteClient(id);
      setSuccessMessage("Client supprimé avec succès");
      setTimeout(() => navigate("/client"), 1500);
    } catch (err) {
      console.error("Erreur suppression:", err);
      setError("Erreur lors de la suppression");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleViewItem = (item, type) => {
    setSelectedItem({ ...item, type });
    setModalOpen(true);
  };

  // Fonctions pour le contrat PDF
  const handleGenerateContrat = async () => {
    if (!entreprise || !client) {
      alert("Informations entreprise ou client manquantes");
      return;
    }
    try {
      setGeneratingPdf(true);
      const blob = await generateContratClientBlob({ entreprise, client });
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
      a.download = `Contrat_${client.reference}.pdf`;
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

  const tabs = [
    { id: "overview", label: "Aperçu", icon: User },
    { id: "commandes", label: "Commandes", icon: Package, count: stats?.totalCommandes || commandes.length },
    { id: "devis", label: "Devis", icon: FileText, count: stats?.totalDevis || devis.length },
    { id: "factures", label: "Factures", icon: Receipt, count: stats?.totalFactures || factures.length },
    { id: "analytics", label: "Analytique", icon: TrendingUp },
    { id: "contrat", label: "Contrat", icon: FileText }
  ];

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 size={48} className="animate-spin text-[#8bb56a]" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
          <p className="text-slate-600">{error || "Client non trouvé"}</p>
          <button onClick={() => navigate("/client")} className="mt-4 rounded-lg bg-[#e2f0d6] px-4 py-2 text-[#5a7c3c]">Retour</button>
        </div>
      </div>
    );
  }

  // Calcul des statistiques pour l'analytique
  const totalCommandesMontant = commandes.reduce((sum, c) => sum + (c.montant || 0), 0);
  const totalDevisMontant = devis.reduce((sum, d) => sum + (d.montant || 0), 0);
  const totalFacturesMontant = factures.reduce((sum, f) => sum + (f.montant || 0), 0);
  const facturesPayees = factures.filter(f => f.statut === "payée");
  const facturesImpayees = factures.filter(f => f.statut === "impayée");
  const commandesLivrees = commandes.filter(c => c.statut === "livrée");
  const commandesEnCours = commandes.filter(c => c.statut === "en_cours");
  const devisAcceptes = devis.filter(d => d.statut === "accepté");
  const devisEnAttente = devis.filter(d => d.statut === "en_attente");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 lg:p-6 dark:from-slate-900 dark:to-slate-800">
      {/* Messages */}
      {successMessage && (
        <div className="fixed top-20 right-4 z-[350] flex items-center gap-2 rounded-lg bg-green-500 text-white px-4 py-2 shadow-lg">
          <CheckCircle size={18} /> {successMessage}
        </div>
      )}
      {error && (
        <div className="fixed top-20 right-4 z-[350] flex items-center gap-2 rounded-lg bg-red-500 text-white px-4 py-2 shadow-lg">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/client")} className="rounded-full p-2 text-slate-400 hover:bg-gray-100">
              <ArrowLeft size={20} />
            </button>
            <div className={`flex h-14 w-14 items-center justify-center rounded-full ${
              client.type === "particulier" ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"
            }`}>
              {client.type === "particulier" ? <User size={28} /> : <Building size={28} />}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                {client.type === "particulier"
                  ? `${client.nom || ""} ${client.prenom || ""}`.trim()
                  : client.raisonSociale || client.nom}
              </h1>
              <p className="text-sm text-slate-500">
                {client.reference} • Client depuis {new Date(client.createdAt).toLocaleDateString()}
              </p>
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
      </div>

      {/* Cartes statistiques */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Commandes" value={stats?.totalCommandes || commandes.length} icon={Package} color="bg-blue-500" onClick={() => setActiveTab("commandes")} subValue={`${totalCommandesMontant.toLocaleString()} DH`} />
        <StatCard title="Devis" value={stats?.totalDevis || devis.length} icon={FileText} color="bg-purple-500" onClick={() => setActiveTab("devis")} subValue={`${totalDevisMontant.toLocaleString()} DH`} />
        <StatCard title="Factures" value={stats?.totalFactures || factures.length} icon={Receipt} color="bg-green-500" onClick={() => setActiveTab("factures")} subValue={`${totalFacturesMontant.toLocaleString()} DH`} />
        <StatCard title="Chiffre d'affaires" value={`${(stats?.totalCA || totalFacturesMontant).toLocaleString()} DH`} icon={DollarSign} color="bg-orange-500" onClick={() => setActiveTab("analytics")} />
      </div>

      {/* Onglets */}
      <div className="mb-6 flex flex-wrap gap-2 border-b pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === tab.id ? "bg-[#e2f0d6] text-[#5a7c3c] shadow-sm" : "text-slate-600 hover:bg-gray-100"
            }`}
          >
            <tab.icon size={16} /> {tab.label}
            {tab.count > 0 && <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-gray-200">{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* Onglet Aperçu */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SectionCard title="Informations générales" icon={User} onEdit={() => setEditMode(true)} editMode={editMode}>
            <EditableInfoItem icon={Mail} label="Email" value={editMode ? editData.email : client.email} isEditing={editMode} onChange={handleEditField} field="email" />
            <EditableInfoItem icon={Phone} label="Téléphone" value={editMode ? editData.telephone : client.telephone} isEditing={editMode} onChange={handleEditField} field="telephone" type="tel" />
            
            {client.type === "particulier" ? (
              <>
                <EditableInfoItem icon={User} label="Nom" value={editMode ? editData.nom : client.nom} isEditing={editMode} onChange={handleEditField} field="nom" />
                <EditableInfoItem icon={User} label="Prénom" value={editMode ? editData.prenom : client.prenom} isEditing={editMode} onChange={handleEditField} field="prenom" />
              </>
            ) : (
              <>
                <EditableInfoItem icon={Building} label="Raison sociale" value={editMode ? editData.raisonSociale : (client.raisonSociale || client.nom)} isEditing={editMode} onChange={handleEditField} field="raisonSociale" />
                <EditableInfoItem icon={Briefcase} label="ICE" value={editMode ? editData.ice : client.ice} isEditing={editMode} onChange={handleEditField} field="ice" />
                <EditableInfoItem icon={FileCheck} label="IF" value={editMode ? editData.if : client.if} isEditing={editMode} onChange={handleEditField} field="if" />
                <EditableInfoItem icon={Settings} label="RC" value={editMode ? editData.rc : client.rc} isEditing={editMode} onChange={handleEditField} field="rc" />
              </>
            )}
            <EditableInfoItem icon={Calendar} label="Date d'ajout" value={new Date(client.createdAt).toLocaleDateString()} isEditing={false} />
          </SectionCard>

          <SectionCard title="Adresses" icon={MapPin} onEdit={() => setEditMode(true)} editMode={editMode}>
            <div className="space-y-3">
              {(editMode ? editAdresses : client.adresses || []).map((address, idx) => (
                <AddressCard
                  key={address._id || idx}
                  address={address}
                  isEditing={editMode}
                  onChange={handleEditAddress}
                />
              ))}
              {(editMode && (!editAdresses || editAdresses.length === 0)) && (
                <p className="text-center text-slate-400 py-4">Aucune adresse</p>
              )}
              {(!editMode && (!client.adresses || client.adresses.length === 0)) && (
                <p className="text-center text-slate-400 py-4">Aucune adresse</p>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Conditions de paiement" icon={CreditCard} onEdit={() => setEditMode(true)} editMode={editMode}>
            <EditableInfoItem 
              icon={Wallet} 
              label="Mode de paiement" 
              value={editMode ? editConditionPaiement.modePaiement : (client.conditionPaiement?.modePaiement || client.conditionsPaiement?.mode)} 
              isEditing={editMode} 
              onChange={handleEditConditionPaiementField} 
              field="modePaiement"
              type="select"
              options={[
                { value: "virement", label: "Virement bancaire" },
                { value: "cheque", label: "Chèque" },
                { value: "especes", label: "Espèces" },
                { value: "prelevement", label: "Prélèvement automatique" }
              ]}
            />
            <EditableInfoItem 
              icon={Clock} 
              label="Délai de paiement (jours)" 
              value={editMode ? editConditionPaiement.duree : (client.conditionPaiement?.duree || client.conditionsPaiement?.delai)} 
              isEditing={editMode} 
              onChange={handleEditConditionPaiementField} 
              field="duree"
              type="number"
            />
            <EditableInfoItem icon={Banknote} label="Banque" value={editMode ? editConditionPaiement.banque?.nomBanque : (client.conditionPaiement?.banque?.nomBanque || client.conditionsPaiement?.coordonneesBancaires?.banque)} isEditing={editMode} onChange={handleEditConditionPaiementField} field="nomBanque" />
            <EditableInfoItem icon={CreditCard} label="RIB" value={editMode ? editConditionPaiement.banque?.rib : (client.conditionPaiement?.banque?.rib || client.conditionsPaiement?.coordonneesBancaires?.rib)} isEditing={editMode} onChange={handleEditConditionPaiementField} field="rib" />
            <EditableInfoItem icon={CreditCard} label="IBAN" value={editMode ? editConditionPaiement.banque?.iban : (client.conditionPaiement?.banque?.iban || client.conditionsPaiement?.coordonneesBancaires?.iban)} isEditing={editMode} onChange={handleEditConditionPaiementField} field="iban" />
          </SectionCard>

          <SectionCard title="Résumé financier" icon={DollarSign}>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
                <span className="text-sm">Total factures</span>
                <span className="font-bold">{(stats?.totalCA || totalFacturesMontant).toLocaleString()} DH</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-green-50">
                <span className="text-sm text-green-600">Payé</span>
                <span className="font-bold text-green-600">{(stats?.totalPaye || facturesPayees.reduce((sum, f) => sum + (f.montant || 0), 0)).toLocaleString()} DH</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-red-50">
                <span className="text-sm text-red-600">Restant dû</span>
                <span className="font-bold text-red-600">{(stats?.resteAPayer || facturesImpayees.reduce((sum, f) => sum + (f.montant || 0), 0)).toLocaleString()} DH</span>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* Onglet Commandes avec produits */}
      {activeTab === "commandes" && (
        <SectionCard title="Commandes" icon={Package}>
          {loadingData.commandes ? (
            <div className="flex justify-center py-8"><Loader2 size={32} className="animate-spin text-[#8bb56a]" /></div>
          ) : commandes.length === 0 ? (
            <div className="text-center py-8">
              <Package size={48} className="mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500">Aucune commande</p>
            </div>
          ) : (
            <div className="space-y-4">
              {commandes.map(commande => (
                <div key={commande._id} className="rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                  {/* En-tête de la commande */}
                  <div className="bg-gray-50 p-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Package size={20} className="text-blue-500" />
                      <div>
                        <p className="font-semibold text-slate-800">{commande.reference}</p>
                        <p className="text-xs text-slate-500">{new Date(commande.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-slate-500">Montant total</p>
                        <p className="font-bold text-slate-800">{(commande.montant || 0).toLocaleString()} DH</p>
                      </div>
                      <StatusBadge status={commande.statut} />
                      <button onClick={() => handleViewItem(commande, "commande")} className="rounded-lg p-2 text-slate-500 hover:bg-gray-200">
                        <Eye size={18} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Détail des produits */}
                  {commande.produits && commande.produits.length > 0 && (
                    <div className="p-4">
                      <p className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                        <ShoppingCart size={14} /> Produits
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left">Désignation</th>
                              <th className="px-3 py-2 text-center">Quantité</th>
                              <th className="px-3 py-2 text-right">Prix U. TTC</th>
                              <th className="px-3 py-2 text-right">TVA (%)</th>
                              <th className="px-3 py-2 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {commande.produits.slice(0, 3).map((prod, idx) => {
                              const designationProd = prod.designation || prod.nom || (prod.produit && typeof prod.produit === "object" ? (prod.produit.designation || prod.produit.nom) : "") || "Produit";
                              return (
                              <tr key={idx}>
                                <td className="px-3 py-2">{designationProd}</td>
                                <td className="px-3 py-2 text-center">{prod.quantite}</td>
                                <td className="px-3 py-2 text-right">{(prod.prixTTC || 0).toLocaleString()} DH</td>
                                <td className="px-3 py-2 text-right">{prod.tauxTVA || 20}%</td>
                                <td className="px-3 py-2 text-right font-medium">{(prod.total || 0).toLocaleString()} DH</td>
                              </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        {commande.produits.length > 3 && (
                          <p className="text-xs text-slate-400 text-center mt-2">+ {commande.produits.length - 3} autres produits</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {/* Onglet Devis avec produits */}
      {activeTab === "devis" && (
        <SectionCard title="Devis" icon={FileText}>
          {loadingData.devis ? (
            <div className="flex justify-center py-8"><Loader2 size={32} className="animate-spin text-[#8bb56a]" /></div>
          ) : devis.length === 0 ? (
            <div className="text-center py-8">
              <FileText size={48} className="mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500">Aucun devis</p>
            </div>
          ) : (
            <div className="space-y-4">
              {devis.map(devi => (
                <div key={devi._id} className="rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                  {/* En-tête du devis */}
                  <div className="bg-gray-50 p-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <FileText size={20} className="text-purple-500" />
                      <div>
                        <p className="font-semibold text-slate-800">{devi.reference}</p>
                        <p className="text-xs text-slate-500">{new Date(devi.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-slate-500">Montant total</p>
                        <p className="font-bold text-slate-800">{(devi.montant || 0).toLocaleString()} DH</p>
                      </div>
                      <StatusBadge status={devi.statut} />
                      <button onClick={() => handleViewItem(devi, "devis")} className="rounded-lg p-2 text-slate-500 hover:bg-gray-200">
                        <Eye size={18} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Détail des produits */}
                  {devi.produits && devi.produits.length > 0 && (
                    <div className="p-4">
                      <p className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                        <ShoppingCart size={14} /> Produits
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                           <tr>
                              <th className="px-3 py-2 text-left">Désignation</th>
                              <th className="px-3 py-2 text-center">Quantité</th>
                              <th className="px-3 py-2 text-right">Prix U. TTC</th>
                              <th className="px-3 py-2 text-right">TVA (%)</th>
                              <th className="px-3 py-2 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {devi.produits.slice(0, 3).map((prod, idx) => {
                              const designationProd = prod.designation || prod.nom || (prod.produit && typeof prod.produit === "object" ? (prod.produit.designation || prod.produit.nom) : "") || "Produit";
                              return (
                              <tr key={idx}>
                                <td className="px-3 py-2">{designationProd}</td>
                                <td className="px-3 py-2 text-center">{prod.quantite}</td>
                                <td className="px-3 py-2 text-right">{(prod.prixTTC || 0).toLocaleString()} DH</td>
                                <td className="px-3 py-2 text-right">{prod.tauxTVA || 20}%</td>
                                <td className="px-3 py-2 text-right font-medium">{(prod.total || 0).toLocaleString()} DH</td>
                              </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        {devi.produits.length > 3 && (
                          <p className="text-xs text-slate-400 text-center mt-2">+ {devi.produits.length - 3} autres produits</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {/* Onglet Factures */}
      {activeTab === "factures" && (
        <SectionCard title="Factures" icon={Receipt}>
          {loadingData.factures ? (
            <div className="flex justify-center py-8"><Loader2 size={32} className="animate-spin text-[#8bb56a]" /></div>
          ) : factures.length === 0 ? (
            <div className="text-center py-8">
              <Receipt size={48} className="mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500">Aucune facture</p>
            </div>
          ) : (
            <div className="space-y-4">
              {factures.map(facture => (
                <div key={facture._id} className="rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="bg-gray-50 p-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Receipt size={20} className="text-green-500" />
                      <div>
                        <p className="font-semibold text-slate-800">{facture.reference}</p>
                        <p className="text-xs text-slate-500">{new Date(facture.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-slate-500">Montant</p>
                        <p className="font-bold text-slate-800">{(facture.montant || 0).toLocaleString()} DH</p>
                      </div>
                      <StatusBadge status={facture.statut} />
                      <button onClick={() => handleViewItem(facture, "facture")} className="rounded-lg p-2 text-slate-500 hover:bg-gray-200">
                        <Eye size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {/* Onglet Analytique */}
      {activeTab === "analytics" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SectionCard title="Répartition financière" icon={PieChart}>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Factures payées</span>
                  <span className="text-sm font-semibold text-green-600">{facturesPayees.length} / {factures.length}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                  <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${factures.length > 0 ? (facturesPayees.length / factures.length) * 100 : 0}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Montant payé</span>
                  <span className="text-sm font-semibold text-green-600">{(facturesPayees.reduce((sum, f) => sum + (f.montant || 0), 0)).toLocaleString()} DH</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                  <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${totalFacturesMontant > 0 ? (facturesPayees.reduce((sum, f) => sum + (f.montant || 0), 0) / totalFacturesMontant) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Statut des commandes" icon={Activity}>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
                <span className="text-sm">Livrées</span>
                <span className="font-semibold text-green-600">{commandesLivrees.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-yellow-50">
                <span className="text-sm">En cours</span>
                <span className="font-semibold text-yellow-600">{commandesEnCours.length}</span>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Statut des devis" icon={FileText}>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-lg bg-green-50">
                <span className="text-sm">Acceptés</span>
                <span className="font-semibold text-green-600">{devisAcceptes.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-yellow-50">
                <span className="text-sm">En attente</span>
                <span className="font-semibold text-yellow-600">{devisEnAttente.length}</span>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Chiffres clés" icon={TrendingUp}>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-lg bg-blue-50">
                <span className="text-sm">Total des ventes</span>
                <span className="font-bold text-blue-600">{(totalCommandesMontant + totalDevisMontant).toLocaleString()} DH</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-purple-50">
                <span className="text-sm">Taux de conversion (devis → commandes)</span>
                <span className="font-bold text-purple-600">{devis.length > 0 ? Math.round((commandes.length / devis.length) * 100) : 0}%</span>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* Onglet Contrat */}
      {activeTab === "contrat" && (
        <div className="space-y-6">
          <SectionCard title="Génération du contrat" icon={FileText}>
            <div className="flex flex-col items-center justify-center py-8">
              <button
                onClick={handleGenerateContrat}
                disabled={generatingPdf}
                className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-[#8bb56a] bg-[#e2f0d6]/20 p-8 hover:bg-[#e2f0d6]/40 transition"
              >
                {generatingPdf ? (
                  <Loader2 size={48} className="animate-spin text-[#8bb56a]" />
                ) : (
                  <FileText size={48} className="text-[#8bb56a]" />
                )}
                <span className="text-lg font-semibold text-slate-700">
                  {generatingPdf ? "Génération en cours..." : "Générer le contrat client"}
                </span>
                <span className="text-sm text-slate-500">PDF prêt à être visualisé, téléchargé ou imprimé</span>
              </button>
            </div>
          </SectionCard>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SectionCard title="Informations entreprise" icon={Building}>
              {entreprise ? (
                <div className="space-y-2 text-sm">
                  <p><strong>Nom :</strong> {entreprise.nom}</p>
                  <p><strong>RC / ICE / IF :</strong> {entreprise.rc} / {entreprise.ice} / {entreprise.if}</p>
                  <p><strong>Adresse :</strong> {entreprise.adresse}</p>
                  <p><strong>Tél :</strong> {entreprise.telephone} | <strong>Email :</strong> {entreprise.email}</p>
                  <p><strong>Site web :</strong> {entreprise.siteWeb || "—"}</p>
                  <p><strong>Type :</strong> {entreprise.typeEntreprise}</p>
                </div>
              ) : (
                <p className="text-slate-500">Aucune entreprise configurée</p>
              )}
            </SectionCard>

            <SectionCard title="Récapitulatif client" icon={User}>
              <div className="space-y-2 text-sm">
                <p><strong>{client.type === "particulier" ? "Nom complet :" : "Raison sociale :"}</strong> 
                  {client.type === "particulier" 
                    ? `${client.nom || ""} ${client.prenom || ""}`.trim() 
                    : client.raisonSociale || client.nom}
                </p>
                <p><strong>Référence :</strong> {client.reference}</p>
                {client.type === "entreprise" && (
                  <>
                    <p><strong>ICE :</strong> {client.ice || "—"}</p>
                    <p><strong>RC :</strong> {client.rc || "—"}</p>
                  </>
                )}
                <p><strong>Email :</strong> {client.email || "—"}</p>
                <p><strong>Téléphone :</strong> {client.telephone || "—"}</p>
                <p><strong>Adresse principale :</strong> {
                  client.adresses?.find(a => a.type === "livraison" && a.principale)?.rue ||
                  client.adresses?.[0]?.rue ||
                  "—"
                }</p>
                <p><strong>Conditions de paiement :</strong> 
                  {client.conditionPaiement?.modePaiement || "—"} / {client.conditionPaiement?.duree || 0} jours
                </p>
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && selectedItem && <DetailModal item={selectedItem} type={selectedItem.type} onClose={() => setModalOpen(false)} />}

      {/* Confirmation suppression */}
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
              <button onClick={handleDeleteClient} className="rounded-lg bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600">Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal PDF */}
      {pdfModalOpen && pdfUrl && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative h-[90vh] w-full max-w-4xl rounded-2xl bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b p-4">
              <h3 className="text-lg font-semibold">Contrat client</h3>
              <div className="flex gap-2">
                <button onClick={handlePrintPdf} className="rounded-lg p-2 text-slate-500 hover:bg-gray-100" title="Imprimer">
                  <Printer size={20} />
                </button>
                <button onClick={handleDownloadPdf} className="rounded-lg p-2 text-slate-500 hover:bg-gray-100" title="Télécharger">
                  <Download size={20} />
                </button>
                <button onClick={closePdfModal} className="rounded-lg p-2 text-slate-500 hover:bg-gray-100">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-2">
              <iframe
                src={pdfUrl}
                title="Aperçu du contrat"
                className="h-full w-full"
                style={{ border: "none" }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailClient; 