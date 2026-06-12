import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, AlertTriangle, Package, TrendingUp, CheckCircle, User, Truck, FileText, Loader2 } from 'lucide-react';
import { getChauffeurs } from '../../services/chauffeur.service';
import { getVehicules } from '../../services/vehicule.service';

const LivraisonQuantityModal = ({ livraison, onSave, onClose, isSaving }) => {
  const [additionalQuantities, setAdditionalQuantities] = useState({});
  const [error, setError] = useState(null);
  const [chauffeurs, setChauffeurs] = useState([]);
  const [vehicules, setVehicules] = useState([]);
  const [selectedChauffeur, setSelectedChauffeur] = useState('');
  const [selectedVehicule, setSelectedVehicule] = useState('');
  const [withFacture, setWithFacture] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Charger les listes
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [chauffeursData, vehiculesData] = await Promise.all([
          getChauffeurs(),
          getVehicules()
        ]);
        setChauffeurs(chauffeursData);
        setVehicules(vehiculesData);
      } catch (err) {
        setError("Erreur lors du chargement des données logistiques");
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (livraison && livraison.produits) {
      const initial = {};
      livraison.produits.forEach((_, idx) => {
        initial[idx] = 0;
      });
      setAdditionalQuantities(initial);
      setError(null);
    }
  }, [livraison]);

  const getRemainingQuantity = (produit) => {
    const commandee = produit.quantiteCommandee || produit.quantite || 0;
    const dejaLivree = produit.quantiteLivree || 0;
    return Math.max(0, commandee - dejaLivree);
  };

  const updateQuantity = (index, value) => {
    const parsed = parseInt(value, 10);
    const maxAdditional = getRemainingQuantity(livraison.produits[index]);
    const newValue = isNaN(parsed) ? 0 : Math.min(parsed, maxAdditional);
    setAdditionalQuantities(prev => ({ ...prev, [index]: newValue }));
    setError(null);
  };

  const getTotalToDeliverNow = () => {
    return Object.values(additionalQuantities).reduce((sum, qty) => sum + (qty || 0), 0);
  };

  const getOverallProgress = () => {
    const produits = livraison.produits;
    let totalCommandee = 0;
    let totalLivree = 0;
    produits.forEach(p => {
      const cmd = p.quantiteCommandee || p.quantite || 0;
      const liv = p.quantiteLivree || 0;
      totalCommandee += cmd;
      totalLivree += liv;
    });
    const percentage = totalCommandee === 0 ? 0 : (totalLivree / totalCommandee) * 100;
    return { percentage: Math.min(100, percentage), totalCommandee, totalLivree };
  };

  const handleSubmit = async () => {
    if (!selectedChauffeur) {
      setError("Veuillez sélectionner un chauffeur");
      return;
    }
    if (!selectedVehicule) {
      setError("Veuillez sélectionner un véhicule");
      return;
    }
    const hasPositive = Object.values(additionalQuantities).some(q => q > 0);
    if (!hasPositive) {
      setError("Veuillez indiquer au moins une quantité à livrer (> 0)");
      return;
    }

    const produitsLivres = livraison.produits
      .map((prod, idx) => {
        const qtyToAdd = additionalQuantities[idx] || 0;
        if (qtyToAdd === 0) return null;
        const remaining = getRemainingQuantity(prod);
        if (qtyToAdd > remaining) {
          setError(`La quantité pour ${prod.produit?.nom || 'produit'} dépasse le reste à livrer (${remaining})`);
          return null;
        }
        const produitId = prod.produit?._id || prod.produit;
        return {
          produit: produitId.toString(),
          quantiteLivree: qtyToAdd
        };
      })
      .filter(Boolean);

    if (produitsLivres.length === 0) return;

    await onSave(livraison._id, produitsLivres, selectedChauffeur, selectedVehicule, withFacture);
  };

  if (!livraison) return null;

  const { percentage, totalCommandee, totalLivree } = getOverallProgress();
  const totalNow = getTotalToDeliverNow();
  const willBeFullyDelivered = totalLivree + totalNow >= totalCommandee;

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
              <Package size={22} className="text-[#8bb56a]" />
              Effectuer une livraison
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Livraison <span className="font-mono font-semibold">{livraison.reference}</span> – 
              <span className="ml-1">{livraison.client?.nom || livraison.client?.raisonSociale}</span>
            </p>
            {livraison.adresseLivraison && (
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <span>📍</span> {livraison.adresseLivraison}
              </p>
            )}
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-gray-100 transition">
            <X size={20} />
          </button>
        </div>

        {/* Barre de progression */}
        <div className="px-6 pt-4">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Progression globale</span>
            <span>{totalLivree} / {totalCommandee} unités</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-[#8bb56a] h-2 rounded-full transition-all duration-300" style={{ width: `${percentage}%` }} />
          </div>
        </div>

        {/* Chauffeur + Véhicule + Facture */}
        <div className="px-6 pt-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-b pb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
              <User size={14} /> Chauffeur <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedChauffeur}
              onChange={(e) => setSelectedChauffeur(e.target.value)}
              disabled={loadingData}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#8bb56a] focus:outline-none disabled:bg-gray-100"
            >
              <option value="">Sélectionner un chauffeur</option>
              {chauffeurs.map(c => (
                <option key={c._id} value={c._id}>{c.nom} {c.prenom}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
              <Truck size={14} /> Véhicule <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedVehicule}
              onChange={(e) => setSelectedVehicule(e.target.value)}
              disabled={loadingData}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#8bb56a] focus:outline-none disabled:bg-gray-100"
            >
              <option value="">Sélectionner un véhicule</option>
              {vehicules.map(v => (
                <option key={v._id} value={v._id}>{v.immatriculation} - {v.modele}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 mt-6">
            <input
              type="checkbox"
              id="withFacture"
              checked={withFacture}
              onChange={(e) => setWithFacture(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-[#8bb56a] focus:ring-[#8bb56a]"
            />
            <label htmlFor="withFacture" className="text-sm font-medium text-slate-700 flex items-center gap-1">
              <FileText size={14} /> Avec facture
            </label>
          </div>
        </div>

        {/* Tableau des produits */}
        <div className="flex-1 overflow-auto p-6">
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 p-3 flex items-center gap-2 text-red-700 border border-red-200">
              <AlertTriangle size={18} /> {error}
            </div>
          )}
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-50 rounded-lg">
              <tr>
                <th className="p-3 text-left rounded-l-lg text-slate-600">Produit</th>
                <th className="p-3 text-center text-slate-600">Commandée</th>
                <th className="p-3 text-center text-slate-600">Déjà livrée</th>
                <th className="p-3 text-center text-slate-600">Reste</th>
                <th className="p-3 text-center rounded-r-lg text-slate-600">À livrer maintenant</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {livraison.produits.map((prod, idx) => {
                const commandee = prod.quantiteCommandee || prod.quantite || 0;
                const dejaLivree = prod.quantiteLivree || 0;
                const remaining = commandee - dejaLivree;
                const isCompleted = remaining === 0;
                return (
                  <tr key={idx} className={isCompleted ? "bg-gray-50" : ""}>
                    <td className="p-3 font-medium text-slate-700">
                      {prod.produit?.nom || prod.produit?.designation || 'Produit'}
                      {isCompleted && <span className="ml-2 text-green-600 text-xs">(complet)</span>}
                    </td>
                    <td className="p-3 text-center text-slate-600">{commandee}</td>
                    <td className="p-3 text-center">
                      <span className={dejaLivree > 0 ? "text-green-600 font-medium" : "text-slate-400"}>
                        {dejaLivree}
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono text-slate-600">{remaining}</td>
                    <td className="p-3 text-center">
                      <input
                        type="number"
                        value={additionalQuantities[idx] || 0}
                        onChange={(e) => updateQuantity(idx, e.target.value)}
                        min="0"
                        max={remaining}
                        disabled={isCompleted}
                        className={`w-24 rounded-lg border px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-[#8bb56a] focus:border-transparent disabled:bg-gray-100 disabled:text-slate-400 ${
                          additionalQuantities[idx] > 0 ? 'border-[#8bb56a] bg-green-50' : 'border-gray-300'
                        }`}
                      />
                      {remaining > 0 && !isCompleted && <div className="text-xs text-slate-400 mt-1">max {remaining}</div>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Résumé */}
          <div className="mt-5 rounded-xl bg-green-50 p-4 border border-green-100">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-[#8bb56a]" />
                <span className="font-medium text-slate-700">Résumé de cette livraison</span>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-600">
                  Total à livrer maintenant : <strong className="text-[#8bb56a]">{totalNow}</strong> unités
                </p>
                {willBeFullyDelivered && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1 justify-end">
                    <CheckCircle size={12} /> Cette livraison sera complète après validation
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t bg-gray-50 px-6 py-4">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-gray-100 transition disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving || totalNow === 0 || loadingData || !selectedChauffeur || !selectedVehicule}
            className="flex items-center gap-2 rounded-lg bg-[#8bb56a] px-5 py-2 text-sm font-medium text-white hover:bg-[#7aa55a] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Enregistrer la livraison
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default LivraisonQuantityModal;