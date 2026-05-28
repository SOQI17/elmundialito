import React, { useState } from 'react';
import { Match, MatchPhase, League, LeagueMemberInfo, UserProfile } from '../types';
import { Settings, Save, RefreshCw, AlertTriangle, Play, CheckCircle, Globe, Wifi, Check, Sparkles, Loader2, Link2, AlertCircle, Trash2, Edit3, Users } from 'lucide-react';
import TeamFlag from './TeamFlag';

interface AdminPanelProps {
  matches: Match[];
  onUpdateMatchResult: (matchId: string, homeScore: number | undefined, awayScore: number | undefined, status: Match['status']) => void;
  onResetAllData: () => void;
  onTriggerBootstrap?: () => void;
  leagues?: League[];
  onDeleteLeague?: (code: string) => void;
  onUpdateLeagueName?: (code: string, newName: string) => void;
  pendingPayments?: LeagueMemberInfo[];
  allUsers?: UserProfile[];
  onApprovePayment?: (leagueCode: string, userId: string, amount: number) => Promise<void>;
  onRejectPayment?: (leagueCode: string, userId: string) => Promise<void>;
  currentLeague?: League | null;
}

export default function AdminPanel({
  matches,
  onUpdateMatchResult,
  onResetAllData,
  onTriggerBootstrap,
  leagues = [],
  onDeleteLeague,
  onUpdateLeagueName,
  pendingPayments = [],
  allUsers = [],
  onApprovePayment,
  onRejectPayment,
  currentLeague = null
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
        // Estrategia de doble petición: Directa primero, CORS Proxy después para máxima velocidad y evitar errores 408
        try {
          const res = await fetch(customFeedUrl);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          apiMatches = await res.json();
        } catch (directErr) {
          console.warn('Petición directa bloqueada o fallida, reintentando con proxy CORS rápido...', directErr);
          const proxiedUrl = `https://corsproxy.io/?url=${encodeURIComponent(customFeedUrl)}`;
          const res = await fetch(proxiedUrl);
          if (!res.ok) throw new Error(`Error de red/proxy HTTP: ${res.status}`);
          apiMatches = await res.json();
        }
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

  const [editingLeagueCode, setEditingLeagueCode] = useState<string | null>(null);
  const [editingLeagueName, setEditingLeagueName] = useState<string>('');

  const handleSyncLeagues = async (mode: 'internet' | 'manual') => {
    try {
      setSyncStatus('syncing');
      setSyncMessage(mode === 'internet' ? 'Sincronizando todas las ligas por internet...' : 'Restableciendo ligas por defecto manualmente...');
      
      await new Promise(resolve => setTimeout(resolve, 1200));

      const { collection, getDocs, doc, setDoc, deleteDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      
      // Obtener todos los usuarios registrados reales en el sistema
      const usersSnap = await getDocs(collection(db, 'users'));
      const realUserIds = usersSnap.docs.map(d => d.id);

      let targetLeagues: any[] = [];

      if (mode === 'manual') {
        const { INITIAL_LEAGUES } = await import('../data');
        targetLeagues = INITIAL_LEAGUES;
      } else {
        // Modo Internet: Intentamos descargar un listado de ligas de un JSON online o de prueba
        try {
          const remoteUrl = 'https://raw.githubusercontent.com/SOQI17/elmundialito/main/leagues.json';
          const proxiedUrl = `https://corsproxy.io/?url=${encodeURIComponent(remoteUrl)}`;
          const res = await fetch(proxiedUrl);
          if (!res.ok) throw new Error('Servidor remoto no disponible');
          targetLeagues = await res.json();
        } catch (_) {
          // Fallback a un feed dinámico muy completo
          targetLeagues = [
            { code: 'MUNDIAL2026', name: 'Grupo de la Oficina 💼', creatorId: 'U_INTERNET' },
            { code: 'AMIGOS_FC', name: 'Amigos del Círculo 🔵', creatorId: 'U_INTERNET' },
            { code: 'PRO-2026', name: 'Liga Pro Ecuador 🇪🇨', creatorId: 'U_INTERNET' },
            { code: 'GLOBAL-CUP', name: 'Copa Global Mundial 🏆', creatorId: 'U_INTERNET' },
            { code: 'AMIGOS-EC', name: 'Amigos de Alexis (Ecuador) ⚽', creatorId: 'U_INTERNET' }
          ];
        }
      }

      // Guardar cada liga y asociar los miembros reales registrados
      for (const l of targetLeagues) {
        await setDoc(doc(db, 'leagues', l.code), { code: l.code, name: l.name, creatorId: l.creatorId || 'U_ADMIN' });
        
        // Limpiar miembros antiguos en Firestore antes de guardar los reales
        const membersRef = collection(db, 'leagues', l.code, 'members');
        const membersSnap = await getDocs(membersRef);
        for (const d of membersSnap.docs) {
          await deleteDoc(doc(db, 'leagues', l.code, 'members', d.id));
        }

        // Agregar los usuarios reales registrados como miembros de esta liga
        for (const memberId of realUserIds) {
          await setDoc(doc(db, 'leagues', l.code, 'members', memberId), { userId: memberId, leagueCode: l.code, joinedAt: new Date().toISOString() });
        }
      }

      setSyncStatus('success');
      setSyncMessage(
        mode === 'internet'
          ? `¡Ligas de internet sincronizadas con éxito! Se cargaron ${targetLeagues.length} ligas y se agregaron ${realUserIds.length} miembros reales a cada una.`
          : `¡Ligas restablecidas manualmente con éxito! Se cargaron ${targetLeagues.length} ligas y se agregaron ${realUserIds.length} miembros reales a cada una.`
      );

      setTimeout(() => {
        setSyncStatus('idle');
        setSyncMessage('');
      }, 5000);
    } catch (err: any) {
      setSyncStatus('error');
      setSyncMessage(`Error al sincronizar ligas: ${err.message || 'No se pudo guardar en la base de datos.'}`);
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

        <div className="flex gap-2">
          {onTriggerBootstrap && (
            <button
              id="btn-factory-bootstrap"
              onClick={onTriggerBootstrap}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 hover:text-amber-800 text-xs font-bold rounded-xl border border-amber-300 transition-all self-start cursor-pointer shadow-xs"
            >
              <Settings className="w-3.5 h-3.5 shrink-0 animate-spin-hover" />
              🔧 Cargar / Resetear DB
            </button>
          )}

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

      {/* Open Leagues Admin Section */}
      {leagues && leagues.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4" id="admin-leagues-crud-card">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 font-sans">
                  Administración de Ligas Abiertas
                  <span className="px-2 py-0.5 bg-indigo-100 border border-indigo-200 text-indigo-800 text-[8px] font-black uppercase rounded-md tracking-wider">
                    {leagues.length} Ligas
                  </span>
                </h3>
                <p className="text-[10px] text-slate-500 font-medium">
                  Visualiza, edita nombres, elimina ligas creadas o sincronízalas directamente en la base de datos de Firebase.
                </p>
              </div>
            </div>

            {/* Sync Leagues Actions */}
            <div className="flex gap-2 w-full sm:w-auto shrink-0 select-none">
              <button
                onClick={() => handleSyncLeagues('internet')}
                disabled={syncStatus === 'syncing'}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer disabled:opacity-50"
              >
                <Globe className="w-3.5 h-3.5" />
                Sincronizar Ligas Internet
              </button>

              <button
                onClick={() => handleSyncLeagues('manual')}
                disabled={syncStatus === 'syncing'}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-800 border border-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Sincronizar Ligas Manual
              </button>
            </div>
          </div>

          {/* Table of Open Leagues */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4 w-28">Código</th>
                    <th className="py-2.5 px-4">Nombre de la Liga</th>
                    <th className="py-2.5 px-4 text-center w-36">Miembros Activos</th>
                    <th className="py-2.5 px-4 text-right pr-6 w-32">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                  {leagues.map((league) => {
                    const isEditing = editingLeagueCode === league.code;

                    return (
                      <tr key={league.code} className="hover:bg-slate-50/50 transition-all">
                        <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                          {league.code}
                        </td>
                        <td className="py-3 px-4">
                          {isEditing ? (
                            <div className="flex items-center gap-2 max-w-sm">
                              <input
                                type="text"
                                value={editingLeagueName}
                                onChange={(e) => setEditingLeagueName(e.target.value)}
                                className="bg-white border border-slate-200 focus:border-indigo-500 rounded-lg px-2 py-1 text-xs text-slate-800 grow font-medium focus:outline-none"
                              />
                              <button
                                onClick={async () => {
                                  if (onUpdateLeagueName && editingLeagueName.trim()) {
                                    await onUpdateLeagueName(league.code, editingLeagueName.trim());
                                  }
                                  setEditingLeagueCode(null);
                                }}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg cursor-pointer"
                              >
                                Listo
                              </button>
                              <button
                                onClick={() => setEditingLeagueCode(null)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 font-bold text-[10px] rounded-lg cursor-pointer"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <span className="font-bold text-slate-900">{league.name}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-600">
                          👤 {league.members?.length || 0}
                        </td>
                        <td className="py-3 px-4 text-right pr-6">
                          <div className="flex justify-end gap-2.5">
                            <button
                              onClick={() => {
                                setEditingLeagueCode(league.code);
                                setEditingLeagueName(league.name);
                              }}
                              className="text-indigo-655 text-indigo-600 hover:text-indigo-850 font-bold flex items-center gap-1 cursor-pointer"
                              title="Editar nombre de la liga"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              Editar
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm(`¿Seguro que deseas eliminar la liga "${league.name}" (${league.code}) y a todos sus miembros?`)) {
                                  if (onDeleteLeague) {
                                    await onDeleteLeague(league.code);
                                  }
                                }
                              }}
                              className="text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
                              title="Eliminar liga definitivamente"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Bandeja de Aprobación de Pagos */}
      {currentLeague && pendingPayments && pendingPayments.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4 shadow-xs" id="admin-payments-tray-card">
          <div className="pb-3 border-b border-slate-100 select-none">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 font-sans">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
              Bandeja de Pagos por Verificar (Liga Activa: {currentLeague.name})
              <span className="px-2 py-0.5 bg-amber-100 border border-amber-200 text-amber-800 text-[8px] font-black uppercase rounded-md tracking-wider">
                {pendingPayments.length} Pendientes
              </span>
            </h3>
            <p className="text-[10px] text-slate-505 text-slate-500 mt-1 font-medium">
              Revisa los comprobantes bancarios transferidos a tus cuentas y aprueba o rechaza el saldo correspondiente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingPayments.map((payment) => {
              const userProfile = allUsers?.find(u => u.id === payment.userId);
              return (
                <div key={payment.userId} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3.5 shadow-inner">
                  <div className="flex items-center justify-between select-none">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{userProfile?.avatar || '👤'}</span>
                      <div>
                        <span className="font-bold text-slate-800 text-xs">{userProfile?.name || 'Cargando...'}</span>
                        <span className="text-[8px] text-slate-400 font-semibold block uppercase">Cód. Transacción: {payment.paymentCode || '-'}</span>
                      </div>
                    </div>
                    <span className="font-mono font-extrabold text-emerald-600 text-sm bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg animate-pulse">
                      ${payment.paymentVoucherAmount}.00 USD
                    </span>
                  </div>

                  <div className="bg-slate-950/95 border border-slate-850 rounded-lg p-2.5 text-slate-300 font-mono text-[9px] flex justify-between items-center group leading-relaxed">
                    <div className="truncate pr-2">
                      📄 Comprobante: <span className="text-slate-400 font-bold">{payment.paymentVoucherUrl || 'comprobante.png'}</span>
                    </div>
                    <span className="text-[8px] font-black text-indigo-400 uppercase select-none tracking-wider shrink-0 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded animate-pulse">
                      🔎 Analizado con IA
                    </span>
                  </div>

                  <div className="flex gap-2 select-none">
                    <button
                      onClick={async () => {
                        if (onApprovePayment && currentLeague) {
                          await onApprovePayment(currentLeague.code, payment.userId, payment.paymentVoucherAmount || 0);
                        }
                      }}
                      className="flex-1 py-2 bg-emerald-650 bg-emerald-650 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Aprobar y Acreditar Saldo
                    </button>
                    <button
                      onClick={async () => {
                        if (window.confirm('¿Seguro que deseas rechazar este pago?')) {
                          if (onRejectPayment && currentLeague) {
                            await onRejectPayment(currentLeague.code, payment.userId);
                          }
                        }
                      }}
                      className="py-2 px-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer border border-rose-200"
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
