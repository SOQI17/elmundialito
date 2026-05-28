import React, { useState } from 'react';
import { League } from '../types';
import { Landmark, Save, DollarSign, User, FileText, Mail, CheckCircle } from 'lucide-react';

interface LeaguePaymentSettingsProps {
  league: League;
  onSaveSettings: (bankConfig: League['bankConfig'], costPerEntry: number) => Promise<void>;
}

const ECUADOR_BANKS = [
  'Banco Pichincha',
  'Banco Guayaquil',
  'Produbanco',
  'Banco del Pacífico',
  'Banco Bolivariano',
  'Banco Internacional',
  'Cooperativa JEP',
  'Cooperativa Alianza del Valle',
  'Banco del Austro'
];

export default function LeaguePaymentSettings({ league, onSaveSettings }: LeaguePaymentSettingsProps) {
  const [bankName, setBankName] = useState(league.bankConfig?.bankName || ECUADOR_BANKS[0]);
  const [accountType, setAccountType] = useState<League['bankConfig']['accountType']>(league.bankConfig?.accountType || 'ahorros');
  const [accountNumber, setAccountNumber] = useState(league.bankConfig?.accountNumber || '');
  const [ownerName, setOwnerName] = useState(league.bankConfig?.ownerName || '');
  const [ownerId, setOwnerId] = useState(league.bankConfig?.ownerId || '');
  const [ownerEmail, setOwnerEmail] = useState(league.bankConfig?.ownerEmail || '');
  const [costPerEntry, setCostPerEntry] = useState<number>(league.costPerEntry || 5);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNumber.trim() || !ownerName.trim() || !ownerId.trim()) return;

    setLoading(true);
    setSuccess(false);

    try {
      const config = {
        bankName,
        accountType,
        accountNumber: accountNumber.trim(),
        ownerName: ownerName.trim(),
        ownerId: ownerId.trim(),
        ownerEmail: ownerEmail.trim() || undefined
      };

      await onSaveSettings(config, Number(costPerEntry));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-6 max-w-2xl mx-auto shadow-xs" id="league-payment-settings-root">
      <div>
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 font-sans select-none">
          <Landmark className="w-5 h-5 text-indigo-650 text-indigo-650" />
          Configuración Bancaria y Costos de Cobro
        </h3>
        <p className="text-[11px] text-slate-500 mt-1">
          Define o edita los datos bancarios de tu cuenta en Ecuador. Todos los miembros de tu liga te transferirán a estos datos para pagar su inscripción.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Cost per Entry */}
        <div className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <label className="text-xs font-black text-indigo-950 block select-none">
              Monto de Inscripción por Usuario ($)
            </label>
            <span className="text-[10px] text-indigo-500 font-semibold block mt-0.5">
              Costo en dólares para que el usuario pueda competir y guardar pronósticos.
            </span>
          </div>
          <div className="relative w-full sm:w-32 shrink-0">
            <DollarSign className="w-4 h-4 text-indigo-600 absolute left-3 top-2.5" />
            <input
              type="number"
              min="1"
              value={costPerEntry}
              onChange={(e) => setCostPerEntry(Math.max(1, parseInt(e.target.value, 10)))}
              className="w-full bg-white border border-indigo-200 rounded-xl pl-8 pr-3 py-1.5 font-bold font-mono text-xs text-indigo-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>
        </div>

        {/* Bank Form Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Bank selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block select-none">Banco Receptor</label>
            <select
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
            >
              {ECUADOR_BANKS.map(bank => (
                <option key={bank} value={bank}>{bank}</option>
              ))}
            </select>
          </div>

          {/* Account type */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block select-none">Tipo de Cuenta</label>
            <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 select-none">
              <button
                type="button"
                onClick={() => setAccountType('ahorros')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  accountType === 'ahorros' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Ahorros
              </button>
              <button
                type="button"
                onClick={() => setAccountType('corriente')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  accountType === 'corriente' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Corriente
              </button>
            </div>
          </div>

          {/* Account number */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block select-none">Número de Cuenta</label>
            <div className="relative">
              <Landmark className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                placeholder="Escribe el número de cuenta"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2 pl-10 pr-3 text-xs text-slate-800 focus:outline-none transition-all font-mono font-bold"
                required
              />
            </div>
          </div>

          {/* Owner Name */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block select-none">Titular de la Cuenta</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                placeholder="Ej: Alexis Guerra"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2 pl-10 pr-3 text-xs text-slate-800 focus:outline-none transition-all font-medium"
                required
              />
            </div>
          </div>

          {/* Owner ID (Cédula o RUC) */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block select-none">Cédula o RUC</label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                placeholder="Ej: 1726543210"
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2 pl-10 pr-3 text-xs text-slate-800 focus:outline-none transition-all font-mono font-bold"
                maxLength={13}
                required
              />
            </div>
          </div>

          {/* Owner Email */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block select-none">Correo de Confirmación (Opcional)</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="email"
                placeholder="ejemplo@correo.com"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2 pl-10 pr-3 text-xs text-slate-800 focus:outline-none transition-all font-medium"
              />
            </div>
          </div>
        </div>

        {/* Save button and status message */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
          {success ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-250 border-emerald-100 rounded-xl text-emerald-800 text-xs font-semibold animate-fadeIn select-none">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ¡Datos guardados y actualizados con éxito!
            </div>
          ) : (
            <span className="text-[9px] text-slate-400 font-semibold leading-normal">
              *Asegúrate de ingresar datos reales de transferencia de Ecuador para evitar reclamos en tu polla.
            </span>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Guardando...' : 'Guardar y Publicar Datos'}
          </button>
        </div>
      </form>
    </div>
  );
}
