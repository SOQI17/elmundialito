import React, { useState, useEffect } from 'react';
import { Match, MatchPhase, Forecast, UserProfile, League, LeagueMemberInfo, Team } from '../types';
import { Lock, Unlock, Calendar, Eye, Activity, CheckSquare, Sparkles, Tv, AlertCircle } from 'lucide-react';
import LiveMatchSimulator from './LiveMatchSimulator';
import TeamFlag from './TeamFlag';
import { calculatePenaltyScore } from '../utils/scoring';

interface MatchesListProps {
  matches: Match[];
  forecasts: Forecast[];
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onSaveForecast: (
    matchId: string, 
    homeScore: number, 
    awayScore: number,
    homePenalties?: number,
    awayPenalties?: number
  ) => void;
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
  currentLeague?: League | null;
  allLeagues?: League[];
  activePhase: MatchPhase;
  onChangePhase: (phase: MatchPhase) => void;
  leagueMembersData?: LeagueMemberInfo[];
}

const PHASES_LABELS: Record<MatchPhase, string> = {
  group: 'Fase de Grupos',
  dieciseisavos: 'Dieciseisavos de Final',
  octavos: 'Octavos de Final',
  cuartos: 'Cuartos de Final',
  semifinal: 'Semifinal',
  final: 'Final de la Copa'
};

const GROUPS_LIST = [
  { id: 'all', label: 'Todos los Grupos' },
  { id: 'Grupo A', label: 'Grupo A' },
  { id: 'Grupo B', label: 'Grupo B' },
  { id: 'Grupo C', label: 'Grupo C' },
  { id: 'Grupo D', label: 'Grupo D' },
  { id: 'Grupo E', label: 'Grupo E' },
  { id: 'Grupo F', label: 'Grupo F' },
  { id: 'Grupo G', label: 'Grupo G' },
  { id: 'Grupo H', label: 'Grupo H' },
  { id: 'Grupo I', label: 'Grupo I' },
  { id: 'Grupo J', label: 'Grupo J' },
  { id: 'Grupo K', label: 'Grupo K' },
  { id: 'Grupo L', label: 'Grupo L' }
];

export default function MatchesList({
  matches,
  forecasts,
  currentUser,
  allUsers,
  onSaveForecast,
  onUpdateMatchResult,
  currentLeague,
  allLeagues = [],
  activePhase,
  onChangePhase,
  leagueMembersData = []
}: MatchesListProps) {
  const [activeGroupFilter, setActiveGroupFilter] = useState<string>('all');
  const [activeDateFilter, setActiveDateFilter] = useState<string>('all');
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { homeScore: number; awayScore: number; homePenalties?: number; awayPenalties?: number }>>({});
  const [savingMatchIds, setSavingMatchIds] = useState<Record<string, boolean>>({});
  const [selectedLiveMatch, setSelectedLiveMatch] = useState<Match | null>(null);
  const [now, setNow] = useState<Date>(new Date());

  const myMemberData = leagueMembersData?.find(m => m.userId === currentUser.id);
  const isCreator = currentLeague?.creatorId === currentUser.id;
  const isAdmin = currentUser.isAdmin;
  const isBlockedByPayment = !!currentLeague && !isCreator && !isAdmin && (!myMemberData || !myMemberData.paid);

  // Import Modal States
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedSourceLeagueCode, setSelectedSourceLeagueCode] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importResultText, setImportResultText] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const isMatchLocked = (match: Match): boolean => {
    if (isBlockedByPayment) return true;
    if (match.status === 'live' || match.status === 'finished') return true;
    const kickoff = new Date(match.dateTime).getTime();
    return now.getTime() >= kickoff;
  };

  const getLockReason = (match: Match): string => {
    if (isBlockedByPayment) return 'Falta de Pago';
    if (match.status === 'finished') return 'Terminado';
    if (match.status === 'live') return 'Partido en Juego';
    return 'Comenzado';
  };

  const getLocalDateStr = (dateStr: string) => {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isDateInPast = (dateStr: string) => {
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    return dateStr < todayStr;
  };

  const formatMatchTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const timeStr = d.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const datePart = d.toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric'
    }).replace('.', '');
    return `${datePart}, ${timeStr}`;
  };

  const formatDateHeader = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    const dayName = d.toLocaleDateString('es-ES', { weekday: 'long' });
    const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    const monthName = d.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '');
    return `${capitalizedDay} ${day} de ${monthName}`;
  };

  const getDayShortLabel = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    const weekday = d.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '');
    const capitalizedW = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    return `${capitalizedW} ${day}`;
  };

  const availableDatesInPhase = Array.from(
    new Set(matches.filter(m => m.phase === activePhase).map(m => getLocalDateStr(m.dateTime)))
  ).sort();

  const availableDatesKey = availableDatesInPhase.join(',');

  useEffect(() => {
    if (availableDatesInPhase.length > 0) {
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
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
  }, [activePhase, availableDatesKey]);

  const getDateStats = (dateStr: string) => {
    const dayMatches = matches.filter(m => m.phase === activePhase && getLocalDateStr(m.dateTime) === dateStr);
    return {
      totalCount: dayMatches.length,
      predictedCount: dayMatches.filter(m => forecasts.some(f => f.matchId === m.id && f.userId === currentUser.id && (!currentLeague || f.leagueCode === currentLeague.code || !f.leagueCode))).length
    };
  };

  const getMyForecast = (matchId: string): Forecast | undefined =>
    forecasts.find(f => f.matchId === matchId && f.userId === currentUser.id && currentLeague && f.leagueCode === currentLeague.code) ||
    forecasts.find(f => f.matchId === matchId && f.userId === currentUser.id && !f.leagueCode);

  const handleScoreChange = (matchId: string, team: 'home' | 'away', currentVal: number, step: number) => {
    const forecast = getMyForecast(matchId);
    const draft = drafts[matchId];
    let homeS = draft ? draft.homeScore : (forecast ? forecast.homeScore : 0);
    let awayS = draft ? draft.awayScore : (forecast ? forecast.awayScore : 0);
    if (team === 'home') homeS = Math.max(0, homeS + step);
    else awayS = Math.max(0, awayS + step);

    const isNewDraw = homeS === awayS;
    const homeP = isNewDraw ? (draft?.homePenalties !== undefined ? draft.homePenalties : (forecast?.homePenalties !== undefined ? forecast.homePenalties : undefined)) : undefined;
    const awayP = isNewDraw ? (draft?.awayPenalties !== undefined ? draft.awayPenalties : (forecast?.awayPenalties !== undefined ? forecast.awayPenalties : undefined)) : undefined;

    setDrafts(prev => ({ 
      ...prev, 
      [matchId]: { 
        homeScore: homeS, 
        awayScore: awayS,
        homePenalties: homeP,
        awayPenalties: awayP
      } 
    }));
  };

  const handlePenaltyChange = (matchId: string, team: 'home' | 'away', currentVal: number, step: number) => {
    const forecast = getMyForecast(matchId);
    const draft = drafts[matchId];
    const homeS = draft ? draft.homeScore : (forecast ? forecast.homeScore : 0);
    const awayS = draft ? draft.awayScore : (forecast ? forecast.awayScore : 0);
    let homeP = draft?.homePenalties !== undefined ? draft.homePenalties : (forecast?.homePenalties || 0);
    let awayP = draft?.awayPenalties !== undefined ? draft.awayPenalties : (forecast?.awayPenalties || 0);

    if (team === 'home') homeP = Math.max(0, homeP + step);
    else awayP = Math.max(0, awayP + step);

    setDrafts(prev => ({ 
      ...prev, 
      [matchId]: { 
        homeScore: homeS, 
        awayScore: awayS,
        homePenalties: homeP,
        awayPenalties: awayP
      } 
    }));
  };

  const handleCommitForecast = async (matchId: string) => {
    const draft = drafts[matchId];
    if (!draft) return;
    
    // Shootout draw check
    const matchVal = matches.find(m => m.id === matchId);
    const isKnockout = matchVal?.phase !== 'group';
    if (isKnockout && draft.homeScore === draft.awayScore) {
      if (draft.homePenalties === draft.awayPenalties) {
        alert("Error: Las tandas de penales deben tener un ganador (el marcador no puede quedar empatado).");
        return;
      }
    }

    setSavingMatchIds(prev => ({ ...prev, [matchId]: true }));
    try {
      await onSaveForecast(matchId, draft.homeScore, draft.awayScore, draft.homePenalties, draft.awayPenalties);
      setDrafts(prev => { const copy = { ...prev }; delete copy[matchId]; return copy; });
    } catch (err: any) {
      console.error('Error al guardar pronóstico:', err);
    } finally {
      setSavingMatchIds(prev => ({ ...prev, [matchId]: false }));
    }
  };

  const handleImportForecasts = async () => {
    if (!selectedSourceLeagueCode) return;
    setImporting(true);
    setImportProgress(0);
    setImportStatus('idle');

    try {
      // Find forecasts from the selected source league that belong to this user
      const sourceForecasts = selectedSourceLeagueCode === '__legacy__'
        ? forecasts.filter(f => f.userId === currentUser.id && !f.leagueCode)
        : forecasts.filter(f => f.userId === currentUser.id && f.leagueCode === selectedSourceLeagueCode);

      if (sourceForecasts.length === 0) {
        setImportStatus('error');
        setImportResultText('No se encontraron pronósticos en el origen seleccionado.');
        setImporting(false);
        return;
      }

      // Filter only editable matches (not started yet, scheduled)
      const eligibleForecasts = sourceForecasts.filter(f => {
        const match = matches.find(m => m.id === f.matchId);
        if (!match) return false;
        const isLocked = match.status === 'live' || match.status === 'finished' || now.getTime() >= new Date(match.dateTime).getTime();
        return !isLocked;
      });

      if (eligibleForecasts.length === 0) {
        setImportStatus('error');
        setImportResultText('No hay pronósticos pendientes o elegibles para importar (todos los partidos ya comenzaron).');
        setImporting(false);
        return;
      }

      let copiedCount = 0;
      for (let i = 0; i < eligibleForecasts.length; i++) {
        const f = eligibleForecasts[i];
        await onSaveForecast(f.matchId, f.homeScore, f.awayScore, f.homePenalties, f.awayPenalties);
        copiedCount++;
        setImportProgress(Math.round(((i + 1) / eligibleForecasts.length) * 100));
      }

      setImportStatus('success');
      setImportResultText(`¡Se importaron con éxito ${copiedCount} pronósticos!`);
    } catch (err) {
      console.error('Error importing forecasts:', err);
      setImportStatus('error');
      setImportResultText('Ocurrió un error inesperado durante la importación.');
    } finally {
      setImporting(false);
    }
  };

  const activeMatches = matches.filter(m => {
    if (m.phase !== activePhase) return false;
    if (activePhase === 'group' && activeGroupFilter !== 'all' && m.homeTeam.group !== activeGroupFilter) return false;
    if (activeDateFilter !== 'all' && getLocalDateStr(m.dateTime) !== activeDateFilter) return false;
    return true;
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6" id="matches-list-root">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 font-sans">Calendario de Partidos</h2>
            {currentUser && !currentUser.isAdmin && !isBlockedByPayment && (
              <button
                onClick={() => {
                  setSelectedSourceLeagueCode('');
                  setImportProgress(0);
                  setImportStatus('idle');
                  setImportResultText('');
                  setShowImportModal(true);
                }}
                className="px-2.5 py-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg flex items-center gap-1 transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <Sparkles className="w-3 h-3 text-indigo-600 animate-pulse" />
                Importar de otra liga
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">Registra tus marcadores estimados o revisa los pronósticos cruzados de tus amigos.</p>
        </div>
        <div className="px-3 py-1.5 bg-indigo-50/70 border border-indigo-100/40 rounded-lg text-[11px] text-indigo-800 flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 animate-pulse text-indigo-500" />
          <span>Hora del Sistema: <strong className="font-mono">{
            now.toLocaleDateString('es-ES', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            })
          } {
            now.toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            })
          }</strong></span>
        </div>
      </div>

      {/* Payment Block Warning Banner */}
      {isBlockedByPayment && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 animate-fadeIn select-none">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-black text-rose-900 uppercase tracking-wide">⚠️ Pronósticos Bloqueados por Falta de Pago</h4>
            <p className="text-[11px] text-rose-700 font-bold leading-relaxed">
              No puedes registrar ni modificar tus pronósticos porque tu cuenta se encuentra pendiente de pago en esta liga. 
              Por favor, comunícate con el organizador de la liga (<strong>{allUsers.find(u => u.id === currentLeague?.creatorId)?.name || 'Organizador'}</strong>) para confirmar tu pago vía transferencia o efectivo.
            </p>
          </div>
        </div>
      )}

      {/* Legacy Forecasts Banner */}
      {(() => {
        const legacyForecasts = forecasts.filter(f => f.userId === currentUser.id && !f.leagueCode);
        const activeLeagueForecasts = forecasts.filter(f => f.userId === currentUser.id && f.leagueCode === currentLeague?.code);
        if (legacyForecasts.length > 0 && activeLeagueForecasts.length === 0) {
          return (
            <div className="p-4 bg-indigo-50/70 border border-indigo-100/70 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeIn">
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5 select-none">🎁</span>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-indigo-900 font-sans">¡Detectamos tus pronósticos anteriores!</h4>
                  <p className="text-[11px] text-indigo-700 font-sans leading-relaxed">
                    Tienes <strong>{legacyForecasts.length} pronósticos</strong> guardados de la versión anterior. ¿Deseas copiarlos todos a tu liga activa actual (<strong>{currentLeague?.name}</strong>)?
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedSourceLeagueCode('__legacy__');
                  setImportProgress(0);
                  setImportStatus('idle');
                  setImportResultText('');
                  setShowImportModal(true);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shrink-0 cursor-pointer active:scale-95 text-center"
              >
                Importar Pronósticos Ahora
              </button>
            </div>
          );
        }
        return null;
      })()}

      {/* Phase tabs */}
      {(() => {
        const modeActiveTabStyle = (() => {
          const mode = currentLeague?.gameMode || 'total';
          if (mode === 'sectional') {
            return {
              active: 'bg-emerald-600 text-white shadow-md border-emerald-600',
              badge: 'bg-emerald-500/80 text-white',
              inactiveBadge: 'bg-slate-200/80 text-slate-700'
            };
          }
          if (mode === 'custom') {
            return {
              active: 'bg-purple-600 text-white shadow-md border-purple-600',
              badge: 'bg-purple-500/80 text-white',
              inactiveBadge: 'bg-slate-200/80 text-slate-700'
            };
          }
          return {
            active: 'bg-indigo-600 text-white shadow-md border-indigo-600',
            badge: 'bg-indigo-500/80 text-white',
            inactiveBadge: 'bg-slate-200/80 text-slate-700'
          };
        })();

        return (
          <div className="flex flex-wrap gap-1.5 p-1 bg-slate-50 rounded-xl" id="phase-tabs-container">
            {(['group', 'dieciseisavos', 'octavos', 'cuartos', 'semifinal', 'final'] as MatchPhase[]).map((phase) => {
              const phaseMatches = matches.filter(m => m.phase === phase);
              const totalCount = phaseMatches.length;
              const predictedCount = phaseMatches.filter(m => forecasts.some(f => f.matchId === m.id && f.userId === currentUser.id && (!currentLeague || f.leagueCode === currentLeague.code || !f.leagueCode))).length;
              const isActive = activePhase === phase;

              return (
                <button
                  key={phase}
                  onClick={() => { onChangePhase(phase); setActiveGroupFilter('all'); setActiveDateFilter('all'); }}
                  className={`flex-1 min-w-[110px] sm:min-w-[130px] text-center px-2 py-2 rounded-lg transition-all border active:scale-98 cursor-pointer flex flex-col items-center justify-center gap-1 ${
                    isActive 
                      ? `${modeActiveTabStyle.active}` 
                      : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-[11px] font-extrabold leading-none">{PHASES_LABELS[phase]}</span>
                  {!currentUser.isAdmin && totalCount > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold font-mono transition-colors leading-none ${
                      isActive ? modeActiveTabStyle.badge : modeActiveTabStyle.inactiveBadge
                    }`}>
                      {predictedCount}/{totalCount}
                    </span>
                  )}
                  {currentUser.isAdmin && totalCount > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold font-mono transition-colors leading-none ${
                      isActive ? modeActiveTabStyle.badge : modeActiveTabStyle.inactiveBadge
                    }`}>
                      {totalCount} partidos
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        );
      })()}

      {/* Filters */}
      <div className="flex flex-col gap-4 border-t border-slate-100 pt-4">
        {activePhase === 'group' && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase font-black text-indigo-700 tracking-wider">Filtrar por Grupo Oficial</span>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-200">
              {GROUPS_LIST.map((group) => (
                <button
                  key={group.id}
                  onClick={() => setActiveGroupFilter(group.id)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-full whitespace-nowrap transition-all border shrink-0 ${
                    activeGroupFilter === group.id
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                      : 'bg-slate-50 border-slate-200/60 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {group.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {availableDatesInPhase.length > 1 && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-black text-amber-700 tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                Filtrar por Fecha (Apuestas de la Jornada)
              </span>
              <span className="text-[9px] bg-amber-50 text-amber-800 border border-amber-200 font-extrabold px-1.5 py-0.5 rounded animate-pulse">
                🕒 Selecciona un día para apostar ordenadamente
              </span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-200">
              <button
                onClick={() => setActiveDateFilter('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-full whitespace-nowrap transition-all border shrink-0 ${
                  activeDateFilter === 'all'
                    ? 'bg-amber-600 border-amber-600 text-white shadow-sm'
                    : 'bg-slate-50 border-slate-200/60 text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                }`}
              >
                📅 Todos los Días ({matches.filter(m => m.phase === activePhase).length} partidos)
              </button>
              {availableDatesInPhase.map((dateStr) => {
                const isSelected = activeDateFilter === dateStr;
                const { totalCount, predictedCount } = getDateStats(dateStr);
                const allDone = !currentUser.isAdmin && (predictedCount >= totalCount);
                const isPast = isDateInPast(dateStr);
                return (
                  <button
                    key={dateStr}
                    onClick={() => setActiveDateFilter(dateStr)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-full whitespace-nowrap transition-all border shrink-0 flex items-center gap-1.5 ${
                      isSelected 
                        ? isPast
                          ? 'bg-rose-600 border-rose-600 text-white shadow-sm hover:bg-rose-700'
                          : 'bg-amber-500 border-amber-500 text-white shadow-sm' 
                        : isPast
                          ? 'bg-rose-50/70 border-rose-200 text-rose-700 hover:text-rose-950 hover:bg-rose-100/80'
                          : 'bg-slate-50 border-slate-200/60 text-slate-600 hover:text-indigo-950 hover:bg-slate-100'
                    }`}
                  >
                    <span>{getDayShortLabel(dateStr)}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold font-mono ${
                      isSelected 
                        ? 'bg-white/20 text-white' 
                        : allDone 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : isPast
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-200 text-slate-700'
                    }`}>
                      {currentUser.isAdmin ? `${totalCount} part.` : `${predictedCount}/${totalCount}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Matches */}
      {activeMatches.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">No hay partidos programados para esta fase aún.</div>
      ) : (
        <div className="space-y-8" id="matches-grid-view">
          {(() => {
            const matchesByDate: Record<string, Match[]> = {};
            activeMatches.forEach(m => {
              const dStr = getLocalDateStr(m.dateTime);
              if (!matchesByDate[dStr]) matchesByDate[dStr] = [];
              matchesByDate[dStr].push(m);
            });

            return Object.keys(matchesByDate).sort().map((dateKey) => {
              const dateMatches = matchesByDate[dateKey];
              const isTodaySimulation = dateKey === '2026-06-11';
              const isPastDate = isDateInPast(dateKey);

              return (
                <div key={dateKey} className="space-y-4">
                  <div className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border ${
                    isPastDate
                      ? 'bg-rose-50/40 border-rose-200/30'
                      : 'bg-slate-50 border-slate-200/40'
                  }`}>
                    <span className={`w-2.5 h-2.5 rounded-full shadow-sm ${
                      isPastDate ? 'bg-rose-400' : 'bg-indigo-500 animate-pulse'
                    }`}></span>
                    <h3 className={`text-xs font-black tracking-tight uppercase ${
                      isPastDate ? 'text-rose-700' : 'text-slate-700'
                    }`}>
                      📅 {formatDateHeader(dateKey)}
                    </h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
                      isPastDate ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {dateMatches.length} {dateMatches.length === 1 ? 'partido' : 'partidos'}
                    </span>
                    {isTodaySimulation && (
                      <span className="ml-auto text-[9px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 uppercase px-2 py-0.5 rounded-md animate-pulse">
                        🔥 APUESTAS DESTACADAS DEL DÍA
                      </span>
                    )}
                  </div>

                  <div className="space-y-4">
                    {dateMatches.map((match) => {
                      const locked = isMatchLocked(match);
                      const userForecast = getMyForecast(match.id);
                      const isPlayed = match.status === 'finished';
                      const draft = drafts[match.id];
                      const hasDraft = draft !== undefined;
                      const isPendingValue = hasDraft && (
                        !userForecast || 
                        userForecast.homeScore !== draft.homeScore || 
                        userForecast.awayScore !== draft.awayScore ||
                        userForecast.homePenalties !== draft.homePenalties ||
                        userForecast.awayPenalties !== draft.awayPenalties
                      );
                      const displayHomeScore = hasDraft ? draft.homeScore : (userForecast ? userForecast.homeScore : undefined);
                      const displayAwayScore = hasDraft ? draft.awayScore : (userForecast ? userForecast.awayScore : undefined);
                      const displayHomePens = hasDraft ? draft.homePenalties : (userForecast ? userForecast.homePenalties : undefined);
                      const displayAwayPens = hasDraft ? draft.awayPenalties : (userForecast ? userForecast.awayPenalties : undefined);
                      const otherForecasts = (() => {
                        const raw = forecasts.filter(f => {
                          if (f.matchId !== match.id || f.userId === currentUser.id) return false;
                          if (currentLeague) {
                            return (currentLeague.members || []).includes(f.userId) && (f.leagueCode === currentLeague.code || !f.leagueCode);
                          }
                          return true;
                        });

                        const map = new Map<string, typeof forecasts[0]>();
                        raw.forEach(f => {
                          const existing = map.get(f.userId);
                          if (!existing) {
                            map.set(f.userId, f);
                          } else {
                            if (f.leagueCode && !existing.leagueCode) {
                              map.set(f.userId, f);
                            }
                          }
                        });
                        return Array.from(map.values());
                      })();

                      return (
                        <div
                          key={match.id}
                          className={`border rounded-2xl transition-all overflow-hidden ${
                            locked ? 'border-slate-150 bg-slate-50/50' : 'border-slate-200 bg-white hover:border-indigo-150 hover:shadow-xs'
                          }`}
                        >
                          {/* Card header */}
                          <div className="px-4 py-3 bg-slate-50/40 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
                            <div className="flex items-center gap-2 text-slate-500 text-xs">
                              <Calendar className="w-3.5 h-3.5" />
                              <span className="font-semibold font-mono">{formatMatchTime(match.dateTime)}</span>
                              <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[9px] font-bold rounded-md uppercase tracking-wider">
                                {match.homeTeam.group || 'Eliminatoria'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {isPlayed && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded-full uppercase">Jugado</span>}
                              {match.status === 'live' && (
                                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[9px] font-bold rounded-full uppercase animate-pulse flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>En Vivo
                                </span>
                              )}
                              {locked ? (
                                <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[9px] font-bold rounded-md flex items-center gap-1">
                                  <Lock className="w-2.5 h-2.5 text-slate-500" />Cerrado ({getLockReason(match)})
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold rounded-md flex items-center gap-1">
                                  <Unlock className="w-2.5 h-2.5 text-emerald-500 animate-bounce" />Abierto para pronósticos
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Match body */}
                          <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">

                            {/* ── TEAMS + SCORE ── */}
                            <div className="md:col-span-5 flex items-center justify-between gap-4">

                              {/* Home Team — FLAG + NAME */}
                              <div className="flex flex-col items-center flex-1 text-center gap-1">
                                <span className="filter drop-shadow-sm select-none" role="img" aria-label={match.homeTeam.name}>
                                  <TeamFlag team={match.homeTeam} size="xl" />
                                </span>
                                <span className="text-xs font-bold text-slate-800 mt-1">{match.homeTeam.name}</span>
                              </div>

                              {/* Score or VS */}
                              <div className="flex items-center gap-2 select-none shrink-0">
                                {isPlayed || match.status === 'live' ? (
                                  <div className="flex flex-col items-center bg-slate-900 text-white font-mono font-bold text-sm px-3 py-1.5 rounded-lg select-none">
                                    <div className="flex items-center gap-2 text-base">
                                      <span>{match.homeScore}</span>
                                      <span className="text-slate-500">-</span>
                                      <span>{match.awayScore}</span>
                                    </div>
                                    {match.homePenalties !== undefined && match.awayPenalties !== undefined && match.homePenalties !== null && match.awayPenalties !== null && (
                                      <span className="text-[10px] text-amber-400 font-bold mt-0.5">
                                        ({match.homePenalties} - {match.awayPenalties} pen.)
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div className="font-sans text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 uppercase tracking-wider">
                                    VS
                                  </div>
                                )}
                              </div>

                              {/* Away Team — FLAG + NAME */}
                              <div className="flex flex-col items-center flex-1 text-center gap-1">
                                <span className="filter drop-shadow-sm select-none" role="img" aria-label={match.awayTeam.name}>
                                  <TeamFlag team={match.awayTeam} size="xl" />
                                </span>
                                <span className="text-xs font-bold text-slate-800 mt-1">{match.awayTeam.name}</span>
                              </div>
                            </div>

                            {/* ── FORECAST FORM ── */}
                            <div className="md:col-span-5 bg-slate-100/30 border border-slate-150 rounded-2xl p-4 flex flex-col items-center justify-center space-y-2">
                              {currentUser.isAdmin ? (
                                <div className="text-center py-2 space-y-1 select-none">
                                  <span className="text-[9px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded-md">
                                    🛡️ Cuenta Administradora
                                  </span>
                                  <p className="text-[10px] text-slate-400 font-semibold max-w-[220px] leading-tight mt-1">
                                    Los administradores del sistema solo auditan y controlan la liga. No participan con pronósticos.
                                  </p>
                                </div>
                              ) : (
                                <>
                                  <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 text-indigo-500" />
                                    Tu Pronóstico ({currentUser.avatar} {currentUser.name.split(' ')[0]})
                                  </span>

                                  <div className="flex items-center gap-4">
                                    {/* Home score input */}
                                    <div className="flex items-center gap-1.5">
                                      {!locked && (
                                        <button onClick={() => handleScoreChange(match.id, 'home', userForecast?.homeScore || 0, -1)} className="w-7 h-7 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-sm font-bold flex items-center justify-center shadow-xs cursor-pointer">-</button>
                                      )}
                                      <div className="w-10 h-10 bg-white border border-slate-200 font-mono font-bold text-slate-850 rounded-xl flex items-center justify-center text-lg shadow-inner">
                                        {displayHomeScore !== undefined ? displayHomeScore : '-'}
                                      </div>
                                      {!locked && (
                                        <button onClick={() => handleScoreChange(match.id, 'home', userForecast?.homeScore || 0, 1)} className="w-7 h-7 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-sm font-bold flex items-center justify-center shadow-xs cursor-pointer">+</button>
                                      )}
                                    </div>

                                    <span className="text-sm font-bold text-slate-400 font-mono">:</span>

                                    {/* Away score input */}
                                    <div className="flex items-center gap-1.5">
                                      {!locked && (
                                        <button onClick={() => handleScoreChange(match.id, 'away', userForecast?.awayScore || 0, -1)} className="w-7 h-7 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-sm font-bold flex items-center justify-center shadow-xs cursor-pointer">-</button>
                                      )}
                                      <div className="w-10 h-10 bg-white border border-slate-200 font-mono font-bold text-slate-850 rounded-xl flex items-center justify-center text-lg shadow-inner">
                                        {displayAwayScore !== undefined ? displayAwayScore : '-'}
                                      </div>
                                      {!locked && (
                                        <button onClick={() => handleScoreChange(match.id, 'away', userForecast?.awayScore || 0, 1)} className="w-7 h-7 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-sm font-bold flex items-center justify-center shadow-xs cursor-pointer">+</button>
                                      )}
                                    </div>
                                  </div>

                                  {match.phase !== 'group' && displayHomeScore !== undefined && displayAwayScore !== undefined && displayHomeScore === displayAwayScore && (
                                    <div className="flex flex-col items-center space-y-1.5 pt-2 border-t border-slate-100/50 w-full animate-fadeIn" id={`penalties-input-${match.id}`}>
                                      <span className="text-[9px] font-black text-rose-700 uppercase tracking-wider flex items-center gap-1">
                                        🎯 Marcador de Penales
                                      </span>
                                      <div className="flex items-center gap-4">
                                        {/* Home penalties input */}
                                        <div className="flex items-center gap-1.5">
                                          {!locked && (
                                            <button 
                                              type="button"
                                              onClick={() => handlePenaltyChange(match.id, 'home', userForecast?.homePenalties || 0, -1)} 
                                              className="w-6.5 h-6.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-xs font-bold flex items-center justify-center shadow-xs cursor-pointer"
                                            >-</button>
                                          )}
                                          <div className="w-8 h-8 bg-white border border-slate-200 font-mono font-bold text-slate-800 rounded-lg flex items-center justify-center text-sm shadow-inner">
                                            {displayHomePens !== undefined ? displayHomePens : '-'}
                                          </div>
                                          {!locked && (
                                            <button 
                                              type="button"
                                              onClick={() => handlePenaltyChange(match.id, 'home', userForecast?.homePenalties || 0, 1)} 
                                              className="w-6.5 h-6.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-xs font-bold flex items-center justify-center shadow-xs cursor-pointer"
                                            >+</button>
                                          )}
                                        </div>
                                        <span className="text-xs font-bold text-slate-400 font-mono">pens</span>
                                        {/* Away penalties input */}
                                        <div className="flex items-center gap-1.5">
                                          {!locked && (
                                            <button 
                                              type="button"
                                              onClick={() => handlePenaltyChange(match.id, 'away', userForecast?.awayPenalties || 0, -1)} 
                                              className="w-6.5 h-6.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-xs font-bold flex items-center justify-center shadow-xs cursor-pointer"
                                            >-</button>
                                          )}
                                          <div className="w-8 h-8 bg-white border border-slate-200 font-mono font-bold text-slate-800 rounded-lg flex items-center justify-center text-sm shadow-inner">
                                            {displayAwayPens !== undefined ? displayAwayPens : '-'}
                                          </div>
                                          {!locked && (
                                            <button 
                                              type="button"
                                              onClick={() => handlePenaltyChange(match.id, 'away', userForecast?.awayPenalties || 0, 1)} 
                                              className="w-6.5 h-6.5 bg-white hover:bg-slate-155 text-slate-700 border border-slate-200 rounded-md text-xs font-bold flex items-center justify-center shadow-xs cursor-pointer"
                                            >+</button>
                                          )}
                                        </div>
                                      </div>
                                      
                                      {displayHomePens !== undefined && displayAwayPens !== undefined && displayHomePens === displayAwayPens && (
                                        <span className="text-[9px] text-rose-600 font-extrabold select-none animate-pulse">
                                          ⚠️ Los penales no pueden quedar empatados.
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {!userForecast && !hasDraft && (
                                    <span className="text-[10px] text-amber-600 font-semibold mt-1">⚠️ Requiere ingresar pronóstico</span>
                                  )}

                                  {isPendingValue && !locked && (
                                    <div className="flex flex-col items-center gap-1.5 w-full mt-2">
                                      <span className="text-[10px] text-indigo-600 font-black animate-pulse uppercase tracking-wider">⚡ Cambios sin confirmar</span>
                                      <button
                                        onClick={() => handleCommitForecast(match.id)}
                                        disabled={savingMatchIds[match.id]}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] py-1 px-3 rounded-lg shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer"
                                      >
                                        {savingMatchIds[match.id] ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : <CheckSquare className="w-3.5 h-3.5" />}
                                        <span>Confirmar Pronóstico</span>
                                      </button>
                                    </div>
                                  )}

                                  {isPlayed && userForecast && (
                                    <div className="pt-2 border-t border-slate-100/50 w-full flex flex-col items-center gap-1">
                                      {(() => {
                                        const rating = getScoreBadge(match, userForecast);
                                        let totalPts = rating.points;
                                        const userPredictedDraw = userForecast.homeScore === userForecast.awayScore;
                                        if (match.phase !== 'group' && match.homeScore === match.awayScore && userPredictedDraw) {
                                          const penResult = calculatePenaltyScore(
                                            match.homePenalties,
                                            match.awayPenalties,
                                            userForecast.homePenalties,
                                            userForecast.awayPenalties
                                          );
                                          totalPts += penResult.score;
                                        }
                                        return (
                                          <>
                                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${rating.style}`}>{rating.label} (+{totalPts} Pts)</span>
                                            {match.phase !== 'group' && match.homeScore === match.awayScore && userPredictedDraw && (
                                              <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                                                Penales: {userForecast.homePenalties ?? 0} - {userForecast.awayPenalties ?? 0}
                                                {(() => {
                                                  const penResult = calculatePenaltyScore(
                                                    match.homePenalties,
                                                    match.awayPenalties,
                                                    userForecast.homePenalties,
                                                    userForecast.awayPenalties
                                                  );
                                                  if (penResult.score > 0) {
                                                    return <span className="text-emerald-600 font-bold ml-1"> ({penResult.reason} +{penResult.score})</span>;
                                                  }
                                                  return <span className="text-slate-400 font-semibold ml-1"> (No sumó en penales)</span>;
                                                })()}
                                              </div>
                                            )}
                                          </>
                                        );
                                      })()}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>

                            {/* ── ACTIONS ── */}
                            <div className="md:col-span-2 flex flex-col gap-2.5 items-center md:items-end justify-center w-full">
                              {isPendingValue && !locked && !currentUser.isAdmin && (
                                <button
                                  onClick={() => handleCommitForecast(match.id)}
                                  disabled={savingMatchIds[match.id]}
                                  className="w-full md:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md hover:shadow-lg transition-all transform hover:scale-105 active:scale-95 animate-pulse cursor-pointer border border-emerald-700"
                                >
                                  {savingMatchIds[match.id] ? (
                                    <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span><span>Guardando...</span></>
                                  ) : (
                                    <><CheckSquare className="w-4 h-4 text-emerald-100" /><span className="tracking-tight uppercase">APOSTAR ⚽</span></>
                                  )}
                                </button>
                              )}

                              {userForecast && !isPendingValue && !currentUser.isAdmin && (
                                <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-700 bg-emerald-50/80 border border-emerald-200 px-3 py-1.5 rounded-xl uppercase tracking-wider">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                                  <span>Apuesta Registrada</span>
                                </div>
                              )}


                              {match.status === 'finished' && (
                                <button
                                  onClick={() => setSelectedLiveMatch(match)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer w-full md:w-auto justify-center border bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                                >
                                  <Activity className="w-3.5 h-3.5 text-indigo-650" />
                                  <span>Ver Estadísticas</span>
                                </button>
                              )}
                              <button
                                onClick={() => setExpandedMatchId(expandedMatchId === match.id ? null : match.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold tracking-wide transition-all cursor-pointer w-full md:w-auto justify-center"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Ver amigos ({otherForecasts.length})</span>
                              </button>
                            </div>
                          </div>

                          {/* Friends forecasts panel */}
                          {expandedMatchId === match.id && (
                            <div className="bg-slate-50 p-4 border-t border-slate-150 text-xs space-y-2">
                              <h5 className="font-bold text-slate-600 uppercase text-[10px] tracking-widest flex items-center gap-1">
                                <Eye className="w-3.5 h-3.5 text-slate-400" />
                                Otros pronósticos de la liga para este encuentro:
                              </h5>
                              {otherForecasts.length === 0 ? (
                                <p className="text-slate-400 text-[11px] italic">No hay más amigos que hayan pronosticado este partido aún.</p>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                                  {otherForecasts.map((f) => {
                                    const userProfile = allUsers.find(u => u.id === f.userId);
                                    if (!userProfile) return null;
                                    const showFriendlyResult = isPlayed;
                                    const pointsResult = isPlayed ? getScoreBadge(match, f) : null;
                                    const scoreMasked = false; // Se muestran siempre en abierto a petición del usuario
                                    return (
                                      <div key={f.userId} className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-2 shadow-xs">
                                        <div className="flex items-center gap-2">
                                          <span className="text-lg">{userProfile.avatar}</span>
                                          <div>
                                            <span className="font-bold text-slate-800 block text-xs truncate max-w-[90px]">{userProfile.name}</span>
                                            {showFriendlyResult && pointsResult && (
                                              <span className="text-[9px] text-slate-400 block mt-0.5">{pointsResult.reason}</span>
                                            )}
                                          </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                          <div className="font-mono text-xs bg-slate-900 text-white px-2 py-1 rounded font-bold">
                                            {f.homeScore} - {f.awayScore}
                                          </div>
                                          {match.phase !== 'group' && f.homeScore === f.awayScore && f.homePenalties !== undefined && f.awayPenalties !== undefined && f.homePenalties !== null && f.awayPenalties !== null && (
                                            <span className="text-[10px] text-amber-500 font-bold mt-0.5">
                                              ({f.homePenalties} - {f.awayPenalties} pen.)
                                            </span>
                                          )}
                                          {showFriendlyResult && pointsResult && (
                                            <span className={`inline-block text-[9px] font-bold mt-1 px-1.5 rounded ${pointsResult.badgeColor}`}>
                                              {(() => {
                                                let pts = pointsResult.points;
                                                if (match.phase !== 'group' && match.homeScore === match.awayScore && f.homeScore === f.awayScore) {
                                                  const penResult = calculatePenaltyScore(
                                                    match.homePenalties,
                                                    match.awayPenalties,
                                                    f.homePenalties,
                                                    f.awayPenalties
                                                  );
                                                  pts += penResult.score;
                                                }
                                                return `+${pts} pts`;
                                              })()}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      )}

      {selectedLiveMatch && (
        <LiveMatchSimulator
          match={selectedLiveMatch}
          currentUser={currentUser}
          onClose={() => setSelectedLiveMatch(null)}
          onUpdateMatchResult={onUpdateMatchResult}
        />
      )}

      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden animate-slideUp">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Importar Pronósticos</h3>
                  <p className="text-[10px] text-slate-500">Copia tus pronósticos de otra liga</p>
                </div>
              </div>
              <button 
                onClick={() => setShowImportModal(false)}
                disabled={importing}
                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {(() => {
                const otherLeagues = allLeagues.filter(l => 
                  l.members.includes(currentUser.id) && 
                  l.code !== currentLeague?.code
                );
                const hasLegacy = forecasts.some(f => f.userId === currentUser.id && !f.leagueCode);

                if (otherLeagues.length === 0 && !hasLegacy) {
                  return (
                    <div className="text-center py-6 space-y-3">
                      <span className="text-3xl select-none">📭</span>
                      <h4 className="text-xs font-bold text-slate-700">No tienes otras ligas</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                        Para poder importar pronósticos, necesitas pertenecer a al menos otra liga activa donde ya hayas registrado marcadores.
                      </p>
                      <div className="pt-2">
                        <button 
                          onClick={() => setShowImportModal(false)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                        >
                          Entendido
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Seleccionar Liga de Origen</label>
                      <select 
                        value={selectedSourceLeagueCode}
                        onChange={(e) => {
                          setSelectedSourceLeagueCode(e.target.value);
                          setImportStatus('idle');
                          setImportResultText('');
                        }}
                        disabled={importing}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
                      >
                        <option value="">-- Elige una liga para copiar --</option>
                        {hasLegacy && (
                          <option value="__legacy__">
                            🕒 Pronósticos anteriores (Versión Global) ({forecasts.filter(f => f.userId === currentUser.id && !f.leagueCode).length} pronósticos)
                          </option>
                        )}
                        {otherLeagues.map(l => {
                          const count = forecasts.filter(f => f.userId === currentUser.id && f.leagueCode === l.code).length;
                          return (
                            <option key={l.code} value={l.code}>
                              {l.name} [{l.code}] ({count} pronósticos)
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {importStatus === 'idle' && selectedSourceLeagueCode && (
                      <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2.5">
                        <span className="text-base select-none mt-0.5">💡</span>
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-amber-800 uppercase block">Reglas de Importación</span>
                          <p className="text-[10px] text-amber-700 leading-normal">
                            Se copiarán únicamente los pronósticos de partidos que aún <strong>no hayan comenzado</strong> (kickoff en el futuro). Los marcadores en partidos cerrados no se alterarán.
                          </p>
                        </div>
                      </div>
                    )}

                    {importing && (
                      <div className="space-y-2 py-2">
                        <div className="flex justify-between items-center text-[10px] font-bold text-indigo-700">
                          <span className="animate-pulse">Importando marcadores...</span>
                          <span className="font-mono">{importProgress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                            style={{ width: `${importProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {importStatus === 'success' && (
                      <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-2.5 animate-fadeIn">
                        <span className="text-emerald-500 text-base mt-0.5">✅</span>
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-emerald-800 uppercase block">Importación Exitosa</span>
                          <p className="text-[10px] text-emerald-700 leading-normal">{importResultText}</p>
                        </div>
                      </div>
                    )}

                    {importStatus === 'error' && (
                      <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5 animate-fadeIn">
                        <span className="text-red-500 text-base mt-0.5">⚠️</span>
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-red-800 uppercase block">No se pudo importar</span>
                          <p className="text-[10px] text-red-700 leading-normal">{importResultText}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowImportModal(false)}
                        disabled={importing}
                        className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                      >
                        {importStatus === 'success' ? 'Cerrar' : 'Cancelar'}
                      </button>
                      
                      {importStatus !== 'success' && (
                        <button
                          type="button"
                          onClick={handleImportForecasts}
                          disabled={importing || !selectedSourceLeagueCode}
                          className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg cursor-pointer text-center"
                        >
                          {importing ? 'Importando...' : 'Confirmar Importación'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getScoreBadge(match: Match, forecast: Forecast) {
  if (match.homeScore === undefined || match.awayScore === undefined) {
    return { points: 0, label: 'Pendiente', style: 'bg-slate-100 text-slate-600', badgeColor: 'bg-slate-200 text-slate-700', reason: 'No se ha jugado' };
  }
  if (match.homeScore === forecast.homeScore && match.awayScore === forecast.awayScore) {
    return { points: 3, label: 'Acierto Perfecto 🎯', style: 'bg-emerald-100 text-emerald-800 border border-emerald-250', badgeColor: 'bg-emerald-500 text-white', reason: 'Marcador exacto' };
  }
  const realDiff = match.homeScore - match.awayScore;
  const predDiff = forecast.homeScore - forecast.awayScore;
  const realWinner = realDiff > 0 ? 'Home' : realDiff < 0 ? 'Away' : 'Draw';
  const predWinner = predDiff > 0 ? 'Home' : predDiff < 0 ? 'Away' : 'Draw';
  if (realWinner !== predWinner) {
    return { points: 0, label: 'Sin Puntos ❌', style: 'bg-slate-100 text-slate-500', badgeColor: 'bg-slate-500 text-white', reason: 'Diferente ganador' };
  }
  if (realWinner === 'Draw' && predWinner === 'Draw') {
    return { points: 2, label: 'Tendencia (Empate) 📈', style: 'bg-indigo-100 text-indigo-800', badgeColor: 'bg-indigo-500 text-white', reason: 'Mismo empate, goles dif.' };
  }
  if (realDiff === predDiff) {
    return { points: 2, label: 'Tendencia (Diferencia) 📈', style: 'bg-indigo-100 text-indigo-800', badgeColor: 'bg-indigo-500 text-white', reason: 'Misma diferencia de goles' };
  }
  return { points: 1, label: 'Acierto Simple ⚽', style: 'bg-blue-100 text-blue-800', badgeColor: 'bg-blue-500 text-white', reason: 'Solo ganador' };
}