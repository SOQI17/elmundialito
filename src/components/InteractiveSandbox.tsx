import React, { useState, useEffect } from 'react';
import { calculateScore } from '../utils/scoring';
import { ScoringResult } from '../types';
import { Sparkles, ArrowRight, CheckCircle, Info, RotateCcw } from 'lucide-react';

export default function InteractiveSandbox() {
  const [realHome, setRealHome] = useState<number>(3);
  const [realAway, setRealAway] = useState<number>(1);
  const [predHome, setPredHome] = useState<number>(2);
  const [predAway, setPredAway] = useState<number>(0);
  const [result, setResult] = useState<ScoringResult>({ score: 0, category: 'none', reason: '' });

  useEffect(() => {
    const res = calculateScore(realHome, realAway, predHome, predAway);
    setResult(res);
  }, [realHome, realAway, predHome, predAway]);

  const resetSandbox = () => {
    setRealHome(3);
    setRealAway(1);
    setPredHome(2);
    setPredAway(0);
  };

  const getBadgeStyle = (category: string) => {
    switch (category) {
      case 'perfect':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'trend':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'simple':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score === 3) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score === 2) return 'text-indigo-600 bg-indigo-50 border-indigo-200';
    if (score === 1) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-slate-400 bg-slate-50 border-slate-200';
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8" id="interactive-sandbox-container">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
        <div>
          <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full uppercase tracking-wider">
            Simulador de Reglas
          </span>
          <h2 className="text-2xl font-bold text-slate-900 mt-2 font-sans">Sandbox del Algoritmo de Puntuación</h2>
          <p className="text-sm text-slate-505 mt-1 text-slate-500">
            Prueba combinando diferentes resultados reales y pronósticos para ver cómo calcula los puntos el motor de reglas en vivo.
          </p>
        </div>
        <button
          id="btn-reset-sandbox"
          onClick={resetSandbox}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all self-start"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Restablecer
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Controls Column */}
        <div className="space-y-6">
          {/* Real Score Counter Card */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4" id="real-score-inputs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Resultado Real del Partido</span>
              <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-full uppercase">Oficial</span>
            </div>
            
            <div className="flex items-center justify-around py-4">
              <div className="text-center space-y-2">
                <span className="text-4xl block">🇺🇦</span>
                <span className="text-xs font-semibold text-slate-600 block">Equipo Local</span>
                <div className="flex items-center gap-2">
                  <button
                    id="dec-real-home"
                    onClick={() => setRealHome(Math.max(0, realHome - 1))}
                    className="w-10 h-10 rounded-full border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xl flex items-center justify-center transition-all shadow-xs"
                  >
                    -
                  </button>
                  <span className="text-3xl font-bold text-slate-800 w-8 text-center">{realHome}</span>
                  <button
                    id="inc-real-home"
                    onClick={() => setRealHome(realHome + 1)}
                    className="w-10 h-10 rounded-full border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xl flex items-center justify-center transition-all shadow-xs"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="text-3xl font-bold text-slate-350 select-none">:</div>

              <div className="text-center space-y-2">
                <span className="text-4xl block">🇦🇺</span>
                <span className="text-xs font-semibold text-slate-600 block">Equipo Visitante</span>
                <div className="flex items-center gap-2">
                  <button
                    id="dec-real-away"
                    onClick={() => setRealAway(Math.max(0, realAway - 1))}
                    className="w-10 h-10 rounded-full border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xl flex items-center justify-center transition-all shadow-xs"
                  >
                    -
                  </button>
                  <span className="text-3xl font-bold text-slate-800 w-8 text-center">{realAway}</span>
                  <button
                    id="inc-real-away"
                    onClick={() => setRealAway(realAway + 1)}
                    className="w-10 h-10 rounded-full border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xl flex items-center justify-center transition-all shadow-xs"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Predicted Score Counter Card */}
          <div className="p-6 bg-indigo-50/40 rounded-2xl border border-indigo-100/30 space-y-4" id="predicted-score-inputs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">Pronóstico del Usuario</span>
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded-full uppercase">Estimación</span>
            </div>

            <div className="flex items-center justify-around py-4">
              <div className="text-center space-y-2">
                <span className="text-4xl block">🇺🇦</span>
                <span className="text-xs font-semibold text-slate-600 block">Predicción Local</span>
                <div className="flex items-center gap-2">
                  <button
                    id="dec-pred-home"
                    onClick={() => setPredHome(Math.max(0, predHome - 1))}
                    className="w-10 h-10 rounded-full border border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-700 font-bold text-xl flex items-center justify-center transition-all shadow-xs"
                  >
                    -
                  </button>
                  <span className="text-3xl font-bold text-slate-800 w-8 text-center">{predHome}</span>
                  <button
                    id="inc-pred-home"
                    onClick={() => setPredHome(predHome + 1)}
                    className="w-10 h-10 rounded-full border border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-700 font-bold text-xl flex items-center justify-center transition-all shadow-xs"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="text-3xl font-bold text-indigo-300 select-none">vs</div>

              <div className="text-center space-y-2">
                <span className="text-4xl block">🇦🇺</span>
                <span className="text-xs font-semibold text-slate-600 block">Predicción Vis.</span>
                <div className="flex items-center gap-2">
                  <button
                    id="dec-pred-away"
                    onClick={() => setPredAway(Math.max(0, predAway - 1))}
                    className="w-10 h-10 rounded-full border border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-700 font-bold text-xl flex items-center justify-center transition-all shadow-xs"
                  >
                    -
                  </button>
                  <span className="text-3xl font-bold text-slate-800 w-8 text-center">{predAway}</span>
                  <button
                    id="inc-pred-away"
                    onClick={() => setPredAway(predAway + 1)}
                    className="w-10 h-10 rounded-full border border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-700 font-bold text-xl flex items-center justify-center transition-all shadow-xs"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Outputs & Tracing column */}
        <div className="flex flex-col justify-between p-6 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-md relative">
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-mono uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Cálculo del Motor de Reglas
              </span>
              <span className="text-xs font-mono text-slate-500">2026-05-27</span>
            </div>

            {/* Score Output Indicator */}
            <div className="flex items-center gap-6 py-4">
              <div className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center w-24 h-24 shrink-0 transition-all ${getScoreColor(result.score)}`}>
                <span className="text-4xl font-sans font-bold leading-none">{result.score}</span>
                <span className="text-[10px] font-semibold uppercase mt-1">Puntos</span>
              </div>

              <div className="space-y-2">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getBadgeStyle(result.category)}`}>
                  {result.category === 'perfect' && '🏆 Acierto Perfecto'}
                  {result.category === 'trend' && '📈 Acierto por Tendencia'}
                  {result.category === 'simple' && '⚽ Acierto Simple'}
                  {result.category === 'none' && '❌ Sin Puntos'}
                </span>
                <p className="text-xs text-slate-300 leading-relaxed font-sans mt-1">
                  {result.reason}
                </p>
              </div>
            </div>

            {/* Logical Trace Steps */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">Pasos de Evaluación de la Regla:</h4>
              
              <div className="space-y-2">
                <div className="flex items-start gap-3.5 text-xs p-2.5 bg-slate-800/40 rounded-lg border border-slate-800/60 font-sans">
                  <div className="mt-1">
                    {realHome === predHome && realAway === predAway ? (
                      <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">✓</span>
                    ) : (
                      <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center text-[10px] font-mono">1</span>
                    )}
                  </div>
                  <div>
                    <p className={`font-semibold ${realHome === predHome && realAway === predAway ? 'text-emerald-400' : 'text-slate-300'}`}>
                      ¿Marcador exacto? Pasando {realHome}-{realAway} vs {predHome}-{predAway}
                    </p>
                    <p className="text-[11px] text-slate-450 text-slate-450 mt-0.5 mt-0.5">
                      {realHome === predHome && realAway === predAway 
                        ? 'Coincide de forma idéntica goles del local y visitante. Retorna 3 Puntos.'
                        : `No coincide exactamente (${realHome !== predHome ? 'goles local dif' : 'goles visitante dif'}). Pasando al análisis de tendencia.`}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 text-xs p-2.5 bg-slate-800/40 rounded-lg border border-slate-800/60 font-sans">
                  <div className="mt-1">
                    {(realHome > realAway === predHome > predAway) && (realHome < realAway === predHome < predAway) && (realHome === realAway === (predHome === predAway)) ? (
                      <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">✓</span>
                    ) : (
                      <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center text-[10px] font-mono">2</span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-300">
                      ¿Coincide Tendencia (Ganador/Empate)?
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Ganador real: <strong className="text-indigo-300">{realHome > realAway ? 'Local' : realHome < realAway ? 'Visitante' : 'Empate'}</strong> | 
                      Ganador predicho: <strong className="text-indigo-300">{predHome > predAway ? 'Local' : predHome < predAway ? 'Visitante' : 'Empate'}</strong> 
                      <span className="block mt-1 font-mono text-[10px] text-slate-400">
                        Resultado: {result.score > 0 ? '✓ Coinciden (Sigue evaluación)' : '❌ No coinciden (Inacierto - Retorna 0 Puntos)'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 text-xs p-2.5 bg-slate-800/40 rounded-lg border border-slate-800/60 font-sans">
                  <div className="mt-1 font-mono">
                    {result.score === 2 ? (
                      <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">✓</span>
                    ) : (
                      <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center text-[10px] font-mono">3</span>
                    )}
                  </div>
                  <div>
                    <p className={`font-semibold ${result.score === 2 ? 'text-indigo-400' : 'text-slate-300'}`}>
                      ¿Se atinó a la diferencia exacta o empate genérico?
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Diferencia Real: <strong className="text-indigo-300">{realHome - realAway}</strong> | 
                      Diferencia Predicha: <strong className="text-indigo-300">{predHome - predAway}</strong>. 
                      {result.score === 2 
                        ? ' Coincide la diferencia exacta o es un empate. Retorna 2 Puntos.' 
                        : ' No coincide la diferencia ni es empate exacto.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 text-xs p-2.5 bg-slate-800/40 rounded-lg border border-slate-800/60 font-sans">
                  <div className="mt-1 font-mono">
                    {result.score === 1 ? (
                      <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">✓</span>
                    ) : (
                      <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center text-[10px] font-mono">4</span>
                    )}
                  </div>
                  <div>
                    <p className={`font-semibold ${result.score === 1 ? 'text-blue-400' : 'text-slate-300'}`}>
                      Acierto Simple (Victoria / Empate correcto, pero goles incorrectos)
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Acertaste la tendencia fundamental del equipo ganador pero con otro saldo de anotaciones. Retorna 1 Punto.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-800 pt-4 text-[11px] text-slate-500 flex justify-between items-center bg-slate-900 font-mono">
            <span>MODO SIMULADOR INTERACTIVO v1.0</span>
            <span>POLÍGONOS DE PRUEBA</span>
          </div>
        </div>
      </div>
    </div>
  );
}
