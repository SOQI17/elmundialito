import { ScoringResult } from '../types';

/**
 * Calcula el puntaje obtenido por un pronóstico basado en el resultado real.
 * Reglas de negocio:
 * - 3 Puntos: Acierto Perfecto (Atina al ganador/empate Y al marcador exacto).
 * - 2 Puntos: Acierto Parcial por Tendencia (Atina al ganador y a la diferencia de goles,
 *             o atina a un empate pero con diferente número de goles).
 * - 1 Punto: Acierto Simple (Atina al equipo ganador o al empate, pero el marcador y la diferencia son distintos).
 * - 0 Puntos: No acierta el resultado (Ej: Pronosticó gana Equipo A y ganó Equipo B).
 * 
 * @param realHome Goles reales del equipo local
 * @param realAway Goles reales del equipo visitante
 * @param predHome Goles pronosticados del equipo local
 * @param predAway Goles pronosticados del equipo visitante
 */
export function calculateScore(
  realHome: number,
  realAway: number,
  predHome: number,
  predAway: number
): ScoringResult {
  // Caso de entrada inválida
  if (
    realHome === undefined || realHome === null ||
    realAway === undefined || realAway === null ||
    predHome === undefined || predHome === null ||
    predAway === undefined || predAway === null
  ) {
    return {
      score: 0,
      category: 'none',
      reason: 'Falta ingresar resultado real o pronosticado.'
    };
  }

  // 1. Acierto Perfecto (3 Puntos)
  if (realHome === predHome && realAway === predAway) {
    return {
      score: 3,
      category: 'perfect',
      reason: '¡Acierto Perfecto! Atinaste al ganador/empate y al marcador exacto.'
    };
  }

  // Determinar tendencias/ganadores reales y pronosticados
  const realDiff = realHome - realAway;
  const predDiff = predHome - predAway;

  const realWinner = realDiff > 0 ? 'Home' : realDiff < 0 ? 'Away' : 'Draw';
  const predWinner = predDiff > 0 ? 'Home' : predDiff < 0 ? 'Away' : 'Draw';

  // Si no se acertó el ganador ni el empate (0 Puntos)
  if (realWinner !== predWinner) {
    return {
      score: 0,
      category: 'none',
      reason: 'No se acertó el ganador ni el empate.'
    };
  }

  // 2. Acierto Parcial por Tendencia (2 Puntos)
  // Caso A: Empate pronosticado y real, pero con marcador diferente (ej: Real: 1-1, Pred: 2-2)
  if (realWinner === 'Draw' && predWinner === 'Draw') {
    return {
      score: 2,
      category: 'trend',
      reason: 'Acertaste el empate, pero con diferente marcador.'
    };
  }

  // Caso B: Atina al ganador y a la misma diferencia de goles (ej: Real: 3-1, Pred: 2-0 -> diferencia de +2)
  if (realDiff === predDiff) {
    return {
      score: 2,
      category: 'trend',
      reason: `Acertaste el equipo ganador y la diferencia de goles exacta (${Math.abs(realDiff)} goles).`
    };
  }

  // 3. Acierto Simple (1 Punto)
  // Atinó al equipo ganador, pero con diferente marcador y diferencia de goles (ej: Real: 3-1, Pred: 1-0)
  const winnerTeamName = realWinner === 'Home' ? 'Local' : 'Visitante';
  return {
    score: 1,
    category: 'simple',
    reason: `Acertaste la victoria del ${winnerTeamName}, pero con diferente marcador y diferencia.`
  };
}
