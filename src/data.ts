import { Match, Team, UserProfile, Forecast, League } from './types';

export const TEAMS: Record<string, Team> = {
  // Grupo A
  MEX: { id: 'MEX', name: 'México', flag: '🇲🇽', group: 'Grupo A' },
  COL: { id: 'COL', name: 'Colombia', flag: '🇨🇴', group: 'Grupo A' },
  SWE: { id: 'SWE', name: 'Suecia', flag: '🇸🇪', group: 'Grupo A' },
  CMR: { id: 'CMR', name: 'Camerún', flag: '🇨🇲', group: 'Grupo A' },
  
  // Grupo B
  CAN: { id: 'CAN', name: 'Canadá', flag: '🇨🇦', group: 'Grupo B' },
  BEL: { id: 'BEL', name: 'Bélgica', flag: '🇧🇪', group: 'Grupo B' },
  KOR: { id: 'KOR', name: 'Corea del Sur', flag: '🇰🇷', group: 'Grupo B' },
  GHA: { id: 'GHA', name: 'Ghana', flag: '🇬🇭', group: 'Grupo B' },
  
  // Grupo C
  ARG: { id: 'ARG', name: 'Argentina', flag: '🇦🇷', group: 'Grupo C' },
  URU: { id: 'URU', name: 'Uruguay', flag: '🇺🇾', group: 'Grupo C' },
  UKR: { id: 'UKR', name: 'Ucrania', flag: '🇺🇦', group: 'Grupo C' },
  AUS: { id: 'AUS', name: 'Australia', flag: '🇦🇺', group: 'Grupo C' },
  
  // Grupo D
  USA: { id: 'USA', name: 'EE. UU.', flag: '🇺🇸', group: 'Grupo D' },
  JPN: { id: 'JPN', name: 'Japón', flag: '🇯🇵', group: 'Grupo D' },
  DEN: { id: 'DEN', name: 'Dinamarca', flag: '🇩🇰', group: 'Grupo D' },
  NGA: { id: 'NGA', name: 'Nigeria', flag: '🇳🇬', group: 'Grupo D' },
  
  // Grupo E
  BRA: { id: 'BRA', name: 'Brasil', flag: '🇧🇷', group: 'Grupo E' },
  TUR: { id: 'TUR', name: 'Turquía', flag: '🇹🇷', group: 'Grupo E' },
  CIV: { id: 'CIV', name: 'Costa de Marfil', flag: '🇨🇮', group: 'Grupo E' },
  SCO: { id: 'SCO', name: 'Escocia', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', group: 'Grupo E' },

  // Grupo F
  ESP: { id: 'ESP', name: 'España', flag: '🇪🇸', group: 'Grupo F' },
  MAR: { id: 'MAR', name: 'Marruecos', flag: '🇲🇦', group: 'Grupo F' },
  AUT: { id: 'AUT', name: 'Austria', flag: '🇦🇹', group: 'Grupo F' },
  EGY: { id: 'EGY', name: 'Egipto', flag: '🇪🇬', group: 'Grupo F' },

  // Grupo G
  FRA: { id: 'FRA', name: 'Francia', flag: '🇫🇷', group: 'Grupo G' },
  SUI: { id: 'SUI', name: 'Suiza', flag: '🇨🇭', group: 'Grupo G' },
  SEN: { id: 'SEN', name: 'Senegal', flag: '🇸🇳', group: 'Grupo G' },
  SLO: { id: 'SLO', name: 'Eslovaquia', flag: '🇸🇮', group: 'Grupo G' },

  // Grupo H
  GER: { id: 'GER', name: 'Alemania', flag: '🇩🇪', group: 'Grupo H' },
  ECU: { id: 'ECU', name: 'Ecuador', flag: '🇪🇨', group: 'Grupo H' },
  NOR: { id: 'NOR', name: 'Noruega', flag: '🇳🇴', group: 'Grupo H' },
  IRQ: { id: 'IRQ', name: 'Irak', flag: '🇮🇶', group: 'Grupo H' },

  // Grupo I
  ENG: { id: 'ENG', name: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', group: 'Grupo I' },
  POL: { id: 'POL', name: 'Polonia', flag: '🇵🇱', group: 'Grupo I' },
  CRC: { id: 'CRC', name: 'Costa Rica', flag: '🇨🇷', group: 'Grupo I' },
  RSA: { id: 'RSA', name: 'Sudáfrica', flag: '🇿🇦', group: 'Grupo I' },

  // Grupo J
  POR: { id: 'POR', name: 'Portugal', flag: '🇵🇹', group: 'Grupo J' },
  CRO: { id: 'CRO', name: 'Croacia', flag: '🇭🇷', group: 'Grupo J' },
  ALG: { id: 'ALG', name: 'Argelia', flag: '🇩🇿', group: 'Grupo J' },
  HON: { id: 'HON', name: 'Honduras', flag: '🇭🇳', group: 'Grupo J' },

  // Grupo K
  ITA: { id: 'ITA', name: 'Italia', flag: '🇮🇹', group: 'Grupo K' },
  PER: { id: 'PER', name: 'Perú', flag: '🇵🇪', group: 'Grupo K' },
  TUN: { id: 'TUN', name: 'Túnez', flag: '🇹🇳', group: 'Grupo K' },
  NZL: { id: 'NZL', name: 'Nueva Zelanda', flag: '🇳🇿', group: 'Grupo K' },

  // Grupo L
  NED: { id: 'NED', name: 'Países Bajos', flag: '🇳🇱', group: 'Grupo L' },
  CHI: { id: 'CHI', name: 'Chile', flag: '🇨🇱', group: 'Grupo L' },
  VEN: { id: 'VEN', name: 'Venezuela', flag: '🇻🇪', group: 'Grupo L' },
  QAT: { id: 'QAT', name: 'Catar', flag: '🇶🇦', group: 'Grupo L' }
};

export const INITIAL_MATCHES: Match[] = [
  // --- GRUPO A ---
  { id: 'M_A1', homeTeam: TEAMS.MEX, awayTeam: TEAMS.COL, dateTime: '2026-06-11T17:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_A2', homeTeam: TEAMS.SWE, awayTeam: TEAMS.CMR, dateTime: '2026-06-11T20:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_A3', homeTeam: TEAMS.MEX, awayTeam: TEAMS.SWE, dateTime: '2026-06-17T16:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_A4', homeTeam: TEAMS.COL, awayTeam: TEAMS.CMR, dateTime: '2026-06-17T19:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_A5', homeTeam: TEAMS.CMR, awayTeam: TEAMS.MEX, dateTime: '2026-06-24T18:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_A6', homeTeam: TEAMS.COL, awayTeam: TEAMS.SWE, dateTime: '2026-06-24T18:00:00Z', phase: 'group', status: 'scheduled' },

  // --- GRUPO B ---
  { id: 'M_B1', homeTeam: TEAMS.CAN, awayTeam: TEAMS.BEL, dateTime: '2026-06-12T15:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_B2', homeTeam: TEAMS.KOR, awayTeam: TEAMS.GHA, dateTime: '2026-06-12T18:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_B3', homeTeam: TEAMS.CAN, awayTeam: TEAMS.KOR, dateTime: '2026-06-18T16:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_B4', homeTeam: TEAMS.BEL, awayTeam: TEAMS.GHA, dateTime: '2026-06-18T20:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_B5', homeTeam: TEAMS.GHA, awayTeam: TEAMS.CAN, dateTime: '2026-06-25T15:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_B6', homeTeam: TEAMS.BEL, awayTeam: TEAMS.KOR, dateTime: '2026-06-25T15:00:00Z', phase: 'group', status: 'scheduled' },

  // --- GRUPO C ---
  { id: 'M_C1', homeTeam: TEAMS.ARG, awayTeam: TEAMS.URU, dateTime: '2026-06-13T17:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_C2', homeTeam: TEAMS.UKR, awayTeam: TEAMS.AUS, dateTime: '2026-06-13T20:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_C3', homeTeam: TEAMS.ARG, awayTeam: TEAMS.UKR, dateTime: '2026-06-19T17:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_C4', homeTeam: TEAMS.URU, awayTeam: TEAMS.AUS, dateTime: '2026-06-19T20:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_C5', homeTeam: TEAMS.AUS, awayTeam: TEAMS.ARG, dateTime: '2026-06-26T19:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_C6', homeTeam: TEAMS.URU, awayTeam: TEAMS.UKR, dateTime: '2026-06-26T19:00:00Z', phase: 'group', status: 'scheduled' },

  // --- GRUPO D ---
  { id: 'M_D1', homeTeam: TEAMS.USA, awayTeam: TEAMS.JPN, dateTime: '2026-06-12T20:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_D2', homeTeam: TEAMS.DEN, awayTeam: TEAMS.NGA, dateTime: '2026-06-13T14:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_D3', homeTeam: TEAMS.USA, awayTeam: TEAMS.DEN, dateTime: '2026-06-19T14:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_D4', homeTeam: TEAMS.JPN, awayTeam: TEAMS.NGA, dateTime: '2026-06-19T18:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_D5', homeTeam: TEAMS.NGA, awayTeam: TEAMS.USA, dateTime: '2026-06-25T19:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_D6', homeTeam: TEAMS.JPN, awayTeam: TEAMS.DEN, dateTime: '2026-06-25T19:00:00Z', phase: 'group', status: 'scheduled' },

  // --- GRUPO E ---
  { id: 'M_E1', homeTeam: TEAMS.BRA, awayTeam: TEAMS.TUR, dateTime: '2026-06-14T15:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_E2', homeTeam: TEAMS.CIV, awayTeam: TEAMS.SCO, dateTime: '2026-06-14T18:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_E3', homeTeam: TEAMS.BRA, awayTeam: TEAMS.CIV, dateTime: '2026-06-20T16:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_E4', homeTeam: TEAMS.TUR, awayTeam: TEAMS.SCO, dateTime: '2026-06-20T19:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_E5', homeTeam: TEAMS.SCO, awayTeam: TEAMS.BRA, dateTime: '2026-06-26T16:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_E6', homeTeam: TEAMS.TUR, awayTeam: TEAMS.CIV, dateTime: '2026-06-26T16:00:00Z', phase: 'group', status: 'scheduled' },

  // --- GRUPO F ---
  { id: 'M_F1', homeTeam: TEAMS.ESP, awayTeam: TEAMS.MAR, dateTime: '2026-06-14T20:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_F2', homeTeam: TEAMS.AUT, awayTeam: TEAMS.EGY, dateTime: '2026-06-15T13:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_F3', homeTeam: TEAMS.ESP, awayTeam: TEAMS.AUT, dateTime: '2026-06-20T21:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_F4', homeTeam: TEAMS.MAR, awayTeam: TEAMS.EGY, dateTime: '2026-06-21T13:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_F5', homeTeam: TEAMS.EGY, awayTeam: TEAMS.ESP, dateTime: '2026-06-26T21:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_F6', homeTeam: TEAMS.MAR, awayTeam: TEAMS.AUT, dateTime: '2026-06-26T21:00:00Z', phase: 'group', status: 'scheduled' },

  // --- GRUPO G ---
  { id: 'M_G1', homeTeam: TEAMS.FRA, awayTeam: TEAMS.SUI, dateTime: '2026-06-15T16:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_G2', homeTeam: TEAMS.SEN, awayTeam: TEAMS.SLO, dateTime: '2026-06-15T19:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_G3', homeTeam: TEAMS.FRA, awayTeam: TEAMS.SEN, dateTime: '2026-06-21T16:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_G4', homeTeam: TEAMS.SUI, awayTeam: TEAMS.SLO, dateTime: '2026-06-21T19:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_G5', homeTeam: TEAMS.SLO, awayTeam: TEAMS.FRA, dateTime: '2026-06-27T15:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_G6', homeTeam: TEAMS.SUI, awayTeam: TEAMS.SEN, dateTime: '2026-06-27T15:00:00Z', phase: 'group', status: 'scheduled' },

  // --- GRUPO H ---
  { id: 'M_H1', homeTeam: TEAMS.GER, awayTeam: TEAMS.ECU, dateTime: '2026-06-15T21:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_H2', homeTeam: TEAMS.NOR, awayTeam: TEAMS.IRQ, dateTime: '2026-06-16T13:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_H3', homeTeam: TEAMS.GER, awayTeam: TEAMS.NOR, dateTime: '2026-06-21T21:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_H4', homeTeam: TEAMS.ECU, awayTeam: TEAMS.IRQ, dateTime: '2026-06-22T13:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_H5', homeTeam: TEAMS.IRQ, awayTeam: TEAMS.GER, dateTime: '2026-06-27T18:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_H6', homeTeam: TEAMS.ECU, awayTeam: TEAMS.NOR, dateTime: '2026-06-27T18:00:00Z', phase: 'group', status: 'scheduled' },

  // --- GRUPO I ---
  { id: 'M_I1', homeTeam: TEAMS.ENG, awayTeam: TEAMS.POL, dateTime: '2026-06-16T16:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_I2', homeTeam: TEAMS.CRC, awayTeam: TEAMS.RSA, dateTime: '2026-06-16T19:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_I3', homeTeam: TEAMS.ENG, awayTeam: TEAMS.CRC, dateTime: '2026-06-22T16:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_I4', homeTeam: TEAMS.POL, awayTeam: TEAMS.RSA, dateTime: '2026-06-22T19:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_I5', homeTeam: TEAMS.RSA, awayTeam: TEAMS.ENG, dateTime: '2026-06-27T21:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_I6', homeTeam: TEAMS.POL, awayTeam: TEAMS.CRC, dateTime: '2026-06-27T21:00:00Z', phase: 'group', status: 'scheduled' },

  // --- GRUPO J ---
  { id: 'M_J1', homeTeam: TEAMS.POR, awayTeam: TEAMS.CRO, dateTime: '2026-06-16T21:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_J2', homeTeam: TEAMS.ALG, awayTeam: TEAMS.HON, dateTime: '2026-06-17T13:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_J3', homeTeam: TEAMS.POR, awayTeam: TEAMS.ALG, dateTime: '2026-06-22T21:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_J4', homeTeam: TEAMS.CRO, awayTeam: TEAMS.HON, dateTime: '2026-06-23T13:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_J5', homeTeam: TEAMS.HON, awayTeam: TEAMS.POR, dateTime: '2026-06-28T15:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_J6', homeTeam: TEAMS.CRO, awayTeam: TEAMS.ALG, dateTime: '2026-06-28T15:00:00Z', phase: 'group', status: 'scheduled' },

  // --- GRUPO K ---
  { id: 'M_K1', homeTeam: TEAMS.ITA, awayTeam: TEAMS.PER, dateTime: '2026-06-17T15:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_K2', homeTeam: TEAMS.TUN, awayTeam: TEAMS.NZL, dateTime: '2026-06-17T18:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_K3', homeTeam: TEAMS.ITA, awayTeam: TEAMS.TUN, dateTime: '2026-06-23T16:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_K4', homeTeam: TEAMS.PER, awayTeam: TEAMS.NZL, dateTime: '2026-06-23T19:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_K5', homeTeam: TEAMS.NZL, awayTeam: TEAMS.ITA, dateTime: '2026-06-28T18:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_K6', homeTeam: TEAMS.PER, awayTeam: TEAMS.TUN, dateTime: '2026-06-28T18:00:00Z', phase: 'group', status: 'scheduled' },

  // --- GRUPO L ---
  { id: 'M_L1', homeTeam: TEAMS.NED, awayTeam: TEAMS.CHI, dateTime: '2026-06-17T21:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_L2', homeTeam: TEAMS.VEN, awayTeam: TEAMS.QAT, dateTime: '2026-06-18T13:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_L3', homeTeam: TEAMS.NED, awayTeam: TEAMS.VEN, dateTime: '2026-06-23T21:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_L4', homeTeam: TEAMS.CHI, awayTeam: TEAMS.QAT, dateTime: '2026-06-24T13:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_L5', homeTeam: TEAMS.QAT, awayTeam: TEAMS.NED, dateTime: '2026-06-28T21:00:00Z', phase: 'group', status: 'scheduled' },
  { id: 'M_L6', homeTeam: TEAMS.CHI, awayTeam: TEAMS.VEN, dateTime: '2026-06-28T21:00:00Z', phase: 'group', status: 'scheduled' },

  // --- HISTORIC KNOCKOUT STAGES AT THE END ---
  { id: 'M_PLAYOFF_1', homeTeam: TEAMS.ARG, awayTeam: TEAMS.MEX, dateTime: '2026-06-30T18:00:00Z', phase: 'octavos', status: 'scheduled' },
  { id: 'M_PLAYOFF_2', homeTeam: TEAMS.BRA, awayTeam: TEAMS.USA, dateTime: '2026-07-01T20:00:00Z', phase: 'octavos', status: 'scheduled' },
  { id: 'M_PLAYOFF_3', homeTeam: TEAMS.FRA, awayTeam: TEAMS.ESP, dateTime: '2026-07-08T18:00:00Z', phase: 'cuartos', status: 'scheduled' },
  { id: 'M_PLAYOFF_4', homeTeam: TEAMS.COL, awayTeam: TEAMS.BRA, dateTime: '2026-07-14T20:00:00Z', phase: 'semifinal', status: 'scheduled' },
  { id: 'M_PLAYOFF_5', homeTeam: TEAMS.ARG, awayTeam: TEAMS.FRA, dateTime: '2026-07-19T19:00:00Z', phase: 'final', status: 'scheduled' }
];

export const INITIAL_USERS: UserProfile[] = [
  { id: 'U1', name: 'Santiago (Tú)', avatar: '🦁', isAdmin: true },
  { id: 'U2', name: 'Laura Gómez', avatar: '🐱' },
  { id: 'U3', name: 'Andrés López', avatar: '🐼' },
  { id: 'U4', name: 'Camila Rivas', avatar: '🦊' }
];

export const INITIAL_LEAGUES: League[] = [
  {
    code: 'MUNDIAL2026',
    name: 'Grupo de la Oficina 💼',
    creatorId: 'U1',
    members: ['U1', 'U2', 'U3', 'U4']
  },
  {
    code: 'AMIGOS_FC',
    name: 'Amigos del Círculo ⚽',
    creatorId: 'U2',
    members: ['U1', 'U2', 'U3']
  }
];

export const INITIAL_FORECASTS: Forecast[] = [];
