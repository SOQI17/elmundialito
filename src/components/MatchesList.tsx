import React, { useState, useEffect } from 'react';
import { Match, MatchPhase, Forecast, UserProfile } from '../types';
import { Lock, Unlock, Calendar, Eye, Activity, CheckSquare, Sparkles, Tv } from 'lucide-react';
import LiveMatchSimulator from './LiveMatchSimulator';
import TeamFlag from './TeamFlag';

interface MatchesListProps {
  matches: Match[];
  forecasts: Forecast[];
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onSaveForecast: (matchId: string, homeScore: number, awayScore: number) => void;
  onUpdateMatchResult: (
    matchId: string,
    homeScore: number | undefined,
    awayScore: number | undefined,
    status: Match['status']
  ) => void;
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
  onUpdateMatchResult
}: MatchesListProps) {
  const [activePhase, setActivePhase] = useState<MatchPhase>('group');
  const [activeGroupFilter, setActiveGroupFilter] = useState<string>('all');
  const [activeDateFilter, setActiveDateFilter] = useState<string>('all');
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { homeScore: number; awayScore: number }>>({});
  const [savingMatchIds, setSavingMatchIds] = useState<Record<string, boolean>>({});
  const [selectedLiveMatch, setSelectedLiveMatch] = useState<Match | null>(null);
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const isMatchLocked = (match: Match): boolean => {
    if (match.status === 'live' || match.status === 'finished') return true;
    const kickoff = new Date(match.dateTime).getTime();
    return now.getTime() >= kickoff;
  };

  const getLockReason = (match: Match): string => {
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

  const getDateStats = (dateStr: string) => {
    const dayMatches = matches.filter(m => m.phase === activePhase && getLocalDateStr(m.dateTime) === dateStr);
    return {
      totalCount: dayMatches.length,
      predictedCount: dayMatches.filter(m => forecasts.some(f => f.matchId === m.id && f.userId === currentUser.id)).length
    };
  };

  const getMyForecast = (matchId: string): Forecast | undefined =>
    forecasts.find(f => f.matchId === matchId && f.userId === currentUser.id);

  const handleScoreChange = (matchId: string, team: 'home' | 'away', currentVal: number, step: number) => {
    const forecast = getMyForecast(matchId);
    const draft = drafts[matchId];
    let homeS = draft ? draft.homeScore : (forecast ? forecast.homeScore : 0);
    let awayS = draft ? draft.awayScore : (forecast ? forecast.awayScore : 0);
    if (team === 'home') homeS = Math.max(0, homeS + step);
    else awayS = Math.max(0, awayS + step);
    setDrafts(prev => ({ ...prev, [matchId]: { homeScore: homeS, awayScore: awayS } }));
  };

  const handleCommitForecast = async (matchId: string) => {
    const draft = drafts[matchId];
    if (!draft) return;
    setSavingMatchIds(prev => ({ ...prev, [matchId]: true }));
    try {
      await onSaveForecast(matchId, draft.homeScore, draft.awayScore);
      setDrafts(prev => { const copy = { ...prev }; delete copy[matchId]; return copy; });
    } catch (err) {
      console.error('Error al guardar pronóstico:', err);
    } finally {
      setSavingMatchIds(prev => ({ ...prev, [matchId]: false }));
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
          <h2 className="text-xl font-bold text-slate-900 font-sans">Calendario de Partidos</h2>
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

      {/* Phase tabs */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-slate-50 rounded-xl" id="phase-tabs-container">
        {(['group', 'dieciseisavos', 'octavos', 'cuartos', 'semifinal', 'final'] as MatchPhase[]).map((phase) => (
          <button
            key={phase}
            onClick={() => { setActivePhase(phase); setActiveGroupFilter('all'); setActiveDateFilter('all'); }}
            className={`flex-1 min-w-[100px] text-center px-3 py-2 text-xs font-bold rounded-lg transition-all ${
              activePhase === phase ? 'bg-white text-slate-900 shadow-xs border border-slate-150' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            {PHASES_LABELS[phase]}
          </button>
        ))}
      </div>

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
                return (
                  <button
                    key={dateStr}
                    onClick={() => setActiveDateFilter(dateStr)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-full whitespace-nowrap transition-all border shrink-0 flex items-center gap-1.5 ${
                      isSelected ? 'bg-amber-500 border-amber-500 text-white shadow-sm' : 'bg-slate-50 border-slate-200/60 text-slate-600 hover:text-indigo-950 hover:bg-slate-100'
                    }`}
                  >
                    <span>{getDayShortLabel(dateStr)}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold font-mono ${
                      isSelected ? 'bg-white/20 text-white' : allDone ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
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

              return (
                <div key={dateKey} className="space-y-4">
                  <div className="flex items-center gap-2.5 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200/40">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse shadow-sm"></span>
                    <h3 className="text-xs font-black text-slate-700 tracking-tight uppercase">
                      📅 {formatDateHeader(dateKey)}
                    </h3>
                    <span className="text-[10px] bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded-full font-mono">
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
                      const isPendingValue = hasDraft && (!userForecast || userForecast.homeScore !== draft.homeScore || userForecast.awayScore !== draft.awayScore);
                      const displayHomeScore = hasDraft ? draft.homeScore : (userForecast ? userForecast.homeScore : undefined);
                      const displayAwayScore = hasDraft ? draft.awayScore : (userForecast ? userForecast.awayScore : undefined);
                      const otherForecasts = forecasts.filter(f => f.matchId === match.id && f.userId !== currentUser.id);

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
                                  <div className="flex items-center gap-2 bg-slate-900 text-white font-mono font-bold text-lg px-3 py-1.5 rounded-lg">
                                    <span>{match.homeScore}</span>
                                    <span className="text-slate-500">-</span>
                                    <span>{match.awayScore}</span>
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

                                  {!userForecast && !hasDraft && (
                                    <span className="text-[10px] text-amber-600 font-semibold">⚠️ Requiere ingresar pronóstico</span>
                                  )}

                                  {isPendingValue && !locked && (
                                    <div className="flex flex-col items-center gap-1.5 w-full">
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
                                    <div className="pt-2 border-t border-slate-100/50 w-full flex justify-center">
                                      {(() => {
                                        const rating = getScoreBadge(match, userForecast);
                                        return <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${rating.style}`}>{rating.label} (+{rating.points} Pts)</span>;
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

                              {match.status !== 'scheduled' && (
                                <button
                                  onClick={() => setSelectedLiveMatch(match)}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer w-full md:w-auto justify-center border ${
                                    match.status === 'live'
                                      ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-700 shadow-sm animate-pulse'
                                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                                  }`}
                                >
                                  <Tv className="w-3.5 h-3.5" />
                                  <span>{match.status === 'live' ? '🔴 En Vivo' : '📺 Ver Repetición'}</span>
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
                                    const scoreMasked = !locked;
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
                                          {scoreMasked ? (
                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 font-semibold text-[10px] rounded-md flex items-center gap-1.5">
                                              <Lock className="w-3 h-3 text-slate-400" /> Oculto
                                            </span>
                                          ) : (
                                            <div className="font-mono text-xs bg-slate-900 text-white px-2 py-1 rounded font-bold">{f.homeScore} - {f.awayScore}</div>
                                          )}
                                          {showFriendlyResult && pointsResult && (
                                            <span className={`inline-block text-[9px] font-bold mt-1 px-1.5 rounded ${pointsResult.badgeColor}`}>+{pointsResult.points} pts</span>
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