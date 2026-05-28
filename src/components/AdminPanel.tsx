import React, { useState } from 'react';
import { Match, MatchPhase } from '../types';
import { Settings, Save, RefreshCw, AlertTriangle, Play, CheckCircle, Globe, Wifi, Check, Sparkles, Loader2, Link2, AlertCircle } from 'lucide-react';
import TeamFlag from './TeamFlag';

interface AdminPanelProps {
  matches: Match[];
  onUpdateMatchResult: (matchId: string, homeScore: number | undefined, awayScore: number | undefined, status: Match['status']) => void;
  onResetAllData: () => void;
}

export default function AdminPanel({
  matches,
  onUpdateMatchResult,
  onResetAllData
}: AdminPanelProps) {
  const [editingScores, setEditingScores] = useState<Record<string, { home: number; away: number; status: Match['status'] }>>({});
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState<string>('');
  const [customFeedUrl, setCustomFeedUrl] = useState<string>('https://worldcupjson.net/matches');
  const [showAdvancedSync, setShowAdvancedSync] = useState<boolean>(false);

  const handleSyncFromInternet = async (isSimulation: boolean = false) => {
    setSyncStatus('syncing');
    setSyncMessage(isSimulation ? 'Obteniendo feed de red simulado...' : 'Conectando con la API de internet...');

    try {
      let apiMatches: any[] = [];

      if (isSimulation) {
        // Simular retardo de red
        await new Promise(resolve => setTimeout(resolve, 1500));
        // Crear algunos partidos simulados con resultados reales para los dos primeros días del mundial
        apiMatches = [
          {
            home_team: { code: 'MEX', country: 'México', goals: 2 },
            away_team: { code: 'RSA', country: 'Sudáfrica', goals: 1 },
            status: 'completed',
            datetime: '2026-06-11T19:00:00Z'
          },
          {
            home_team: { code: 'KOR', country: 'Corea del Sur', goals: 0 },
            away_team: { code: 'CZE', country: 'República Checa', goals: 3 },
            status: 'completed',
            datetime: '2026-06-12T02:00:00Z'
          },
          {
            home_team: { code: 'CAN', country: 'Canadá', goals: 1 },
            away_team: { code: 'BIH', country: 'Bosnia y H.', goals: 1 },
            status: 'in_progress',
            datetime: '2026-06-12T19:00:00Z'
          }
        ];
      } else {
        // Usar un proxy de CORS público y confiable para evitar errores CORS en el navegador
        const proxiedUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(customFeedUrl)}`;
        const res = await fetch(proxiedUrl);
        if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
        apiMatches = await res.json();
      }

      if (!Array.isArray(apiMatches)) {
        throw new Error('El formato del JSON recibido no es un array válido de partidos.');
      }

      let updatedCount = 0;

      for (const apiM of apiMatches) {
        // Encontrar partido coincidente en local
        const localMatch = matches.find(m => {
          const homeCode = apiM.home_team?.code;
          const awayCode = apiM.away_team?.code;
          if (!homeCode || !awayCode) return false;
          
          return (m.homeTeam.id === homeCode && m.awayTeam.id === awayCode) ||
                 (m.homeTeam.name.toLowerCase() === apiM.home_team?.country?.toLowerCase() &&
                  m.awayTeam.name.toLowerCase() === apiM.away_team?.country?.toLowerCase());
        });

        if (localMatch) {
          // Mapear estado
          let mappedStatus: Match['status'] = 'scheduled';
          if (apiM.status === 'completed' || apiM.status === 'finished') {
            mappedStatus = 'finished';
          } else if (apiM.status === 'in_progress' || apiM.status === 'live' || apiM.status === 'active') {
            mappedStatus = 'live';
          }

          const apiHomeScore = apiM.home_team?.goals;
          const apiAwayScore = apiM.away_team?.goals;

          const scoreChanged = localMatch.homeScore !== apiHomeScore || localMatch.awayScore !== apiAwayScore;
          const statusChanged = localMatch.status !== mappedStatus;

          if (scoreChanged || statusChanged) {
            await onUpdateMatchResult(
              localMatch.id,
              apiHomeScore !== undefined ? Number(apiHomeScore) : undefined,
              apiAwayScore !== undefined ? Number(apiAwayScore) : undefined,
              mappedStatus
            );
            updatedCount++;
          }
        }
      }

      setSyncStatus('success');
      setSyncMessage(
        isSimulation
          ? `¡Simulación completada! Se actualizaron ${updatedCount} partidos en tiempo real en la base de datos.`
          : `Sincronización exitosa. Se procesaron ${apiMatches.length} partidos y se actualizaron marcadores de ${updatedCount} partidos en Firestore.`
      );

      setTimeout(() => {
        setSyncStatus('idle');
        setSyncMessage('');
      }, 6000);

    } catch (err: any) {
      console.error(err);
      setSyncStatus('error');
      setSyncMessage(`Error de red o CORS: ${err.message || 'No se pudo conectar al servidor de destino.'}`);
    }
  };

  const handleLocalScoreChange = (matchId: string, team: 'home' | 'away', value: string, currentMatch: Match) => {
    const numericVal = value === '' ? 0 : Math.max(0, parseInt(value, 10));
    
    // Si el estado actual es 'scheduled' (programado), al editar goles lo cambiamos automáticamente a 'finished' para evitar errores y simplificar la experiencia.
    const currentEdit = editingScores[matchId] || {
      home: currentMatch.homeScore !== undefined ? currentMatch.homeScore : 0,
      away: currentMatch.awayScore !== undefined ? currentMatch.awayScore : 0,
      status: currentMatch.status === 'scheduled' ? 'finished' : currentMatch.status
    };

    const nextStatus = currentEdit.status === 'scheduled' ? 'finished' : currentEdit.status;

    setEditingScores({
      ...editingScores,
      [matchId]: {
        ...currentEdit,
        [team]: numericVal,
        status: nextStatus
      }
    });
  };

  const handleStatusChange = (matchId: string, status: Match['status'], currentMatch: Match) => {
    const currentEdit = editingScores[matchId] || {
      home: currentMatch.homeScore !== undefined ? currentMatch.homeScore : 0,
      away: currentMatch.awayScore !== undefined ? currentMatch.awayScore : 0,
      status: currentMatch.status
    };

    setEditingScores({
      ...editingScores,
      [matchId]: {
        ...currentEdit,
        status: status
      }
    });
  };

  const handleSaveResult = (matchId: string, currentMatch: Match) => {
    const edit = editingScores[matchId];
    if (edit) {
      onUpdateMatchResult(matchId, edit.home, edit.away, edit.status);
    } else {
      // Si no ha editado valores directamente pero hace clic, guardar con actuales
      onUpdateMatchResult(
        matchId, 
        currentMatch.homeScore !== undefined ? currentMatch.homeScore : 0, 
        currentMatch.awayScore !== undefined ? currentMatch.awayScore : 0, 
        currentMatch.status
      );
    }
    
    // Quitar del estado local de edición activa para confirmar cambios visuales
    const copy = { ...editingScores };
    delete copy[matchId];
    setEditingScores(copy);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6" id="admin-panel-root-container">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 font-sans">
            <Settings className="w-5 h-5 text-indigo-600" />
            Consola del Administrador (Organizador)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Introduce resultados reales de los partidos para evaluar los pronósticos y actualizar la clasificación.
          </p>
        </div>

        <button
          id="btn-factory-reset"
          onClick={() => {
            if (window.confirm('¿Seguro que deseas restablecer los datos originales de la demostración? Perderás tus pronósticos actuales.')) {
              onResetAllData();
              setEditingScores({});
            }
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-105 text-rose-700 hover:bg-rose-100 text-xs font-bold rounded-xl border border-rose-200/50 transition-all self-start cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Restablecer Todo
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-xs text-amber-800 leading-relaxed font-medium">
        <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
        <div>
          <strong className="block font-bold">Instrucciones de Simulación:</strong>
          Cambia el estado de un partido a <strong className="text-amber-900">"Finished" (Terminado)</strong>, define el número de goles reales y presiona <strong className="text-indigo-900">"Guardar"</strong>. Las posiciones y estadísticas se recalcularán de inmediato en la pestaña de <strong>Clasificación</strong>.
        </div>
      </div>

      {/* Red/Internet Auto Sync Section */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4" id="admin-internet-sync-card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 font-sans">
                Sincronización Autónoma de Resultados por Red
                <span className="px-2 py-0.5 bg-indigo-100 border border-indigo-200 text-indigo-800 text-[8px] font-black uppercase rounded-md tracking-wider">
                  Internet
                </span>
              </h3>
              <p className="text-[10px] text-slate-505 text-slate-500 font-medium">
                Conecta la polla con feeds en la red para buscar marcadores reales en internet y actualizar todo automáticamente.
              </p>
            </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto shrink-0 select-none">
            <button
              onClick={() => handleSyncFromInternet(false)}
              disabled={syncStatus === 'syncing'}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer disabled:opacity-50"
            >
              {syncStatus === 'syncing' && !syncMessage.includes('simulado') ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Wifi className="w-3.5 h-3.5" />
              )}
              Sincronizar vía Internet
            </button>

            <button
              onClick={() => handleSyncFromInternet(true)}
              disabled={syncStatus === 'syncing'}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 border border-emerald-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Probar Simulación
            </button>
          </div>
        </div>

        {/* Sync status/message box */}
        {syncStatus !== 'idle' && (
          <div className={`p-3.5 rounded-xl border flex gap-3 text-xs leading-relaxed transition-all animate-fadeIn ${
            syncStatus === 'syncing'
              ? 'bg-slate-100/50 border-slate-200 text-slate-700 font-medium'
              : syncStatus === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold'
                : 'bg-rose-50 border-rose-200 text-rose-850 text-rose-800 font-semibold'
          }`}>
            {syncStatus === 'syncing' ? (
              <Loader2 className="w-4 h-4 text-indigo-500 animate-spin shrink-0 mt-0.5" />
            ) : syncStatus === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              {syncMessage}
            </div>
          </div>
        )}

        {/* Advanced Settings toggle */}
        <div className="pt-2 border-t border-slate-200/60">
          <button
            onClick={() => setShowAdvancedSync(!showAdvancedSync)}
            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer select-none"
          >
            <Link2 className="w-3 h-3" />
            {showAdvancedSync ? 'Ocultar Configuración Avanzada' : 'Mostrar Configuración Avanzada (URL del Feed)'}
          </button>

          {showAdvancedSync && (
            <div className="mt-3 space-y-2 max-w-xl animate-fadeIn">
              <label className="text-[10px] font-bold text-slate-500 uppercase block">
                URL del Feed JSON de Partidos (API)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customFeedUrl}
                  onChange={(e) => setCustomFeedUrl(e.target.value)}
                  placeholder="https://ejemplo.com/partidos.json"
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 grow focus:outline-none focus:border-indigo-500 font-medium"
                />
                <button
                  onClick={() => setCustomFeedUrl('https://worldcupjson.net/matches')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 text-xs font-bold rounded-xl border border-slate-200 transition-all cursor-pointer"
                >
                  Restablecer
                </button>
              </div>
              <p className="text-[9px] text-slate-400 font-semibold leading-relaxed">
                El JSON debe tener la estructura estándar de matches de worldcupjson.net, conteniendo un array de objetos con `home_team`, `away_team` y `status`.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Matches editor list */}
      <div className="space-y-4" id="admin-matches-editor">
        {matches.map((match) => {
          const edit = editingScores[match.id];
          const homeScoreVal = edit !== undefined ? edit.home : (match.homeScore !== undefined ? match.homeScore : 0);
          const awayScoreVal = edit !== undefined ? edit.away : (match.awayScore !== undefined ? match.awayScore : 0);
          const statusVal = edit !== undefined ? edit.status : match.status;

          return (
            <div
              key={match.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-4 text-xs shadow-xs"
            >
              {/* Match Details */}
              <div className="flex items-center justify-between md:justify-start gap-4 w-full md:w-auto">
                <div className="text-left">
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-700 font-bold text-[9px] rounded-md uppercase block w-max uppercase tracking-wider mb-1 font-mono">
                    {match.phase}
                  </span>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <TeamFlag team={match.homeTeam} size="md" />
                    <span className="font-bold text-slate-800 text-xs w-20 truncate">{match.homeTeam.name}</span>
                    <span className="text-slate-400 font-mono">vs</span>
                    <TeamFlag team={match.awayTeam} size="md" />
                    <span className="font-bold text-slate-800 text-xs w-23 truncate text-left">{match.awayTeam.name}</span>
                  </div>
                </div>
              </div>

              {/* Status & Scores Controls */}
              <div className="flex flex-wrap items-center justify-between sm:justify-start gap-4 w-full md:w-auto grow md:grow-0">
                {/* Status selector */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Estado Match</label>
                  <select
                    id={`admin-status-select-${match.id}`}
                    value={statusVal}
                    onChange={(e) => handleStatusChange(match.id, e.target.value as Match['status'], match)}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="scheduled">Scheduled (Programado)</option>
                    <option value="live">Live (En Curso)</option>
                    <option value="finished">Finished (Terminado)</option>
                  </select>
                </div>

                {/* Score input fields */}
                <div className="flex items-center gap-1.5">
                  <div className="flex flex-col gap-1 items-center">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Goles Local</label>
                    <input
                      id={`admin-score-home-${match.id}`}
                      type="number"
                      min="0"
                      value={homeScoreVal}
                      onChange={(e) => handleLocalScoreChange(match.id, 'home', e.target.value, match)}
                      className="w-14 bg-white border border-slate-200 rounded-lg py-1.5 text-center font-mono font-bold text-slate-850 focus:outline-none focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </div>

                  <span className="font-bold text-slate-450 mt-4 text-slate-400 select-none">:</span>

                  <div className="flex flex-col gap-1 items-center">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Goles Vis.</label>
                    <input
                      id={`admin-score-away-${match.id}`}
                      type="number"
                      min="0"
                      value={awayScoreVal}
                      onChange={(e) => handleLocalScoreChange(match.id, 'away', e.target.value, match)}
                      className="w-14 bg-white border border-slate-200 rounded-lg py-1.5 text-center font-mono font-bold text-slate-850 focus:outline-none focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </div>
                </div>

                {/* Save button */}
                <button
                  id={`admin-save-btn-${match.id}`}
                  onClick={() => handleSaveResult(match.id, match)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-1 transition-all md:mt-4 shadow-xs grow sm:grow-0 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  Guardar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
