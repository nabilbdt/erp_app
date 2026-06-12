// pages/BonCommandes.jsx
import React, { useState, useEffect } from 'react';
import {
  getBonCommandes,
  getBonCommandeById,
  createBonCommande,
  downloadBonCommandePDF,
  deleteBonCommande
} from '../services/bonCommande.service';
import {
  Plus,
  Eye,
  FileText,
  Trash2,
  Download,
  X,
  AlertCircle,
  CheckCircle,
  Send,
  Package,
  User,
  Calendar
} from 'lucide-react';

const BonCommandes = () => {
  const [bonCommandes, setBonCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBonCommande, setSelectedBonCommande] = useState(null);
  const [formData, setFormData] = useState({
    commande: '',
    client: '',
    statut: 'genere'
  });

  useEffect(() => {
    fetchBonCommandes();
  }, []);

  const fetchBonCommandes = async () => {
    try {
      setLoading(true);
      const data = await getBonCommandes();
      setBonCommandes(data);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des bons de commande');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (bonCommande = null) => {
    if (bonCommande) {
      setSelectedBonCommande(bonCommande);
      setFormData({
        commande: bonCommande.commande?._id || bonCommande.commande,
        client: bonCommande.client?._id || bonCommande.client,
        statut: bonCommande.statut
      });
    } else {
      setSelectedBonCommande(null);
      setFormData({
        commande: '',
        client: '',
        statut: 'genere'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedBonCommande(null);
    setFormData({
      commande: '',
      client: '',
      statut: 'genere'
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (!formData.commande) {
        setError('Veuillez sélectionner une commande');
        return;
      }

      await createBonCommande(formData);
      setSuccess('Bon de commande créé avec succès !');
      handleCloseModal();
      fetchBonCommandes();
      
      // Effacer le message de succès après 3 secondes
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Erreur lors de la création du bon de commande');
      console.error(err);
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce bon de commande ?')) {
      try {
        await deleteBonCommande(id);
        setSuccess('Bon de commande supprimé avec succès !');
        fetchBonCommandes();
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        setError('Erreur lors de la suppression');
        console.error(err);
        setTimeout(() => setError(null), 3000);
      }
    }
  };

  const handleViewDetails = async (id) => {
    try {
      const bonCommande = await getBonCommandeById(id);
      setSelectedBonCommande(bonCommande);
      setShowDetailsModal(true);
    } catch (err) {
      setError('Erreur lors du chargement des détails');
      console.error(err);
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDownloadPDF = async (id) => {
    try {
      await downloadBonCommandePDF(id);
      setSuccess('PDF téléchargé avec succès !');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Erreur lors du téléchargement du PDF');
      console.error(err);
      setTimeout(() => setError(null), 3000);
    }
  };

  const getStatusColor = (statut) => {
    const colors = {
      genere: 'bg-yellow-100 text-yellow-800',
      envoye: 'bg-green-100 text-green-800'
    };
    return colors[statut] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (statut) => {
    const labels = {
      genere: 'Généré',
      envoye: 'Envoyé'
    };
    return labels[statut] || statut;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bons de Commande</h1>
          <p className="text-gray-600 mt-1">Gérez tous vos bons de commande</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Nouveau Bon de Commande
        </button>
      </div>

      {/* Messages d'alerte */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 text-red-800">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <X size={20} />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2 text-green-800">
          <CheckCircle size={20} />
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="ml-auto">
            <X size={20} />
          </button>
        </div>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total</p>
              <p className="text-2xl font-bold text-gray-900">{bonCommandes.length}</p>
            </div>
            <FileText size={32} className="text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Générés</p>
              <p className="text-2xl font-bold text-yellow-600">
                {bonCommandes.filter(bc => bc.statut === 'genere').length}
              </p>
            </div>
            <FileText size={32} className="text-yellow-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Envoyés</p>
              <p className="text-2xl font-bold text-green-600">
                {bonCommandes.filter(bc => bc.statut === 'envoye').length}
              </p>
            </div>
            <Send size={32} className="text-green-500" />
          </div>
        </div>
      </div>

      {/* Tableau des bons de commande */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Référence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commande
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date d'émission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bonCommandes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    <Package size={48} className="mx-auto mb-2 text-gray-300" />
                    <p>Aucun bon de commande trouvé</p>
                    <button
                      onClick={() => handleOpenModal()}
                      className="mt-2 text-blue-600 hover:text-blue-800"
                    >
                      Créer le premier bon de commande
                    </button>
                  </td>
                </tr>
              ) : (
                bonCommandes.map((bonCommande) => (
                  <tr key={bonCommande._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {bonCommande.reference}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {bonCommande.commande?.reference || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {bonCommande.client?.nom || bonCommande.client?.email || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(bonCommande.statut)}`}>
                        {getStatusLabel(bonCommande.statut)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(bonCommande.dateEmission).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => handleViewDetails(bonCommande._id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Voir détails"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(bonCommande._id)}
                        className="text-green-600 hover:text-green-900"
                        title="Télécharger PDF"
                      >
                        <Download size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(bonCommande._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Supprimer"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
           </table>
        </div>
      </div>

      {/* Modal de création */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold">Nouveau Bon de Commande</h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID de la Commande *
                </label>
                <input
                  type="text"
                  name="commande"
                  value={formData.commande}
                  onChange={handleInputChange}
                  placeholder="Entrez l'ID de la commande"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Entrez l'ID de la commande associée
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID du Client (optionnel)
                </label>
                <input
                  type="text"
                  name="client"
                  value={formData.client}
                  onChange={handleInputChange}
                  placeholder="Entrez l'ID du client"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut
                </label>
                <select
                  name="statut"
                  value={formData.statut}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="genere">Généré</option>
                  <option value="envoye">Envoyé</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal des détails */}
      {showDetailsModal && selectedBonCommande && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold">Détails du Bon de Commande</h2>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* En-tête avec référence */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-blue-600">Référence</p>
                    <p className="text-2xl font-bold text-blue-900">{selectedBonCommande.reference}</p>
                  </div>
                  <FileText size={48} className="text-blue-500" />
                </div>
              </div>

              {/* Informations principales */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <Package size={20} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Commande associée</p>
                    <p className="font-medium">{selectedBonCommande.commande?.reference || 'N/A'}</p>
                    {selectedBonCommande.commande && (
                      <p className="text-sm text-gray-500">
                        Montant: {selectedBonCommande.commande.montantTotal?.toLocaleString()} FCFA
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <User size={20} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Client</p>
                    <p className="font-medium">{selectedBonCommande.client?.nom || 'Non spécifié'}</p>
                    {selectedBonCommande.client?.email && (
                      <p className="text-sm text-gray-500">{selectedBonCommande.client.email}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Calendar size={20} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Date d'émission</p>
                    <p className="font-medium">
                      {new Date(selectedBonCommande.dateEmission).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(selectedBonCommande.dateEmission).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div>
                    <p className="text-sm text-gray-600">Statut</p>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(selectedBonCommande.statut)}`}>
                      {getStatusLabel(selectedBonCommande.statut)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Fichier PDF */}
              {selectedBonCommande.fichierPDF && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-2">Fichier PDF</p>
                  <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText size={20} className="text-red-500" />
                      <span className="text-sm">{selectedBonCommande.fichierPDF}</span>
                    </div>
                    <button
                      onClick={() => handleDownloadPDF(selectedBonCommande._id)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Download size={18} />
                    </button>
                  </div>
                </div>
              )}

              {/* Dates de création/modification */}
              <div className="border-t pt-4 text-xs text-gray-500">
                <p>Créé le : {new Date(selectedBonCommande.createdAt).toLocaleString()}</p>
                <p>Modifié le : {new Date(selectedBonCommande.updatedAt).toLocaleString()}</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  handleDownloadPDF(selectedBonCommande._id);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Download size={18} />
                Télécharger PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BonCommandes;