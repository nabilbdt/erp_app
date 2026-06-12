import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Save, User, Package, CheckCircle } from 'lucide-react';

const steps = ['Client', 'Produits & quantités', 'Récapitulatif'];

const LivraisonFormStepper = ({
  formData,
  onInputChange,
  onSubmit,
  onClose,
  isSubmitting,
  editingLivraison,
  clients,
  produits,
}) => {
  const [activeStep, setActiveStep] = useState(0);

  const handleNext = () => setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  const handleBack = () => setActiveStep((prev) => Math.max(prev - 1, 0));

  const handleAddProduct = () => {
    const newProducts = [...(formData.produits || [])];
    newProducts.push({ produit: '', quantiteCommandee: 1, quantiteLivree: 0 });
    onInputChange('produits', newProducts);
  };

  const handleRemoveProduct = (index) => {
    const newProducts = [...(formData.produits || [])];
    newProducts.splice(index, 1);
    onInputChange('produits', newProducts);
  };

  const handleProductChange = (index, field, value) => {
    const newProducts = [...(formData.produits || [])];
    const qtyCmd = field === 'quantiteCommandee' ? parseInt(value, 10) : newProducts[index].quantiteCommandee;
    let qtyLiv = field === 'quantiteLivree' ? parseInt(value, 10) : newProducts[index].quantiteLivree;
    qtyLiv = Math.min(qtyLiv, qtyCmd);
    newProducts[index] = {
      ...newProducts[index],
      [field]: field === 'quantiteCommandee' ? qtyCmd : field === 'quantiteLivree' ? qtyLiv : value,
    };
    onInputChange('produits', newProducts);
  };

  const isStepValid = () => {
    if (activeStep === 0) return !!formData.client;
    if (activeStep === 1) {
      const products = formData.produits || [];
      return products.length > 0 && products.every(p => p.produit && p.quantiteCommandee > 0);
    }
    return true;
  };

  const getSelectedClient = () => clients.find(c => c._id === formData.client);
  const getProductDetails = (prodId) => produits.find(p => p._id === prodId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-5 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {editingLivraison ? 'Modifier la livraison' : 'Nouvelle livraison'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">Renseignez les informations</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition">
            <X size={20} />
          </button>
        </div>

        {/* Steps */}
        <div className="flex border-b px-6 pt-4">
          {steps.map((label, idx) => (
            <div
              key={idx}
              className={`pb-3 mr-6 cursor-pointer text-sm font-medium transition ${
                idx === activeStep
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveStep(idx)}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeStep === 0 && (
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-700">Client *</label>
              <select
                value={formData.client || ''}
                onChange={(e) => onInputChange('client', e.target.value)}
                className="w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-300"
              >
                <option value="">Sélectionner un client</option>
                {clients.map(c => (
                  <option key={c._id} value={c._id}>{c.nom || c.raisonSociale}</option>
                ))}
              </select>
            </div>
          )}

          {activeStep === 1 && (
            <div className="space-y-5">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Produits commandés</h3>
                <button
                  type="button"
                  onClick={handleAddProduct}
                  className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-full hover:bg-blue-100"
                >
                  + Ajouter un produit
                </button>
              </div>
              {(formData.produits || []).map((prod, idx) => {
                const prodDetail = getProductDetails(prod.produit);
                return (
                  <div key={idx} className="border rounded-xl p-4 bg-gray-50 relative">
                    <button
                      onClick={() => handleRemoveProduct(idx)}
                      className="absolute top-3 right-3 text-red-400 hover:text-red-600"
                    >
                      <X size={16} />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Produit *</label>
                        <select
                          value={prod.produit}
                          onChange={(e) => handleProductChange(idx, 'produit', e.target.value)}
                          className="w-full border rounded-lg px-3 py-2 text-sm"
                        >
                          <option value="">Choisir</option>
                          {produits.map(p => (
                            <option key={p._id} value={p._id}>{p.nom || p.designation}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Qté commandée *</label>
                        <input
                          type="number"
                          min="1"
                          value={prod.quantiteCommandee || ''}
                          onChange={(e) => handleProductChange(idx, 'quantiteCommandee', e.target.value)}
                          className="w-full border rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Qté livrée</label>
                        <input
                          type="number"
                          min="0"
                          max={prod.quantiteCommandee || 0}
                          value={prod.quantiteLivree || 0}
                          onChange={(e) => handleProductChange(idx, 'quantiteLivree', e.target.value)}
                          className="w-full border rounded-lg px-3 py-2 text-sm"
                        />
                        <p className="text-xs text-gray-400 mt-1">max {prod.quantiteCommandee || 0}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {(!formData.produits || formData.produits.length === 0) && (
                <p className="text-center text-gray-400 py-6">Aucun produit. Cliquez sur "Ajouter"</p>
              )}
            </div>
          )}

          {activeStep === 2 && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold flex items-center gap-2"><User size={18} /> Client</h3>
                <p className="mt-1 text-gray-700">{getSelectedClient()?.nom || getSelectedClient()?.raisonSociale || 'Non renseigné'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold flex items-center gap-2"><Package size={18} /> Produits</h3>
                <ul className="mt-2 divide-y">
                  {(formData.produits || []).map((p, idx) => {
                    const prodDetail = getProductDetails(p.produit);
                    return (
                      <li key={idx} className="py-2 flex justify-between text-sm">
                        <span>{prodDetail?.nom || prodDetail?.designation || 'Produit'}</span>
                        <span>Cmd: {p.quantiteCommandee} / Liv: {p.quantiteLivree || 0}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between gap-3 p-5 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-xl hover:bg-gray-100 transition"
          >
            Annuler
          </button>
          <div className="flex gap-3">
            {activeStep > 0 && (
              <button
                onClick={handleBack}
                className="px-4 py-2 border rounded-xl hover:bg-gray-100 flex items-center gap-1"
              >
                <ChevronLeft size={16} /> Retour
              </button>
            )}
            {activeStep < steps.length - 1 ? (
              <button
                onClick={handleNext}
                disabled={!isStepValid()}
                className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
              >
                Suivant <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={onSubmit}
                disabled={isSubmitting || !isStepValid()}
                className="px-5 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
                {editingLivraison ? 'Mettre à jour' : 'Créer'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LivraisonFormStepper;