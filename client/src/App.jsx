import React, { useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { formatCurrency, formatDate } from './utils/formatters';
import { getWhatsAppLink } from './utils/phone';

function App() {
  const [testAmount] = useState(15000);
  const [testDate] = useState(new Date());

  const handleTestToast = () => {
    toast.success('ShopLedger Frontend System Operational!');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6">
      <Toaster position="top-right" />
      
      <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-indigo-500/30">
            S
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">ShopLedger</h1>
            <p className="text-xs text-indigo-400 font-medium tracking-wide uppercase">Day 2 Frontend Verification</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50">
            <span className="text-xs text-slate-400 block mb-1">Formatted Currency Test</span>
            <span className="text-lg font-bold text-emerald-400">{formatCurrency(testAmount)}</span>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50">
            <span className="text-xs text-slate-400 block mb-1">Formatted Date Test</span>
            <span className="text-lg font-semibold text-indigo-300">{formatDate(testDate)}</span>
          </div>
        </div>

        <div className="pt-2 flex flex-col space-y-3">
          <button
            onClick={handleTestToast}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98] cursor-pointer"
          >
            Trigger Hot Toast Notification
          </button>

          <a
            href={getWhatsAppLink('03001234567', 'Hello ShopLedger Support')}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-semibold rounded-xl text-center transition-all cursor-pointer"
          >
            Test WhatsApp Utility Link
          </a>
        </div>
      </div>
    </div>
  );
}

export default App;
