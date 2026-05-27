import React, { useState } from 'react';
import { UserStats, UserProfile, Match, Forecast, League } from '../types';
import { Trophy, Award, Search, Percent, Medal, BarChart2, Calendar } from 'lucide-react';
import { calculateScore } from '../utils/scoring';
import TeamFlag from './TeamFlag';

interface LeaderboardProps {
  stats: UserStats[];
  currentUser: UserProfile;
  matches?: Match[];
  forecasts?: Forecast[];
  users?: UserProfile[];
  currentLeague?: League | null;
}

export default function Leaderboard({ 
  stats, 
  currentUser,
  matches = [],
  forecasts = [],
  users = [],
  currentLeague = null
}: LeaderboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDateFilter, setActiveDateFilter] = useState<string>('all');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  // Obtener fechas únicas del torneo
  const uniqueDates = React.useMemo(() => {
    if (!matches || matches.length === 0) return [];
    const dates = matches.map(m => m.dateTime.split('T')[0]);
    return Array.from(new Set(dates)).sort();
  }, [matches]);

  // Obtener partidos jugados vs totales para una fecha
  const getDateStats = (dateStr: string) => {
    const dayMatches = matches.filter(m => m.dateTime.startsWith(dateStr));
    const finished = dayMatches.filter(m => m.status === 'finished').length;
    return {
      total: dayMatches.length,
      finished
    };
  };

  // Convertir string de fecha en etiqueta de día corta
  const getDayShortLabel = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00Z');
    const weekday = d.toLocaleDateString('es-ES', { weekday: 'short', timeZone: 'UTC' }).replace('.', '');
    const capitalizedW = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    const dayNum = d.getUTCDate();
    const monthName = d.toLocaleDateString('es-ES', { month: 'short', timeZone: 'UTC' });
    return `${capitalizedW} ${dayNum} ${monthName}`;
  };

  // Convertir string de fecha en etiqueta de cabecera larga
  const formatDateHeader = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00Z');
    const dayName = d.toLocaleDateString('es-ES', { weekday: 'long', timeZone: 'UTC' });
    const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    const dayNum = d.getUTCDate();
    const monthName = d.toLocaleDateString('es-ES', { month: 'short', timeZone: 'UTC' });
    return `${capitalizedDay} ${dayNum} de ${monthName}`;
  };

  // Función interna para calcular estadísticas de un grupo selecto de partidos
  const calculatePointsForMatches = (targetMatches: Match[]): UserStats[] => {
    // Ensure active participants is initialized as a copy of users
    const activeParticipantsMap = new Map<string, UserProfile>();
    
    // Add all registered users
    if (users && users.length > 0) {
      users.forEach(u => {
        if (u && u.id) activeParticipantsMap.set(u.id, u);
      });
    }

    // Make sure currentUser is always included
    if (currentUser && currentUser.id) {
      activeParticipantsMap.set(currentUser.id, currentUser);
    }

    // Identify all unique userIds that have submitted forecasts
    if (forecasts && forecasts.length > 0) {
      forecasts.forEach((f) => {
        if (f && f.userId && f.userId !== 'undefined' && !activeParticipantsMap.has(f.userId)) {
          // Find if this is a known user from our static data or construct a placeholder
          const placeholderName = f.userId === currentUser?.id 
            ? currentUser.name 
            : `Participante (${f.userId.substring(0, 5)})`;
          const placeholderAvatar = f.userId === currentUser?.id
            ? currentUser.avatar
            : '👤';
            
          activeParticipantsMap.set(f.userId, {
            id: f.userId,
            name: placeholderName,
            avatar: placeholderAvatar
          });
        }
      });
    }

    let activeParticipants = Array.from(activeParticipantsMap.values());

    // Filter active users based on the selected league
    if (currentLeague) {
      const activeMemberIds = currentLeague.members || [];
      activeParticipants = activeParticipants.filter(u => 
        activeMemberIds.includes(u.id) || u.id === currentUser.id
      );
    }

    const leaderboard: UserStats[] = activeParticipants.map((user) => {
      let exactMatchesCount = 0;
      let trendMatchesCount = 0;
      let simpleMatchesCount = 0;
      let noMatchesCount = 0;
      let totalPoints = 0;
      let pendingMatchesCount = 0;

      targetMatches.forEach((match) => {
        if (match.status === 'finished' && match.homeScore !== undefined && match.awayScore !== undefined) {
          const forecast = forecasts.find(f => f.matchId === match.id && f.userId === user.id);
          
          if (forecast) {
            const result = calculateScore(match.homeScore, match.awayScore, forecast.homeScore, forecast.awayScore);
            totalPoints += result.score;
            
            if (result.category === 'perfect') exactMatchesCount++;
            else if (result.category === 'trend') trendMatchesCount++;
            else if (result.category === 'simple') simpleMatchesCount++;
            else if (result.category === 'none') noMatchesCount++;
          } else {
            noMatchesCount++;
          }
        } else {
          const forecast = forecasts.find(f => f.matchId === match.id && f.userId === user.id);
          if (forecast) {
            pendingMatchesCount++;
          }
        }
      });

      return {
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        exactMatchesCount,
        trendMatchesCount,
        simpleMatchesCount,
        noMatchesCount,
        totalPoints,
        pendingMatchesCount
      };
    });

    return leaderboard.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      if (b.exactMatchesCount !== a.exactMatchesCount) {
        return b.exactMatchesCount - a.exactMatchesCount;
      }
      return b.trendMatchesCount - a.trendMatchesCount;
    });
  };

  // Determinar la fuente de datos (acumulado o diario de partidos)
  const currentStatsSource = React.useMemo(() => {
    if (activeDateFilter === 'all') {
      return stats;
    }
    const dayMatches = matches.filter(m => m.dateTime.startsWith(activeDateFilter));
    return calculatePointsForMatches(dayMatches);
  }, [activeDateFilter, stats, matches, forecasts, users, currentLeague]);

  // Filtrar clasificaciones basadas en búsqueda
  const filteredStats = currentStatsSource.filter(stat =>
    stat.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // El primero, segundo y tercer lugar del ranking
  const podiumList = currentStatsSource.slice(0, 3);
  const remainderList = filteredStats.slice(3);

  // Obtener colores representativos del podium
  const getPodiumBadgeStyle = (index: number) => {
    switch (index) {
      case 0: // 1er Lugar
        return {
          bg: 'bg-gradient-to-tr from-amber-400 to-amber-500',
          textColor: 'text-amber-950',
          borderColor: 'border-amber-300',
          shadow: 'shadow-amber-250',
          badge: '🥇 1er Lugar'
        };
      case 1: // 2do Lugar
        return {
          bg: 'bg-gradient-to-tr from-slate-300 to-slate-400',
          textColor: 'text-slate-900',
          borderColor: 'border-slate-200',
          shadow: 'shadow-slate-200',
          badge: '🥈 2do Lugar'
        };
      case 2: // 3er Lugar
        return {
          bg: 'bg-gradient-to-tr from-amber-600 to-amber-700',
          textColor: 'text-amber-100',
          borderColor: 'border-amber-500',
          shadow: 'shadow-amber-700/20',
          badge: '🥉 3er Lugar'
        };
      default:
        return {
          bg: 'bg-slate-100',
          textColor: 'text-slate-800',
          borderColor: 'border-slate-200',
          shadow: 'shadow-none',
          badge: 'Participante'
        };
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-8" id="leaderboard-root-container">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 font-sans">
            <Trophy className="w-6 h-6 text-amber-500" />
            Tabla de Posiciones
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {activeDateFilter === 'all' 
              ? 'Ranking dinámico de mayor a menor puntuación acumulada de todos los días.'
              : `Puntaje obtenido únicamente en la jornada del ${formatDateHeader(activeDateFilter)}.`}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar amigo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 font-medium transition-all"
          />
        </div>
      </div>

      {/* Date Filter Tabs for Daily Leaderboards */}
      {matches && matches.length > 0 && uniqueDates.length > 0 && (
        <div className="flex flex-col gap-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200/65" id="leaderboard-date-filter">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5">
            <span className="text-[10px] uppercase font-black text-indigo-700 tracking-wider flex items-center gap-1.5 select-none">
              <Calendar className="w-4 h-4 text-indigo-600 animate-pulse" />
              Filtrar Clasificación (Apuestas Diarias)
            </span>
            <span className="text-[10px] text-slate-505 text-slate-500 font-semibold">
              Elige entre el acumulado total o el desempeño en un día específico para hacer apuestas diarias.
            </span>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-200">
            {/* All-time option */}
            <button
              id="btn-lead-filter-all"
              onClick={() => setActiveDateFilter('all')}
              className={`px-3.5 py-1.5 text-xs font-black rounded-full whitespace-nowrap transition-all border shrink-0 flex items-center gap-1.5 cursor-pointer select-none ${
                activeDateFilter === 'all'
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 shrink-0" />
              <span>🌐 General de Todos los Días</span>
            </button>

            {/* Individual Dates */}
            {uniqueDates.map((dateStr) => {
              const { total, finished } = getDateStats(dateStr);
              if (total === 0) return null;

              const isSelected = activeDateFilter === dateStr;
              
              return (
                <button
                  key={dateStr}
                  id={`btn-lead-filter-${dateStr}`}
                  onClick={() => setActiveDateFilter(dateStr)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-full whitespace-nowrap transition-all border shrink-0 flex items-center gap-2 cursor-pointer select-none ${
                    isSelected
                      ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                  }`}
                >
                  <span>📅 {getDayShortLabel(dateStr)}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold font-mono ${
                    isSelected
                      ? 'bg-amber-750 bg-amber-700 text-amber-50'
                      : finished === total && total > 0
                        ? 'bg-emerald-105 bg-emerald-100 text-emerald-800'
                        : finished > 0
                          ? 'bg-indigo-105 bg-indigo-100 text-indigo-800 border border-indigo-200'
                          : 'bg-slate-105 bg-slate-100 text-slate-500'
                  }`}>
                    {finished}/{total} jugados
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Podium Render (Show only if stats has records) */}
      {currentStatsSource.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 max-w-4xl mx-auto" id="dynamic-podium">
          {/* order 2nd place first on desktop for symmetric look, then 1st place, then 3rd */}
          {[1, 0, 2].map((podiumIndex) => {
            const userStat = podiumList[podiumIndex];
            if (!userStat) return null;
            const styles = getPodiumBadgeStyle(podiumIndex);
            const isCurrentUserInstance = userStat.userId === currentUser.id;

            return (
              <div
                key={userStat.userId}
                className={`rounded-2xl border p-5 flex flex-col items-center justify-between text-center relative transition-all ${
                  podiumIndex === 0 
                    ? 'border-amber-200 bg-amber-50/20 scale-105 shadow-md md:-translate-y-2' 
                    : 'border-slate-100 bg-slate-50/50'
                } ${isCurrentUserInstance ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
                style={{ order: podiumIndex === 0 ? 2 : podiumIndex === 1 ? 1 : 3 }}
              >
                {/* Score badge at top left */}
                <span className={`absolute top-3 left-3 px-2 py-0.5 rounded-md text-[10px] font-bold ${styles.bg} ${styles.textColor}`}>
                  {styles.badge}
                </span>

                <div className="mt-4 flex flex-col items-center space-y-2">
                  <div className="w-16 h-16 rounded-full bg-white border border-slate-200 flex items-center justify-center text-4xl shadow-xs">
                    {userStat.userAvatar}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm truncate max-w-[150px] font-sans">
                      {userStat.userName}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">
                      {isCurrentUserInstance ? 'Tú' : 'Amigo'}
                    </p>
                  </div>
                </div>

                {/* Score points card */}
                <div className="w-full bg-white rounded-xl border border-slate-100 p-3 mt-4 space-y-2">
                  <span className="text-2xl font-black text-slate-800 block leading-none">
                    {userStat.totalPoints} <span className="text-xs font-semibold text-slate-400">Pts</span>
                  </span>

                  {/* Tiny break downs stats */}
                  <div className="flex justify-around text-[10px] text-slate-500 font-medium">
                    <span title="Acierto Perfecto (3pts)" className="text-emerald-600">🎯 {userStat.exactMatchesCount}</span>
                    <span title="Acierto de Tendencia (2pts)" className="text-indigo-600">📈 {userStat.trendMatchesCount}</span>
                    <span title="Acierto Simple (1pt)" className="text-blue-600">⚽ {userStat.simpleMatchesCount}</span>
                  </div>

                  {userStat.pendingMatchesCount !== undefined && userStat.pendingMatchesCount > 0 && (
                    <div className="pt-1.5 border-t border-slate-100 flex items-center justify-center gap-1 text-[9px] font-black uppercase text-amber-700 tracking-wider animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                      <span>⏳ {userStat.pendingMatchesCount} apuestas pendientes</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Remainder list render as table */}
      <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-xs" id="leaderboard-grid-view">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-indigo-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 text-center w-12">Pos</th>
                <th className="py-3.5 px-4">Usuario</th>
                <th className="py-3.5 px-4 text-center">🏆 Aciertos Perfectos (3p)</th>
                <th className="py-3.5 px-4 text-center">📈 Ac. Tendencia (2p)</th>
                <th className="py-3.5 px-4 text-center">⚽ Ac. Simples (1p)</th>
                <th className="py-3.5 px-4 text-center">❌ Errores (0p)</th>
                <th className="py-3.5 px-4 text-center">⏳ Apuestas Pendientes</th>
                <th className="py-3.5 px-4 text-right pr-6">Puntaje Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
              {filteredStats.map((userStat, index) => {
                const isCurrentUserRow = userStat.userId === currentUser.id;
                const position = index + 1;
                const isExpanded = expandedUserId === userStat.userId;

                return (
                  <React.Fragment key={userStat.userId}>
                    <tr
                      onClick={() => setExpandedUserId(isExpanded ? null : userStat.userId)}
                      className={`hover:bg-indigo-50/20 transition-all cursor-pointer ${
                        isCurrentUserRow ? 'bg-indigo-50/30' : ''
                      } ${isExpanded ? 'bg-indigo-50/15' : ''}`}
                      title="Haz clic para ver las apuestas pendientes de este usuario"
                    >
                      <td className="py-3 px-4 text-center font-bold">
                        {position <= 3 ? (
                          <span className={`inline-flex w-6 h-6 rounded-full items-center justify-center text-xs ${
                            position === 1 ? 'bg-amber-100 text-amber-700' :
                            position === 2 ? 'bg-slate-200 text-slate-700' :
                            'bg-amber-150 text-amber-800 bg-amber-50'
                          }`}>
                            {position}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono">{position}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{userStat.userAvatar}</span>
                          <div>
                            <span className="font-bold text-slate-900">{userStat.userName}</span>
                            {isCurrentUserRow && (
                              <span className="ml-1.5 px-1.5 py-0.5 bg-indigo-100 text-indigo-800 text-[9px] font-bold rounded">
                                Tú
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-emerald-600">
                        {userStat.exactMatchesCount}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-indigo-600">
                        {userStat.trendMatchesCount}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-blue-600">
                        {userStat.simpleMatchesCount}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-400">
                        {userStat.noMatchesCount}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {userStat.pendingMatchesCount && userStat.pendingMatchesCount > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-bold font-mono text-[10px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                            <span>⏳ {userStat.pendingMatchesCount} pend.</span>
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right pr-6 font-mono font-extrabold text-sm text-slate-900">
                        {userStat.totalPoints} pts
                      </td>
                    </tr>

                    {/* Sub-fila expandible con el detalle de pronósticos pendientes */}
                    {isExpanded && (
                      <tr className="bg-slate-50/50">
                        <td colSpan={8} className="py-3 px-5 border-y border-slate-100">
                          <div className="bg-white rounded-2xl border border-indigo-100 p-4 space-y-3.5 shadow-xs max-w-2xl mx-auto">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider flex items-center gap-1.5 align-middle select-none">
                                <Calendar className="w-4 h-4 text-indigo-600 animate-pulse" />
                                Detalle de Pronósticos de {userStat.userName} {activeDateFilter !== 'all' ? `(${getDayShortLabel(activeDateFilter)})` : ''}
                              </span>
                              <span className="text-[9px] text-slate-400 font-semibold">
                                Partidos programados o en juego en vivo
                              </span>
                            </div>

                            <div className="grid grid-cols-1 gap-2">
                              {(() => {
                                const matchesToShow = activeDateFilter === 'all'
                                  ? matches.filter(m => m.status !== 'finished')
                                  : matches.filter(m => m.status !== 'finished' && m.dateTime.startsWith(activeDateFilter));

                                if (matchesToShow.length === 0) {
                                  return (
                                    <p className="text-[11px] text-slate-400 italic py-2 text-center select-none">
                                      No hay partidos programados para esta fecha.
                                    </p>
                                  );
                                }

                                return matchesToShow.map(m => {
                                  const forecast = forecasts.find(f => f.matchId === m.id && f.userId === userStat.userId);

                                  return (
                                    <div key={m.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 border border-slate-200/60 p-2.5 rounded-xl text-xs gap-3 hover:border-indigo-150 transition-all">
                                      <div className="flex items-center gap-2 select-none">
                                        <span className="text-xs font-semibold flex items-center gap-1.5">
                                          <TeamFlag team={m.homeTeam} size="sm" />
                                          {m.homeTeam.name}
                                        </span>
                                        <span className="text-slate-400 font-bold text-[9px] uppercase">vs</span>
                                        <span className="text-xs font-semibold flex items-center gap-1.5">
                                          <TeamFlag team={m.awayTeam} size="sm" />
                                          {m.awayTeam.name}
                                        </span>
                                      </div>
                                      
                                      <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-between shrink-0">
                                        {forecast ? (
                                          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-800 text-[10px] font-black rounded-lg border border-indigo-100">
                                            Apuesta: {forecast.homeScore} - {forecast.awayScore}
                                          </span>
                                        ) : (
                                          <div className="flex flex-col items-end">
                                            <span className="px-2 py-1 bg-amber-50 border border-amber-250 text-amber-700 text-[9px] font-bold rounded-lg leading-none">
                                              ⚠️ Sin Pronóstico (Pendiente)
                                            </span>
                                            {isCurrentUserRow && (
                                              <span className="text-[8px] text-indigo-400 mt-1 font-semibold">
                                                ¡Agrégalo en la pestaña "Calendario"!
                                              </span>
                                            )}
                                          </div>
                                        )}

                                        {m.status === 'live' ? (
                                          <span className="px-2 py-0.5 bg-rose-600 border border-rose-700 text-white font-extrabold text-[8px] uppercase tracking-wider rounded-md animate-pulse shrink-0">
                                            🔴 En Vivo ({m.homeScore ?? 0} - {m.awayScore ?? 0})
                                          </span>
                                        ) : (
                                          <span className="px-2 py-0.5 bg-slate-200 text-slate-600 font-bold text-[8px] uppercase tracking-wider rounded-md shrink-0">
                                            Por Jugar
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {filteredStats.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400 italic">
                    Sin resultados coincidentes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
