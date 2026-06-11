// modules/produit/produit.middleware.js

/**
 * 🔥 Middleware de normalisation du produit
 * - Nettoie les champs selon typeProduit
 * - Applique logique métier ERP
 */
export const normalizeProduit = (req, res, next) => {
  try {
    const produit = req.body;

    if (!produit.typeProduit) {
      return res.status(400).json({
        message: "typeProduit est obligatoire",
      });
    }

    switch (produit.typeProduit) {
      case "service":
        // ❌ pas de stock
        produit.stock = undefined;
        produit.stockMin = undefined;
        produit.emplacement = undefined;
        produit.poids = undefined;

        // ❌ pas de production
        produit.composantes = undefined;

        // ✅ service
        produit.dureeService = produit.dureeService || 1;
        break;

      case "Produit_Fini":
        // ✅ stock
        produit.stock = produit.stock ?? 0;
        produit.stockMin = produit.stockMin ?? 0;

        // ❌ pas de production
        produit.composantes = undefined;

        // ❌ pas service
        produit.dureeService = undefined;
        break;

      case "production":
        // ✅ stock
        produit.stock = produit.stock ?? 0;

        // ✅ composantes obligatoire (validé après)
        produit.composantes = produit.composantes || [];

        // ❌ service
        produit.dureeService = undefined;
        break;

      default:
        return res.status(400).json({
          message: "typeProduit invalide",
        });
    }

    next();
  } catch (error) {
    res.status(500).json({
      message: "Erreur middleware normalizeProduit",
      error: error.message,
    });
  }
};

/**
 * 🔥 Middleware de validation métier
 */
export const validateProduit = (req, res, next) => {
  try {
    const produit = req.body;

    // 🔹 Vérif champs de base
    if (!produit.reference || !produit.designation) {
      return res.status(400).json({
        message: "reference et designation sont obligatoires",
      });
    }

    if (produit.prixVente < 0) {
      return res.status(400).json({
        message: "prixVente invalide",
      });
    }

    // 🔥 VALIDATION PAR TYPE
    switch (produit.typeProduit) {
      case "service":
        if (produit.stock !== undefined) {
          return res.status(400).json({
            message: "Un service ne doit pas avoir de stock",
          });
        }
        break;

      case "vente":
        if (produit.stock < 0) {
          return res.status(400).json({
            message: "stock invalide",
          });
        }
        break;

      case "production":
        if (!produit.composantes || produit.composantes.length === 0) {
          return res.status(400).json({
            message:
              "Un produit de production doit contenir au moins une composante",
          });
        }

        // vérifier chaque composante
        for (const comp of produit.composantes) {
          if (!comp.produit || comp.quantite <= 0) {
            return res.status(400).json({
              message: "Composante invalide",
            });
          }
        }
        break;
    }

    next();
  } catch (error) {
    res.status(500).json({
      message: "Erreur middleware validateProduit",
      error: error.message,
    });
  }
};

