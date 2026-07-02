import React, { useState } from 'react';
import { UserStats, UserProfile, Match, Forecast, League, MatchPhase } from '../types';
import { Trophy, Award, Search, Percent, Medal, BarChart2, Calendar, ChevronDown, ChevronUp, BookOpen, Coins } from 'lucide-react';
import { calculateScore } from '../utils/scoring';
import { TEAMS } from '../data';
import TeamFlag from './TeamFlag';

interface LeaderboardProps {
  stats: UserStats[];
  currentUser: UserProfile;
  matches?: Match[];
  forecasts?: Forecast[];
  users?: UserProfile[];
  currentLeague?: League | null;
  activePhase?: MatchPhase;
  onChangePhase?: (phase: MatchPhase) => void;
  tournamentResults?: { realChampion?: string; realScorer?: string; realAssister?: string } | null;
}

export default function Leaderboard({ 
  stats, 
  currentUser,
  matches = [],
  forecasts = [],
  users = [],
  currentLeague = null,
  activePhase,
  onChangePhase,
  tournamentResults = null
}: LeaderboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDateFilter, setActiveDateFilter] = useState<string>('all');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(false);

  // Active pool ID (sectional phase or custom group id)
  const [activePoolId, setActivePoolId] = useState<string>(() => {
    if (currentLeague?.gameMode === 'sectional') {
      return activePhase || 'group';
    }
    if (currentLeague?.gameMode === 'custom' && currentLeague.customGroups && currentLeague.customGroups.length > 0) {
      if (activePhase) {
        const matchingGroup = currentLeague.customGroups.find(g => g.phases.includes(activePhase));
        if (matchingGroup) return matchingGroup.id;
      }
      return currentLeague.customGroups[0].id;
    }
    return 'total';
  });

  React.useEffect(() => {
    if (currentLeague?.gameMode === 'sectional') {
      setActivePoolId(activePhase || 'group');
    } else if (currentLeague?.gameMode === 'custom' && currentLeague.customGroups && currentLeague.customGroups.length > 0) {
      if (activePhase) {
        const matchingGroup = currentLeague.customGroups.find(g => g.phases.includes(activePhase));
        if (matchingGroup) {
          setActivePoolId(matchingGroup.id);
          return;
        }
      }
      setActivePoolId(currentLeague.customGroups[0].id);
    } else {
      setActivePoolId('total');
    }
  }, [currentLeague?.code, currentLeague?.gameMode, activePhase]);

  // Selected pool matches
  const poolMatches = React.useMemo(() => {
    if (!currentLeague || !currentLeague.gameMode || currentLeague.gameMode === 'total') {
      return matches;
    }
    if (currentLeague.gameMode === 'sectional') {
      return matches.filter(m => m.phase === activePoolId);
    }
    if (currentLeague.gameMode === 'custom') {
      const group = currentLeague.customGroups?.find(g => g.id === activePoolId);
      if (group) {
        return matches.filter(m => group.phases.includes(m.phase));
      }
    }
    return matches;
  }, [matches, currentLeague, activePoolId]);

  // Info del siguiente pozo si el actual terminó
  const nextPoolInfo = React.useMemo(() => {
    if (!currentLeague || !currentLeague.gameMode || poolMatches.length === 0) return null;
    
    // Check if ALL matches in the current pool have status === 'finished'
    const isFinished = poolMatches.every(m => m.status === 'finished');
    if (!isFinished) return null;
    
    if (currentLeague.gameMode === 'sectional') {
      const phasesOrder: MatchPhase[] = ['group', 'dieciseisavos', 'octavos', 'cuartos', 'semifinal', 'final'];
      const currentIndex = phasesOrder.indexOf(activePoolId as MatchPhase);
      
      if (currentIndex !== -1 && currentIndex < phasesOrder.length - 1) {
        const nextPhase = phasesOrder[currentIndex + 1];
        // Check if there are matches in that next phase to ensure it has data
        const nextPhaseMatches = matches.filter(m => m.phase === nextPhase);
        if (nextPhaseMatches.length === 0) return null;
        
        const nextPhaseLabels: Record<MatchPhase, string> = {
          group: 'Fase de Grupos',
          dieciseisavos: 'Dieciseisavos de Final',
          octavos: 'Octavos de Final',
          cuartos: 'Cuartos de Final',
          semifinal: 'Semifinal',
          final: 'Gran Final'
        };
        const currentPhaseLabels: Record<MatchPhase, string> = {
          group: 'Fase de Grupos',
          dieciseisavos: 'Dieciseisavos',
          octavos: 'Octavos de Final',
          cuartos: 'Cuartos de Final',
          semifinal: 'Semifinal',
          final: 'Gran Final'
        };
        return {
          nextId: nextPhase,
          nextName: nextPhaseLabels[nextPhase],
          currentName: currentPhaseLabels[activePoolId as MatchPhase] || activePoolId
        };
      }
    }
    
    if (currentLeague.gameMode === 'custom' && currentLeague.customGroups) {
      const currentIndex = currentLeague.customGroups.findIndex(g => g.id === activePoolId);
      
      if (currentIndex !== -1 && currentIndex < currentLeague.customGroups.length - 1) {
        const currentGroup = currentLeague.customGroups[currentIndex];
        const nextGroup = currentLeague.customGroups[currentIndex + 1];
        
        return {
          nextId: nextGroup.id,
          nextName: nextGroup.name,
          currentName: currentGroup.name
        };
      }
    }
    
    return null;
  }, [matches, poolMatches, currentLeague, activePoolId]);

  const handleStartNextPool = () => {
    if (nextPoolInfo) {
      setActivePoolId(nextPoolInfo.nextId);
      setActiveDateFilter('all');
      if (onChangePhase) {
        if (currentLeague?.gameMode === 'sectional') {
          onChangePhase(nextPoolInfo.nextId as MatchPhase);
        } else if (currentLeague?.gameMode === 'custom' && currentLeague.customGroups) {
          const nextGroup = currentLeague.customGroups.find(g => g.id === nextPoolInfo.nextId);
          if (nextGroup && nextGroup.phases.length > 0) {
            onChangePhase(nextGroup.phases[0]);
          }
        }
      }
    }
  };

  const getLocalDateStr = (dateStr: string) => {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Obtener fechas únicas del torneo
  const uniqueDates = React.useMemo(() => {
    if (!poolMatches || poolMatches.length === 0) return [];
    const dates = poolMatches.map(m => getLocalDateStr(m.dateTime));
    return Array.from(new Set(dates)).sort();
  }, [poolMatches]);

  // Obtener partidos jugados vs totales para una fecha
  const getDateStats = (dateStr: string) => {
    const dayMatches = poolMatches.filter(m => getLocalDateStr(m.dateTime) === dateStr);
    const finished = dayMatches.filter(m => m.status === 'finished').length;
    return {
      total: dayMatches.length,
      finished
    };
  };

  // Convertir string de fecha en etiqueta de día corta
  const getDayShortLabel = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    const weekday = d.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '');
    const capitalizedW = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    const monthName = d.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '');
    return `${capitalizedW} ${day} ${monthName}`;
  };

  // Convertir string de fecha en etiqueta de cabecera larga
  const formatDateHeader = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    const dayName = d.toLocaleDateString('es-ES', { weekday: 'long' });
    const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    const monthName = d.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '');
    return `${capitalizedDay} ${day} de ${monthName}`;
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

    let activeParticipants = Array.from(activeParticipantsMap.values()).filter(u => !u.isAdmin);

    // Filter active users based on the selected league
    if (currentLeague) {
      const activeMemberIds = currentLeague.members || [];
      activeParticipants = activeParticipants.filter(u => 
        activeMemberIds.includes(u.id)
      );
    }

    const leaderboard: UserStats[] = activeParticipants.map((user) => {
      let exactMatchesCount = 0;
      let trendMatchesCount = 0;
      let simpleMatchesCount = 0;
      let noMatchesCount = 0;
      let totalPoints = 0;
      let pendingMatchesCount = 0;
      let predictionsMadeCount = 0;

      targetMatches.forEach((match) => {
        const forecast = forecasts.find(f => f.matchId === match.id && f.userId === user.id && (!currentLeague || f.leagueCode === currentLeague.code));
        
        if (forecast) {
          predictionsMadeCount++;
        }

        if (match.status === 'finished' && match.homeScore !== undefined && match.awayScore !== undefined) {
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
          if (forecast) {
            pendingMatchesCount++;
          }
        }
      });

      // Extra points for tournament predictions
      let championPoints = 0;
      let scorerPoints = 0;
      let assisterPoints = 0;
      if (tournamentResults) {
        if (tournamentResults.realChampion && user.predictedChampion === tournamentResults.realChampion) {
          championPoints = 5;
        }
        if (
          tournamentResults.realScorer && 
          user.predictedScorer && 
          user.predictedScorer.trim().toLowerCase() === tournamentResults.realScorer.trim().toLowerCase()
        ) {
          scorerPoints = 5;
        }
        if (
          tournamentResults.realAssister && 
          user.predictedAssister && 
          user.predictedAssister.trim().toLowerCase() === tournamentResults.realAssister.trim().toLowerCase()
        ) {
          assisterPoints = 5;
        }
      }
      totalPoints += championPoints + scorerPoints + assisterPoints;

      return {
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        exactMatchesCount,
        trendMatchesCount,
        simpleMatchesCount,
        noMatchesCount,
        totalPoints,
        pendingMatchesCount,
        predictionsMadeCount,
        championPoints,
        scorerPoints,
        assisterPoints
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
    const targetMatches = activeDateFilter === 'all'
      ? poolMatches
      : poolMatches.filter(m => getLocalDateStr(m.dateTime) === activeDateFilter);

    // If game mode is sectional or custom, or a date filter is selected, we MUST calculate dynamically!
    const needsDynamicCalculation = (currentLeague?.gameMode && currentLeague.gameMode !== 'total') || activeDateFilter !== 'all';
    
    if (needsDynamicCalculation) {
      return calculatePointsForMatches(targetMatches);
    }
    
    // Otherwise, fallback to pre-computed stats
    return stats;
  }, [stats, activeDateFilter, poolMatches, forecasts, users, currentUser, currentLeague]);

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

      {/* Premium Pool Selector */}
      {currentLeague && currentLeague.gameMode && currentLeague.gameMode !== 'total' && (
        <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center gap-1.5 text-indigo-950 font-bold text-xs select-none">
            <Coins className="w-4 h-4 text-indigo-600" />
            <span>Seleccionar pozo activo de apuestas:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {currentLeague.gameMode === 'sectional' ? (
              // Sectional Phases
              (['group', 'dieciseisavos', 'octavos', 'cuartos', 'semifinal', 'final'] as MatchPhase[]).map((phase) => {
                const totalCount = matches.filter(m => m.phase === phase).length;
                const predictedCount = matches.filter(m => m.phase === phase && forecasts.some(f => f.matchId === m.id && f.userId === currentUser.id && f.leagueCode === currentLeague.code)).length;
                const isActive = activePoolId === phase;
                
                const labels: Record<MatchPhase, string> = {
                  group: 'Grupos',
                  dieciseisavos: '16avos',
                  octavos: 'Octavos',
                  cuartos: 'Cuartos',
                  semifinal: 'Semifinal',
                  final: 'Final'
                };

                return (
                  <button
                    key={phase}
                    onClick={() => {
                      setActivePoolId(phase);
                      setActiveDateFilter('all');
                      if (onChangePhase) onChangePhase(phase);
                    }}
                    className={`px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border active:scale-95 ${
                      isActive
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm font-black'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-bold'
                    }`}
                  >
                    <span>{labels[phase]}</span>
                    <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold transition-colors ${isActive ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {predictedCount}/{totalCount}
                    </span>
                  </button>
                );
              })
            ) : (
              // Custom Phase Groups
              (currentLeague.customGroups || []).map((group) => {
                const totalCount = matches.filter(m => group.phases.includes(m.phase)).length;
                const predictedCount = matches.filter(m => group.phases.includes(m.phase) && forecasts.some(f => f.matchId === m.id && f.userId === currentUser.id && f.leagueCode === currentLeague.code)).length;
                const isActive = activePoolId === group.id;

                return (
                  <button
                    key={group.id}
                    onClick={() => {
                      setActivePoolId(group.id);
                      setActiveDateFilter('all');
                      if (onChangePhase && group.phases.length > 0) {
                        onChangePhase(group.phases[0]);
                      }
                    }}
                    className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 border active:scale-95 ${
                      isActive
                        ? 'bg-purple-600 border-purple-600 text-white shadow-sm font-black'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-bold'
                    }`}
                  >
                    <span>{group.name}</span>
                    <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold transition-colors ${isActive ? 'bg-purple-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {predictedCount}/{totalCount}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Banner de Siguiente Pozo */}
      {nextPoolInfo && (
        <div className={`p-4 rounded-2xl border text-white shadow-md animate-fadeIn flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all ${
          currentLeague.gameMode === 'sectional'
            ? 'bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 border-emerald-500/20'
            : 'bg-gradient-to-r from-purple-900 via-fuchsia-950 to-slate-900 border-purple-500/20'
        }`}>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-lg shadow-inner shrink-0 select-none animate-pulse">
              🎉
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-350 block">
                ¡{nextPoolInfo.currentName} Finalizado!
              </span>
              <p className="text-xs font-bold text-slate-100 mt-0.5">
                Todos los partidos de este pozo han terminado. ¿Listo para la siguiente ronda?
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleStartNextPool}
            className={`w-full sm:w-auto px-4 py-2.5 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md transform hover:scale-[1.02] active:scale-[0.98] ${
              currentLeague.gameMode === 'sectional'
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white hover:shadow-emerald-500/20'
                : 'bg-purple-500 hover:bg-purple-600 text-white hover:shadow-purple-500/20'
            }`}
          >
            <span>Iniciar siguiente pozo: {nextPoolInfo.nextName}</span>
            <span className="text-sm font-black">→</span>
          </button>
        </div>
      )}

      {/* Botón y Acordeón del Reglamento Profesional */}
      <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 transition-all">
        <button
          onClick={() => setShowRules(!showRules)}
          className="w-full flex items-center justify-between text-left focus:outline-none group cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" />
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Reglamento y Sistema de Puntuación Profesional
              </h3>
              <p className="text-[10px] text-slate-505 text-slate-500 font-semibold mt-0.5">
                Conoce el formato oficial 3-2-1-0 de adjudicación de puntos (Estándar de Quinielas FIFA).
              </p>
            </div>
          </div>
          {showRules ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500 group-hover:translate-y-0.5 transition-transform" />
          )}
        </button>

        {showRules && (
          <div className="mt-4 pt-3.5 border-t border-slate-200/80 grid grid-cols-1 md:grid-cols-4 gap-3.5 animate-fadeIn">
            <div className="bg-white p-3 rounded-xl border border-emerald-100 flex flex-col justify-between shadow-xs">
              <div>
                <span className="inline-flex items-center px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-md mb-2">
                  🎯 3 PUNTOS
                </span>
                <h4 className="font-bold text-xs text-slate-900 mb-1">Acierto Perfecto</h4>
                <p className="text-[10px] text-slate-500 leading-normal font-medium">
                  Atinas con exactitud al equipo ganador (o empate) <strong>Y</strong> al marcador exacto de goles de ambos equipos.
                </p>
              </div>
              <span className="text-[9px] text-emerald-700 font-black mt-2 bg-emerald-50 px-2 py-0.5 rounded self-start">
                Ej: Pronóstico 2-1 | Real 2-1
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-indigo-100 flex flex-col justify-between shadow-xs">
              <div>
                <span className="inline-flex items-center px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-black rounded-md mb-2">
                  📈 2 PUNTOS
                </span>
                <h4 className="font-bold text-xs text-slate-900 mb-1">Acierto por Tendencia</h4>
                <p className="text-[10px] text-slate-500 leading-normal font-medium">
                  Atinas al ganador y a la <strong>diferencia exacta de goles</strong>, o atinas a un empate pero con diferente marcador.
                </p>
              </div>
              <span className="text-[9px] text-indigo-700 font-black mt-2 bg-indigo-50 px-2 py-0.5 rounded self-start">
                Ej: Pronóstico 2-0 | Real 3-1 (+2 dif)
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-blue-100 flex flex-col justify-between shadow-xs">
              <div>
                <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-black rounded-md mb-2">
                  ⚽ 1 PUNTO
                </span>
                <h4 className="font-bold text-xs text-slate-900 mb-1">Acierto Simple</h4>
                <p className="text-[10px] text-slate-500 leading-normal font-medium">
                  Atinas únicamente al ganador o empate, pero con <strong>diferente marcador y diferencia</strong> de goles.
                </p>
              </div>
              <span className="text-[9px] text-blue-700 font-black mt-2 bg-blue-50 px-2 py-0.5 rounded self-start">
                Ej: Pronóstico 2-1 | Real 1-0
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-rose-100 flex flex-col justify-between shadow-xs">
              <div>
                <span className="inline-flex items-center px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-black rounded-md mb-2">
                  ❌ 0 PUNTOS
                </span>
                <h4 className="font-bold text-xs text-slate-900 mb-1">Sin Acierto</h4>
                <p className="text-[10px] text-slate-500 leading-normal font-medium">
                  Fallas al predecir el resultado (ej: pronosticas victoria local y resulta empate o victoria visitante).
                </p>
              </div>
              <span className="text-[9px] text-rose-700 font-black mt-2 bg-rose-50 px-2 py-0.5 rounded self-start">
                Ej: Pronóstico 3-1 | Real 1-2
              </span>
            </div>
          </div>
        )}
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

                  {((userStat.championPoints !== undefined && userStat.championPoints > 0) || 
                    (userStat.scorerPoints !== undefined && userStat.scorerPoints > 0) || 
                    (userStat.assisterPoints !== undefined && userStat.assisterPoints > 0)) && (
                    <div className="flex flex-wrap justify-center gap-1 mt-1 text-[9px] font-bold">
                      {userStat.championPoints !== undefined && userStat.championPoints > 0 && (
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded border border-amber-200" title="Acertó Campeón (+5 pts)">
                          🏆 +5 Camp.
                        </span>
                      )}
                      {userStat.scorerPoints !== undefined && userStat.scorerPoints > 0 && (
                        <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded border border-rose-200" title="Acertó Goleador (+5 pts)">
                          ⚽ +5 Gol.
                        </span>
                      )}
                      {userStat.assisterPoints !== undefined && userStat.assisterPoints > 0 && (
                        <span className="px-1.5 py-0.5 bg-sky-100 text-sky-850 rounded border border-sky-200" title="Acertó Asistidor (+5 pts)">
                          👟 +5 Asist.
                        </span>
                      )}
                    </div>
                  )}

                  {userStat.predictionsMadeCount !== undefined && (
                    <div className="pt-1.5 border-t border-slate-100 flex flex-col items-center justify-center gap-0.5">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Apuestas Registradas</span>
                      <span className={`text-xs font-mono font-extrabold ${
                        userStat.predictionsMadeCount === poolMatches.length ? 'text-emerald-600' : 'text-slate-700'
                      }`}>
                        {userStat.predictionsMadeCount} / {poolMatches.length}
                      </span>
                      {userStat.predictionsMadeCount < poolMatches.length && (
                        <span className="text-[8px] font-extrabold text-rose-600 animate-pulse">
                          ⚠️ Faltan {poolMatches.length - userStat.predictionsMadeCount} apuestas
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Distribución del Pozo de Premios de la Liga */}
      {currentLeague && (() => {
        const totalPool = (currentLeague.members ? currentLeague.members.length : 0) * (currentLeague.costPerEntry || 0);
        
        let activePoolShare = totalPool;
        let gameModeText = 'Acumulado Total';
        
        const isFullDistribution = currentLeague.poolDistributionMode === 'full';
        
        if (currentLeague.gameMode === 'sectional') {
          if (!isFullDistribution) {
            activePoolShare = totalPool / 6;
          }
          gameModeText = `Modo Seccional (Por Fase) - ${isFullDistribution ? 'Pozo Completo' : 'Pozo Dividido'}`;
        } else if (currentLeague.gameMode === 'custom' && currentLeague.customGroups && currentLeague.customGroups.length > 0) {
          const groupCount = currentLeague.customGroups.length;
          if (!isFullDistribution) {
            activePoolShare = totalPool / groupCount;
          }
          gameModeText = `Modo Elección (Grupos) - ${isFullDistribution ? 'Pozo Completo' : 'Pozo Dividido'}`;
        }

        return (
          <div className="bg-gradient-to-tr from-indigo-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-indigo-500/30 shadow-lg space-y-5" id="prize-pool-distributor">
            
            {/* Header of Prize Pool */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-indigo-500/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
                  <Coins className="w-5 h-5 text-amber-400 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-indigo-200">
                    Pozo de Premios ({currentLeague.name})
                  </h3>
                  <p className="text-[10px] text-indigo-300 font-semibold mt-0.5">
                    Distribución Equilibrada (60% / 25% / 15%) en base a: <span className="text-amber-400 font-bold">{gameModeText}</span>
                  </p>
                </div>
              </div>

              {/* Total collected metric */}
              <div className="text-right">
                {currentLeague.gameMode && currentLeague.gameMode !== 'total' ? (
                  <>
                    <span className="text-[10px] text-amber-300 font-extrabold block uppercase tracking-wider">
                      {isFullDistribution ? 'Pozo Completo de la Ronda' : (currentLeague.gameMode === 'sectional' ? 'Pozo de esta Fase Activa' : 'Pozo del Grupo Activo')}
                    </span>
                    <span className="text-2xl font-black text-amber-400 font-mono">
                      ${activePoolShare.toFixed(2)} USD
                    </span>
                    <span className="text-[9px] text-slate-350 block mt-0.5 font-medium">
                      {isFullDistribution 
                        ? `Aportes independientes por fase (Pozo total recaudado: $${totalPool.toFixed(2)} USD)` 
                        : `Pozo Total de la Liga: $${totalPool.toFixed(2)} USD (${currentLeague.members ? currentLeague.members.length : 0} part.)`}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-xs text-indigo-300 font-bold block uppercase tracking-wider">Pozo Total Recaudado</span>
                    <span className="text-2xl font-black text-amber-400 font-mono">
                      ${totalPool.toFixed(2)} USD
                    </span>
                    <span className="text-[9px] text-slate-300 block mt-0.5">
                      {currentLeague.members ? currentLeague.members.length : 0} participantes × ${currentLeague.costPerEntry || 0}.00 USD
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Podiums Awards Mapping */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(() => {
                // Percentages for the balanced distribution
                const splits = [
                  { percent: 0.60, label: '🥇 1er Puesto (Campeón)', share: 0.60 * activePoolShare, textCol: 'text-amber-400', borderCol: 'border-amber-500/40 bg-amber-500/5' },
                  { percent: 0.25, label: '🥈 2do Puesto (Subcampeón)', share: 0.25 * activePoolShare, textCol: 'text-slate-300', borderCol: 'border-slate-550 border-slate-500/30 bg-slate-500/5' },
                  { percent: 0.15, label: '🥉 3er Puesto (Consolación)', share: 0.15 * activePoolShare, textCol: 'text-amber-500', borderCol: 'border-amber-700/30 bg-amber-700/5' }
                ];

                return splits.map((item, idx) => {
                  // Get member currently in this position
                  const leader = podiumList[idx];

                  return (
                    <div key={idx} className={`rounded-xl border p-4 flex flex-col justify-between ${item.borderCol} transition-all hover:scale-[1.01]`}>
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-black uppercase text-indigo-300 tracking-wider">
                          {item.label}
                        </span>
                        <span className="text-[10px] font-black bg-indigo-500/20 px-2 py-0.5 rounded-full text-indigo-200">
                          {item.percent * 100}%
                        </span>
                      </div>

                      <div className="my-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-950 border border-indigo-850 flex items-center justify-center text-xl shadow-inner shrink-0 select-none">
                          {leader ? leader.userAvatar : '👤'}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-black block truncate text-slate-100">
                            {leader ? leader.userName : 'Esperando participante...'}
                          </span>
                          <span className="text-[9px] text-indigo-300 block mt-0.5 font-semibold">
                            {leader ? `${leader.totalPoints} Pts obtenidos` : 'Posición no definida'}
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-indigo-500/10 flex justify-between items-baseline">
                        <span className="text-[9px] text-indigo-300 font-bold uppercase">Premio Asignado</span>
                        <span className={`text-lg font-black font-mono ${item.textCol}`}>
                          ${item.share.toFixed(2)} USD
                        </span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        );
      })()}

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
                <th className="py-3.5 px-4 text-center">📋 Pronósticos Realizados</th>
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
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900">{userStat.userName}</span>
                              {isCurrentUserRow && (
                                <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-800 text-[9px] font-bold rounded">
                                  Tú
                                </span>
                              )}
                            </div>
                            {((userStat.championPoints !== undefined && userStat.championPoints > 0) || 
                              (userStat.scorerPoints !== undefined && userStat.scorerPoints > 0) || 
                              (userStat.assisterPoints !== undefined && userStat.assisterPoints > 0)) && (
                              <div className="flex gap-1.5 mt-1 text-[8px] font-extrabold uppercase select-none leading-none">
                                {userStat.championPoints !== undefined && userStat.championPoints > 0 && (
                                  <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded" title="Acertó Campeón del Mundo (+5 pts)">
                                    🏆 +5 Camp.
                                  </span>
                                )}
                                {userStat.scorerPoints !== undefined && userStat.scorerPoints > 0 && (
                                  <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded" title="Acertó Goleador del Torneo (+5 pts)">
                                    ⚽ +5 Gol.
                                  </span>
                                )}
                                {userStat.assisterPoints !== undefined && userStat.assisterPoints > 0 && (
                                  <span className="px-1.5 py-0.5 bg-sky-50 text-sky-750 text-sky-700 border border-sky-200 rounded" title="Acertó Asistidor del Torneo (+5 pts)">
                                    👟 +5 Asist.
                                  </span>
                                )}
                              </div>
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
                        <div className="flex flex-col items-center justify-center gap-1">
                          <span className={`font-mono font-extrabold text-[12px] ${
                            userStat.predictionsMadeCount === poolMatches.length ? 'text-emerald-600 font-black' : 'text-slate-700'
                          }`}>
                            {userStat.predictionsMadeCount} <span className="text-[10px] font-normal text-slate-400">/ {poolMatches.length}</span>
                          </span>
                          {userStat.predictionsMadeCount !== undefined && userStat.predictionsMadeCount < poolMatches.length && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-100 text-[9px] font-bold animate-pulse leading-none select-none">
                              Faltan {poolMatches.length - userStat.predictionsMadeCount}
                            </span>
                          )}
                          {userStat.predictionsMadeCount !== undefined && userStat.predictionsMadeCount === poolMatches.length && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 text-[8px] font-bold uppercase tracking-wider scale-90 leading-none select-none">
                              Completo
                            </span>
                          )}
                        </div>
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
                                  : matches.filter(m => m.status !== 'finished' && getLocalDateStr(m.dateTime) === activeDateFilter);

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

                            {/* Predictions details summary */}
                            <div className="border-t border-slate-100 pt-3.5 mt-3 flex flex-col gap-2 select-none">
                              <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">
                                🔮 Pronósticos Especiales del Torneo
                              </span>
                              <div className="flex flex-wrap gap-2 text-xs">
                                {(() => {
                                  const targetUser = users.find(u => u.id === userStat.userId) || (userStat.userId === currentUser.id ? currentUser : null);
                                  const champId = targetUser?.predictedChampion;
                                  const scorer = targetUser?.predictedScorer;
                                  const assister = targetUser?.predictedAssister;
                                  const champTeam = champId ? TEAMS[champId] : null;

                                  return (
                                    <>
                                      <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200">
                                        <span>Campeón: <strong>{champTeam ? `${champTeam.flag} ${champTeam.name}` : 'Pendiente'}</strong></span>
                                        {userStat.championPoints !== undefined && userStat.championPoints > 0 && (
                                          <span className="text-emerald-600 font-extrabold ml-1">(+5 Pts)</span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200">
                                        <span>Goleador: <strong>{scorer ? scorer : 'Pendiente'}</strong></span>
                                        {userStat.scorerPoints !== undefined && userStat.scorerPoints > 0 && (
                                          <span className="text-emerald-600 font-extrabold ml-1">(+5 Pts)</span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200">
                                        <span>Asistidor: <strong>{assister ? assister : 'Pendiente'}</strong></span>
                                        {userStat.assisterPoints !== undefined && userStat.assisterPoints > 0 && (
                                          <span className="text-emerald-600 font-extrabold ml-1">(+5 Pts)</span>
                                        )}
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
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
