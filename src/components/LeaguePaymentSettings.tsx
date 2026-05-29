import React, { useState, useEffect } from 'react';
import { League, MatchPhase } from '../types';
import { Landmark, Save, DollarSign, User, FileText, Mail, CheckCircle, Sparkles, Plus, Trash2, Settings, HelpCircle } from 'lucide-react';

interface LeaguePaymentSettingsProps {
  league: League;
  onSaveSettings: (
    bankConfig: League['bankConfig'], 
    costPerEntry: number, 
    gameMode?: League['gameMode'], 
    customGroups?: League['customGroups'],
    poolDistributionMode?: League['poolDistributionMode']
  ) => Promise<void>;
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

const PHASE_LABELS: Record<MatchPhase, string> = {
  group: 'Fase de Grupos',
  dieciseisavos: 'Dieciseisavos',
  octavos: 'Octavos de Final',
  cuartos: 'Cuartos de Final',
  semifinal: 'Semifinal',
  final: 'Final de la Copa'
};

export default function LeaguePaymentSettings({ league, onSaveSettings }: LeaguePaymentSettingsProps) {
  // Bank settings states
  const [bankName, setBankName] = useState(league.bankConfig?.bankName || ECUADOR_BANKS[0]);
  const [accountType, setAccountType] = useState<League['bankConfig']['accountType']>(league.bankConfig?.accountType || 'ahorros');
  const [accountNumber, setAccountNumber] = useState(league.bankConfig?.accountNumber || '');
  const [ownerName, setOwnerName] = useState(league.bankConfig?.ownerName || '');
  const [ownerId, setOwnerId] = useState(league.bankConfig?.ownerId || '');
  const [ownerEmail, setOwnerEmail] = useState(league.bankConfig?.ownerEmail || '');
  const [costPerEntry, setCostPerEntry] = useState<number>(league.costPerEntry || 5);
  
  // Game Mode States
  const [gameMode, setGameMode] = useState<League['gameMode']>(league.gameMode || 'total');
  const [customGroups, setCustomGroups] = useState<League['customGroups']>(league.customGroups || []);
  const [poolDistributionMode, setPoolDistributionMode] = useState<League['poolDistributionMode']>(league.poolDistributionMode || 'proportional');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupPhases, setNewGroupPhases] = useState<MatchPhase[]>([]);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Sync state with props when league changes
  useEffect(() => {
    setBankName(league.bankConfig?.bankName || ECUADOR_BANKS[0]);
    setAccountType(league.bankConfig?.accountType || 'ahorros');
    setAccountNumber(league.bankConfig?.accountNumber || '');
    setOwnerName(league.bankConfig?.ownerName || '');
    setOwnerId(league.bankConfig?.ownerId || '');
    setOwnerEmail(league.bankConfig?.ownerEmail || '');
    setCostPerEntry(league.costPerEntry || 5);
    setGameMode(league.gameMode || 'total');
    setCustomGroups(league.customGroups || []);
    setPoolDistributionMode(league.poolDistributionMode || 'proportional');
  }, [league]);

  const autoSaveGameMode = async (
    newMode: League['gameMode'], 
    newGroups: League['customGroups'], 
    newDistMode?: League['poolDistributionMode']
  ) => {
    setAutoSaveStatus('saving');
    try {
      const config = league.bankConfig || {
        bankName: ECUADOR_BANKS[0],
        accountType: 'ahorros',
        accountNumber: '',
        ownerName: '',
        ownerId: ''
      };
      const cost = league.costPerEntry || 5;
      await onSaveSettings(config, cost, newMode, newGroups, newDistMode || poolDistributionMode);
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Error auto-saving game mode:', err);
      setAutoSaveStatus('error');
    }
  };

  const handleGameModeChange = (mode: League['gameMode']) => {
    setGameMode(mode);
    autoSaveGameMode(mode, customGroups, poolDistributionMode);
  };

  const handleDistributionModeChange = (mode: League['poolDistributionMode']) => {
    setPoolDistributionMode(mode);
    autoSaveGameMode(gameMode, customGroups, mode);
  };

  const handleToggleNewGroupPhase = (phase: MatchPhase) => {
    setNewGroupPhases(prev => 
      prev.includes(phase) ? prev.filter(p => p !== phase) : [...prev, phase]
    );
  };

  const handleAddCustomGroup = () => {
    if (!newGroupName.trim() || newGroupPhases.length === 0) return;
    const newGroup = {
      id: `group_${Date.now()}`,
      name: newGroupName.trim(),
      phases: [...newGroupPhases]
    };
    const updated = [...(customGroups || []), newGroup];
    setCustomGroups(updated);
    setNewGroupName('');
    setNewGroupPhases([]);
    autoSaveGameMode(gameMode, updated, poolDistributionMode);
  };

  const handleRemoveCustomGroup = (id: string) => {
    const updated = (customGroups || []).filter(g => g.id !== id);
    setCustomGroups(updated);
    autoSaveGameMode(gameMode, updated, poolDistributionMode);
  };

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

      await onSaveSettings(config, Number(costPerEntry), gameMode, customGroups, poolDistributionMode);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-8 max-w-2xl mx-auto shadow-xs animate-fadeIn" id="league-payment-settings-root">
      {/* SECTION 1: GAME MODE */}
      <div className="space-y-4">        <div className="flex justify-between items-start gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 font-sans select-none">
              <Settings className="w-5 h-5 text-indigo-600 animate-spin-slow" />
              Configuración de Modo de Juego
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Elige cómo competirán los miembros de tu liga en la tabla de posiciones y la distribución del acumulado.
            </p>
          </div>
          {/* Auto-save Indicator Badge */}
          {autoSaveStatus !== 'idle' && (
            <div className={`px-2 py-1 rounded-lg text-[9px] font-bold flex items-center gap-1 shadow-xs animate-fadeIn select-none shrink-0 ${
              autoSaveStatus === 'saving'
                ? 'bg-amber-50 border border-amber-100 text-amber-700'
                : autoSaveStatus === 'saved'
                ? 'bg-emerald-50 border border-emerald-100 text-emerald-700'
                : 'bg-red-50 border border-red-100 text-red-700'
            }`}>
              {autoSaveStatus === 'saving' && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              )}
              {autoSaveStatus === 'saved' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              )}
              {autoSaveStatus === 'saving' ? 'Guardando...' : autoSaveStatus === 'saved' ? '¡Guardado!' : 'Error'}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Total Mode Option */}
          <button
            type="button"
            onClick={() => handleGameModeChange('total')}
            className={`p-4 border rounded-xl flex flex-col items-start gap-2.5 text-left transition-all cursor-pointer active:scale-98 ${
              gameMode === 'total'
                ? 'border-indigo-500 bg-indigo-50/30 ring-1 ring-indigo-500'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/20'
            }`}
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-100 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xs">
              🏆
            </div>
            <div>
              <span className="text-xs font-black text-slate-800 block">Modo Total (Acumulado)</span>
              <span className="text-[10px] text-slate-500 leading-relaxed block mt-1">
                Los puntos se acumulan a lo largo de todo el torneo. Un único pozo de premios final.
              </span>
            </div>
          </button>

          {/* Sectional Mode Option */}
          <button
            type="button"
            onClick={() => handleGameModeChange('sectional')}
            className={`p-4 border rounded-xl flex flex-col items-start gap-2.5 text-left transition-all cursor-pointer active:scale-98 ${
              gameMode === 'sectional'
                ? 'border-indigo-500 bg-indigo-50/30 ring-1 ring-indigo-500'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/20'
            }`}
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold text-xs">
              🔄
            </div>
            <div>
              <span className="text-xs font-black text-slate-800 block">Modo Seccional (Por Fase)</span>
              <span className="text-[10px] text-slate-500 leading-relaxed block mt-1">
                Los puntos se reinician en cada fase. Cada fase del torneo funciona como un pozo independiente.
              </span>
            </div>
          </button>

          {/* Custom Mode Option */}
          <button
            type="button"
            onClick={() => handleGameModeChange('custom')}
            className={`p-4 border rounded-xl flex flex-col items-start gap-2.5 text-left transition-all cursor-pointer active:scale-98 ${
              gameMode === 'custom'
                ? 'border-indigo-500 bg-indigo-50/30 ring-1 ring-indigo-500'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/20'
            }`}
          >
            <div className="w-7 h-7 rounded-lg bg-purple-100 border border-purple-200 text-purple-700 flex items-center justify-center font-bold text-xs">
              🧩
            </div>
            <div>
              <span className="text-xs font-black text-slate-800 block">Modo Elección (Grupos)</span>
              <span className="text-[10px] text-slate-500 leading-relaxed block mt-1">
                Agrupa las fases que desees en pozos de premios personalizados (ej: Grupos + 16avos juntos).
              </span>
            </div>
          </button>
        </div>

        {/* Pool Distribution Mode Selector (Only shown if sectional or custom mode is selected) */}
        {gameMode !== 'total' && (
          <div className="border border-indigo-100 bg-indigo-50/10 rounded-xl p-4 space-y-3.5 animate-fadeIn">
            <div>
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 select-none">
                <DollarSign className="w-4 h-4 text-indigo-600" />
                Modelo de Distribución del Pozo de Premios
              </span>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Define cómo se financia y reparte el dinero de las inscripciones entre los diferentes pozos en juego.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Proportional Option */}
              <button
                type="button"
                onClick={() => handleDistributionModeChange('proportional')}
                className={`p-3 border rounded-xl flex items-start gap-2.5 text-left transition-all cursor-pointer active:scale-98 ${
                  poolDistributionMode === 'proportional'
                    ? 'border-indigo-500 bg-indigo-50/20 ring-1 ring-indigo-500'
                    : 'border-slate-205 border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1 shrink-0" />
                <div>
                  <span className="text-[11px] font-black text-slate-800 block">Dividir Pozo (Aporte Único)</span>
                  <span className="text-[9px] text-slate-500 leading-normal block mt-0.5">
                    El pozo inicial se divide entre las fases (ej: pozo total $70 / 3 fases = $23.33 cada una).
                  </span>
                </div>
              </button>

              {/* Full Option */}
              <button
                type="button"
                onClick={() => handleDistributionModeChange('full')}
                className={`p-3 border rounded-xl flex items-start gap-2.5 text-left transition-all cursor-pointer active:scale-98 ${
                  poolDistributionMode === 'full'
                    ? 'border-indigo-500 bg-indigo-50/20 ring-1 ring-indigo-500'
                    : 'border-slate-205 border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1 shrink-0" />
                <div>
                  <span className="text-[11px] font-black text-slate-800 block">Pozo Completo por Fase (Aportes Separados)</span>
                  <span className="text-[9px] text-slate-500 leading-normal block mt-0.5">
                    Cada fase tiene su propio pozo de premios completo (ej: $70 para grupos, $70 para octavos, etc.).
                  </span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Custom Mode Creator UI */}
        {gameMode === 'custom' && (
          <div className="border border-purple-100 bg-purple-50/20 rounded-xl p-4 space-y-4 animate-fadeIn">
            <div className="flex items-center gap-1.5 text-purple-900 font-bold text-xs select-none">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Pozos de Premios Personalizados</span>
            </div>

            {/* List existing custom groups */}
            {customGroups.length > 0 ? (
              <div className="space-y-2">
                {customGroups.map(group => (
                  <div key={group.id} className="flex justify-between items-center bg-white border border-purple-100 rounded-xl p-3 shadow-xs">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">{group.name}</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {group.phases.map(p => (
                          <span key={p} className="px-1.5 py-0.5 bg-purple-50 border border-purple-100 text-purple-700 text-[9px] font-bold rounded-md font-sans">
                            {PHASE_LABELS[p]}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomGroup(group.id)}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 bg-white/40 border border-dashed border-purple-200/50 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400">Aún no has creado pozos personalizados. ¡Crea el primero abajo!</span>
              </div>
            )}

            {/* New Group form */}
            <div className="bg-white border border-purple-100 rounded-xl p-4 space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Nombre del Pozo de Premios</label>
                <input
                  type="text"
                  placeholder="Ej: Fase de Grupos + Dieciseisavos"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-400 rounded-lg py-1.5 px-3 text-xs text-slate-800 focus:outline-none transition-all font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Seleccionar fases del torneo para este pozo</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(PHASE_LABELS) as MatchPhase[]).map(phase => {
                    const isChecked = newGroupPhases.includes(phase);
                    return (
                      <button
                        type="button"
                        key={phase}
                        onClick={() => handleToggleNewGroupPhase(phase)}
                        className={`px-3 py-2 text-left border rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-between ${
                          isChecked
                            ? 'bg-purple-50 border-purple-300 text-purple-700'
                            : 'bg-slate-50 border-slate-250 border-slate-150 text-slate-650 hover:bg-slate-100/50'
                        }`}
                      >
                        <span>{PHASE_LABELS[phase]}</span>
                        {isChecked && <span className="text-purple-600 font-black">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddCustomGroup}
                disabled={!newGroupName.trim() || newGroupPhases.length === 0}
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Crear Pozo Personalizado
              </button>
            </div>
          </div>
        )}
      </div>

      <hr className="border-slate-100" />

      {/* SECTION 2: BANK CONFIG */}
      <div className="space-y-4">
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
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs font-semibold animate-fadeIn select-none">
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
    </div>
  );
}
