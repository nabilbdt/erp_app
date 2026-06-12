// components/client/ClientStatsCards.jsx
import React from "react";
import { Users2, User, Building, Activity } from "lucide-react";

const StatCard = ({ title, value, icon: Icon, bgColor, textColor }) => (
  <div className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition-all hover:shadow-md dark:bg-slate-900 dark:ring-slate-800">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
        <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{value}</p>
      </div>
      <div className={`rounded-xl ${bgColor} p-3 transition-transform group-hover:scale-110`}>
        <Icon size={24} className={textColor} />
      </div>
    </div>
  </div>
);

const ClientStatsCards = ({ stats }) => {
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard 
        title="Total clients" 
        value={stats.total} 
        icon={Users2} 
        bgColor="bg-[#e2f0d6]" 
        textColor="text-[#5a7c3c]" 
      />
      <StatCard 
        title="Particuliers" 
        value={stats.particuliers} 
        icon={User} 
        bgColor="bg-blue-100" 
        textColor="text-blue-600" 
      />
      <StatCard 
        title="Entreprises" 
        value={stats.entreprises} 
        icon={Building} 
        bgColor="bg-purple-100" 
        textColor="text-purple-600" 
      />
      <StatCard 
        title="Clients actifs" 
        value={stats.actifs} 
        icon={Activity} 
        bgColor="bg-green-100" 
        textColor="text-green-600" 
      />
    </div>
  );
};

export default ClientStatsCards;