import React, { useMemo } from 'react';
import { Match, Team } from '../types';
import { TEAMS } from '../data';
import { Globe, Award, ListOrdered, ShieldAlert } from 'lucide-react';

interface WorldStandingsProps {
  matches: Match[];
}

interface TeamStats {
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

const GROUPS = [
  'Grupo A', 'Grupo B', 'Grupo C', 'Grupo D', 'Grupo E', 'Grupo F',
  'Grupo G', 'Grupo H', 'Grupo I', 'Grupo J', 'Grupo K', 'Grupo L'
];

export default function WorldStandings({ matches }: WorldStandingsProps) {
  const standings = useMemo(() => {
    // 1. Initialize empty stats for all teams by group
    const groupMap: Record<string, Record<string, TeamStats>> = {};

    GROUPS.forEach(group => {
      groupMap[group] = {};
    });

    // Populate all teams from TEAMS that belong to a group
    Object.values(TEAMS).forEach(team => {
      if (team.group && team.group !== 'Eliminatoria' && groupMap[team.group]) {
        groupMap[team.group][team.id] = {
          team,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0
        };
      }
    });

    // 2. Process all finished or live group stage matches
    const groupMatches = matches.filter(
      m => m.phase === 'group' && (m.status === 'finished' || m.status === 'live')
    );

    groupMatches.forEach(match => {
      const homeId = match.homeTeam.id;
      const awayId = match.awayTeam.id;
      const homeScore = match.homeScore;
      const awayScore = match.awayScore;

      if (homeScore === undefined || awayScore === undefined) return;

      const groupName = match.homeTeam.group;
      if (!groupName || !groupMap[groupName]) return;

      const homeStats = groupMap[groupName][homeId];
      const awayStats = groupMap[groupName][awayId];

      if (!homeStats || !awayStats) return;

      // Update played count
      homeStats.played += 1;
      awayStats.played += 1;

      // Update goals
      homeStats.goalsFor += homeScore;
      homeStats.goalsAgainst += awayScore;
      awayStats.goalsFor += awayScore;
      awayStats.goalsAgainst += homeScore;

      // Update outcomes
      if (homeScore > awayScore) {
        homeStats.won += 1;
        homeStats.points += 3;
        awayStats.lost += 1;
      } else if (homeScore < awayScore) {
        awayStats.won += 1;
        awayStats.points += 3;
        homeStats.lost += 1;
      } else {
        homeStats.drawn += 1;
        homeStats.points += 1;
        awayStats.drawn += 1;
        awayStats.points += 1;
      }
    });

    // 3. Sort teams in each group and calculate goal difference
    const sortedGroups: Record<string, TeamStats[]> = {};

    GROUPS.forEach(group => {
      const teamsList = Object.values(groupMap[group]);
      
      teamsList.forEach(stats => {
        stats.goalDifference = stats.goalsFor - stats.goalsAgainst;
      });

      // Sort according to: Points -> Goal Difference -> Goals For -> Name
      teamsList.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
        return a.team.name.localeCompare(b.team.name);
      });

      sortedGroups[group] = teamsList;
    });

    return sortedGroups;
  }, [matches]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6" id="world-standings-root">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-sans flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-600 animate-spin-slow" />
            Tablas de Posiciones Mundialistas
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Revisa el estado real de los grupos de la Copa del Mundo 2026. Se actualiza automáticamente con los resultados oficiales.
          </p>
        </div>
        <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-100/40 rounded-lg text-[11px] text-emerald-800 flex items-center gap-2 font-semibold">
          <Award className="w-3.5 h-3.5 text-emerald-500" />
          <span>Clasificación a 16avos de Final en Vivo</span>
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex items-start gap-3 text-xs leading-relaxed text-indigo-800">
        <ListOrdered className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-indigo-900 mb-0.5">Regla de Clasificación (Mundial 2026)</h4>
          <p className="text-[11px] text-indigo-700">
            Los <strong className="font-bold">dos mejores equipos (1° y 2°)</strong> de cada uno de los 12 grupos clasifican directamente a los Dieciseisavos de Final (Ronda de 32), junto con los <strong className="font-bold">8 mejores terceros lugares</strong> de todo el torneo.
          </p>
        </div>
      </div>

      {/* Standings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {GROUPS.map(groupName => {
          const teams = standings[groupName] || [];
          return (
            <div 
              key={groupName} 
              className="bg-slate-50/40 border border-slate-200/60 rounded-2xl p-4 flex flex-col space-y-3 transition-all hover:shadow-xs hover:border-slate-300"
            >
              {/* Card Title */}
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-xs font-black text-slate-850 tracking-wide uppercase flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  {groupName}
                </span>
                <span className="text-[9px] text-slate-400 font-mono font-bold">4 EQUIPOS</span>
              </div>

              {/* Standings Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[9px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">
                      <th className="py-1.5 pl-1 w-6">#</th>
                      <th className="py-1.5">Equipo</th>
                      <th className="py-1.5 text-center w-7">PJ</th>
                      <th className="py-1.5 text-center w-7 hidden sm:table-cell">G</th>
                      <th className="py-1.5 text-center w-7 hidden sm:table-cell">E</th>
                      <th className="py-1.5 text-center w-7 hidden sm:table-cell">P</th>
                      <th className="py-1.5 text-center w-8 hidden sm:table-cell">GF:GC</th>
                      <th className="py-1.5 text-center w-7">DG</th>
                      <th className="py-1.5 text-center w-8 font-extrabold text-slate-600">PTS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/50">
                    {teams.map((stats, idx) => {
                      const position = idx + 1;
                      
                      // Row highlight styles based on tournament qualification rules
                      let rankBg = 'bg-slate-250 text-slate-600';
                      let rowBg = '';
                      
                      if (position <= 2) {
                        rankBg = 'bg-emerald-500 text-white shadow-xs';
                        rowBg = 'bg-emerald-500/5';
                      } else if (position === 3) {
                        rankBg = 'bg-indigo-500 text-white shadow-xs';
                        rowBg = 'bg-indigo-500/5';
                      } else {
                        rowBg = 'opacity-70';
                      }

                      return (
                        <tr 
                          key={stats.team.id} 
                          className={`text-xs transition-colors hover:bg-slate-100/50 ${rowBg}`}
                        >
                          {/* Rank */}
                          <td className="py-2 pl-1">
                            <span className={`w-4.5 h-4.5 rounded-full flex items-center justify-center font-mono text-[10px] font-black ${rankBg}`}>
                              {position}
                            </span>
                          </td>
                          {/* Team Name + Flag */}
                          <td className="py-2 font-semibold text-slate-800">
                            <div className="flex items-center gap-1.5">
                              <span className="text-base select-none" role="img" aria-label={stats.team.name}>
                                {stats.team.flag}
                              </span>
                              <span className="truncate max-w-[85px] sm:max-w-[110px]" title={stats.team.name}>
                                {stats.team.name}
                              </span>
                            </div>
                          </td>
                          {/* Matches Played */}
                          <td className="py-2 text-center font-medium text-slate-600 font-mono">{stats.played}</td>
                          {/* Won */}
                          <td className="py-2 text-center text-slate-500 font-mono hidden sm:table-cell">{stats.won}</td>
                          {/* Drawn */}
                          <td className="py-2 text-center text-slate-500 font-mono hidden sm:table-cell">{stats.drawn}</td>
                          {/* Lost */}
                          <td className="py-2 text-center text-slate-500 font-mono hidden sm:table-cell">{stats.lost}</td>
                          {/* Goals For : Goals Against */}
                          <td className="py-2 text-center text-slate-500 font-mono hidden sm:table-cell">
                            {stats.goalsFor}:{stats.goalsAgainst}
                          </td>
                          {/* Goal Difference */}
                          <td className={`py-2 text-center font-mono font-bold ${
                            stats.goalDifference > 0 
                              ? 'text-emerald-600' 
                              : stats.goalDifference < 0 
                                ? 'text-rose-600' 
                                : 'text-slate-500'
                          }`}>
                            {stats.goalDifference > 0 ? `+${stats.goalDifference}` : stats.goalDifference}
                          </td>
                          {/* Points */}
                          <td className="py-2 text-center font-black font-mono text-slate-900 text-sm">{stats.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
