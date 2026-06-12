import React from "react";
import { FileText, Send, CheckCircle, DollarSign } from "lucide-react";

const FactureStats = ({ stats }) => {
  const cards = [
    { title: "Total", value: stats.total, icon: FileText, color: "blue" },
    { title: "Brouillon", value: stats.brouillon, icon: FileText, color: "gray" },
    { title: "Envoyée", value: stats.envoyee, icon: Send, color: "amber" },
    { title: "Payée", value: stats.payee, icon: CheckCircle, color: "green" },
  ];
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">{card.title}</p>
              <p className="text-2xl font-bold text-slate-800">{card.value}</p>
            </div>
            <div className={`rounded-full bg-${card.color}-100 p-3`}>
              <card.icon size={22} className={`text-${card.color}-600`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FactureStats;