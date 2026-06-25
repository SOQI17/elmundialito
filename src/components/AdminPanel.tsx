import React, { useState, useMemo, useEffect } from 'react';
import { Match, MatchPhase, League, LeagueMemberInfo, UserProfile, Team } from '../types';
import { Settings, Save, RefreshCw, AlertTriangle, Play, CheckCircle, Globe, Wifi, Check, Sparkles, Loader2, Link2, AlertCircle, Trash2, Edit3, Users } from 'lucide-react';
import TeamFlag from './TeamFlag';
import { TEAMS } from '../data';

const PHASES_LABELS: Record<MatchPhase, string> = {
  group: 'Fase de Grupos',
  dieciseisavos: 'Dieciseisavos de Final',
  octavos: 'Octavos de Final',
  cuartos: 'Cuartos de Final',
  semifinal: 'Semifinal',
  final: 'Final de la Copa'
};



interface AdminPanelProps {
  matches: Match[];
  onUpdateMatchResult: (
    matchId: string,
    homeScore: number | undefined,
    awayScore: number | undefined,
    status: Match['status'],
    mode?: Match['mode'],
    liveStartTimestamp?: number | null,
    incidents?: Match['incidents'],
    homeTeam?: Team,
    awayTeam?: Team
  ) => void;
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
  onSaveUserForecast?: (userId: string, matchId: string, homeScore: number, awayScore: number, leagueCode?: string) => Promise<void>;
  onSyncMatchesFromAPI?: () => Promise<{ success: boolean; message: string; updatedCount: number }>;
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
  currentLeague = null,
  onSaveUserForecast,
  onSyncMatchesFromAPI
}: AdminPanelProps) {
  const [editingScores, setEditingScores] = useState<Record<string, { home: number; away: number; status: Match['status']; minute?: number }>>({});
  const [editingTeams, setEditingTeams] = useState<Record<string, { homeId?: string; awayId?: string }>>({});
  const [activePhaseFilter, setActivePhaseFilter] = useState<MatchPhase>('group');
  const [activeDateFilter, setActiveDateFilter] = useState<string>('all');

  const getLocalDateStr = (dateStr: string) => {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const availableDatesInPhase = useMemo(() => {
    return Array.from(
      new Set(
        matches
          .filter(m => m.phase === activePhaseFilter)
          .map(m => getLocalDateStr(m.dateTime))
      )
    ).sort();
  }, [matches, activePhaseFilter]);

  const availableDatesKey = availableDatesInPhase.join(',');

  // Automatically select the correct initial phase on load
  const [hasInitializedPhase, setHasInitializedPhase] = useState(false);
  useEffect(() => {
    if (matches.length > 0 && !hasInitializedPhase) {
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;

      const todayMatch = matches.find(m => getLocalDateStr(m.dateTime) === todayStr);
      if (todayMatch) {
        setActivePhaseFilter(todayMatch.phase);
        setHasInitializedPhase(true);
        return;
      }

      const upcomingMatch = matches.find(m => getLocalDateStr(m.dateTime) > todayStr);
      if (upcomingMatch) {
        setActivePhaseFilter(upcomingMatch.phase);
        setHasInitializedPhase(true);
        return;
      }

      const lastMatch = matches[matches.length - 1];
      if (lastMatch) {
        setActivePhaseFilter(lastMatch.phase);
        setHasInitializedPhase(true);
      }
    }
  }, [matches, hasInitializedPhase]);

  // Automatically select the correct initial date filter when phase or dates change
  useEffect(() => {
    if (availableDatesInPhase.length > 0) {
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;

      if (availableDatesInPhase.includes(todayStr)) {
        setActiveDateFilter(todayStr);
      } else {
        const upcomingDate = availableDatesInPhase.find(dateStr => dateStr > todayStr);
        if (upcomingDate) {
          setActiveDateFilter(upcomingDate);
        } else {
          setActiveDateFilter(availableDatesInPhase[availableDatesInPhase.length - 1]);
        }
      }
    } else {
      setActiveDateFilter('all');
    }
  }, [activePhaseFilter, availableDatesKey]);

  const SELECTABLE_TEAMS = useMemo(() => {
    return Object.values(TEAMS).sort((a, b) => {
      const aPl = a.group === 'Eliminatoria';
      const bPl = b.group === 'Eliminatoria';
      if (aPl && !bPl) return 1;
      if (!aPl && bPl) return -1;
      return a.name.localeCompare(b.name);
    });
  }, []);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState<string>('');


  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSyncFromAPI = async () => {
    if (!onSyncMatchesFromAPI) return;
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await onSyncMatchesFromAPI();
      if (res.success) {
        setSyncResult({ type: 'success', message: res.message });
      } else {
        setSyncResult({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setSyncResult({ type: 'error', message: err?.message || String(err) });
    } finally {
      setIsSyncing(false);
    }
  };

  // Estados para la corrección manual de pronósticos de usuario
  const [overrideLeagueCode, setOverrideLeagueCode] = useState<string>(currentLeague?.code || '');
  const [overrideUserId, setOverrideUserId] = useState<string>('');
  const [overrideMatchId, setOverrideMatchId] = useState<string>('');
  const [overrideHomeScore, setOverrideHomeScore] = useState<number | string>('');
  const [overrideAwayScore, setOverrideAwayScore] = useState<number | string>('');
  const [isSavingOverride, setIsSavingOverride] = useState<boolean>(false);
  const [overridePhase, setOverridePhase] = useState<MatchPhase | 'all'>('all');
  const [overrideDate, setOverrideDate] = useState<string>('all');

  // Synchronize overridePhase with activePhaseFilter on first initialization
  useEffect(() => {
    if (activePhaseFilter && overridePhase === 'all') {
      setOverridePhase(activePhaseFilter);
    }
  }, [activePhaseFilter]);

  // Compute available dates for the selected overridePhase
  const overrideAvailableDates = useMemo(() => {
    const filtered = overridePhase === 'all'
      ? matches
      : matches.filter(m => m.phase === overridePhase);
    return Array.from(
      new Set(
        filtered.map(m => getLocalDateStr(m.dateTime))
      )
    ).sort();
  }, [matches, overridePhase]);

  // Reset overrideDate and overrideMatchId when overridePhase changes
  useEffect(() => {
    setOverrideDate('all');
    setOverrideMatchId('');
  }, [overridePhase]);

  // Reset overrideMatchId when overrideDate changes
  useEffect(() => {
    setOverrideMatchId('');
  }, [overrideDate]);

  // Compute filtered matches for manual forecast registration
  const filteredMatchesForOverride = useMemo(() => {
    return matches.filter(m => {
      if (overridePhase !== 'all' && m.phase !== overridePhase) return false;
      if (overrideDate !== 'all' && getLocalDateStr(m.dateTime) !== overrideDate) return false;
      return true;
    });
  }, [matches, overridePhase, overrideDate]);

  // Obtener los usuarios filtrados según la liga seleccionada
  const filteredUsersForOverride = React.useMemo(() => {
    if (!overrideLeagueCode) {
      // Si no hay liga seleccionada, mostrar todos los usuarios que no son admin
      return allUsers.filter(u => !u.isAdmin);
    }
    const targetLeague = leagues.find(l => l.code === overrideLeagueCode);
    if (!targetLeague) return [];
    const memberIds = targetLeague.members || [];
    return allUsers.filter(u => !u.isAdmin && memberIds.includes(u.id));
  }, [overrideLeagueCode, allUsers, leagues]);

  const handleSaveOverride = async () => {
    if (!onSaveUserForecast || !overrideUserId || !overrideMatchId || overrideHomeScore === '' || overrideAwayScore === '') return;
    setIsSavingOverride(true);
    try {
      await onSaveUserForecast(
        overrideUserId,
        overrideMatchId,
        Number(overrideHomeScore),
        Number(overrideAwayScore),
        overrideLeagueCode || undefined
      );
      alert('¡Pronóstico registrado/corregido con éxito!');
      setOverrideUserId('');
      setOverrideMatchId('');
      setOverrideHomeScore('');
      setOverrideAwayScore('');
    } catch (err: any) {
      console.error(err);
      alert(`⚠️ ERROR AL GUARDAR PRONÓSTICO EN FIRESTORE:\n\n${err.message || err}\n\nPor favor, verifica tus permisos o conexión.`);
    } finally {
      setIsSavingOverride(false);
    }
  };



  const [editingLeagueCode, setEditingLeagueCode] = useState<string | null>(null);
  const [editingLeagueName, setEditingLeagueName] = useState<string>('');

  const handleSyncLeagues = async () => {
    try {
      setSyncStatus('syncing');
      setSyncMessage('Restableciendo ligas por defecto manualmente...');
      
      await new Promise(resolve => setTimeout(resolve, 1200));

      const { collection, getDocs, doc, setDoc, deleteDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      
      // Obtener todos los usuarios registrados reales en el sistema
      const usersSnap = await getDocs(collection(db, 'users'));
      const realUserIds = usersSnap.docs.map(d => d.id);

      const { INITIAL_LEAGUES } = await import('../data');
      const targetLeagues = INITIAL_LEAGUES;

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
      setSyncMessage(`¡Ligas restablecidas manualmente con éxito! Se cargaron ${targetLeagues.length} ligas y se agregaron ${realUserIds.length} miembros reales a cada una.`);

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

  const handleMinuteChange = (matchId: string, val: string, currentMatch: Match) => {
    const currentEdit = editingScores[matchId] || {
      home: currentMatch.homeScore !== undefined ? currentMatch.homeScore : 0,
      away: currentMatch.awayScore !== undefined ? currentMatch.awayScore : 0,
      status: currentMatch.status
    };

    const numVal = val === '' ? 0 : Math.max(0, Math.min(120, Number(val)));

    setEditingScores({
      ...editingScores,
      [matchId]: {
        ...currentEdit,
        minute: numVal
      }
    });
  };

  const handleSaveResult = async (matchId: string, currentMatch: Match) => {
    const edit = editingScores[matchId];
    const teamEdit = editingTeams[matchId];
    try {
      const homeTeam = teamEdit?.homeId ? TEAMS[teamEdit.homeId] : undefined;
      const awayTeam = teamEdit?.awayId ? TEAMS[teamEdit.awayId] : undefined;

      if (edit) {
        // Si el estado es live y se especificó/editó el minuto, calcular liveStartTimestamp
        let calculatedTimestamp: number | null = null;
        if (edit.status === 'live') {
          const currentMinute = edit.minute !== undefined 
            ? edit.minute 
            : (currentMatch.liveStartTimestamp 
              ? Math.max(0, Math.floor((Date.now() - currentMatch.liveStartTimestamp) / 60000))
              : (Math.floor((Date.now() - new Date(currentMatch.dateTime).getTime()) / 60000) > 0 
                ? Math.floor((Date.now() - new Date(currentMatch.dateTime).getTime()) / 60000) 
                : 0));
          calculatedTimestamp = Date.now() - (currentMinute * 60000);
        }
        await onUpdateMatchResult(matchId, edit.home, edit.away, edit.status, undefined, calculatedTimestamp, undefined, homeTeam, awayTeam);
      } else {
        // Si no ha editado valores directamente pero hace clic, guardar con actuales
        await onUpdateMatchResult(
          matchId, 
          currentMatch.homeScore !== undefined ? currentMatch.homeScore : 0, 
          currentMatch.awayScore !== undefined ? currentMatch.awayScore : 0, 
          currentMatch.status,
          undefined,
          null,
          undefined,
          homeTeam,
          awayTeam
        );
      }
      
      // Quitar del estado local de edición activa para confirmar cambios visuales solo si tiene éxito
      const copy = { ...editingScores };
      delete copy[matchId];
      setEditingScores(copy);

      const copyTeams = { ...editingTeams };
      delete copyTeams[matchId];
      setEditingTeams(copyTeams);
    } catch (err: any) {
      console.error("Error saving match result:", err);
      alert(`⚠️ ERROR AL GUARDAR EN FIRESTORE:\n\n${err.message || err}\n\nPor favor, verifica tus permisos o conexión.`);
    }
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

        <div className="flex gap-2 flex-wrap">
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

          {onSyncMatchesFromAPI && (
            <button
              onClick={handleSyncFromAPI}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 text-xs font-bold rounded-xl border border-indigo-700 transition-all self-start cursor-pointer shadow-xs"
            >
              {isSyncing ? (
                <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>Sincronizar resultados de API</span>
            </button>
          )}

          <button
            onClick={async () => {
              try {
                const { db } = await import('../firebase');
                const { doc, setDoc } = await import('firebase/firestore');
                
                // M_1 México vs Sudáfrica
                const realIncidents1 = [
                  { minute: 0, type: 'start', title: 'Inicio del partido', description: '¡Rueda el balón en el Estadio Azteca! Comienza el partido de apertura de la Copa Mundial 2026.', timestamp: Date.now() },
                  { minute: 9, type: 'goal_home', title: '¡GOL DE MÉXICO!', description: 'Julián Andrés Quiñones abre el marcador con un remate de cabeza tras un gran centro de Luis Chávez.', timestamp: Date.now() },
                  { minute: 50, type: 'yellow_away', title: 'Tarjeta Amarilla', description: 'Sphephelo Sithole (Sudáfrica) es amonestado por una falta fuerte sobre Edson Álvarez.', timestamp: Date.now() },
                  { minute: 67, type: 'goal_home', title: '¡GOL DE MÉXICO!', description: 'Raúl Jiménez define con categoría mano a mano con el portero rival para poner el 2-0.', timestamp: Date.now() },
                  { minute: 84, type: 'yellow_away', title: 'Tarjeta Amarilla', description: 'Themba Zwane (Sudáfrica) recibe tarjeta de amonestación por reclamar airadamente al árbitro.', timestamp: Date.now() },
                  { minute: 90, type: 'red_home', title: 'Tarjeta Roja Directa', description: 'César Montes es expulsado tras una entrada tardía en el minuto 90+2.', timestamp: Date.now() },
                  { minute: 94, type: 'end', title: 'Fin del partido', description: '¡Termina el partido inaugural! México vence 2-0 a Sudáfrica y obtiene sus primeros 3 puntos.', timestamp: Date.now() }
                ];
                await setDoc(doc(db, 'matches', 'M_1'), {
                  homeScore: 2,
                  awayScore: 0,
                  status: 'finished',
                  incidents: realIncidents1
                }, { merge: true });

                // M_2 Corea del Sur vs República Checa
                const realIncidents2 = [
                  { minute: 0, type: 'start', title: 'Inicio del partido', description: '¡Comienza el partido en el Estadio Akron! Corea del Sur y República Checa debutan en el Mundial 2026.', timestamp: Date.now() },
                  { minute: 59, type: 'goal_away', title: '¡GOL DE REPÚBLICA CHECA!', description: 'Ladislav Krejčí conecta un soberbio cabezazo tras un tiro de esquina para abrir el marcador 0-1.', timestamp: Date.now() },
                  { minute: 67, type: 'goal_home', title: '¡GOL DE COREA DEL SUR!', description: 'Hwang In-beom empata el partido 1-1 con un remate cruzado inalcanzable para el arquero.', timestamp: Date.now() },
                  { minute: 80, type: 'goal_home', title: '¡GOL DE COREA DEL SUR!', description: 'Oh Hyeon-gyu remata tras un gran pase filtrado y completa la remontada 2-1.', timestamp: Date.now() },
                  { minute: 94, type: 'end', title: 'Fin del partido', description: '¡Termina el encuentro! Corea del Sur vence 2-1 a República Checa en un emocionante partido en Guadalajara.', timestamp: Date.now() }
                ];
                await setDoc(doc(db, 'matches', 'M_2'), {
                  homeScore: 2,
                  awayScore: 1,
                  status: 'finished',
                  incidents: realIncidents2
                }, { merge: true });

                alert('✅ ¡Estadísticas y cronologías reales (México 2-0 y Corea del Sur 2-1) cargadas con éxito en Firestore!');
              } catch (err: any) {
                console.error(err);
                alert('❌ Error al actualizar: ' + (err.message || String(err)));
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-300 transition-all self-start cursor-pointer shadow-xs"
          >
            ⚽ Cargar Estadísticas Reales (M1 y M2)
          </button>

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

      {syncResult && (
        <div className={`p-4 rounded-2xl border text-xs font-semibold ${
          syncResult.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        } animate-fadeIn`}>
          <div className="flex items-center gap-2">
            {syncResult.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{syncResult.message}</span>
          </div>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-xs text-amber-800 leading-relaxed font-medium">
        <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
        <div>
          <strong className="block font-bold text-amber-900 mb-1">Sincronización y Control de Marcadores:</strong>
          <strong className="block font-bold text-amber-900 mb-1">Control de Marcadores:</strong>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong className="text-slate-800">Sincronización Automática:</strong> Los resultados reales se buscan y <strong>guardan automáticamente</strong> en Firestore en segundo plano cada 10 minutos (mediante Cloud Function).
            </li>
            <li>
              <strong className="text-slate-800">Edición Manual:</strong> Si deseas forzar o corregir un marcador manualmente, edita los goles o el estado de un partido en la lista inferior y presiona <strong className="text-indigo-900">"Guardar"</strong>.
            </li>
          </ul>
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
                onClick={() => handleSyncLeagues()}
                disabled={syncStatus === 'syncing'}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Restablecer Ligas por Defecto
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
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs"
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

      {/* Forecast Override Tool */}
      {onSaveUserForecast && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4" id="admin-forecast-override-card">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200/60">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 font-sans">
                Corrección / Registro Manual de Pronóstico de Usuario
                <span className="px-2 py-0.5 bg-amber-100 border border-amber-200 text-amber-800 text-[8px] font-black uppercase rounded-md tracking-wider">
                  Admin Control
                </span>
              </h3>
              <p className="text-[10px] text-slate-500 font-medium">
                Permite al organizador registrar o corregir el pronóstico de cualquier participante para un partido específico.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600">1. Seleccionar Liga</label>
                <select
                  value={overrideLeagueCode}
                  onChange={(e) => {
                    setOverrideLeagueCode(e.target.value);
                    setOverrideUserId('');
                  }}
                  className="bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer h-10 shadow-sm"
                >
                  <option value="">Global (Sin Liga)</option>
                  {leagues.map(l => (
                    <option key={l.code} value={l.code}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600">2. Seleccionar Usuario</label>
                <select
                  value={overrideUserId}
                  onChange={(e) => setOverrideUserId(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer h-10 shadow-sm"
                >
                  <option value="">-- Seleccionar --</option>
                  {filteredUsersForOverride.map(user => (
                    <option key={user.id} value={user.id}>{user.avatar} {user.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-200/60 pt-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600">3. Filtrar por Fase del Partido</label>
                <select
                  value={overridePhase}
                  onChange={(e) => setOverridePhase(e.target.value as MatchPhase | 'all')}
                  className="bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer h-10 shadow-sm"
                >
                  <option value="all">Todas las Fases</option>
                  {(['group', 'dieciseisavos', 'octavos', 'cuartos', 'semifinal', 'final'] as MatchPhase[]).map(phase => (
                    <option key={phase} value={phase}>{PHASES_LABELS[phase]}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600">4. Filtrar por Fecha</label>
                <select
                  value={overrideDate}
                  onChange={(e) => setOverrideDate(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer h-10 shadow-sm"
                >
                  <option value="all">Todas las Fechas</option>
                  {overrideAvailableDates.map((dateStr) => {
                    const [year, month, day] = dateStr.split('-').map(Number);
                    const d = new Date(year, month - 1, day);
                    const weekday = d.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '');
                    const capitalizedW = weekday.charAt(0).toUpperCase() + weekday.slice(1);
                    return (
                      <option key={dateStr} value={dateStr}>
                        {capitalizedW} {day}/{month}/{year}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 border-t border-slate-200/60 pt-4 items-end">
              <div className="flex flex-col gap-1.5 md:col-span-6">
                <label className="text-xs font-bold text-slate-600">
                  5. Seleccionar Partido 
                  <span className="text-[10px] text-slate-450 font-normal ml-1.5">
                    ({filteredMatchesForOverride.length} disponibles)
                  </span>
                </label>
                <select
                  value={overrideMatchId}
                  onChange={(e) => setOverrideMatchId(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer h-10 shadow-sm"
                >
                  <option value="">-- Seleccionar Partido --</option>
                  {filteredMatchesForOverride.map(match => {
                    const matchDate = new Date(match.dateTime);
                    const formattedTime = matchDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
                    const matchDateStr = getLocalDateStr(match.dateTime);
                    const [year, month, day] = matchDateStr.split('-').map(Number);
                    const label = `${match.homeTeam.flag} ${match.homeTeam.name} vs ${match.awayTeam.name} ${match.awayTeam.flag} (${day}/{month} ${formattedTime})`;
                    return (
                      <option key={match.id} value={match.id}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex items-center justify-center gap-2.5 md:col-span-3 pb-0.5">
                <div className="flex flex-col gap-1 items-center w-full">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Goles Local</label>
                  <input
                    type="number"
                    min="0"
                    value={overrideHomeScore}
                    onChange={(e) => setOverrideHomeScore(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg h-10 text-center font-mono font-bold text-slate-800 focus:outline-none focus:border-indigo-500 shadow-sm"
                  />
                </div>
                <span className="font-bold text-slate-400 mt-5 select-none">:</span>
                <div className="flex flex-col gap-1 items-center w-full">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Goles Vis.</label>
                  <input
                    type="number"
                    min="0"
                    value={overrideAwayScore}
                    onChange={(e) => setOverrideAwayScore(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg h-10 text-center font-mono font-bold text-slate-800 focus:outline-none focus:border-indigo-500 shadow-sm"
                  />
                </div>
              </div>

              <div className="md:col-span-3">
                <button
                  onClick={handleSaveOverride}
                  disabled={isSavingOverride || !overrideUserId || !overrideMatchId || overrideHomeScore === '' || overrideAwayScore === ''}
                  className="w-full h-10 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {isSavingOverride ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Registrar Pronóstico
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Matches editor list */}
      <div className="space-y-6" id="admin-matches-editor">
        <div className="border-b border-slate-100 pb-2">
          <h3 className="text-sm font-bold text-slate-800 font-sans uppercase tracking-wider">Editor de Partidos Oficiales</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Filtra por fase y fecha para encontrar y gestionar los encuentros rápidamente.</p>
        </div>

        {/* Phase tabs for Admin Editor */}
        <div className="bg-slate-105 bg-slate-100/80 p-1.5 rounded-xl flex flex-wrap gap-1.5 select-none" id="admin-editor-phase-tabs">
          {(['group', 'dieciseisavos', 'octavos', 'cuartos', 'semifinal', 'final'] as MatchPhase[]).map((phase) => {
            const isActive = activePhaseFilter === phase;
            const phaseMatchesCount = matches.filter(m => m.phase === phase).length;
            return (
              <button
                key={phase}
                type="button"
                onClick={() => {
                  setActivePhaseFilter(phase);
                  setActiveDateFilter('all');
                }}
                className={`flex-1 min-w-[120px] text-center px-3 py-2 rounded-lg text-[11px] font-bold transition-all border active:scale-98 cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                  isActive
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm font-extrabold'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span>{PHASES_LABELS[phase]}</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                  isActive ? 'bg-indigo-500/80 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {phaseMatchesCount} partidos
                </span>
              </button>
            );
          })}
        </div>

        {/* Date Filters for Admin Editor */}
        {availableDatesInPhase.length > 1 && (
          <div className="flex flex-col gap-1.5 select-none pt-1">
            <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-200">
              <button
                type="button"
                onClick={() => setActiveDateFilter('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-full whitespace-nowrap transition-all border shrink-0 ${
                  activeDateFilter === 'all'
                    ? 'bg-slate-800 border-slate-800 text-white shadow-sm'
                    : 'bg-slate-50 border-slate-200/60 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                📅 Todos los Días ({matches.filter(m => m.phase === activePhaseFilter).length} partidos)
              </button>
              {availableDatesInPhase.map((dateStr) => {
                const isSelected = activeDateFilter === dateStr;
                
                const [year, month, day] = dateStr.split('-').map(Number);
                const d = new Date(year, month - 1, day);
                const weekday = d.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '');
                const capitalizedW = weekday.charAt(0).toUpperCase() + weekday.slice(1);
                const label = `${capitalizedW} ${day}`;

                const dayMatchesCount = matches.filter(m => m.phase === activePhaseFilter && getLocalDateStr(m.dateTime) === dateStr).length;

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => setActiveDateFilter(dateStr)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-full whitespace-nowrap transition-all border shrink-0 flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                        : 'bg-slate-50 border-slate-200/60 text-slate-600 hover:text-indigo-950 hover:bg-slate-100'
                    }`}
                  >
                    <span>{label}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold font-mono ${
                      isSelected ? 'bg-indigo-500/80 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {dayMatchesCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Matches list */}
        <div className="space-y-4">
          {(() => {
            const filteredMatches = matches.filter(m => {
              if (m.phase !== activePhaseFilter) return false;
              if (activeDateFilter !== 'all' && getLocalDateStr(m.dateTime) !== activeDateFilter) return false;
              return true;
            });

            if (filteredMatches.length === 0) {
              return (
                <div className="text-center py-12 text-slate-400 font-medium bg-slate-50/20 border border-dashed border-slate-200 rounded-2xl">
                  No hay partidos programados o que coincidan con los filtros seleccionados para esta fase.
                </div>
              );
            }

            return filteredMatches.map((match) => {
              const edit = editingScores[match.id];
              const homeScoreVal = edit !== undefined ? edit.home : (match.homeScore !== undefined ? match.homeScore : 0);
              const awayScoreVal = edit !== undefined ? edit.away : (match.awayScore !== undefined ? match.awayScore : 0);
              const statusVal = edit !== undefined ? edit.status : match.status;
              const minuteVal = edit !== undefined && edit.minute !== undefined 
                ? edit.minute 
                : (match.liveStartTimestamp 
                  ? Math.max(0, Math.floor((Date.now() - match.liveStartTimestamp) / 60000))
                  : (Math.floor((Date.now() - new Date(match.dateTime).getTime()) / 60000) > 0 
                    ? Math.max(0, Math.min(120, Math.floor((Date.now() - new Date(match.dateTime).getTime()) / 60000))) 
                    : 0));

              return (
                <div
                  key={match.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-4 text-xs shadow-xs hover:border-slate-300 transition-all"
                >
                  {/* Match Details */}
                  <div className="flex items-center justify-between md:justify-start gap-4 w-full md:w-auto">
                    <div className="text-left">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-700 font-bold text-[9px] rounded-md uppercase block w-max uppercase tracking-wider font-mono">
                          {match.phase}
                        </span>
                        {match.status === 'live' && (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-700 font-bold text-[9px] rounded-md uppercase block w-max tracking-wider font-mono animate-pulse">
                            🔴 EN VIVO
                          </span>
                        )}
                        {match.status === 'finished' && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-bold text-[9px] rounded-md uppercase block w-max tracking-wider font-mono">
                            ✓ TERMINADO
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 mt-1 select-none">
                        <select
                          value={editingTeams[match.id]?.homeId || match.homeTeam.id}
                          onChange={(e) => {
                            const teamId = e.target.value;
                            setEditingTeams(prev => ({
                              ...prev,
                              [match.id]: { ...prev[match.id], homeId: teamId }
                            }));
                          }}
                          className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer max-w-[125px]"
                        >
                          {SELECTABLE_TEAMS.map(t => (
                            <option key={t.id} value={t.id}>{t.flag} {t.name}</option>
                          ))}
                        </select>
                        
                        {match.homeScore !== undefined || match.awayScore !== undefined ? (
                          <span className="px-2 py-0.5 bg-slate-900 text-white font-mono font-extrabold text-[10px] rounded-md shadow-xs select-none flex items-center gap-1 mx-1 shrink-0">
                            {match.homeScore ?? 0} - {match.awayScore ?? 0}
                            {match.status === 'live' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block"></span>
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono mx-1 shrink-0">vs</span>
                        )}

                        <select
                          value={editingTeams[match.id]?.awayId || match.awayTeam.id}
                          onChange={(e) => {
                            const teamId = e.target.value;
                            setEditingTeams(prev => ({
                              ...prev,
                              [match.id]: { ...prev[match.id], awayId: teamId }
                            }));
                          }}
                          className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer max-w-[125px]"
                        >
                          {SELECTABLE_TEAMS.map(t => (
                            <option key={t.id} value={t.id}>{t.flag} {t.name}</option>
                          ))}
                        </select>
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

                      {statusVal === 'live' && (
                        <div className="flex flex-col gap-1 items-center ml-2 border-l border-slate-200 pl-3">
                          <label className="text-[10px] font-bold text-indigo-600 uppercase">Minuto</label>
                          <input
                            type="number"
                            min="0"
                            max="120"
                            value={minuteVal}
                            onChange={(e) => handleMinuteChange(match.id, e.target.value, match)}
                            className="w-14 bg-indigo-50 border border-indigo-200 rounded-lg py-1.5 text-center font-mono font-bold text-indigo-900 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      )}
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
            });
          })()}
        </div>
      </div>
    </div>
  );
}
