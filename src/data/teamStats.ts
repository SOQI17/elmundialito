export interface HistoricalMatch {
  date: string;
  opponent: string;
  score: string;
  result: 'G' | 'E' | 'P';
}

export interface TeamStatistics {
  id: string;
  name: string;
  pj: number;
  g: number;
  e: number;
  p: number;
  gf: number;
  gc: number;
  dg: number;
  puntos: number;
  winRate: string;
  racha: ('G' | 'E' | 'P')[];
  ultimosPartidos: HistoricalMatch[];
}

export const TEAM_STATS: Record<string, TeamStatistics> = {
  MEX: {
    id: 'MEX',
    name: 'México',
    pj: 5,
    g: 3,
    e: 2,
    p: 0,
    gf: 7,
    gc: 1,
    dg: 6,
    puntos: 11,
    winRate: '60%',
    racha: ["E","E","G","G","G"],
    ultimosPartidos: [
      { date: '2026-03-31', opponent: 'Bélgica', score: '1-1', result: 'E' },
      { date: '2026-03-28', opponent: 'Portugal', score: '0-0', result: 'E' },
      { date: '2026-02-25', opponent: 'Islandia', score: '4-0', result: 'G' },
      { date: '2025-12-25', opponent: 'Bolivia', score: '1-0', result: 'G' },
      { date: '2025-11-22', opponent: 'Panamá', score: '1-0', result: 'G' }
    ]
  },
  RSA: {
    id: 'RSA',
    name: 'Sudáfrica',
    pj: 5,
    g: 1,
    e: 1,
    p: 3,
    gf: 2,
    gc: 8,
    dg: -6,
    puntos: 4,
    winRate: '20%',
    racha: ["P","E","P","G","P"],
    ultimosPartidos: [
      { date: '2026-03-31', opponent: 'Camerún', score: '0-2', result: 'P' },
      { date: '2026-03-27', opponent: 'Panamá', score: '1-1', result: 'E' },
      { date: '2026-01-04', opponent: 'Camerún', score: '0-2', result: 'P' },
      { date: '2025-12-29', opponent: 'Zimbabue', score: '1-0', result: 'G' },
      { date: '2025-11-22', opponent: 'Egipto', score: '0-3', result: 'P' }
    ]
  },
  CZE: {
    id: 'CZE',
    name: 'República Checa',
    pj: 5,
    g: 2,
    e: 2,
    p: 1,
    gf: 12,
    gc: 6,
    dg: 6,
    puntos: 8,
    winRate: '40%',
    racha: ["E","E","G","G","P"],
    ultimosPartidos: [
      { date: '2026-03-31', opponent: 'Dinamarca', score: '2-2', result: 'E' },
      { date: '2026-03-28', opponent: 'Rep. de Irlanda', score: '2-2', result: 'E' },
      { date: '2025-11-17', opponent: 'Gibraltar', score: '6-0', result: 'G' },
      { date: '2025-11-13', opponent: 'San Marino', score: '1-0', result: 'G' },
      { date: '2025-10-12', opponent: 'Islas Feroe', score: '1-2', result: 'P' }
    ]
  },
  KOR: {
    id: 'KOR',
    name: 'Corea del Sur',
    pj: 5,
    g: 3,
    e: 0,
    p: 2,
    gf: 5,
    gc: 5,
    dg: 0,
    puntos: 9,
    winRate: '60%',
    racha: ["P","P","G","G","G"],
    ultimosPartidos: [
      { date: '2026-03-31', opponent: 'Austria', score: '0-1', result: 'P' },
      { date: '2026-03-28', opponent: 'Costa de Marfil', score: '0-4', result: 'P' },
      { date: '2025-11-18', opponent: 'Ghana', score: '1-0', result: 'G' },
      { date: '2025-11-14', opponent: 'Bolivia', score: '2-0', result: 'G' },
      { date: '2025-10-12', opponent: 'Paraguay', score: '2-0', result: 'G' }
    ]
  },
  CAN: {
    id: 'CAN',
    name: 'Canadá',
    pj: 5,
    g: 1,
    e: 4,
    p: 0,
    gf: 4,
    gc: 2,
    dg: 2,
    puntos: 7,
    winRate: '20%',
    racha: ["E","E","G","E","E"],
    ultimosPartidos: [
      { date: '2026-03-31', opponent: 'Túnez', score: '0-0', result: 'E' },
      { date: '2026-03-28', opponent: 'Islandia', score: '2-2', result: 'E' },
      { date: '2025-11-18', opponent: 'Venezuela', score: '2-0', result: 'G' },
      { date: '2025-11-14', opponent: 'Ecuador', score: '0-0', result: 'E' },
      { date: '2025-10-12', opponent: 'Colombia', score: '0-0', result: 'E' }
    ]
  },
  BIH: {
    id: 'BIH',
    name: 'Bosnia y Herzegovina',
    pj: 5,
    g: 2,
    e: 2,
    p: 1,
    gf: 5,
    gc: 4,
    dg: 1,
    puntos: 8,
    winRate: '40%',
    racha: ["E","E","P","G","G"],
    ultimosPartidos: [
      { date: '2026-03-31', opponent: 'Italia', score: '1-1', result: 'E' },
      { date: '2026-03-28', opponent: 'Gales', score: '1-1', result: 'E' },
      { date: '2025-11-18', opponent: 'Austria', score: '1-2', result: 'P' },
      { date: '2025-11-15', opponent: 'Rumania', score: '1-0', result: 'G' },
      { date: '2025-10-12', opponent: 'Malta', score: '1-0', result: 'G' }
    ]
  },
  QAT: {
    id: 'QAT',
    name: 'Catar',
    pj: 5,
    g: 1,
    e: 2,
    p: 2,
    gf: 4,
    gc: 5,
    dg: -1,
    puntos: 5,
    winRate: '20%',
    racha: ["E","E","P","P","G"],
    ultimosPartidos: [
      { date: '2026-03-31', opponent: 'Túnez', score: '0-0', result: 'E' },
      { date: '2026-03-28', opponent: 'Siria', score: '1-1', result: 'E' },
      { date: '2025-11-18', opponent: 'Palestina', score: '0-1', result: 'P' },
      { date: '2025-11-17', opponent: 'Zimbabue', score: '1-2', result: 'P' },
      { date: '2025-10-14', opponent: 'Egipto', score: '2-1', result: 'G' }
    ]
  },
  SUI: {
    id: 'SUI',
    name: 'Suiza',
    pj: 5,
    g: 1,
    e: 3,
    p: 1,
    gf: 3,
    gc: 4,
    dg: -1,
    puntos: 6,
    winRate: '20%',
    racha: ["E","P","E","G","E"],
    ultimosPartidos: [
      { date: '2026-03-31', opponent: 'Noruega', score: '0-0', result: 'E' },
      { date: '2026-03-27', opponent: 'Alemania', score: '1-3', result: 'P' },
      { date: '2025-11-18', opponent: 'Kosovo', score: '1-1', result: 'E' },
      { date: '2025-11-15', opponent: 'Suecia', score: '1-0', result: 'G' },
      { date: '2025-10-13', opponent: 'Eslovenia', score: '0-0', result: 'E' }
    ]
  },
  BRA: {
    id: 'BRA',
    name: 'Brasil',
    pj: 5,
    g: 2,
    e: 1,
    p: 2,
    gf: 9,
    gc: 7,
    dg: 2,
    puntos: 7,
    winRate: '40%',
    racha: ["G","P","E","G","P"],
    ultimosPartidos: [
      { date: '2026-03-31', opponent: 'Croacia', score: '3-1', result: 'G' },
      { date: '2026-03-28', opponent: 'Francia', score: '1-2', result: 'P' },
      { date: '2025-11-18', opponent: 'Túnez', score: '1-1', result: 'E' },
      { date: '2025-11-15', opponent: 'Senegal', score: '2-0', result: 'G' },
      { date: '2025-10-14', opponent: 'Japón', score: '2-3', result: 'P' }
    ]
  },
  MAR: {
    id: 'MAR',
    name: 'Marruecos',
    pj: 5,
    g: 3,
    e: 2,
    p: 0,
    gf: 8,
    gc: 2,
    dg: 6,
    puntos: 11,
    winRate: '60%',
    racha: ["G","E","G","E","G"],
    ultimosPartidos: [
      { date: '2026-03-31', opponent: 'Paraguay', score: '2-1', result: 'G' },
      { date: '2026-03-27', opponent: 'Ecuador', score: '1-1', result: 'E' },
      { date: '2026-01-18', opponent: 'Senegal', score: '2-0', result: 'G' },
      { date: '2026-01-14', opponent: 'Nigeria', score: '0-0', result: 'E' },
      { date: '2026-01-09', opponent: 'Camerún', score: '3-0', result: 'G' }
    ]
  },
  HAI: {
    id: 'HAI',
    name: 'Haití',
    pj: 5,
    g: 2,
    e: 1,
    p: 2,
    gf: 4,
    gc: 5,
    dg: -1,
    puntos: 7,
    winRate: '40%',
    racha: ["E","P","G","G","P"],
    ultimosPartidos: [
      { date: '2026-03-31', opponent: 'Islandia', score: '1-1', result: 'E' },
      { date: '2026-03-28', opponent: 'Túnez', score: '0-1', result: 'P' },
      { date: '2025-11-18', opponent: 'Nicaragua', score: '2-0', result: 'G' },
      { date: '2025-11-15', opponent: 'Costa Rica', score: '1-0', result: 'G' },
      { date: '2025-10-14', opponent: 'Honduras', score: '0-3', result: 'P' }
    ]
  },
  SCO: {
    id: 'SCO',
    name: 'Escocia',
    pj: 5,
    g: 2,
    e: 0,
    p: 3,
    gf: 5,
    gc: 7,
    dg: -2,
    puntos: 6,
    winRate: '40%',
    racha: ["P","P","G","P","G"],
    ultimosPartidos: [
      { date: '2026-03-31', opponent: 'Costa de Marfil', score: '0-1', result: 'P' },
      { date: '2026-03-28', opponent: 'Japón', score: '0-1', result: 'P' },
      { date: '2025-11-18', opponent: 'Dinamarca', score: '4-2', result: 'G' },
      { date: '2025-11-15', opponent: 'Grecia', score: '0-3', result: 'P' },
      { date: '2025-10-12', opponent: 'Bielorrusia', score: '1-0', result: 'G' }
    ]
  },
  USA: {
    id: 'USA',
    name: 'Estados Unidos',
    pj: 5,
    g: 3,
    e: 0,
    p: 2,
    gf: 9,
    gc: 11,
    dg: -2,
    puntos: 9,
    winRate: '60%',
    racha: ["P","P","G","G","G"],
    ultimosPartidos: [
      { date: '2026-03-31', opponent: 'Portugal', score: '0-3', result: 'P' },
      { date: '2026-03-28', opponent: 'Bélgica', score: '2-5', result: 'P' },
      { date: '2025-11-18', opponent: 'Uruguay', score: '3-1', result: 'G' },
      { date: '2025-11-15', opponent: 'Paraguay', score: '2-1', result: 'G' },
      { date: '2025-10-14', opponent: 'Australia', score: '2-1', result: 'G' }
    ]
  },
  PAR: {
    id: 'PAR',
    name: 'Paraguay',
    pj: 5,
    g: 2,
    e: 0,
    p: 3,
    gf: 5,
    gc: 7,
    dg: -2,
    puntos: 6,
    winRate: '40%',
    racha: ["P","G","G","P","P"],
    ultimosPartidos: [
      { date: '2026-03-31', opponent: 'Marruecos', score: '1-2', result: 'P' },
      { date: '2026-03-27', opponent: 'Grecia', score: '1-0', result: 'G' },
      { date: '2025-11-18', opponent: 'México', score: '2-1', result: 'G' },
      { date: '2025-11-15', opponent: 'Estados Unidos', score: '1-2', result: 'P' },
      { date: '2025-10-14', opponent: 'Corea del Sur', score: '0-2', result: 'P' }
    ]
  },
  AUS: {
    id: 'AUS',
    name: 'Australia',
    pj: 5,
    g: 2,
    e: 0,
    p: 3,
    gf: 5,
    gc: 8,
    dg: -3,
    puntos: 6,
    winRate: '40%',
    racha: ["G","G","P","P","P"],
    ultimosPartidos: [
      { date: '2026-03-31', opponent: 'Curaçao', score: '3-1', result: 'G' },
      { date: '2026-03-27', opponent: 'Camerún', score: '1-0', result: 'G' },
      { date: '2025-11-18', opponent: 'Colombia', score: '0-3', result: 'P' },
      { date: '2025-11-14', opponent: 'Venezuela', score: '0-2', result: 'P' },
      { date: '2025-10-14', opponent: 'Estados Unidos', score: '1-2', result: 'P' }
    ]
  },
  TUR: {
    id: 'TUR',
    name: 'Turquía',
    pj: 5,
    g: 4,
    e: 1,
    p: 0,
    gf: 10,
    gc: 3,
    dg: 7,
    puntos: 13,
    winRate: '80%',
    racha: ["G","G","E","G","G"],
    ultimosPartidos: [
      { date: '2026-03-31', opponent: 'Kosovo', score: '1-0', result: 'G' },
      { date: '2026-03-28', opponent: 'Rumania', score: '1-0', result: 'G' },
      { date: '2025-11-18', opponent: 'España', score: '2-2', result: 'E' },
      { date: '2025-11-15', opponent: 'Bulgaria', score: '2-0', result: 'G' },
      { date: '2025-10-14', opponent: 'Georgia', score: '4-1', result: 'G' }
    ]
  },
  GER: {
    id: 'GER',
    name: 'Alemania',
    pj: 5,
    g: 5,
    e: 0,
    p: 0,
    gf: 15,
    gc: 4,
    dg: 11,
    puntos: 15,
    winRate: '100%',
    racha: ["G","G","G","G","G"],
    ultimosPartidos: [
      { date: '2026-03-31', opponent: 'Ghana', score: '2-1', result: 'G' },
      { date: '2026-03-27', opponent: 'Suiza', score: '3-1', result: 'G' },
      { date: '2025-11-17', opponent: 'Eslovaquia', score: '5-0', result: 'G' },
      { date: '2025-11-14', opponent: 'Luxemburgo', score: '2-0', result: 'G' },
      { date: '2025-10-13', opponent: 'Irlanda del Norte', score: '3-2', result: 'G' }
    ]
  },
  CIV: {
    id: 'CIV',
    name: 'Costa de Marfil',
    pj: 5,
    g: 4,
    e: 0,
    p: 1,
    gf: 13,
    gc: 5,
    dg: 8,
    puntos: 12,
    winRate: '80%',
    racha: ["G","G","P","G","G"],
    ultimosPartidos: [
      { date: '2026-03-31', opponent: 'Escocia', score: '1-0', result: 'G' },
      { date: '2026-03-28', opponent: 'Corea del Sur', score: '4-0', result: 'G' },
      { date: '2026-01-10', opponent: 'Egipto', score: '2-3', result: 'P' },
      { date: '2026-01-06', opponent: 'Burkina Faso', score: '3-0', result: 'G' },
      { date: '2025-12-31', opponent: 'Senegal', score: '3-2', result: 'G' }
    ]
  },
  ECU: {
    id: 'ECU',
    name: 'Ecuador',
    pj: 5,
    g: 1,
    e: 4,
    p: 0,
    gf: 5,
    gc: 3,
    dg: 2,
    puntos: 7,
    winRate: '20%',
    racha: ["E","E","G","E","E"],
    ultimosPartidos: [
      { date: '2026-03-31', opponent: 'Países Bajos', score: '1-1', result: 'E' },
      { date: '2026-03-27', opponent: 'Marruecos', score: '1-1', result: 'E' },
      { date: '2025-11-18', opponent: 'Nueva Zelanda', score: '2-0', result: 'G' },
      { date: '2025-11-14', opponent: 'Canadá', score: '0-0', result: 'E' },
      { date: '2025-10-14', opponent: 'México', score: '1-1', result: 'E' }
    ]
  },
  CUW: {
    id: 'CUW',
    name: 'Curaçao',
    pj: 5,
    g: 1,
    e: 2,
    p: 2,
    gf: 8,
    gc: 5,
    dg: 3,
    puntos: 5,
    winRate: '20%',
    racha: ["P","P","E","G","E"],
    ultimosPartidos: [
      { date: '2026-03-31', opponent: 'Australia', score: '1-3', result: 'P' },
      { date: '2026-03-27', opponent: 'China', score: '0-2', result: 'P' },
      { date: '2025-11-18', opponent: 'Jamaica', score: '0-0', result: 'E' },
      { date: '2025-11-13', opponent: 'Bermudas', score: '7-0', result: 'G' },
      { date: '2025-10-14', opponent: 'Colombia', score: '0-0', result: 'E' }
    ]
  },
  NED: {
    id: 'NED',
    name: 'Países Bajos',
    pj: 5,
    g: 2,
    e: 2,
    p: 1,
    gf: 12,
    gc: 3,
    dg: 9,
    puntos: 8,
    winRate: '40%',
    racha: ["E","G","G","E","P"],
    ultimosPartidos: [
      { date: '2026-03-31', opponent: 'Ecuador', score: '1-1', result: 'E' },
      { date: '2026-03-27', opponent: 'Noruega', score: '7-1', result: 'G' },
      { date: '2025-11-17', opponent: 'Lituania', score: '4-0', result: 'G' },
      { date: '2025-11-14', opponent: 'Polonia', score: '0-0', result: 'E' },
      { date: '2025-10-12', opponent: 'Finlandia', score: '0-1', result: 'P' }
    ]
  },
  JPN: {
    id: 'JPN',
    name: 'Japón',
    pj: 5,
    g: 5,
    e: 0,
    p: 0,
    gf: 10,
    gc: 2,
    dg: 8,
    puntos: 15,
    winRate: '100%',
    racha: ["G","G","G","G","G"],
    ultimosPartidos: [
      { date: '2026-03-31', opponent: 'Inglaterra', score: '1-0', result: 'G' },
      { date: '2026-03-28', opponent: 'Escocia', score: '1-0', result: 'G' },
      { date: '2025-11-18', opponent: 'Bolivia', score: '3-0', result: 'G' },
      { date: '2025-11-14', opponent: 'Ghana', score: '2-0', result: 'G' },
      { date: '2025-10-14', opponent: 'Brasil', score: '3-2', result: 'G' }
    ]
  },
  SWE: {
    id: 'SWE',
    name: 'Suecia',
    pj: 5,
    g: 2,
    e: 0,
    p: 3,
    gf: 8,
    gc: 9,
    dg: -1,
    puntos: 6,
    winRate: '40%',
    racha: ["G","G","P","P","P"],
    ultimosPartidos: [
      { date: '2026-03-31', opponent: 'Polonia', score: '3-2', result: 'G' },
      { date: '2026-03-28', opponent: 'Ucrania', score: '3-1', result: 'G' },
      { date: '2025-11-18', opponent: 'Eslovaquia', score: '1-2', result: 'P' },
      { date: '2025-11-15', opponent: 'Suiza', score: '0-1', result: 'P' },
      { date: '2025-10-13', opponent: 'Kosovo', score: '1-3', result: 'P' }
    ]
  },
  TUN: {
    id: 'TUN',
    name: 'Túnez',
    pj: 5,
    g: 1,
    e: 3,
    p: 1,
    gf: 3,
    gc: 3,
    dg: 0,
    puntos: 6,
    winRate: '20%',
    racha: ["E","G","E","E","P"],
    ultimosPartidos: [
      { date: '2026-03-31', opponent: 'Canadá', score: '0-0', result: 'E' },
      { date: '2026-03-28', opponent: 'Haití', score: '1-0', result: 'G' },
      { date: '2026-01-03', opponent: 'Malí', score: '1-1', result: 'E' },
      { date: '2025-12-30', opponent: 'Tanzania', score: '1-1', result: 'E' },
      { date: '2025-12-25', opponent: 'Nigeria', score: '0-1', result: 'P' }
    ]
  },
  IRN: {
    id: 'IRN',
    name: 'Irán',
    pj: 5,
    g: 2,
    e: 2,
    p: 1,
    gf: 6,
    gc: 2,
    dg: 4,
    puntos: 8,
    winRate: '40%',
    racha: ["G","P","E","E","G"],
    ultimosPartidos: [
      { date: '2026-03-31', opponent: 'Costa Rica', score: '3-0', result: 'G' },
      { date: '2026-03-27', opponent: 'Nigeria', score: '1-2', result: 'P' },
      { date: '2026-01-03', opponent: 'Uzbekistán', score: '0-0', result: 'E' },
      { date: '2025-11-18', opponent: 'Cabo Verde', score: '0-0', result: 'E' },
      { date: '2025-10-14', opponent: 'Tanzania', score: '2-0', result: 'G' }
    ]
  },
  NZL: {
    id: 'NZL',
    name: 'Nueva Zelanda',
    pj: 5,
    g: 1,
    e: 1,
    p: 3,
    gf: 6,
    gc: 8,
    dg: -2,
    puntos: 4,
    winRate: '20%',
    racha: ["G","P","P","P","E"],
    ultimosPartidos: [
      { date: '2026-03-30', opponent: 'Chile', score: '4-1', result: 'G' },
      { date: '2026-03-27', opponent: 'Finlandia', score: '0-2', result: 'P' },
      { date: '2025-11-18', opponent: 'Ecuador', score: '0-2', result: 'P' },
      { date: '2025-11-15', opponent: 'Colombia', score: '1-2', result: 'P' },
      { date: '2025-10-14', opponent: 'Noruega', score: '1-1', result: 'E' }
    ]
  },
  BEL: {
    id: 'BEL',
    name: 'Bélgica',
    pj: 5,
    g: 3,
    e: 2,
    p: 0,
    gf: 18,
    gc: 6,
    dg: 12,
    puntos: 11,
    winRate: '60%',
    racha: ["E","G","G","E","G"],
    ultimosPartidos: [
      { date: '2026-03-31', opponent: 'México', score: '1-1', result: 'E' },
      { date: '2026-03-28', opponent: 'Estados Unidos', score: '5-2', result: 'G' },
      { date: '2025-11-18', opponent: 'Liechtenstein', score: '7-0', result: 'G' },
      { date: '2025-11-14', opponent: 'Kazajistán', score: '1-1', result: 'E' },
      { date: '2025-10-12', opponent: 'Gales', score: '4-2', result: 'G' }
    ]
  },
  EGY: {
    id: 'EGY',
    name: 'Egipto',
    pj: 5,
    g: 2,
    e: 2,
    p: 1,
    gf: 7,
    gc: 3,
    dg: 4,
    puntos: 8,
    winRate: '40%',
    racha: ["E","G","E","P","G"],
    ultimosPartidos: [
      { date: '2026-03-31', opponent: 'España', score: '0-0', result: 'E' },
      { date: '2026-03-27', opponent: 'Arabia Saudita', score: '4-0', result: 'G' },
      { date: '2026-01-17', opponent: 'Nigeria', score: '0-0', result: 'E' },
      { date: '2026-01-14', opponent: 'Senegal', score: '0-1', result: 'P' },
      { date: '2026-01-10', opponent: 'Costa de Marfil', score: '3-2', result: 'G' }
    ]
  },
  KSA: {
    id: 'KSA',
    name: 'Arabia Saudita',
    pj: 5,
    g: 1,
    e: 0,
    p: 4,
    gf: 3,
    gc: 10,
    dg: -7,
    puntos: 3,
    winRate: '20%',
    racha: ["P","P","P","G","P"],
    ultimosPartidos: [
      { date: '2026-03-31', opponent: 'Serbia', score: '1-2', result: 'P' },
      { date: '2026-03-27', opponent: 'Egipto', score: '0-4', result: 'P' },
      { date: '2025-12-15', opponent: 'Jordania', score: '0-1', result: 'P' },
      { date: '2025-12-14', opponent: 'Palestina', score: '2-1', result: 'G' },
      { date: '2025-12-09', opponent: 'Marruecos', score: '0-2', result: 'P' }
    ]
  },
  URU: {
    id: 'URU',
    name: 'Uruguay',
    pj: 5,
    g: 1,
    e: 2,
    p: 2,
    gf: 4,
    gc: 6,
    dg: -2,
    puntos: 5,
    winRate: '20%',
    racha: ["E","E","P","P","G"],
    ultimosPartidos: [
      { date: '2026-03-31', opponent: 'Argelia', score: '0-0', result: 'E' },
      { date: '2026-03-27', opponent: 'Inglaterra', score: '1-1', result: 'E' },
      { date: '2025-11-18', opponent: 'Estados Unidos', score: '1-3', result: 'P' },
      { date: '2025-11-14', opponent: 'Paraguay', score: '0-1', result: 'P' },
      { date: '2025-10-14', opponent: 'Uzbekistán', score: '2-1', result: 'G' }
    ]
  },
  ESP: {
    id: 'ESP',
    name: 'España',
    pj: 5,
    g: 3,
    e: 2,
    p: 0,
    gf: 13,
    gc: 2,
    dg: 11,
    puntos: 11,
    winRate: '60%',
    racha: ["E","G","E","G","G"],
    ultimosPartidos: [
      { date: '2026-03-31', opponent: 'Egipto', score: '0-0', result: 'E' },
      { date: '2026-03-27', opponent: 'Serbia', score: '3-0', result: 'G' },
      { date: '2025-11-18', opponent: 'Turquía', score: '2-2', result: 'E' },
      { date: '2025-11-15', opponent: 'Georgia', score: '4-0', result: 'G' },
      { date: '2025-10-14', opponent: 'Bulgaria', score: '4-0', result: 'G' }
    ]
  },
  CPV: {
    id: 'CPV',
    name: 'Cabo Verde',
    pj: 5,
    g: 1,
    e: 3,
    p: 1,
    gf: 7,
    gc: 6,
    dg: 1,
    puntos: 6,
    winRate: '20%',
    racha: ["E","P","E","E","G"],
    ultimosPartidos: [
      { date: '2026-03-30', opponent: 'Finlandia', score: '1-1', result: 'E' },
      { date: '2026-03-27', opponent: 'Chile', score: '2-4', result: 'P' },
      { date: '2025-11-17', opponent: 'Egipto', score: '1-1', result: 'E' },
      { date: '2025-11-13', opponent: 'Irán', score: '0-0', result: 'E' },
      { date: '2025-10-13', opponent: 'Esuatini', score: '3-0', result: 'G' }
    ]
  },
  FRA: {
    id: 'FRA',
    name: 'Francia',
    pj: 5,
    g: 4,
    e: 0,
    p: 1,
    gf: 12,
    gc: 2,
    dg: 10,
    puntos: 12,
    winRate: '80%',
    racha: ["G","G","G","P","G"],
    ultimosPartidos: [
      { date: '2026-03-31', opponent: 'Colombia', score: '3-0', result: 'G' },
      { date: '2026-03-28', opponent: 'Brasil', score: '2-1', result: 'G' },
      { date: '2025-11-18', opponent: 'Azerbaiyán', score: '5-0', result: 'G' },
      { date: '2025-11-14', opponent: 'Ucrania', score: '0-1', result: 'P' },
      { date: '2025-10-13', opponent: 'Islandia', score: '2-0', result: 'G' }
    ]
  },
  SEN: {
    id: 'SEN',
    name: 'Senegal',
    pj: 5,
    g: 4,
    e: 0,
    p: 1,
    gf: 7,
    gc: 3,
    dg: 4,
    puntos: 12,
    winRate: '80%',
    racha: ["G","G","P","G","G"],
    ultimosPartidos: [
      { date: '2026-03-31', opponent: 'Gambia', score: '3-1', result: 'G' },
      { date: '2026-03-27', opponent: 'Perú', score: '2-0', result: 'G' },
      { date: '2026-01-18', opponent: 'Marruecos', score: '0-2', result: 'P' },
      { date: '2026-01-14', opponent: 'Egipto', score: '1-0', result: 'G' },
      { date: '2026-01-09', opponent: 'Malí', score: '1-0', result: 'G' }
    ]
  },
  IRQ: {
    id: 'IRQ',
    name: 'Irak',
    pj: 5,
    g: 3,
    e: 0,
    p: 2,
    gf: 5,
    gc: 4,
    dg: 1,
    puntos: 9,
    winRate: '60%',
    racha: ["G","P","P","G","G"],
    ultimosPartidos: [
      { date: '2026-03-31', opponent: 'Bolivia', score: '2-1', result: 'G' },
      { date: '2026-03-27', opponent: 'Jordania', score: '0-1', result: 'P' },
      { date: '2025-12-09', opponent: 'Argelia', score: '0-2', result: 'P' },
      { date: '2025-12-05', opponent: 'Sudán', score: '2-0', result: 'G' },
      { date: '2025-11-25', opponent: 'Baréin', score: '1-0', result: 'G' }
    ]
  },
  NOR: {
    id: 'NOR',
    name: 'Noruega',
    pj: 5,
    g: 2,
    e: 2,
    p: 1,
    gf: 10,
    gc: 9,
    dg: 1,
    puntos: 8,
    winRate: '40%',
    racha: ["E","P","G","G","E"],
    ultimosPartidos: [
      { date: '2026-03-31', opponent: 'Suiza', score: '0-0', result: 'E' },
      { date: '2026-03-27', opponent: 'Países Bajos', score: '1-7', result: 'P' },
      { date: '2025-11-18', opponent: 'Italia', score: '3-1', result: 'G' },
      { date: '2025-11-14', opponent: 'Estonia', score: '5-0', result: 'G' },
      { date: '2025-10-14', opponent: 'Nueva Zelanda', score: '1-1', result: 'E' }
    ]
  },
  ARG: {
    id: 'ARG',
    name: 'Argentina',
    pj: 5,
    g: 5,
    e: 0,
    p: 0,
    gf: 16,
    gc: 1,
    dg: 15,
    puntos: 15,
    winRate: '100%',
    racha: ["G","G","G","G","G"],
    ultimosPartidos: [
      { date: '2026-03-31', opponent: 'Zambia', score: '5-0', result: 'G' },
      { date: '2026-03-27', opponent: 'Mauritania', score: '2-1', result: 'G' },
      { date: '2025-11-14', opponent: 'Angola', score: '2-0', result: 'G' },
      { date: '2025-10-14', opponent: 'Puerto Rico', score: '6-0', result: 'G' },
      { date: '2025-09-08', opponent: 'Venezuela', score: '1-0', result: 'G' }
    ]
  },
  ALG: {
    id: 'ALG',
    name: 'Argelia',
    pj: 5,
    g: 3,
    e: 1,
    p: 1,
    gf: 8,
    gc: 1,
    dg: 7,
    puntos: 10,
    winRate: '60%',
    racha: ["E","P","G","G","G"],
    ultimosPartidos: [
      { date: '2026-03-31', opponent: 'Uruguay', score: '0-0', result: 'E' },
      { date: '2026-03-28', opponent: 'Guatemala', score: '0-1', result: 'P' },
      { date: '2025-12-28', opponent: 'Nigeria', score: '4-0', result: 'G' },
      { date: '2025-12-25', opponent: 'Rep. Dem. del Congo', score: '1-0', result: 'G' },
      { date: '2025-12-21', opponent: 'Guinea Ecuatorial', score: '3-0', result: 'G' }
    ]
  },
  AUT: {
    id: 'AUT',
    name: 'Austria',
    pj: 5,
    g: 4,
    e: 0,
    p: 1,
    gf: 8,
    gc: 3,
    dg: 5,
    puntos: 12,
    winRate: '80%',
    racha: ["G","G","G","G","P"],
    ultimosPartidos: [
      { date: '2026-03-31', opponent: 'Corea del Sur', score: '1-0', result: 'G' },
      { date: '2026-03-27', opponent: 'Ghana', score: '3-1', result: 'G' },
      { date: '2025-11-18', opponent: 'Bosnia y Herz.', score: '2-1', result: 'G' },
      { date: '2025-11-15', opponent: 'Chipre', score: '2-0', result: 'G' },
      { date: '2025-10-12', opponent: 'Rumania', score: '0-1', result: 'P' }
    ]
  },
  JOR: {
    id: 'JOR',
    name: 'Jordania',
    pj: 5,
    g: 3,
    e: 1,
    p: 1,
    gf: 7,
    gc: 4,
    dg: 3,
    puntos: 10,
    winRate: '60%',
    racha: ["E","G","G","G","P"],
    ultimosPartidos: [
      { date: '2026-03-31', opponent: 'Nigeria', score: '2-2', result: 'E' },
      { date: '2026-03-27', opponent: 'Irak', score: '1-0', result: 'G' },
      { date: '2025-12-18', opponent: 'Marruecos', score: '2-0', result: 'G' },
      { date: '2025-12-15', opponent: 'Arabia Saudita', score: '1-0', result: 'G' },
      { date: '2025-12-10', opponent: 'Irak', score: '1-2', result: 'P' }
    ]
  },
  POR: {
    id: 'POR',
    name: 'Portugal',
    pj: 5,
    g: 2,
    e: 2,
    p: 1,
    gf: 10,
    gc: 4,
    dg: 6,
    puntos: 8,
    winRate: '40%',
    racha: ["G","E","G","P","E"],
    ultimosPartidos: [
      { date: '2026-03-31', opponent: 'Estados Unidos', score: '3-0', result: 'G' },
      { date: '2026-03-28', opponent: 'México', score: '0-0', result: 'E' },
      { date: '2025-11-13', opponent: 'Armenia', score: '5-0', result: 'G' },
      { date: '2025-11-12', opponent: 'Rep. de Irlanda', score: '0-2', result: 'P' },
      { date: '2025-10-12', opponent: 'Hungría', score: '2-2', result: 'E' }
    ]
  },
  COD: {
    id: 'COD',
    name: 'RD Congo',
    pj: 5,
    g: 3,
    e: 1,
    p: 1,
    gf: 8,
    gc: 3,
    dg: 5,
    puntos: 10,
    winRate: '60%',
    racha: ["G","G","P","G","E"],
    ultimosPartidos: [
      { date: '2026-03-31', opponent: 'Jamaica', score: '1-0', result: 'G' },
      { date: '2026-03-27', opponent: 'Bermudas', score: '2-0', result: 'G' },
      { date: '2026-01-06', opponent: 'Argelia', score: '0-1', result: 'P' },
      { date: '2025-12-30', opponent: 'Botsuana', score: '3-0', result: 'G' },
      { date: '2025-12-27', opponent: 'Tanzania', score: '2-2', result: 'E' }
    ]
  },
  UZB: {
    id: 'UZB',
    name: 'Uzbekistán',
    pj: 5,
    g: 2,
    e: 3,
    p: 0,
    gf: 5,
    gc: 1,
    dg: 4,
    puntos: 9,
    winRate: '40%',
    racha: ["E","G","E","E","G"],
    ultimosPartidos: [
      { date: '2026-03-30', opponent: 'Venezuela', score: '0-0', result: 'E' },
      { date: '2026-03-27', opponent: 'Gabón', score: '3-1', result: 'G' },
      { date: '2026-01-03', opponent: 'Irán', score: '0-0', result: 'E' },
      { date: '2025-11-18', opponent: 'Irán', score: '0-0', result: 'E' },
      { date: '2025-11-14', opponent: 'Egipto', score: '2-0', result: 'G' }
    ]
  },
  COL: {
    id: 'COL',
    name: 'Colombia',
    pj: 5,
    g: 2,
    e: 1,
    p: 2,
    gf: 6,
    gc: 6,
    dg: 0,
    puntos: 7,
    winRate: '40%',
    racha: ["P","P","G","G","E"],
    ultimosPartidos: [
      { date: '2026-03-31', opponent: 'Francia', score: '0-3', result: 'P' },
      { date: '2026-03-28', opponent: 'Croacia', score: '1-2', result: 'P' },
      { date: '2025-11-18', opponent: 'Australia', score: '3-0', result: 'G' },
      { date: '2025-11-15', opponent: 'Nueva Zelanda', score: '2-1', result: 'G' },
      { date: '2025-10-14', opponent: 'Curaçao', score: '0-0', result: 'E' }
    ]
  },
  ENG: {
    id: 'ENG',
    name: 'Inglaterra',
    pj: 5,
    g: 3,
    e: 1,
    p: 1,
    gf: 10,
    gc: 2,
    dg: 8,
    puntos: 10,
    winRate: '60%',
    racha: ["P","E","G","G","G"],
    ultimosPartidos: [
      { date: '2026-03-31', opponent: 'Japón', score: '0-1', result: 'P' },
      { date: '2026-03-27', opponent: 'Uruguay', score: '1-1', result: 'E' },
      { date: '2025-11-18', opponent: 'Albania', score: '2-0', result: 'G' },
      { date: '2025-11-14', opponent: 'Serbia', score: '2-0', result: 'G' },
      { date: '2025-10-14', opponent: 'Letonia', score: '5-0', result: 'G' }
    ]
  },
  CRO: {
    id: 'CRO',
    name: 'Croacia',
    pj: 5,
    g: 4,
    e: 0,
    p: 1,
    gf: 12,
    gc: 7,
    dg: 5,
    puntos: 12,
    winRate: '80%',
    racha: ["P","G","G","G","G"],
    ultimosPartidos: [
      { date: '2026-03-31', opponent: 'Brasil', score: '1-3', result: 'P' },
      { date: '2026-03-28', opponent: 'Colombia', score: '2-1', result: 'G' },
      { date: '2025-11-17', opponent: 'Montenegro', score: '3-2', result: 'G' },
      { date: '2025-11-14', opponent: 'Islas Feroe', score: '3-1', result: 'G' },
      { date: '2025-10-12', opponent: 'Gibraltar', score: '3-0', result: 'G' }
    ]
  },
  GHA: {
    id: 'GHA',
    name: 'Ghana',
    pj: 5,
    g: 1,
    e: 0,
    p: 4,
    gf: 3,
    gc: 8,
    dg: -5,
    puntos: 3,
    winRate: '20%',
    racha: ["P","P","P","P","G"],
    ultimosPartidos: [
      { date: '2026-03-30', opponent: 'Alemania', score: '1-2', result: 'P' },
      { date: '2026-03-27', opponent: 'Austria', score: '1-3', result: 'P' },
      { date: '2025-11-18', opponent: 'Corea del Sur', score: '0-1', result: 'P' },
      { date: '2025-11-14', opponent: 'Japón', score: '0-2', result: 'P' },
      { date: '2025-10-12', opponent: 'Comoras', score: '1-0', result: 'G' }
    ]
  },
  PAN: {
    id: 'PAN',
    name: 'Panamá',
    pj: 5,
    g: 2,
    e: 2,
    p: 1,
    gf: 7,
    gc: 4,
    dg: 3,
    puntos: 8,
    winRate: '40%',
    racha: ["G","E","P","E","G"],
    ultimosPartidos: [
      { date: '2026-03-31', opponent: 'Sudáfrica', score: '2-1', result: 'G' },
      { date: '2026-03-27', opponent: 'Sudáfrica', score: '1-1', result: 'E' },
      { date: '2026-01-22', opponent: 'México', score: '0-1', result: 'P' },
      { date: '2026-01-18', opponent: 'Bolivia', score: '1-1', result: 'E' },
      { date: '2025-11-22', opponent: 'El Salvador', score: '3-0', result: 'G' }
    ]
  }
};
