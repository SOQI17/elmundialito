import React, { useState } from 'react';
import { Database, FileCode, Landmark, ListChecks, HelpCircle, Copy, Check } from 'lucide-react';

export default function SchemaAndArchitecture() {
  const [activeSubTab, setActiveSubTab] = useState<'model' | 'algorithm' | 'flow'>('model');
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const schemaCode = `{
  "users": {
    "id": "string (UID)",
    "name": "string",
    "avatar": "string (emoji or url)",
    "isAdmin": "boolean"
  },
  "leagues": {
    "code": "string (Unique Key / Code)",
    "name": "string",
    "creatorId": "string (references users.id)",
    "members": "array[string] (references users.id)"
  },
  "matches": {
    "id": "string (Unique Match Key)",
    "homeTeam": {
      "id": "string",
      "name": "string",
      "flag": "string",
      "group": "string"
    },
    "awayTeam": {
      "id": "string",
      "name": "string",
      "flag": "string",
      "group": "string"
    },
    "dateTime": "string (ISO Date-Time)",
    "phase": "string ('group' | 'octavos' | 'cuartos' | 'semifinal' | 'final')",
    "homeScore": "number (optional, actual score)",
    "awayScore": "number (optional, actual score)",
    "status": "string ('scheduled' | 'live' | 'finished')"
  },
  "forecasts": {
    "id": "string (composite: LeagueCode_MatchId_UserId)",
    "leagueCode": "string (references leagues.code)",
    "matchId": "string (references matches.id)",
    "userId": "string (references users.id)",
    "homeScore": "number",
    "awayScore": "number",
    "updatedAt": "string (ISO Date-Time)"
  }
}`;

  const algorithmCode = `/**
 * Algoritmo de Cálculo de Puntos - Clasificación del Mundialito
 * Reglas:
 * 1. Acierto Perfecto (Ganador y Marcador exacto): 3 Puntos
 * 2. Acierto por Tendencia (Ganador y Diferencia exacta, o empate exacto en tendencia): 2 Puntos
 * 3. Acierto Simple (Ganador acertado, pero diferente marcador y diferencia): 1 Punto
 * 4. Sin acierto: 0 Puntos
 */
export function calculateScore(
  realHome: number, 
  realAway: number, 
  predHome: number, 
  predAway: number
): { score: number; category: string; reason: string } {
  // 1. Acierto Perfecto (3 Puntos)
  if (realHome === predHome && realAway === predAway) {
    return {
      score: 3,
      category: "perfect",
      reason: "¡Acierto Perfecto! Atinaste al marcador exacto."
    };
  }

  const realDiff = realHome - realAway;
  const predDiff = predHome - predAway;

  const realWinner = realDiff > 0 ? "Home" : realDiff < 0 ? "Away" : "Draw";
  const predWinner = predDiff > 0 ? "Home" : predDiff < 0 ? "Away" : "Draw";

  // Si no se acertó el ganador ni el empate (0 Puntos)
  if (realWinner !== predWinner) {
    return {
      score: 0,
      category: "none",
      reason: "No acertó el ganador/empate."
    };
  }

  // 2. Acierto Parcial por Tendencia (2 Puntos)
  // Caso A: Empate, pero con marcador diferente (ej: Real: 1-1, Pred: 2-2)
  if (realWinner === "Draw" && predWinner === "Draw") {
    return {
      score: 2,
      category: "trend",
      reason: "Acertó empate con diferente número de goles."
    };
  }

  // Caso B: Atina al ganador y a la misma diferencia de goles (ej: Real: 3-1, Pred: 2-0 -> diferencia de +2)
  if (realDiff === predDiff) {
    return {
      score: 2,
      category: "trend",
      reason: "Acertó el ganador y la diferencia de goles exacta."
    };
  }

  // 3. Acierto Simple (1 Punto)
  // Atinó al equipo ganador, pero con diferente marcador y diferencia de goles (ej: Real: 3-1, Pred: 1-0)
  return {
    score: 1,
    category: "simple",
    reason: "Acertó el ganador, pero con diferente marcador y diferencia."
  };
}`;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8" id="schema-and-architecture-container">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
        <div>
          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full uppercase tracking-wider">
            Diseño Técnico
          </span>
          <h2 className="text-2xl font-bold text-slate-900 mt-2 font-sans">Estructura del Sistema y Lógica</h2>
          <p className="text-sm text-slate-500 mt-1">
            Revisión del modelo de base de datos relacional, el algoritmo de puntuación y el flujo de navegación de la aplicación.
          </p>
        </div>

        <div className="flex flex-row bg-slate-100 p-1 rounded-xl self-start">
          <button
            id="subtab-model"
            onClick={() => setActiveSubTab('model')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeSubTab === 'model'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4" />
            Modelo Relacional
          </button>
          <button
            id="subtab-algorithm"
            onClick={() => setActiveSubTab('algorithm')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeSubTab === 'algorithm'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCode className="w-4 h-4" />
            Algoritmo Puntos
          </button>
          <button
            id="subtab-flow"
            onClick={() => setActiveSubTab('flow')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeSubTab === 'flow'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListChecks className="w-4 h-4" />
            Flujo de Pantallas
          </button>
        </div>
      </div>

      {activeSubTab === 'model' && (
        <div className="space-y-6" id="architecture-model-section">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="p-2 w-10 h-10 bg-indigo-100 rounded-lg text-indigo-700 flex items-center justify-center mb-3">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-800 text-sm">Organización de Firestore</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Diseñamos una arquitectura optimizada para lecturas y cálculo ágil. Los pronósticos se aíslan por usuario y por liga para simplificar el filtrado de tablas de posiciones.
              </p>
            </div>

            <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="p-2 w-10 h-10 bg-emerald-100 rounded-lg text-emerald-700 flex items-center justify-center mb-3">
                <Landmark className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-800 text-sm">Bloqueo Automático</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Cada consulta antes de registrar valida que la hora actual del servidor esté al menos 15 minutos antes de la hora del respectivo <code className="bg-slate-200 px-1 rounded">dateTime</code> del partido.
              </p>
            </div>

            <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="p-2 w-10 h-10 bg-amber-100 rounded-lg text-amber-700 flex items-center justify-center mb-3">
                <ListChecks className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-800 text-sm">Cálculo de Posiciones</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Se realiza un "Aggregator" reactivo: al registrarse el marcador real de un partido, se consulta la colección de pronósticos de ese partido y se actualiza el puntaje acumulado de cada participante.
              </p>
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl p-5 relative overflow-hidden group">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-mono text-indigo-300">Esquema JSON de Colecciones de Datos (NoSQL / Relacional)</span>
              <button
                id="btn-copy-schema"
                onClick={() => copyToClipboard(schemaCode)}
                className="p-1 px-3 bg-slate-800 text-slate-300 hover:text-white rounded text-xs flex items-center gap-1 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <pre className="font-mono text-xs text-slate-200 overflow-x-auto max-h-96 leading-relaxed">
              {schemaCode}
            </pre>
          </div>

          <div className="border border-slate-100 rounded-xl overflow-hidden">
            <div className="bg-slate-50 p-4 border-b border-indigo-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Diccionario de Entidades</h4>
            </div>
            <div className="divide-y divide-slate-100">
              <div className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div className="font-semibold text-xs text-indigo-700 font-mono">users</div>
                <div className="col-span-3 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">Propósito:</span> Registra el perfil del participante del mundialito. El avatar indica una representación visual lúdica. Incluye un bit de administrador para autorizar la edición de resultados.
                </div>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div className="font-semibold text-xs text-indigo-700 font-mono">leagues</div>
                <div className="col-span-3 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">Propósito:</span> Representa los grupos de amigos privados. Se accede mediante un <code className="bg-slate-100 px-1 rounded font-mono">code</code> único de 6 a 12 caracteres alfa-numéricos.
                </div>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div className="font-semibold text-xs text-indigo-700 font-mono">matches</div>
                <div className="col-span-3 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">Propósito:</span> Calendario maestro cargado de antemano. Almacena las puntuaciones reales una vez finalizado por el administrador.
                </div>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div className="font-semibold text-xs text-indigo-700 font-mono">forecasts</div>
                <div className="col-span-3 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">Propósito:</span> Predicción hecha por un usuario asignado a una liga para un partido en específico. Almacena la puntuación local y visitante predicha.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'algorithm' && (
        <div className="space-y-6" id="architecture-algorithm-section">
          <div className="bg-amber-50 rounded-xl border border-amber-100 p-5 flex gap-4">
            <div className="text-amber-600 mt-1">
              <HelpCircle className="w-6 h-6 shrink-0" />
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-sm text-amber-800">Comprensión de las Reglas de Puntuación</h4>
              <ul className="text-xs text-amber-700 space-y-1.5 list-disc pl-4 leading-relaxed">
                <li>
                  <span className="font-bold">3 Puntos (Acierto Perfecto):</span> Si real es 2-1 y predijiste 2-1. Marcador y Ganador combinados.
                </li>
                <li>
                  <span className="font-bold">2 Puntos (Acierto por Tendencia):</span> 
                  Si real es 3-1 y predijiste 2-0. Acertaste que ganaba Local (Tendencia) Y que la diferencia de goles era exactamente de +2. 
                  También aplica para empates de diferente marcador: Real 1-1 y predijiste 2-2.
                </li>
                <li>
                  <span className="font-bold">1 Punto (Acierto Simple):</span> 
                  Si real es 3-1 y predijiste 1-0. Acertaste que ganaba Local (Tendencia), pero ni los goles reales ni la diferencia exacta (+2 vs +1) coincidieron.
                </li>
                <li>
                  <span className="font-bold">0 Puntos (Inacierto):</span> 
                  Si real es 0-2 (ganador visitante) y predijiste 2-1 o 1-1 (ganador local u empate).
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl p-5 relative overflow-hidden group">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-mono text-amber-300">Código del Algoritmo de Negocio (TypeScript)</span>
              <button
                id="btn-copy-algorithm"
                onClick={() => copyToClipboard(algorithmCode)}
                className="p-1 px-3 bg-slate-800 text-slate-300 hover:text-white rounded text-xs flex items-center gap-1 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <pre className="font-mono text-xs text-slate-200 overflow-x-auto max-h-96 leading-relaxed">
              {algorithmCode}
            </pre>
          </div>
        </div>
      )}

      {activeSubTab === 'flow' && (
        <div className="space-y-6" id="architecture-flow-section">
          <div className="relative border-l-2 border-slate-200 pl-6 ml-4 space-y-8">
            <div className="relative">
              <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-indigo-600 border-4 border-white"></div>
              <h4 className="font-bold text-slate-900 text-sm">Paso 1: Bienvenida e Identificación</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                El usuario ingresa a la app, ve una pantalla amigable de onboarding donde puede registrarse con su nombre de usuario, elegir un avatar divertido (emoji de animal/fútbol), o iniciar sesión con un código único de su cuenta.
              </p>
            </div>

            <div className="relative">
              <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-indigo-600 border-4 border-white"></div>
              <h4 className="font-bold text-slate-900 text-sm">Paso 2: Liga Privada (Unirse o Crear)</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                El mundialito cobra sentido al jugar con amigos. El usuario puede <strong>Crear una Liga</strong> (generando un código único instantáneo de 6 letras como <code className="bg-slate-100 px-1 rounded text-red-600 font-mono">MUNDIAL2026</code>) o ingresar el código de un amigo para **Unirse a la Liga**.
              </p>
            </div>

            <div className="relative">
              <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-indigo-600 border-4 border-white"></div>
              <h4 className="font-bold text-slate-900 text-sm">Paso 3: Dashboard de Pronósticos y Calendario</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Visualizan el calendario completo de partidos filtrado por Fase (Grupos, Octavos, Cuartos, etc.). Los partidos "abiertos" muestran campos numéricos deslizables o botones sencillos +/- para definir sus pronósticos. Los partidos del día que empiecen en menos de 15 minutos muestran un candado e impiden cualquier alteración, asegurando la transparencia total del juego.
              </p>
            </div>

            <div className="relative">
              <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-indigo-600 border-4 border-white"></div>
              <h4 className="font-bold text-slate-900 text-sm">Paso 4: Tabla de Posiciones Competitiva (Leaderboard)</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Los usuarios pueden ver el ranking global de su liga privada en tiempo real. Al hacer clic en cualquier participante de la tabla, se listan los pronósticos que dicho participante ingresó (solo se revelan los pronósticos de los partidos ya bloqueados o finalizados para evitar copias deshonestas antes del juego).
              </p>
            </div>

            <div className="relative">
              <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-indigo-600 border-4 border-white"></div>
              <h4 className="font-bold text-slate-900 text-sm">Paso 5: Administración Colectiva (Simulador)</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Cualquier usuario o el administrador autorizado ingresa al marcador real de los partidos finalizados. Al guardar, el motor de reglas re-calcula las posiciones de todos los usuarios de la liga correspondientemente y emite un sonido o notificación visual de celebración a los ganadores de la jornada.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
