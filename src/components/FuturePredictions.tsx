import React, { useState, useEffect, useMemo } from 'react';
import { Match, UserProfile, League, LeagueMemberInfo } from '../types';
import { TEAMS } from '../data';
import { TOP_SCORERS, TOP_ASSISTERS, getPlayerFlag, PlayerOption } from '../data/players';
import { Sparkles, Save, Trophy, Loader2, AlertCircle, Lock, CheckCircle2, XCircle, ChevronDown, Search } from 'lucide-react';
import TeamFlag from './TeamFlag';

interface FuturePredictionsProps {
  currentUser: UserProfile;
  matches: Match[];
  tournamentResults: { realChampion?: string; realScorer?: string; realAssister?: string; specialPredictionsLocked?: boolean } | null;
  onSavePredictions: (champion: string, scorer: string, assister: string) => Promise<void>;
  currentLeague?: League | null;
  leagueMembersData?: LeagueMemberInfo[];
}

export default function FuturePredictions({
  currentUser,
  matches,
  tournamentResults,
  onSavePredictions,
  currentLeague,
  leagueMembersData
}: FuturePredictionsProps) {
  const [selectedChampion, setSelectedChampion] = useState<string>(currentUser.predictedChampion || '');
  const [selectedScorer, setSelectedScorer] = useState<string>(currentUser.predictedScorer || '');
  const [selectedAssister, setSelectedAssister] = useState<string>(currentUser.predictedAssister || '');

  const [isChampOpen, setIsChampOpen] = useState(false);
  const [champSearch, setChampSearch] = useState('');
  
  const [isScorerOpen, setIsScorerOpen] = useState(false);
  const [scorerSearch, setScorerSearch] = useState('');
  
  const [isAssisterOpen, setIsAssisterOpen] = useState(false);
  const [assisterSearch, setAssisterSearch] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Sync inputs with user profile on load/change
  useEffect(() => {
    if (currentUser) {
      setSelectedChampion(currentUser.predictedChampion || '');
      setSelectedScorer(currentUser.predictedScorer || '');
      setSelectedAssister(currentUser.predictedAssister || '');
    }
  }, [currentUser]);

  // Determine payment block status
  const isBlockedByPayment = useMemo(() => {
    const isCreator = currentLeague?.creatorId === currentUser.id;
    const isAdmin = currentUser.isAdmin;
    const myMemberData = leagueMembersData?.find(m => m.userId === currentUser.id);
    return !!currentLeague && !isCreator && !isAdmin && (!myMemberData || !myMemberData.paid);
  }, [currentLeague, currentUser, leagueMembersData]);

  const isLocked = useMemo(() => {
    if (isBlockedByPayment) return true;
    return !!tournamentResults?.specialPredictionsLocked;
  }, [tournamentResults, isBlockedByPayment]);

  // Sorted teams for the dropdown
  const sortedTeams = useMemo(() => {
    return Object.values(TEAMS).sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      await onSavePredictions(selectedChampion, selectedScorer, selectedAssister);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error(err);
      setSaveError(err.message || 'No se pudieron guardar las predicciones.');
    } finally {
      setIsSaving(false);
    }
  };

  // Status variables helper for correctness
  const hasChampionResults = !!tournamentResults?.realChampion;
  const isChampionCorrect = hasChampionResults && tournamentResults.realChampion === selectedChampion;

  const hasScorerResults = !!tournamentResults?.realScorer;
  const isScorerCorrect = hasScorerResults && tournamentResults.realScorer?.trim().toLowerCase() === selectedScorer.trim().toLowerCase();

  const hasAssisterResults = !!tournamentResults?.realAssister;
  const isAssisterCorrect = hasAssisterResults && tournamentResults.realAssister?.trim().toLowerCase() === selectedAssister.trim().toLowerCase();

  return (
    <div className="space-y-6 max-w-4xl mx-auto" id="future-predictions-container">
      {/* Description Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-xl text-white">
        {/* Background glow decorator */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold font-sans flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500 animate-pulse" />
              Pronósticos Especiales del Torneo (+15 Puntos Extra)
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Elige con anticipación al **Campeón del Mundial**, al **Goleador del Torneo** y al **Asistidor del Torneo**. Cada acierto correcto sumará **5 puntos** adicionales a tu puntaje acumulado general de la liga.
            </p>
          </div>

          <div className="shrink-0 flex flex-col items-start md:items-end gap-1 select-none">
            <span className="px-2.5 py-1 rounded-lg bg-indigo-950 border border-indigo-550/40 text-indigo-400 text-[10px] font-black uppercase tracking-wider font-mono">
              3 Predicciones = 15 Puntos
            </span>
          </div>
        </div>

        {/* Lock status setting block */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {tournamentResults?.specialPredictionsLocked ? (
            <div className="flex items-center gap-2 text-rose-400 font-bold bg-rose-950/30 px-3 py-1.5 rounded-lg border border-rose-900/35 select-none">
              <Lock className="w-4 h-4" />
              <span>Predicciones bloqueadas por el Organizador (Cerrado).</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-400 font-bold bg-emerald-950/30 px-3 py-1.5 rounded-lg border border-emerald-900/35 select-none">
              <Sparkles className="w-4 h-4 animate-pulse text-emerald-400" />
              <span>
                Pronósticos especiales abiertos para edición (Campeón, Goleador, Asistidor).
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Block by Payment Alert */}
      {isBlockedByPayment && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 animate-fadeIn select-none shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-black text-rose-900 uppercase tracking-wide">⚠️ Guardado Deshabilitado por Falta de Pago</h4>
            <p className="text-[11px] text-rose-700 font-bold leading-relaxed">
              No puedes registrar ni cambiar tus predicciones especiales debido a que tu cuenta registra saldo pendiente en esta liga. Por favor, realiza o confirma tu pago con el organizador.
            </p>
          </div>
        </div>
      )}

      {/* Save Success Alert */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 font-bold animate-fadeIn shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>¡Pronósticos guardados en tu perfil con éxito! Se aplicarán en todas tus ligas activas.</span>
        </div>
      )}

      {/* Save Error Alert */}
      {saveError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-xs text-rose-800 font-bold animate-fadeIn shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-655 text-rose-600 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Main Predictions form */}
      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Champion */}
        <div className={`bg-white border rounded-2xl p-5 flex flex-col justify-between shadow-xs transition-all relative ${
          isChampionCorrect ? 'border-emerald-200 ring-2 ring-emerald-500/20' : 'border-slate-200/80'
        }`}>
          {/* Winner status decorator */}
          {hasChampionResults && (
            <span className={`absolute top-4 right-4 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
              isChampionCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {isChampionCorrect ? '✓ Acertado (+5)' : '✗ Incorrecto'}
            </span>
          )}

          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-indigo-650 text-indigo-650 text-indigo-600 uppercase tracking-widest block font-sans">
                Predicción 1 (5 Pts)
              </span>
              <h3 className="text-sm font-bold text-slate-800 font-sans flex items-center gap-1.5">
                🏆 Campeón del Mundo
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">
                Selecciona al país que levantará la Copa del Mundo 2026.
              </p>
            </div>

            <div className="flex flex-col gap-2 relative">
              <label className="text-[10px] font-bold text-slate-500 uppercase select-none">Elegir País</label>
              
              <div>
                <button
                  type="button"
                  disabled={isLocked || isBlockedByPayment}
                  onClick={() => setIsChampOpen(!isChampOpen)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-xs disabled:bg-slate-50 disabled:text-slate-500 flex items-center justify-between transition-all select-none"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    {selectedChampion ? (
                      <>
                        <TeamFlag team={TEAMS[selectedChampion]} size="sm" />
                        <span>{TEAMS[selectedChampion].name}</span>
                      </>
                    ) : (
                      <span className="text-slate-400">Seleccionar país...</span>
                    )}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isChampOpen ? 'rotate-180' : ''}`} />
                </button>

                {isChampOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsChampOpen(false)} />
                    <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-60 overflow-y-auto animate-fadeIn flex flex-col p-1.5">
                      <div className="flex items-center gap-1.5 border border-slate-100 rounded-lg px-2.5 py-1.5 bg-slate-50/50 mb-1.5">
                        <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <input
                          type="text"
                          placeholder="Buscar país..."
                          value={champSearch}
                          onChange={(e) => setChampSearch(e.target.value)}
                          className="bg-transparent border-none text-xs text-slate-700 outline-none w-full placeholder-slate-400"
                        />
                      </div>

                      <div className="overflow-y-auto max-h-48 space-y-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedChampion('');
                            setChampSearch('');
                            setIsChampOpen(false);
                          }}
                          className="w-full text-left px-2.5 py-2 text-xs font-semibold rounded-lg hover:bg-slate-50 text-slate-400 transition-colors"
                        >
                          -- Limpiar Selección --
                        </button>
                        {sortedTeams
                          .filter(t => t.name.toLowerCase().includes(champSearch.toLowerCase()))
                          .map(team => (
                            <button
                              key={team.id}
                              type="button"
                              onClick={() => {
                                setSelectedChampion(team.id);
                                setChampSearch('');
                                setIsChampOpen(false);
                              }}
                              className={`w-full text-left px-2.5 py-2 text-xs font-semibold rounded-lg hover:bg-indigo-50 flex items-center gap-2 transition-all ${
                                selectedChampion === team.id ? 'bg-indigo-50 text-indigo-700 font-extrabold' : 'text-slate-700 hover:text-indigo-650'
                              }`}
                            >
                              <TeamFlag team={team} size="sm" />
                              <span>{team.name}</span>
                            </button>
                          ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Locked Read-only view helper */}
          {isLocked && selectedChampion && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 select-none">
              {(() => {
                const team = TEAMS[selectedChampion];
                return team ? (
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <TeamFlag team={team} size="sm" />
                    Elección: {team.name}
                  </span>
                ) : null;
              })()}
            </div>
          )}
        </div>

        {/* Card 2: Top Scorer */}
        <div className={`bg-white border rounded-2xl p-5 flex flex-col justify-between shadow-xs transition-all relative ${
          isScorerCorrect ? 'border-emerald-200 ring-2 ring-emerald-500/20' : 'border-slate-200/80'
        }`}>
          {/* Winner status decorator */}
          {hasScorerResults && (
            <span className={`absolute top-4 right-4 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
              isScorerCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {isScorerCorrect ? '✓ Acertado (+5)' : '✗ Incorrecto'}
            </span>
          )}

          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest block font-sans">
                Predicción 2 (5 Pts)
              </span>
              <h3 className="text-sm font-bold text-slate-800 font-sans flex items-center gap-1.5">
                ⚽ Goleador del Torneo
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">
                Elige al jugador que marcará la mayor cantidad de goles.
              </p>
            </div>

            <div className="flex flex-col gap-2 relative">
              <label className="text-[10px] font-bold text-slate-500 uppercase select-none">Elegir Goleador</label>
              
              <div>
                <button
                  type="button"
                  disabled={isLocked || isBlockedByPayment}
                  onClick={() => setIsScorerOpen(!isScorerOpen)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-xs disabled:bg-slate-50 disabled:text-slate-500 flex items-center justify-between transition-all select-none"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    {selectedScorer ? (
                      <>
                        <span className="text-sm shrink-0">
                          {(() => {
                            const pl = TOP_SCORERS.find(p => p.name === selectedScorer);
                            return pl ? getPlayerFlag(pl.team) : '⚽';
                          })()}
                        </span>
                        <span>
                          {selectedScorer}
                          {(() => {
                            const pl = TOP_SCORERS.find(p => p.name === selectedScorer);
                            return pl ? ` (${pl.team})` : '';
                          })()}
                        </span>
                      </>
                    ) : (
                      <span className="text-slate-400">Seleccionar goleador...</span>
                    )}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isScorerOpen ? 'rotate-180' : ''}`} />
                </button>

                {isScorerOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsScorerOpen(false)} />
                    <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-60 overflow-y-auto animate-fadeIn flex flex-col p-1.5">
                      <div className="flex items-center gap-1.5 border border-slate-100 rounded-lg px-2.5 py-1.5 bg-slate-50/50 mb-1.5">
                        <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <input
                          type="text"
                          placeholder="Buscar goleador..."
                          value={scorerSearch}
                          onChange={(e) => setScorerSearch(e.target.value)}
                          className="bg-transparent border-none text-xs text-slate-700 outline-none w-full placeholder-slate-400"
                        />
                      </div>

                      <div className="overflow-y-auto max-h-48 space-y-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedScorer('');
                            setScorerSearch('');
                            setIsScorerOpen(false);
                          }}
                          className="w-full text-left px-2.5 py-2 text-xs font-semibold rounded-lg hover:bg-slate-50 text-slate-400 transition-colors"
                        >
                          -- Limpiar Selección --
                        </button>
                        {TOP_SCORERS
                          .filter(p => p.name.toLowerCase().includes(scorerSearch.toLowerCase()) || p.team.toLowerCase().includes(scorerSearch.toLowerCase()))
                          .map(player => (
                            <button
                              key={player.name}
                              type="button"
                              onClick={() => {
                                setSelectedScorer(player.name);
                                setScorerSearch('');
                                setIsScorerOpen(false);
                              }}
                              className={`w-full text-left px-2.5 py-2 text-xs font-semibold rounded-lg hover:bg-indigo-50 flex items-center gap-2 transition-all ${
                                selectedScorer === player.name ? 'bg-indigo-50 text-indigo-700 font-extrabold' : 'text-slate-700 hover:text-indigo-650'
                              }`}
                            >
                              <span className="text-sm shrink-0">{getPlayerFlag(player.team)}</span>
                              <span>{player.name} <span className="text-slate-400 font-normal">({player.team})</span></span>
                            </button>
                          ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Locked Read-only view helper */}
          {isLocked && selectedScorer && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-1.5 select-none">
              <span className="text-xs font-black text-slate-800">
                Elección: {selectedScorer}
              </span>
            </div>
          )}
        </div>

        {/* Card 3: Top Assister */}
        <div className={`bg-white border rounded-2xl p-5 flex flex-col justify-between shadow-xs transition-all relative ${
          isAssisterCorrect ? 'border-emerald-200 ring-2 ring-emerald-500/20' : 'border-slate-200/80'
        }`}>
          {/* Winner status decorator */}
          {hasAssisterResults && (
            <span className={`absolute top-4 right-4 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
              isAssisterCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {isAssisterCorrect ? '✓ Acertado (+5)' : '✗ Incorrecto'}
            </span>
          )}

          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest block font-sans">
                Predicción 3 (5 Pts)
              </span>
              <h3 className="text-sm font-bold text-slate-800 font-sans flex items-center gap-1.5">
                👟 Asistidor del Torneo
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">
                Elige al jugador que dará el mayor número de asistencias.
              </p>
            </div>

            <div className="flex flex-col gap-2 relative">
              <label className="text-[10px] font-bold text-slate-500 uppercase select-none">Elegir Asistidor</label>
              
              <div>
                <button
                  type="button"
                  disabled={isLocked || isBlockedByPayment}
                  onClick={() => setIsAssisterOpen(!isAssisterOpen)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-xs disabled:bg-slate-50 disabled:text-slate-500 flex items-center justify-between transition-all select-none"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    {selectedAssister ? (
                      <>
                        <span className="text-sm shrink-0">
                          {(() => {
                            const pl = TOP_ASSISTERS.find(p => p.name === selectedAssister);
                            return pl ? getPlayerFlag(pl.team) : '👟';
                          })()}
                        </span>
                        <span>
                          {selectedAssister}
                          {(() => {
                            const pl = TOP_ASSISTERS.find(p => p.name === selectedAssister);
                            return pl ? ` (${pl.team})` : '';
                          })()}
                        </span>
                      </>
                    ) : (
                      <span className="text-slate-400">Seleccionar asistidor...</span>
                    )}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isAssisterOpen ? 'rotate-180' : ''}`} />
                </button>

                {isAssisterOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsAssisterOpen(false)} />
                    <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-60 overflow-y-auto animate-fadeIn flex flex-col p-1.5">
                      <div className="flex items-center gap-1.5 border border-slate-100 rounded-lg px-2.5 py-1.5 bg-slate-50/50 mb-1.5">
                        <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <input
                          type="text"
                          placeholder="Buscar asistidor..."
                          value={assisterSearch}
                          onChange={(e) => setAssisterSearch(e.target.value)}
                          className="bg-transparent border-none text-xs text-slate-700 outline-none w-full placeholder-slate-400"
                        />
                      </div>

                      <div className="overflow-y-auto max-h-48 space-y-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAssister('');
                            setAssisterSearch('');
                            setIsAssisterOpen(false);
                          }}
                          className="w-full text-left px-2.5 py-2 text-xs font-semibold rounded-lg hover:bg-slate-50 text-slate-400 transition-colors"
                        >
                          -- Limpiar Selección --
                        </button>
                        {TOP_ASSISTERS
                          .filter(p => p.name.toLowerCase().includes(assisterSearch.toLowerCase()) || p.team.toLowerCase().includes(assisterSearch.toLowerCase()))
                          .map(player => (
                            <button
                              key={player.name}
                              type="button"
                              onClick={() => {
                                setSelectedAssister(player.name);
                                setAssisterSearch('');
                                setIsAssisterOpen(false);
                              }}
                              className={`w-full text-left px-2.5 py-2 text-xs font-semibold rounded-lg hover:bg-indigo-50 flex items-center gap-2 transition-all ${
                                selectedAssister === player.name ? 'bg-indigo-50 text-indigo-700 font-extrabold' : 'text-slate-700 hover:text-indigo-650'
                              }`}
                            >
                              <span className="text-sm shrink-0">{getPlayerFlag(player.team)}</span>
                              <span>{player.name} <span className="text-slate-400 font-normal">({player.team})</span></span>
                            </button>
                          ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Locked Read-only view helper */}
          {isLocked && selectedAssister && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-1.5 select-none">
              <span className="text-xs font-black text-slate-800">
                Elección: {selectedAssister}
              </span>
            </div>
          )}
        </div>

        {/* Row 4: Submit button */}
        {!isLocked && (
          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={isSaving || !selectedChampion || !selectedScorer || !selectedAssister}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer disabled:opacity-50 select-none"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Guardar Pronósticos Especiales</span>
            </button>
          </div>
        )}
      </form>

      {/* Show admin results display card if resolved */}
      {(hasChampionResults || hasScorerResults || hasAssisterResults) && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3.5 select-none">
          <h4 className="text-xs font-bold text-slate-800 font-sans uppercase tracking-wider">
            🏁 Resultados Oficiales Definidos por el Organizador
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium">
            <div className="p-3 bg-white border border-slate-200/60 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Campeón</span>
                <span className="font-extrabold text-slate-800">
                  {(() => {
                    const team = tournamentResults?.realChampion ? TEAMS[tournamentResults.realChampion] : null;
                    return team ? `${team.flag} ${team.name}` : 'No definido';
                  })()}
                </span>
              </div>
            </div>
            <div className="p-3 bg-white border border-slate-200/60 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Goleador</span>
                <span className="font-extrabold text-slate-800">
                  {tournamentResults?.realScorer || 'No definido'}
                </span>
              </div>
            </div>
            <div className="p-3 bg-white border border-slate-200/60 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Asistidor</span>
                <span className="font-extrabold text-slate-800">
                  {tournamentResults?.realAssister || 'No definido'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
