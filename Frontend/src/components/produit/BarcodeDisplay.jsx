// components/produit/BarcodeDisplay.js
import React, { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";

const BarcodeDisplay = ({ value, width = 2, height = 50 }) => {
  const barcodeRef = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (barcodeRef.current && value) {
      try {
        JsBarcode(barcodeRef.current, value, {
          format: "CODE128",
          lineColor: "#000000",
          width: width,
          height: height,
          displayValue: true,
          fontSize: 12,
          margin: 5,
        });
        setError(false);
      } catch (err) {
        console.error("Erreur génération code-barres:", err);
        setError(true);
      }
    }
  }, [value, width, height]);

  if (!value) {
    return (
      <div className="flex items-center justify-center p-4 bg-gray-100 rounded-lg">
        <span className="text-sm text-slate-400">Aucun code-barres</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-4 bg-red-50 rounded-lg">
        <span className="text-sm text-red-500">Erreur génération</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-3 bg-white rounded-lg border">
      <svg ref={barcodeRef}></svg>
      <p className="text-xs text-slate-500 mt-2 font-mono">{value}</p>
    </div>
  );
};

export default BarcodeDisplay;