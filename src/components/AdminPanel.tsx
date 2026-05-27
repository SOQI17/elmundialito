import React, { useState } from 'react';
import { Match, MatchPhase } from '../types';
import { Settings, Save, RefreshCw, AlertTriangle, Play, CheckCircle } from 'lucide-react';
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

  const handleLocalScoreChange = (matchId: string, team: 'home' | 'away', value: string, currentMatch: Match) => {
    const numericVal = value === '' ? 0 : Math.max(0, parseInt(value, 10));
    const currentEdit = editingScores[matchId] || {
      home: currentMatch.homeScore !== undefined ? currentMatch.homeScore : 0,
      away: currentMatch.awayScore !== undefined ? currentMatch.awayScore : 0,
      status: currentMatch.status
    };

    setEditingScores({
      ...editingScores,
      [matchId]: {
        ...currentEdit,
        [team]: numericVal
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
                      disabled={statusVal === 'scheduled'}
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
                      disabled={statusVal === 'scheduled'}
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
