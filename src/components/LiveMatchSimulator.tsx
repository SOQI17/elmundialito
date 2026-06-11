import React, { useState, useEffect, useRef } from 'react';
import { Match, UserProfile, MatchIncident } from '../types';
import { Play, Pause, X, Radio, RefreshCw, Trophy, Zap, AlertCircle, ArrowUpRight, Shield, Clock, Eye, ToggleLeft, Send, Sparkles } from 'lucide-react';
import TeamFlag from './TeamFlag';

interface LiveMatchSimulatorProps {
  match: Match;
  currentUser: UserProfile;
  onClose: () => void;
  onUpdateMatchResult: (
    matchId: string,
    homeScore: number | undefined,
    awayScore: number | undefined,
    status: Match['status'],
    mode?: Match['mode'],
    liveStartTimestamp?: number,
    incidents?: Match['incidents']
  ) => void;
}

export default function LiveMatchSimulator({
  match,
  currentUser,
  onClose,
  onUpdateMatchResult
}: LiveMatchSimulatorProps) {
  const currentMode = 'realtime' as string;

  // Configuración de la simulación rápida (solo aplica en modo 'simulated')
  const [isPlaying, setIsPlaying] = useState(false);
  const [simGameMinute, setSimGameMinute] = useState(0);
  const [simHomeScore, setSimHomeScore] = useState(match.homeScore ?? 0);
  const [simAwayScore, setSimAwayScore] = useState(match.awayScore ?? 0);
  const [speedMultiplier, setSpeedMultiplier] = useState<1 | 2 | 5>(2);
  const [isBroadcastEnabled, setIsBroadcastEnabled] = useState(true); // Siempre activo por defecto para simular
  const [simIncidents, setSimIncidents] = useState<MatchIncident[]>([]);

  // Estadísticas del juego (se actualizan dinámicamente)
  const [stats, setStats] = useState({
    possessionHome: 50,
    shotsHome: Math.max(2, (match.homeScore ?? 0) * 2 + 1),
    shotsAway: Math.max(1, (match.awayScore ?? 0) * 2),
    foulsHome: 4,
    foulsAway: 5,
    cornersHome: 2,
    cornersAway: 3
  });

  // Recalcular estadísticas basadas en los incidentes reales
  useEffect(() => {
    const list = currentMode === 'realtime' ? (match.incidents || []) : simIncidents;
    
    let goalsH = 0;
    let goalsA = 0;
    let shotsH = 0;
    let shotsA = 0;
    let foulsH = 0;
    let foulsA = 0;
    let cornersH = 0;
    let cornersA = 0;

    list.forEach(inc => {
      if (inc.type === 'goal_home') {
        goalsH++;
        shotsH++;
      } else if (inc.type === 'goal_away') {
        goalsA++;
        shotsA++;
      } else if (inc.type === 'shot_miss') {
        if (inc.title.includes(match.homeTeam.name)) {
          shotsH++;
        } else if (inc.title.includes(match.awayTeam.name)) {
          shotsA++;
        } else {
          if (inc.minute % 2 === 0) shotsH++; else shotsA++;
        }
      } else if (inc.type === 'corner') {
        if (inc.title.includes(match.homeTeam.name)) {
          cornersH++;
        } else if (inc.title.includes(match.awayTeam.name)) {
          cornersA++;
        } else {
          if (inc.minute % 2 === 0) cornersH++; else cornersA++;
        }
      } else if (inc.type === 'foul' || inc.type.startsWith('yellow_') || inc.type.startsWith('red_')) {
        const isHome = inc.type.endsWith('_home') || inc.title.includes(match.homeTeam.name);
        if (isHome) foulsH++; else foulsA++;
      }
    });

    if (match.id === 'M_1' && match.status === 'finished') {
      setStats({
        possessionHome: 61,
        shotsHome: 16,
        shotsAway: 4,
        foulsHome: 12,
        foulsAway: 11,
        cornersHome: 7,
        cornersAway: 2
      });
    } else {
      // Fallbacks si no hay suficientes incidentes
      setStats({
        possessionHome: Math.max(20, Math.min(80, 50 + (goalsH - goalsA) * 3 + (shotsH - shotsA) * 2)),
        shotsHome: Math.max(goalsH, shotsH || (match.homeScore ?? 0) * 2 + 1),
        shotsAway: Math.max(goalsA, shotsA || (match.awayScore ?? 0) * 2),
        foulsHome: Math.max(foulsH, 4),
        foulsAway: Math.max(foulsA, 5),
        cornersHome: Math.max(cornersH, 2),
        cornersAway: Math.max(cornersA, 3)
      });
    }
  }, [match.incidents, simIncidents, currentMode, match.homeScore, match.awayScore, match.homeTeam.name, match.awayTeam.name]);

  // Minuto actual unificado según el modo activo
  const [gameMinute, setGameMinute] = useState(0);

  const timelineEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Narraciones futboleras pintorescas
  const NARRATIVES = {
    shots: [
      "¡Qué cerca se quedó! El disparo rozó el travesaño del arquero.",
      "¡Espectacular atajada! El portero vuela y manda el gran balonazo hacia afuera.",
      "Bombazo de media distancia que se marcha apenas desviado por el sector derecho.",
      "Prueba portería con un disparo débil que controla el guardameta sin inconvenientes."
    ],
    fouls: [
      "Fuerte infracción en la mitad de la cancha para frenar la contra del rival.",
      "El árbitro pita falta. Juego físico y de mucha fricción en el mediocampo.",
      "Entrada tardía que deja resentido al jugador de la delantera.",
      "Falta táctica muy inteligente para reagrupar las líneas defensivas del combinado nacional."
    ],
    corners: [
      "Balón al tiro de esquina tras un centro peligroso despejado con los puños.",
      "El centro viaja al corazón del área chica pero el guardameta se cuelga del balón.",
      "¡Cabezazo defensivo providencial! Tiro de esquina peligroso que soluciona la zaga."
    ],
    goalsHome: [
      "¡¡¡GOOOOOOOOOOL DE [TEAM]!!! Tremendo zapatazo cruzado imparable.",
      "¡¡¡GOOOOOOOL!!! Remate soberbio de cabeza tras un centro milimétrico.",
      "¡¡¡GOOOOLAZO de [TEAM]!!! Aprovecha un error defensivo y define de vaselina impecable sobre el arquero.",
      "¡¡¡GOOOOOOOL!!! Recupera en el área pequeña y fusila las redes con potencia pura."
    ],
    goalsAway: [
      "¡¡¡GOOOOOOOOOOL DE [TEAM]!!! Excelente jugada colectiva hilvanada para silenciar el estadio.",
      "¡¡¡GOOOOOOOL!!! Gran definición templada en el mano a mano contra el portero.",
      "¡¡¡GOOOOLAZO de [TEAM]!!! Cobro de tiro libre perfecto directo al ángulo.",
      "¡¡¡GOOOOOOOL!!! Empuja el balón en la línea de gol tras una serie de rebotes cardíacos."
    ],
    yellows: [
      "Tarjeta amarilla. Entrada ruda abajo que amerita amonestación reglamentaria de inmediato.",
      "El silbante muestra el cartón preventivo por reiteración de infracciones tácticas.",
      "Amonestación por demorar la reanudación del partido."
    ],
    reds: [
      "¡¡ROJA DIRECTA!! Falta antideportiva clarísima como último hombre en la defensa.",
      "Segunda amarilla para el mediocampo defensivo y se marcha expulsado a los vestidores."
    ]
  };

  // CALCULO DE TIEMPO TRANSCURRIDO PARA MODO REALTIME
  const getElapsedRealTimeMinute = (): number => {
    // Si el administrador especificó/guardó una hora de inicio manual o ajustó el minuto actual
    if (match.liveStartTimestamp) {
      const diffMs = Date.now() - match.liveStartTimestamp;
      const calculatedMinutes = Math.floor(diffMs / 60000); // 60,000ms = 1 minuto real
      if (calculatedMinutes > 120) return 120; // Límite de tiempo extra máximo
      return Math.max(0, calculatedMinutes);
    }

    // Si no hay timestamp de inicio manual, calcular basándose en el horario oficial de inicio del partido (kickoff)
    const kickoff = new Date(match.dateTime).getTime();
    const now = Date.now();
    const diffMs = now - kickoff;
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 0) return 0;
    if (diffMinutes <= 45) return diffMinutes;
    if (diffMinutes <= 60) return 45; // Entretiempo (mostramos 45')
    if (diffMinutes <= 105) return diffMinutes - 15; // Segundo tiempo (se restan 15' de entretiempo)
    return 90; // Finalizado / Tiempo reglamentario cumplido
  };

  // Inicializar simulación rápida con marcadores actuales
  useEffect(() => {
    if (currentMode === 'simulated') {
      if (match.status === 'finished') {
        setSimGameMinute(90);
        setGameMinute(90);
        setSimIncidents([
          { minute: 0, type: 'start', title: 'Inicio del Partido', description: `¡Pitazo inicial! Arranca el partido entre ${match.homeTeam.name} y ${match.awayTeam.name}.`, timestamp: Date.now() },
          { minute: 45, type: 'half_time', title: 'Medio Tiempo', description: 'El árbitro señala el final del primer tiempo. Los jugadores van al descanso de vestidores.', timestamp: Date.now() },
          { minute: 90, type: 'end', title: 'Fin del Partido', description: `¡Finaliza el encuentro emocionante con marcador final ${match.homeTeam.name} ${match.homeScore ?? 0} - ${match.awayScore ?? 0} ${match.awayTeam.name}!`, timestamp: Date.now() }
        ]);
        setSimHomeScore(match.homeScore ?? 0);
        setSimAwayScore(match.awayScore ?? 0);
      } else {
        setSimGameMinute(0);
        setGameMinute(0);
        setSimIncidents([
          {
            minute: 0,
            type: 'start',
            title: '🚨 Transmisión en Vivo (Ficticia)',
            description: `¡Bienvenidos al Estadio virtual! Arranca la simulación interactiva rápida entre ${match.homeTeam.flag} ${match.homeTeam.name} y ${match.awayTeam.flag} ${match.awayTeam.name}. ¡Rueda el balón!`,
            timestamp: Date.now()
          }
        ]);
        setSimHomeScore(0);
        setSimAwayScore(0);
      }
    }
  }, [match.id, currentMode]);

  // Manejar el reloj de minutos según el modo
  useEffect(() => {
    if (currentMode === 'realtime') {
      if (match.status === 'live') {
        setGameMinute(getElapsedRealTimeMinute());

        // Actualizar minuto cada 5 segundos
        const timer = setInterval(() => {
          setGameMinute(getElapsedRealTimeMinute());
        }, 5000);

        return () => clearInterval(timer);
      } else if (match.status === 'finished') {
        // Si ya finalizó de forma real, mostramos el minuto en 90 o el último incidente registrado
        const lastInc = match.incidents?.[match.incidents.length - 1];
        setGameMinute(lastInc?.minute ?? 90);
      } else {
        setGameMinute(0);
      }
    } else {
      // Modo de simulación rápida por intervalos
      setGameMinute(simGameMinute);
    }
  }, [currentMode, match.liveStartTimestamp, match.status, simGameMinute, match.incidents]);

  // Scroll automático cada vez que hay incidentes activos en pantalla
  const activeIncidents = currentMode === 'realtime' ? (match.incidents || []) : simIncidents;

  useEffect(() => {
    setTimeout(() => {
      timelineEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [activeIncidents.length]);

  // Loop principal de Simulación Rápida
  useEffect(() => {
    if (currentMode === 'simulated' && isPlaying) {
      const intervalMs = 1000 / speedMultiplier;
      timerRef.current = setInterval(() => {
        setSimGameMinute(prev => {
          const nextMin = prev + 1;
          
          if (nextMin > 90) {
            handleStopSimSimulation(90, simHomeScore, simAwayScore);
            return 90;
          }

          // Generación de incidentes aleatorios en la simulación rápida
          triggerRandomSimIncidents(nextMin);

          return nextMin;
        });
      }, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, simGameMinute, speedMultiplier, simHomeScore, simAwayScore, currentMode]);

  // Sincronizar marcador de simulación rápida con Firebase si broadcast está activo
  const syncSimLiveStats = async (min: number, currentH: number, currentA: number, finalStatus: Match['status']) => {
    if (isBroadcastEnabled && currentMode === 'simulated') {
      try {
        await onUpdateMatchResult(match.id, currentH, currentA, finalStatus, 'simulated');
      } catch (e) {
        console.error("Falla al transferir marcador en vivo ficticio:", e);
      }
    }
  };

  const handleStopSimSimulation = (finalMin: number, scoreH: number, scoreA: number) => {
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
    
    const endIncident: MatchIncident = {
      minute: finalMin,
      type: 'end',
      title: '🏁 Fin de la Simulación',
      description: `¡Silbatazo final del árbitro de simulación! Termina la transmisión acelerada. Resultado: ${match.homeTeam.name} ${scoreH} - ${scoreA} ${match.awayTeam.name}.`,
      timestamp: Date.now()
    };

    setSimIncidents(prev => [...prev, endIncident]);
    setSimGameMinute(finalMin);
    
    syncSimLiveStats(finalMin, scoreH, scoreA, 'finished');
  };

  // Generador de eventos aleatorios de simulación acelerada
  const triggerRandomSimIncidents = (currentMin: number) => {
    if (currentMin === 45) {
      setSimIncidents(prev => [...prev, {
        minute: 45,
        type: 'half_time',
        title: '☕ Medio Tiempo (Ficticio)',
        description: `Finaliza el primer lapso de simulación rápida. El técnico planea cambios tácticos. Marcador provisional: ${match.homeTeam.name} ${simHomeScore} - ${simAwayScore} ${match.awayTeam.name}.`,
        timestamp: Date.now()
      }]);
      setIsPlaying(false); // Pausar para más realismo
      return;
    }

    // Cambiar la posesión dinámicamente
    setStats(prev => ({
      ...prev,
      possessionHome: Math.max(30, Math.min(70, prev.possessionHome + (Math.random() > 0.5 ? 2 : -2)))
    }));

    const roll = Math.random() * 100;

    // Gol Local (2% de probabilidad por minuto acelerado)
    if (roll < 2) {
      const nextHomeScore = simHomeScore + 1;
      setSimHomeScore(nextHomeScore);
      
      const phrase = NARRATIVES.goalsHome[Math.floor(Math.random() * NARRATIVES.goalsHome.length)]
        .replace("[TEAM]", match.homeTeam.name.toUpperCase());

      setSimIncidents(prev => [...prev, {
        minute: currentMin,
        type: 'goal_home',
        title: `⚽ ¡GOOOOOOL DE ${match.homeTeam.name.toUpperCase()}!`,
        description: phrase,
        timestamp: Date.now()
      }]);

      setStats(prev => ({ ...prev, shotsHome: prev.shotsHome + 1 }));
      syncSimLiveStats(currentMin, nextHomeScore, simAwayScore, 'live');
      return;
    }

    // Gol Visitante (1.8% de probabilidad por minuto acelerado)
    if (roll >= 2 && roll < 3.8) {
      const nextAwayScore = simAwayScore + 1;
      setSimAwayScore(nextAwayScore);

      const phrase = NARRATIVES.goalsAway[Math.floor(Math.random() * NARRATIVES.goalsAway.length)]
        .replace("[TEAM]", match.awayTeam.name.toUpperCase());

      setSimIncidents(prev => [...prev, {
        minute: currentMin,
        type: 'goal_away',
        title: `⚽ ¡GOOOOOOL DE ${match.awayTeam.name.toUpperCase()}!`,
        description: phrase,
        timestamp: Date.now()
      }]);

      setStats(prev => ({ ...prev, shotsAway: prev.shotsAway + 1 }));
      syncSimLiveStats(currentMin, simHomeScore, nextAwayScore, 'live');
      return;
    }

    // Remate errado / Atajada (8% de probabilidad)
    if (roll >= 3.8 && roll < 11.8) {
      const isHome = Math.random() > 0.45;
      const teamLabel = isHome ? match.homeTeam.name : match.awayTeam.name;
      const phrase = NARRATIVES.shots[Math.floor(Math.random() * NARRATIVES.shots.length)];

      setSimIncidents(prev => [...prev, {
        minute: currentMin,
        type: 'shot_miss',
        title: `💥 Aviso peligroso de ${teamLabel}`,
        description: phrase,
        timestamp: Date.now()
      }]);

      setStats(prev => {
        if (isHome) return { ...prev, shotsHome: prev.shotsHome + 1 };
        return { ...prev, shotsAway: prev.shotsAway + 1 };
      });
      return;
    }

    // Falta (12% de probabilidad)
    if (roll >= 11.8 && roll < 23.8) {
      const isHome = Math.random() > 0.5;
      setStats(prev => {
        if (isHome) return { ...prev, foulsHome: prev.foulsHome + 1 };
        return { ...prev, foulsAway: prev.foulsAway + 1 };
      });

      if (Math.random() < 0.20) {
        const type = isHome ? 'yellow_home' : 'yellow_away';
        const teamLabel = isHome ? match.homeTeam.name : match.awayTeam.name;
        const cardPhrase = NARRATIVES.yellows[Math.floor(Math.random() * NARRATIVES.yellows.length)];

        setSimIncidents(prev => [...prev, {
          minute: currentMin,
          type,
          title: `🟨 Tarjeta Amarilla para ${teamLabel}`,
          description: cardPhrase,
          timestamp: Date.now()
        }]);
      }
      return;
    }

    // Tiro de esquina (6% de probabilidad)
    if (roll >= 23.8 && roll < 29.8) {
      const isHome = Math.random() > 0.5;
      const phrase = NARRATIVES.corners[Math.floor(Math.random() * NARRATIVES.corners.length)];

      setSimIncidents(prev => [...prev, {
        minute: currentMin,
        type: 'corner',
        title: `📐 Tiro de Esquina para ${isHome ? match.homeTeam.name : match.awayTeam.name}`,
        description: phrase,
        timestamp: Date.now()
      }]);

      setStats(prev => {
        if (isHome) return { ...prev, cornersHome: prev.cornersHome + 1 };
        return { ...prev, cornersAway: prev.cornersAway + 1 };
      });
      return;
    }
  };

  const resetSimSimulation = () => {
    setIsPlaying(false);
    setSimGameMinute(0);
    setSimHomeScore(0);
    setSimAwayScore(0);
    setStats({
      possessionHome: 50,
      shotsHome: 0,
      shotsAway: 0,
      foulsHome: 0,
      foulsAway: 0,
      cornersHome: 0,
      cornersAway: 0
    });
    setSimIncidents([
      {
        minute: 0,
        type: 'start',
        title: '🚨 Transmisión en Vivo Reiniciada',
        description: `Los banquillos se vuelven a acomodar. ¡Todo listo en el estadio para reiniciar la simulación rápida de ${match.homeTeam.flag} ${match.homeTeam.name} vs ${match.awayTeam.flag} ${match.awayTeam.name}!`,
        timestamp: Date.now()
      }
    ]);
    syncSimLiveStats(0, 0, 0, 'live');
  };


  // --- ADMINISTRACIÓN EN TIEMPO REAL (FÚTBOL REAL COOPERATIVO) ---

  const handleToggleMode = async (newMode: 'simulated' | 'realtime') => {
    // Permitimos a todos cambiar de modo en el simulador para una óptima experiencia interactiva
    if (newMode === 'realtime') {
      const initialIncidents: MatchIncident[] = match.incidents && match.incidents.length > 0 ? match.incidents : [
        {
          minute: 0,
          type: 'start',
          title: '🚨 Señal En Vivo Iniciada',
          description: `¡Bienvenidos! Iniciamos la transmisión oficial en TIEMPO REAL de este apasionante cotejo futbolístico entre ${match.homeTeam.flag} ${match.homeTeam.name} y ${match.awayTeam.flag} ${match.awayTeam.name}.`,
          timestamp: Date.now()
        }
      ];

      await onUpdateMatchResult(
        match.id,
        match.homeScore ?? 0,
        match.awayScore ?? 0,
        'live',
        'realtime',
        match.liveStartTimestamp || Date.now(),
        initialIncidents
      );
    } else {
      await onUpdateMatchResult(
        match.id,
        0,
        0,
        'scheduled',
        'simulated',
        undefined,
        []
      );
    }
  };

  const startRealTimeClock = async () => {
    const freshIncidents: MatchIncident[] = [
      {
        minute: 0,
        type: 'start',
        title: '⚽ ¡Pitazo Inicial en Vivo!',
        description: `El árbitro principal sopla su silbato. ¡Arrancan los 90 minutos oficiales en tiempo real! Las estadísticas y goles se actualizarán al instante en los navegadores de todos los usuarios de la quiniela.`,
        timestamp: Date.now()
      }
    ];

    await onUpdateMatchResult(
      match.id,
      0,
      0,
      'live',
      'realtime',
      Date.now(),
      freshIncidents
    );
  };

  const submitRealTimeEvent = async (
    type: MatchIncident['type'],
    title: string,
    description: string
  ) => {
    let incidentMinute = getElapsedRealTimeMinute();
    let updatedHomeScore = match.homeScore ?? 0;
    let updatedAwayScore = match.awayScore ?? 0;

    if (type === 'goal_home') {
      updatedHomeScore += 1;
    } else if (type === 'goal_away') {
      updatedAwayScore += 1;
    }

    const newIncident: MatchIncident = {
      minute: incidentMinute,
      type,
      title,
      description,
      timestamp: Date.now()
    };

    const currentList = match.incidents || [];
    const newList = [...currentList, newIncident];

    await onUpdateMatchResult(
      match.id,
      updatedHomeScore,
      updatedAwayScore,
      'live',
      'realtime',
      match.liveStartTimestamp,
      newList
    );

    // Incrementar estadísticas en caliente locales
    setStats(prev => {
      const isHome = type.endsWith('_home') || type === 'goal_home';
      const isAway = type.endsWith('_away') || type === 'goal_away';
      return {
        ...prev,
        shotsHome: prev.shotsHome + (type.startsWith('goal') || type === 'shot_miss' ? (isHome ? 1 : 0) : 0),
        shotsAway: prev.shotsAway + (type.startsWith('goal') || type === 'shot_miss' ? (isAway ? 1 : 0) : 0),
        foulsHome: prev.foulsHome + (type === 'foul' && isHome ? 1 : 0),
        foulsAway: prev.foulsAway + (type === 'foul' && isAway ? 1 : 0),
        cornersHome: prev.cornersHome + (type === 'corner' && isHome ? 1 : 0),
        cornersAway: prev.cornersAway + (type === 'corner' && isAway ? 1 : 0)
      };
    });
  };

  const triggerRealTimeAutoEvent = async () => {
    // Generar un evento automático al minuto real actual con comentarios futbolísticos
    const minute = getElapsedRealTimeMinute();
    const eventTypes: MatchIncident['type'][] = ['goal_home', 'goal_away', 'shot_miss', 'corner', 'foul', 'yellow_home', 'yellow_away'];
    const chosenType = eventTypes[Math.floor(Math.random() * eventTypes.length)];

    let title = '';
    let description = '';

    switch (chosenType) {
      case 'goal_home':
        title = `⚽ ¡GOOOOOOL DE ${match.homeTeam.name.toUpperCase()}!`;
        description = NARRATIVES.goalsHome[Math.floor(Math.random() * NARRATIVES.goalsHome.length)].replace("[TEAM]", match.homeTeam.name.toUpperCase());
        break;
      case 'goal_away':
        title = `⚽ ¡GOOOOOOL DE ${match.awayTeam.name.toUpperCase()}!`;
        description = NARRATIVES.goalsAway[Math.floor(Math.random() * NARRATIVES.goalsAway.length)].replace("[TEAM]", match.awayTeam.name.toUpperCase());
        break;
      case 'shot_miss':
        title = `💥 ¡Por poco de ${match.homeTeam.name}!`;
        description = NARRATIVES.shots[Math.floor(Math.random() * NARRATIVES.shots.length)];
        break;
      case 'corner':
        title = `📐 Tiro de Esquina para ${Math.random() > 0.5 ? match.homeTeam.name : match.awayTeam.name}`;
        description = NARRATIVES.corners[Math.floor(Math.random() * NARRATIVES.corners.length)];
        break;
      case 'foul':
        title = `⚠️ Falta táctica pitada`;
        description = NARRATIVES.fouls[Math.floor(Math.random() * NARRATIVES.fouls.length)];
        break;
      case 'yellow_home':
        title = `🟨 Tarjeta Amarilla (${match.homeTeam.name})`;
        description = NARRATIVES.yellows[Math.floor(Math.random() * NARRATIVES.yellows.length)];
        break;
      case 'yellow_away':
        title = `🟨 Tarjeta Amarilla (${match.awayTeam.name})`;
        description = NARRATIVES.yellows[Math.floor(Math.random() * NARRATIVES.yellows.length)];
        break;
    }

    await submitRealTimeEvent(chosenType, title, description);
  };

  const handleFinishRealTimeGame = async () => {
    const elapsed = getElapsedRealTimeMinute();
    const finishIncident: MatchIncident = {
      minute: elapsed,
      type: 'end',
      title: '🏁 ¡PITAZO FINAL OFICIAL!',
      description: `El árbitro silba el final definitivo del encuentro tras el tiempo reglamentario completo en vivo. Marcador Oficial e Histórico grabado en la Liga: ${match.homeTeam.name} ${match.homeScore ?? 0} - ${match.awayScore ?? 0} ${match.awayTeam.name}. ¡Los puntos se han distribuido a los jugadores de la polla automáticamente!`,
      timestamp: Date.now()
    };

    const currentList = match.incidents || [];
    await onUpdateMatchResult(
      match.id,
      match.homeScore ?? 0,
      match.awayScore ?? 0,
      'finished',
      'realtime',
      match.liveStartTimestamp,
      [...currentList, finishIncident]
    );
  };


  // --- PARIDADES DE IDENTIFICADORES Y RENDERIZADORES ---

  const dispHomeScore = currentMode === 'realtime' ? (match.homeScore ?? 0) : simHomeScore;
  const dispAwayScore = currentMode === 'realtime' ? (match.awayScore ?? 0) : simAwayScore;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-55 animate-fade-in animate-duration-150" id="live-simulator-modal-root">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl w-full max-w-3xl overflow-hidden flex flex-col h-[90vh] shadow-2xl relative">
        


        {/* TOP GLOW SCOREBOARD HEADER */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 border-b border-slate-850 relative shrink-0">
          
          <div className="absolute top-4 left-6 flex items-center gap-1.5 bg-rose-600 font-extrabold text-[9px] uppercase text-white px-2.5 py-1 rounded-full tracking-widest animate-pulse">
            <Radio className="w-3 h-3 text-white" />
            <span>FÚTBOL EN TIEMPO REAL</span>
          </div>

          <button
            id="close-live-simulator"
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-1.5 rounded-full transition-all cursor-pointer border border-slate-700"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Core Scorecard Grid */}
          <div className="grid grid-cols-3 items-center mt-7" id="live-score-grid">
            {/* Home team */}
            <div className="flex flex-col items-center text-center space-y-2">
              <span className="filter drop-shadow-md select-none" role="img" aria-label={match.homeTeam.name}>
                <TeamFlag team={match.homeTeam} size="lg" interactive={false} />
              </span>
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">{match.homeTeam.name}</span>
              <span className="text-[9px] bg-slate-800/80 border border-slate-750 text-slate-400 px-2 py-0.5 rounded-md uppercase font-bold">LOCAL</span>
            </div>

            {/* Middle scoreboard */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-5">
                <span className="text-4xl font-extrabold font-mono tracking-tighter text-white">
                  {dispHomeScore}
                </span>
                <span className="text-indigo-400 font-bold text-xl">:</span>
                <span className="text-4xl font-extrabold font-mono tracking-tighter text-white">
                  {dispAwayScore}
                </span>
              </div>

              {/* Game Minute Timer Display */}
              <div className="mt-3.5 flex flex-col items-center">
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-[10px] px-3.5 py-1 rounded-full flex items-center gap-1.5 animate-fadeIn">
                  <span className={`w-2 h-2 rounded-full bg-emerald-500 ${match.status === 'live' ? 'animate-pulse' : ''}`}></span>
                  <span>
                    {match.status === 'finished' 
                      ? 'FINALIZADO' 
                      : (match.status === 'live' && !match.liveStartTimestamp && Math.floor((Date.now() - new Date(match.dateTime).getTime()) / 60000) > 45 && Math.floor((Date.now() - new Date(match.dateTime).getTime()) / 60000) <= 60
                        ? 'ENTREETIEMPO' 
                        : `MINUTO ${gameMinute}'`
                      )}
                  </span>
                </div>
                {!match.liveStartTimestamp && match.status === 'live' && Math.floor((Date.now() - new Date(match.dateTime).getTime()) / 60000) < 0 && (
                  <span className="text-rose-400 text-[8px] font-bold uppercase tracking-wider mt-1 animate-pulse">El partido iniciará en el horario programado</span>
                )}
              </div>
            </div>

            {/* Away team */}
            <div className="flex flex-col items-center text-center space-y-2">
              <span className="filter drop-shadow-md select-none" role="img" aria-label={match.awayTeam.name}>
                <TeamFlag team={match.awayTeam} size="lg" interactive={false} />
              </span>
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">{match.awayTeam.name}</span>
              <span className="text-[9px] bg-slate-800/80 border border-slate-750 text-slate-400 px-2 py-0.5 rounded-md uppercase font-bold">VISITANTE</span>
            </div>
          </div>
        </div>

        {/* CONTROLLER: CANAL OFICIAL EN TIEMPO REAL CON REPLICACIÓN ABSOLUTA EN FIREBASE */}
        <div className="bg-slate-950 border-b border-slate-850 p-4 shrink-0 flex flex-wrap gap-4 justify-between items-center text-xs">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-900/60 px-3.5 py-1.5 rounded-full text-emerald-400">
              <Clock className="w-4 h-4 animate-spin-slow" />
              <span className="font-extrabold text-[10px] uppercase tracking-wider">⏱️ Reloj Tiempo Real Activo</span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:inline-block">
              Sincronizado vía satélite con todos los amigos de la polla.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {match.status === 'scheduled' || (match.status === 'live' && !match.liveStartTimestamp && Date.now() < new Date(match.dateTime).getTime()) ? (
              currentUser.isAdmin ? (
                <button
                  onClick={startRealTimeClock}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-900/20"
                >
                  <Play className="w-3.5 h-3.5 fill-white animate-bounce-short" />
                  <span>DAR INICIO AL PARTIDO (TIEMPO REAL)</span>
                </button>
              ) : (
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 select-none">
                  ⚽ Esperando Pitazo Inicial
                </span>
              )
            ) : match.status === 'finished' ? (
              <span className="text-[10px] uppercase font-black tracking-wider text-rose-500 animate-pulse">
                🛑 Partido Terminado Oficialmente
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1 bg-stone-900 rounded-lg text-[10px] font-mono font-black uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  TRANSMITIENDO EN VIVO (Minuto {gameMinute}')
                </span>
              </div>
            )}
          </div>
        </div>

        {/* MAIN SPLIT VIEWPORTS: STADIUM, LIVE STATISTICS & CHRONOLOGY */}
        <div className="flex-1 overflow-y-auto flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-800 min-h-0 bg-slate-900" id="live-simulation-viewports">
          
          {/* STADIUM GRAPHIC AND STATS */}
          <div className="w-full md:w-3/5 flex flex-col p-5 space-y-6 h-full overflow-y-auto min-h-[300px]" id="pitch-stats-view">
            
            {/* MINI STADIUM PITCH PREVIEW */}
            <div className="bg-gradient-to-b from-emerald-800 to-emerald-950 h-36 rounded-2xl relative border border-slate-800 shadow-inner flex items-center justify-center overflow-hidden shrink-0">
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
              
              <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/30"></div>
              <div className="absolute inset-y-8 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full border border-white/20"></div>
              <div className="absolute left-0 top-1/4 bottom-1/4 w-5 border-y border-r border-white/20"></div>
              <div className="absolute right-0 top-1/4 bottom-1/4 w-5 border-y border-l border-white/20"></div>

              {/* Animated ball on pitch */}
              <div className={`absolute transition-all duration-1000 bg-white text-slate-900 font-black rounded-full text-sm w-8 h-8 flex items-center justify-center shadow-lg ${
                isPlaying || (currentMode === 'realtime' && match.status === 'live') ? 'animate-bounce' : ''
              }`} style={{
                left: `${40 + (stats.possessionHome - 50) * 0.4}%`,
                top: `${40 + (Math.sin(gameMinute) * 15)}%`
              }}>
                ⚽
              </div>

              <div className="absolute bottom-3 left-4 flex items-center gap-1 text-[9px] font-bold text-emerald-100 bg-emerald-950/70 border border-emerald-800/40 px-2 py-0.5 rounded-md backdrop-blur-xs">
                <Shield className="w-3 h-3 text-white" />
                <span>Estadio Copa Mundial 2026</span>
              </div>

              <div className="absolute top-2.5 right-3.5 bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 font-mono text-[8px] px-2 py-0.5 rounded-md tracking-wider">
                {match.status === 'live' ? '⚡ TRANSMISIÓN EN VIVO' : '⏸️ RETRANSMISIÓN'}
              </div>
            </div>

            {/* REAL-TIME MATCH STATISTICS */}
            <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 space-y-4 shrink-0 shadow-inner" id="live-match-stats-panel">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 select-none">
                📊 Estadísticas del Partido en Vivo
              </h4>
              
              <div className="space-y-3">
                {/* Possession */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400">
                    <span>{stats.possessionHome}%</span>
                    <span className="uppercase tracking-wider font-mono">Posesión</span>
                    <span>{100 - stats.possessionHome}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                    <div className="bg-indigo-500 h-full transition-all duration-500" style={{ width: `${stats.possessionHome}%` }}></div>
                    <div className="bg-slate-700 h-full grow transition-all duration-500"></div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  {/* Shots */}
                  <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-2">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Remates</span>
                    <div className="flex justify-center items-center gap-2 mt-1">
                      <strong className="text-white font-extrabold">{stats.shotsHome}</strong>
                      <span className="text-slate-650 font-bold">:</span>
                      <strong className="text-white font-extrabold">{stats.shotsAway}</strong>
                    </div>
                  </div>

                  {/* Corners */}
                  <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-2">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Córners</span>
                    <div className="flex justify-center items-center gap-2 mt-1">
                      <strong className="text-white font-extrabold">{stats.cornersHome}</strong>
                      <span className="text-slate-650 font-bold">:</span>
                      <strong className="text-white font-extrabold">{stats.cornersAway}</strong>
                    </div>
                  </div>

                  {/* Fouls */}
                  <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-2">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Faltas</span>
                    <div className="flex justify-center items-center gap-2 mt-1">
                      <strong className="text-white font-extrabold">{stats.foulsHome}</strong>
                      <span className="text-slate-650 font-bold">:</span>
                      <strong className="text-white font-extrabold">{stats.foulsAway}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* LIVE CONSOLE BAR: AVAILABLE TO THOSE IN REALTIME MODE FOR DEMOING AND ADMIN */}
            {currentUser.isAdmin && match.status === 'live' && (
              <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/20 space-y-3 shrink-0">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black uppercase text-indigo-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span>
                    Consola de Incidentes en Tiempo Real
                  </span>
                  <span className="text-[8px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 uppercase font-mono font-bold">
                    Probar en vivo
                  </span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                  <button
                    onClick={() => submitRealTimeEvent('goal_home', `⚽ GOL DE ${match.homeTeam.name.toUpperCase()}!`, `¡Magnífico gol de ${match.homeTeam.name}! El estadio ruge en directo.`)}
                    className="py-1.5 px-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800/50 text-emerald-300 font-extrabold text-[9px] text-center rounded-lg cursor-pointer"
                  >
                    ⚽ L GOL
                  </button>
                  <button
                    onClick={() => submitRealTimeEvent('goal_away', `⚽ GOL DE ${match.awayTeam.name.toUpperCase()}!`, `¡Anotación tremenda de ${match.awayTeam.name}! Brutal jugada hilvanada.`)}
                    className="py-1.5 px-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800/50 text-emerald-300 font-extrabold text-[9px] text-center rounded-lg cursor-pointer"
                  >
                    ⚽ V GOL
                  </button>
                  <button
                    onClick={() => submitRealTimeEvent('yellow_home', `🟨 Tarjeta Amarilla (${match.homeTeam.name})`, `Falta táctica fuerte que frena el contraataque.`)}
                    className="py-1.5 px-1 bg-amber-950 hover:bg-amber-900 border border-amber-800/50 text-amber-300 font-extrabold text-[9px] text-center rounded-lg cursor-pointer"
                  >
                    🟨 Amar. L
                  </button>
                  <button
                    onClick={() => submitRealTimeEvent('yellow_away', `🟨 Tarjeta Amarilla (${match.awayTeam.name})`, `Amonestado por reclamar desairadamente al juez de línea.`)}
                    className="py-1.5 px-1 bg-amber-950 hover:bg-amber-900 border border-amber-800/50 text-amber-300 font-extrabold text-[9px] text-center rounded-lg cursor-pointer"
                  >
                    🟨 Amar. V
                  </button>
                  <button
                    onClick={() => submitRealTimeEvent('shot_miss', `💥 Remate de Peligro`, `¡Ufff, el balón rosó las mallas por fuera!`)}
                    className="py-1.5 px-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-extrabold text-[9px] text-center rounded-lg cursor-pointer"
                  >
                    💥 Remate
                  </button>
                  <button
                    onClick={() => submitRealTimeEvent('corner', `📐 Tiro de Esquina`, `Se alista el córner. Sube la defensa a rematar.`)}
                    className="py-1.5 px-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-extrabold text-[9px] text-center rounded-lg cursor-pointer"
                  >
                    📐 Córner
                  </button>
                  <button
                    onClick={triggerRealTimeAutoEvent}
                    className="py-1.5 px-1 bg-indigo-900 hover:bg-indigo-800 text-indigo-300 font-extrabold text-[9px] text-center rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-2.5 h-2.5 animate-spin-slow" />
                    <span>IA Event</span>
                  </button>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const text = new FormData(form).get('customDesc') as string;
                  if (!text || text.trim() === '') return;
                  submitRealTimeEvent('foul', '📢 Comentario Técnico del Arbitraje', text.trim());
                  form.reset();
                }} className="flex gap-2.5">
                  <input
                    type="text"
                    name="customDesc"
                    placeholder="Escribe un incidente o comentario personalizado..."
                    className="flex-1 bg-slate-900 border border-slate-750 text-xs rounded-xl px-3 py-1.5 font-medium outline-none text-slate-100 placeholder-slate-500 focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="bg-indigo-650 bg-indigo-600 hover:bg-indigo-500 font-extrabold text-xs text-white rounded-xl px-4 py-1.5 flex items-center gap-1 cursor-pointer select-none"
                  >
                    <Send className="w-3 h-3" />
                    <span>Enviar</span>
                  </button>
                </form>

                <div className="flex border-t border-slate-800/80 pt-2 flex-wrap items-center justify-between gap-1.5">
                  <span className="text-[8px] text-slate-400 italic">Cualquier evento de gol se guarda en vivo en base de datos.</span>
                  
                  <button
                    onClick={handleFinishRealTimeGame}
                    className="bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/50 hover:text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase cursor-pointer"
                  >
                    🏁 Terminar Partido Oficialmente
                  </button>
                </div>
              </div>
            )}


            {/* INFORMATIVE CALLOUT */}
            <div className="bg-indigo-950/20 border border-indigo-900/30 text-indigo-200/90 p-4 rounded-xl flex items-start gap-2.5 text-[11px] leading-relaxed select-none">
              <AlertCircle className="w-4 h-4 shrink-0 text-indigo-400 mt-0.5" />
              <div>
                <p className="font-extrabold text-indigo-300 uppercase tracking-wide text-[9px]">💡 ¿Sincronización Total?</p>
                <p className="text-slate-400 mt-0.5">
                  Los marcadores de los partidos en juego de la quiniela recalculan en tiempo real la tabla general de posiciones de todos los usuarios. ¡Las pollas se disfrutan en el minuto a minuto de la Eurocopa/Mundial!
                </p>
              </div>
            </div>
          </div>

          {/* CHRONOLOGICAL INCIDENTS LIST TIMELINE */}
          <div className="w-full md:w-2/5 p-5 flex flex-col h-full overflow-hidden" id="timeline-panel">
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 block border-b border-slate-800 pb-1.5 shrink-0 mb-4 select-none">
              📻 Narraciones y Minuto a Minuto
            </span>

            {/* Scrollable Incidents Feed */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 scrollbar-thin scrollbar-thumb-slate-800" id="incidents-feed-container">
              {activeIncidents.map((incident, ii) => {
                const getIconAndColor = (type: MatchIncident['type']) => {
                  switch (type) {
                    case 'start':
                      return { icon: '📢', color: 'bg-indigo-900/80 ring-indigo-500/20' };
                    case 'half_time':
                      return { icon: '☕', color: 'bg-amber-900/80 ring-amber-500/20' };
                    case 'end':
                      return { icon: '🏁', color: 'bg-slate-800 ring-slate-500/20' };
                    case 'goal_home':
                    case 'goal_away':
                      return { icon: '⚽', color: 'bg-emerald-900 ring-emerald-400/30 font-bold border border-emerald-400/30' };
                    case 'yellow_home':
                    case 'yellow_away':
                      return { icon: '🟨', color: 'bg-amber-950 border border-amber-600/70 ring-amber-500/10' };
                    case 'red_home':
                    case 'red_away':
                      return { icon: '🟥', color: 'bg-rose-950 border border-rose-600/70 ring-rose-500/10' };
                    case 'shot_miss':
                      return { icon: '💥', color: 'bg-slate-800/80' };
                    case 'corner':
                      return { icon: '📐', color: 'bg-indigo-950/70' };
                    default:
                      return { icon: '•', color: 'bg-slate-800' };
                  }
                };

                const style = getIconAndColor(incident.type);

                return (
                  <div key={ii} className="flex gap-2.5 items-start animate-fade-in animate-duration-150">
                    <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs shadow ring-2 ${style.color}`}>
                      {style.icon}
                    </div>

                    <div className="bg-slate-850 border border-slate-800 rounded-xl p-3 flex-1 space-y-1">
                      <div className="flex justify-between items-center text-[9px] font-black tracking-wider uppercase text-indigo-400">
                        <span>{incident.title}</span>
                        <span className="font-mono bg-slate-800 border border-slate-750 px-1.5 py-0.5 rounded text-white text-[9px]">{incident.minute}'</span>
                      </div>
                      <p className="text-[11px] leading-relaxed font-sans mt-0.5 text-slate-300">
                        {incident.description}
                      </p>
                    </div>
                  </div>
                );
              })}

              {activeIncidents.length === 0 && (
                <div className="text-center py-12 text-slate-500 italic text-xs select-none">
                  Esperando el silbatazo de inicio oficial...
                </div>
              )}
              <div ref={timelineEndRef} />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
