import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Loader2, Database, CheckCircle, AlertCircle } from 'lucide-react';

interface ForceBootstrapProps {
  onDone: () => void;
}

// Matches con flags hardcodeados como emojis Unicode directos
const MATCHES_WITH_FLAGS = [
  // GRUPO A
  { id: 'M_A1', home: { id:'MEX', name:'México', flag:'\uD83C\uDDF2\uD83C\uDDFD', group:'Grupo A' }, away: { id:'COL', name:'Colombia', flag:'\uD83C\uDDE8\uD83C\uDDF4', group:'Grupo A' }, dateTime:'2026-06-11T17:00:00Z', phase:'group' },
  { id: 'M_A2', home: { id:'SWE', name:'Suecia', flag:'\uD83C\uDDF8\uD83C\uDDEA', group:'Grupo A' }, away: { id:'CMR', name:'Camerún', flag:'\uD83C\uDDE8\uD83C\uDDF2', group:'Grupo A' }, dateTime:'2026-06-11T20:00:00Z', phase:'group' },
  { id: 'M_A3', home: { id:'MEX', name:'México', flag:'\uD83C\uDDF2\uD83C\uDDFD', group:'Grupo A' }, away: { id:'SWE', name:'Suecia', flag:'\uD83C\uDDF8\uD83C\uDDEA', group:'Grupo A' }, dateTime:'2026-06-17T16:00:00Z', phase:'group' },
  { id: 'M_A4', home: { id:'COL', name:'Colombia', flag:'\uD83C\uDDE8\uD83C\uDDF4', group:'Grupo A' }, away: { id:'CMR', name:'Camerún', flag:'\uD83C\uDDE8\uD83C\uDDF2', group:'Grupo A' }, dateTime:'2026-06-17T19:00:00Z', phase:'group' },
  { id: 'M_A5', home: { id:'CMR', name:'Camerún', flag:'\uD83C\uDDE8\uD83C\uDDF2', group:'Grupo A' }, away: { id:'MEX', name:'México', flag:'\uD83C\uDDF2\uD83C\uDDFD', group:'Grupo A' }, dateTime:'2026-06-24T18:00:00Z', phase:'group' },
  { id: 'M_A6', home: { id:'COL', name:'Colombia', flag:'\uD83C\uDDE8\uD83C\uDDF4', group:'Grupo A' }, away: { id:'SWE', name:'Suecia', flag:'\uD83C\uDDF8\uD83C\uDDEA', group:'Grupo A' }, dateTime:'2026-06-24T18:00:00Z', phase:'group' },
  // GRUPO B
  { id: 'M_B1', home: { id:'CAN', name:'Canadá', flag:'\uD83C\uDDE8\uD83C\uDDE6', group:'Grupo B' }, away: { id:'BEL', name:'Bélgica', flag:'\uD83C\uDDE7\uD83C\uDDEA', group:'Grupo B' }, dateTime:'2026-06-12T15:00:00Z', phase:'group' },
  { id: 'M_B2', home: { id:'KOR', name:'Corea del Sur', flag:'\uD83C\uDDF0\uD83C\uDDF7', group:'Grupo B' }, away: { id:'GHA', name:'Ghana', flag:'\uD83C\uDDEC\uD83C\uDDED', group:'Grupo B' }, dateTime:'2026-06-12T18:00:00Z', phase:'group' },
  { id: 'M_B3', home: { id:'CAN', name:'Canadá', flag:'\uD83C\uDDE8\uD83C\uDDE6', group:'Grupo B' }, away: { id:'KOR', name:'Corea del Sur', flag:'\uD83C\uDDF0\uD83C\uDDF7', group:'Grupo B' }, dateTime:'2026-06-18T16:00:00Z', phase:'group' },
  { id: 'M_B4', home: { id:'BEL', name:'Bélgica', flag:'\uD83C\uDDE7\uD83C\uDDEA', group:'Grupo B' }, away: { id:'GHA', name:'Ghana', flag:'\uD83C\uDDEC\uD83C\uDDED', group:'Grupo B' }, dateTime:'2026-06-18T20:00:00Z', phase:'group' },
  { id: 'M_B5', home: { id:'GHA', name:'Ghana', flag:'\uD83C\uDDEC\uD83C\uDDED', group:'Grupo B' }, away: { id:'CAN', name:'Canadá', flag:'\uD83C\uDDE8\uD83C\uDDE6', group:'Grupo B' }, dateTime:'2026-06-25T15:00:00Z', phase:'group' },
  { id: 'M_B6', home: { id:'BEL', name:'Bélgica', flag:'\uD83C\uDDE7\uD83C\uDDEA', group:'Grupo B' }, away: { id:'KOR', name:'Corea del Sur', flag:'\uD83C\uDDF0\uD83C\uDDF7', group:'Grupo B' }, dateTime:'2026-06-25T15:00:00Z', phase:'group' },
  // GRUPO C
  { id: 'M_C1', home: { id:'ARG', name:'Argentina', flag:'\uD83C\uDDE6\uD83C\uDDF7', group:'Grupo C' }, away: { id:'URU', name:'Uruguay', flag:'\uD83C\uDDFA\uD83C\uDDFE', group:'Grupo C' }, dateTime:'2026-06-13T17:00:00Z', phase:'group' },
  { id: 'M_C2', home: { id:'UKR', name:'Ucrania', flag:'\uD83C\uDDFA\uD83C\uDDE6', group:'Grupo C' }, away: { id:'AUS', name:'Australia', flag:'\uD83C\uDDE6\uD83C\uDDFA', group:'Grupo C' }, dateTime:'2026-06-13T20:00:00Z', phase:'group' },
  { id: 'M_C3', home: { id:'ARG', name:'Argentina', flag:'\uD83C\uDDE6\uD83C\uDDF7', group:'Grupo C' }, away: { id:'UKR', name:'Ucrania', flag:'\uD83C\uDDFA\uD83C\uDDE6', group:'Grupo C' }, dateTime:'2026-06-19T17:00:00Z', phase:'group' },
  { id: 'M_C4', home: { id:'URU', name:'Uruguay', flag:'\uD83C\uDDFA\uD83C\uDDFE', group:'Grupo C' }, away: { id:'AUS', name:'Australia', flag:'\uD83C\uDDE6\uD83C\uDDFA', group:'Grupo C' }, dateTime:'2026-06-19T20:00:00Z', phase:'group' },
  { id: 'M_C5', home: { id:'AUS', name:'Australia', flag:'\uD83C\uDDE6\uD83C\uDDFA', group:'Grupo C' }, away: { id:'ARG', name:'Argentina', flag:'\uD83C\uDDE6\uD83C\uDDF7', group:'Grupo C' }, dateTime:'2026-06-26T19:00:00Z', phase:'group' },
  { id: 'M_C6', home: { id:'URU', name:'Uruguay', flag:'\uD83C\uDDFA\uD83C\uDDFE', group:'Grupo C' }, away: { id:'UKR', name:'Ucrania', flag:'\uD83C\uDDFA\uD83C\uDDE6', group:'Grupo C' }, dateTime:'2026-06-26T19:00:00Z', phase:'group' },
  // GRUPO D
  { id: 'M_D1', home: { id:'USA', name:'EE. UU.', flag:'\uD83C\uDDFA\uD83C\uDDF8', group:'Grupo D' }, away: { id:'JPN', name:'Japón', flag:'\uD83C\uDDEF\uD83C\uDDF5', group:'Grupo D' }, dateTime:'2026-06-12T20:00:00Z', phase:'group' },
  { id: 'M_D2', home: { id:'DEN', name:'Dinamarca', flag:'\uD83C\uDDE9\uD83C\uDDF0', group:'Grupo D' }, away: { id:'NGA', name:'Nigeria', flag:'\uD83C\uDDF3\uD83C\uDDEC', group:'Grupo D' }, dateTime:'2026-06-13T14:00:00Z', phase:'group' },
  { id: 'M_D3', home: { id:'USA', name:'EE. UU.', flag:'\uD83C\uDDFA\uD83C\uDDF8', group:'Grupo D' }, away: { id:'DEN', name:'Dinamarca', flag:'\uD83C\uDDE9\uD83C\uDDF0', group:'Grupo D' }, dateTime:'2026-06-19T14:00:00Z', phase:'group' },
  { id: 'M_D4', home: { id:'JPN', name:'Japón', flag:'\uD83C\uDDEF\uD83C\uDDF5', group:'Grupo D' }, away: { id:'NGA', name:'Nigeria', flag:'\uD83C\uDDF3\uD83C\uDDEC', group:'Grupo D' }, dateTime:'2026-06-19T18:00:00Z', phase:'group' },
  { id: 'M_D5', home: { id:'NGA', name:'Nigeria', flag:'\uD83C\uDDF3\uD83C\uDDEC', group:'Grupo D' }, away: { id:'USA', name:'EE. UU.', flag:'\uD83C\uDDFA\uD83C\uDDF8', group:'Grupo D' }, dateTime:'2026-06-25T19:00:00Z', phase:'group' },
  { id: 'M_D6', home: { id:'JPN', name:'Japón', flag:'\uD83C\uDDEF\uD83C\uDDF5', group:'Grupo D' }, away: { id:'DEN', name:'Dinamarca', flag:'\uD83C\uDDE9\uD83C\uDDF0', group:'Grupo D' }, dateTime:'2026-06-25T19:00:00Z', phase:'group' },
  // GRUPO E
  { id: 'M_E1', home: { id:'BRA', name:'Brasil', flag:'\uD83C\uDDE7\uD83C\uDDF7', group:'Grupo E' }, away: { id:'TUR', name:'Turquía', flag:'\uD83C\uDDF9\uD83C\uDDF7', group:'Grupo E' }, dateTime:'2026-06-14T15:00:00Z', phase:'group' },
  { id: 'M_E2', home: { id:'CIV', name:'Costa de Marfil', flag:'\uD83C\uDDE8\uD83C\uDDEE', group:'Grupo E' }, away: { id:'SCO', name:'Escocia', flag:'\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62\uDB40\uDC73\uDB40\uDC63\uDB40\uDC74\uDB40\uDC7F', group:'Grupo E' }, dateTime:'2026-06-14T18:00:00Z', phase:'group' },
  { id: 'M_E3', home: { id:'BRA', name:'Brasil', flag:'\uD83C\uDDE7\uD83C\uDDF7', group:'Grupo E' }, away: { id:'CIV', name:'Costa de Marfil', flag:'\uD83C\uDDE8\uD83C\uDDEE', group:'Grupo E' }, dateTime:'2026-06-20T16:00:00Z', phase:'group' },
  { id: 'M_E4', home: { id:'TUR', name:'Turquía', flag:'\uD83C\uDDF9\uD83C\uDDF7', group:'Grupo E' }, away: { id:'SCO', name:'Escocia', flag:'\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62\uDB40\uDC73\uDB40\uDC63\uDB40\uDC74\uDB40\uDC7F', group:'Grupo E' }, dateTime:'2026-06-20T19:00:00Z', phase:'group' },
  { id: 'M_E5', home: { id:'SCO', name:'Escocia', flag:'\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62\uDB40\uDC73\uDB40\uDC63\uDB40\uDC74\uDB40\uDC7F', group:'Grupo E' }, away: { id:'BRA', name:'Brasil', flag:'\uD83C\uDDE7\uD83C\uDDF7', group:'Grupo E' }, dateTime:'2026-06-26T16:00:00Z', phase:'group' },
  { id: 'M_E6', home: { id:'TUR', name:'Turquía', flag:'\uD83C\uDDF9\uD83C\uDDF7', group:'Grupo E' }, away: { id:'CIV', name:'Costa de Marfil', flag:'\uD83C\uDDE8\uD83C\uDDEE', group:'Grupo E' }, dateTime:'2026-06-26T16:00:00Z', phase:'group' },
  // GRUPO F
  { id: 'M_F1', home: { id:'ESP', name:'España', flag:'\uD83C\uDDEA\uD83C\uDDF8', group:'Grupo F' }, away: { id:'MAR', name:'Marruecos', flag:'\uD83C\uDDF2\uD83C\uDDE6', group:'Grupo F' }, dateTime:'2026-06-14T20:00:00Z', phase:'group' },
  { id: 'M_F2', home: { id:'AUT', name:'Austria', flag:'\uD83C\uDDE6\uD83C\uDDF9', group:'Grupo F' }, away: { id:'EGY', name:'Egipto', flag:'\uD83C\uDDEA\uD83C\uDDEC', group:'Grupo F' }, dateTime:'2026-06-15T13:00:00Z', phase:'group' },
  { id: 'M_F3', home: { id:'ESP', name:'España', flag:'\uD83C\uDDEA\uD83C\uDDF8', group:'Grupo F' }, away: { id:'AUT', name:'Austria', flag:'\uD83C\uDDE6\uD83C\uDDF9', group:'Grupo F' }, dateTime:'2026-06-20T21:00:00Z', phase:'group' },
  { id: 'M_F4', home: { id:'MAR', name:'Marruecos', flag:'\uD83C\uDDF2\uD83C\uDDE6', group:'Grupo F' }, away: { id:'EGY', name:'Egipto', flag:'\uD83C\uDDEA\uD83C\uDDEC', group:'Grupo F' }, dateTime:'2026-06-21T13:00:00Z', phase:'group' },
  { id: 'M_F5', home: { id:'EGY', name:'Egipto', flag:'\uD83C\uDDEA\uD83C\uDDEC', group:'Grupo F' }, away: { id:'ESP', name:'España', flag:'\uD83C\uDDEA\uD83C\uDDF8', group:'Grupo F' }, dateTime:'2026-06-26T21:00:00Z', phase:'group' },
  { id: 'M_F6', home: { id:'MAR', name:'Marruecos', flag:'\uD83C\uDDF2\uD83C\uDDE6', group:'Grupo F' }, away: { id:'AUT', name:'Austria', flag:'\uD83C\uDDE6\uD83C\uDDF9', group:'Grupo F' }, dateTime:'2026-06-26T21:00:00Z', phase:'group' },
  // GRUPO G
  { id: 'M_G1', home: { id:'FRA', name:'Francia', flag:'\uD83C\uDDEB\uD83C\uDDF7', group:'Grupo G' }, away: { id:'SUI', name:'Suiza', flag:'\uD83C\uDDE8\uD83C\uDDED', group:'Grupo G' }, dateTime:'2026-06-15T16:00:00Z', phase:'group' },
  { id: 'M_G2', home: { id:'SEN', name:'Senegal', flag:'\uD83C\uDDF8\uD83C\uDDF3', group:'Grupo G' }, away: { id:'SLO', name:'Eslovaquia', flag:'\uD83C\uDDF8\uD83C\uDDEE', group:'Grupo G' }, dateTime:'2026-06-15T19:00:00Z', phase:'group' },
  { id: 'M_G3', home: { id:'FRA', name:'Francia', flag:'\uD83C\uDDEB\uD83C\uDDF7', group:'Grupo G' }, away: { id:'SEN', name:'Senegal', flag:'\uD83C\uDDF8\uD83C\uDDF3', group:'Grupo G' }, dateTime:'2026-06-21T16:00:00Z', phase:'group' },
  { id: 'M_G4', home: { id:'SUI', name:'Suiza', flag:'\uD83C\uDDE8\uD83C\uDDED', group:'Grupo G' }, away: { id:'SLO', name:'Eslovaquia', flag:'\uD83C\uDDF8\uD83C\uDDEE', group:'Grupo G' }, dateTime:'2026-06-21T19:00:00Z', phase:'group' },
  { id: 'M_G5', home: { id:'SLO', name:'Eslovaquia', flag:'\uD83C\uDDF8\uD83C\uDDEE', group:'Grupo G' }, away: { id:'FRA', name:'Francia', flag:'\uD83C\uDDEB\uD83C\uDDF7', group:'Grupo G' }, dateTime:'2026-06-27T15:00:00Z', phase:'group' },
  { id: 'M_G6', home: { id:'SUI', name:'Suiza', flag:'\uD83C\uDDE8\uD83C\uDDED', group:'Grupo G' }, away: { id:'SEN', name:'Senegal', flag:'\uD83C\uDDF8\uD83C\uDDF3', group:'Grupo G' }, dateTime:'2026-06-27T15:00:00Z', phase:'group' },
  // GRUPO H
  { id: 'M_H1', home: { id:'GER', name:'Alemania', flag:'\uD83C\uDDE9\uD83C\uDDEA', group:'Grupo H' }, away: { id:'ECU', name:'Ecuador', flag:'\uD83C\uDDEA\uD83C\uDDE8', group:'Grupo H' }, dateTime:'2026-06-15T21:00:00Z', phase:'group' },
  { id: 'M_H2', home: { id:'NOR', name:'Noruega', flag:'\uD83C\uDDF3\uD83C\uDDF4', group:'Grupo H' }, away: { id:'IRQ', name:'Irak', flag:'\uD83C\uDDEE\uD83C\uDDF6', group:'Grupo H' }, dateTime:'2026-06-16T13:00:00Z', phase:'group' },
  { id: 'M_H3', home: { id:'GER', name:'Alemania', flag:'\uD83C\uDDE9\uD83C\uDDEA', group:'Grupo H' }, away: { id:'NOR', name:'Noruega', flag:'\uD83C\uDDF3\uD83C\uDDF4', group:'Grupo H' }, dateTime:'2026-06-21T21:00:00Z', phase:'group' },
  { id: 'M_H4', home: { id:'ECU', name:'Ecuador', flag:'\uD83C\uDDEA\uD83C\uDDE8', group:'Grupo H' }, away: { id:'IRQ', name:'Irak', flag:'\uD83C\uDDEE\uD83C\uDDF6', group:'Grupo H' }, dateTime:'2026-06-22T13:00:00Z', phase:'group' },
  { id: 'M_H5', home: { id:'IRQ', name:'Irak', flag:'\uD83C\uDDEE\uD83C\uDDF6', group:'Grupo H' }, away: { id:'GER', name:'Alemania', flag:'\uD83C\uDDE9\uD83C\uDDEA', group:'Grupo H' }, dateTime:'2026-06-27T18:00:00Z', phase:'group' },
  { id: 'M_H6', home: { id:'ECU', name:'Ecuador', flag:'\uD83C\uDDEA\uD83C\uDDE8', group:'Grupo H' }, away: { id:'NOR', name:'Noruega', flag:'\uD83C\uDDF3\uD83C\uDDF4', group:'Grupo H' }, dateTime:'2026-06-27T18:00:00Z', phase:'group' },
  // GRUPO I
  { id: 'M_I1', home: { id:'ENG', name:'Inglaterra', flag:'\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67\uDB40\uDC7F', group:'Grupo I' }, away: { id:'POL', name:'Polonia', flag:'\uD83C\uDDF5\uD83C\uDDF1', group:'Grupo I' }, dateTime:'2026-06-16T16:00:00Z', phase:'group' },
  { id: 'M_I2', home: { id:'CRC', name:'Costa Rica', flag:'\uD83C\uDDE8\uD83C\uDDF7', group:'Grupo I' }, away: { id:'RSA', name:'Sudáfrica', flag:'\uD83C\uDDFF\uD83C\uDDE6', group:'Grupo I' }, dateTime:'2026-06-16T19:00:00Z', phase:'group' },
  { id: 'M_I3', home: { id:'ENG', name:'Inglaterra', flag:'\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67\uDB40\uDC7F', group:'Grupo I' }, away: { id:'CRC', name:'Costa Rica', flag:'\uD83C\uDDE8\uD83C\uDDF7', group:'Grupo I' }, dateTime:'2026-06-22T16:00:00Z', phase:'group' },
  { id: 'M_I4', home: { id:'POL', name:'Polonia', flag:'\uD83C\uDDF5\uD83C\uDDF1', group:'Grupo I' }, away: { id:'RSA', name:'Sudáfrica', flag:'\uD83C\uDDFF\uD83C\uDDE6', group:'Grupo I' }, dateTime:'2026-06-22T19:00:00Z', phase:'group' },
  { id: 'M_I5', home: { id:'RSA', name:'Sudáfrica', flag:'\uD83C\uDDFF\uD83C\uDDE6', group:'Grupo I' }, away: { id:'ENG', name:'Inglaterra', flag:'\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67\uDB40\uDC7F', group:'Grupo I' }, dateTime:'2026-06-27T21:00:00Z', phase:'group' },
  { id: 'M_I6', home: { id:'POL', name:'Polonia', flag:'\uD83C\uDDF5\uD83C\uDDF1', group:'Grupo I' }, away: { id:'CRC', name:'Costa Rica', flag:'\uD83C\uDDE8\uD83C\uDDF7', group:'Grupo I' }, dateTime:'2026-06-27T21:00:00Z', phase:'group' },
  // GRUPO J
  { id: 'M_J1', home: { id:'POR', name:'Portugal', flag:'\uD83C\uDDF5\uD83C\uDDF9', group:'Grupo J' }, away: { id:'CRO', name:'Croacia', flag:'\uD83C\uDDED\uD83C\uDDF7', group:'Grupo J' }, dateTime:'2026-06-16T21:00:00Z', phase:'group' },
  { id: 'M_J2', home: { id:'ALG', name:'Argelia', flag:'\uD83C\uDDE9\uD83C\uDDFF', group:'Grupo J' }, away: { id:'HON', name:'Honduras', flag:'\uD83C\uDDED\uD83C\uDDF3', group:'Grupo J' }, dateTime:'2026-06-17T13:00:00Z', phase:'group' },
  { id: 'M_J3', home: { id:'POR', name:'Portugal', flag:'\uD83C\uDDF5\uD83C\uDDF9', group:'Grupo J' }, away: { id:'ALG', name:'Argelia', flag:'\uD83C\uDDE9\uD83C\uDDFF', group:'Grupo J' }, dateTime:'2026-06-22T21:00:00Z', phase:'group' },
  { id: 'M_J4', home: { id:'CRO', name:'Croacia', flag:'\uD83C\uDDED\uD83C\uDDF7', group:'Grupo J' }, away: { id:'HON', name:'Honduras', flag:'\uD83C\uDDED\uD83C\uDDF3', group:'Grupo J' }, dateTime:'2026-06-23T13:00:00Z', phase:'group' },
  { id: 'M_J5', home: { id:'HON', name:'Honduras', flag:'\uD83C\uDDED\uD83C\uDDF3', group:'Grupo J' }, away: { id:'POR', name:'Portugal', flag:'\uD83C\uDDF5\uD83C\uDDF9', group:'Grupo J' }, dateTime:'2026-06-28T15:00:00Z', phase:'group' },
  { id: 'M_J6', home: { id:'CRO', name:'Croacia', flag:'\uD83C\uDDED\uD83C\uDDF7', group:'Grupo J' }, away: { id:'ALG', name:'Argelia', flag:'\uD83C\uDDE9\uD83C\uDDFF', group:'Grupo J' }, dateTime:'2026-06-28T15:00:00Z', phase:'group' },
  // GRUPO K
  { id: 'M_K1', home: { id:'ITA', name:'Italia', flag:'\uD83C\uDDEE\uD83C\uDDF9', group:'Grupo K' }, away: { id:'PER', name:'Perú', flag:'\uD83C\uDDF5\uD83C\uDDEA', group:'Grupo K' }, dateTime:'2026-06-17T15:00:00Z', phase:'group' },
  { id: 'M_K2', home: { id:'TUN', name:'Túnez', flag:'\uD83C\uDDF9\uD83C\uDDF3', group:'Grupo K' }, away: { id:'NZL', name:'Nueva Zelanda', flag:'\uD83C\uDDF3\uD83C\uDDFF', group:'Grupo K' }, dateTime:'2026-06-17T18:00:00Z', phase:'group' },
  { id: 'M_K3', home: { id:'ITA', name:'Italia', flag:'\uD83C\uDDEE\uD83C\uDDF9', group:'Grupo K' }, away: { id:'TUN', name:'Túnez', flag:'\uD83C\uDDF9\uD83C\uDDF3', group:'Grupo K' }, dateTime:'2026-06-23T16:00:00Z', phase:'group' },
  { id: 'M_K4', home: { id:'PER', name:'Perú', flag:'\uD83C\uDDF5\uD83C\uDDEA', group:'Grupo K' }, away: { id:'NZL', name:'Nueva Zelanda', flag:'\uD83C\uDDF3\uD83C\uDDFF', group:'Grupo K' }, dateTime:'2026-06-23T19:00:00Z', phase:'group' },
  { id: 'M_K5', home: { id:'NZL', name:'Nueva Zelanda', flag:'\uD83C\uDDF3\uD83C\uDDFF', group:'Grupo K' }, away: { id:'ITA', name:'Italia', flag:'\uD83C\uDDEE\uD83C\uDDF9', group:'Grupo K' }, dateTime:'2026-06-28T18:00:00Z', phase:'group' },
  { id: 'M_K6', home: { id:'PER', name:'Perú', flag:'\uD83C\uDDF5\uD83C\uDDEA', group:'Grupo K' }, away: { id:'TUN', name:'Túnez', flag:'\uD83C\uDDF9\uD83C\uDDF3', group:'Grupo K' }, dateTime:'2026-06-28T18:00:00Z', phase:'group' },
  // GRUPO L
  { id: 'M_L1', home: { id:'NED', name:'Países Bajos', flag:'\uD83C\uDDF3\uD83C\uDDF1', group:'Grupo L' }, away: { id:'CHI', name:'Chile', flag:'\uD83C\uDDE8\uD83C\uDDF1', group:'Grupo L' }, dateTime:'2026-06-17T21:00:00Z', phase:'group' },
  { id: 'M_L2', home: { id:'VEN', name:'Venezuela', flag:'\uD83C\uDDFB\uD83C\uDDEA', group:'Grupo L' }, away: { id:'QAT', name:'Catar', flag:'\uD83C\uDDF6\uD83C\uDDE6', group:'Grupo L' }, dateTime:'2026-06-18T13:00:00Z', phase:'group' },
  { id: 'M_L3', home: { id:'NED', name:'Países Bajos', flag:'\uD83C\uDDF3\uD83C\uDDF1', group:'Grupo L' }, away: { id:'VEN', name:'Venezuela', flag:'\uD83C\uDDFB\uD83C\uDDEA', group:'Grupo L' }, dateTime:'2026-06-23T21:00:00Z', phase:'group' },
  { id: 'M_L4', home: { id:'CHI', name:'Chile', flag:'\uD83C\uDDE8\uD83C\uDDF1', group:'Grupo L' }, away: { id:'QAT', name:'Catar', flag:'\uD83C\uDDF6\uD83C\uDDE6', group:'Grupo L' }, dateTime:'2026-06-24T13:00:00Z', phase:'group' },
  { id: 'M_L5', home: { id:'QAT', name:'Catar', flag:'\uD83C\uDDF6\uD83C\uDDE6', group:'Grupo L' }, away: { id:'NED', name:'Países Bajos', flag:'\uD83C\uDDF3\uD83C\uDDF1', group:'Grupo L' }, dateTime:'2026-06-28T21:00:00Z', phase:'group' },
  { id: 'M_L6', home: { id:'CHI', name:'Chile', flag:'\uD83C\uDDE8\uD83C\uDDF1', group:'Grupo L' }, away: { id:'VEN', name:'Venezuela', flag:'\uD83C\uDDFB\uD83C\uDDEA', group:'Grupo L' }, dateTime:'2026-06-28T21:00:00Z', phase:'group' },
  // PLAYOFFS
  { id: 'M_PLAYOFF_1', home: { id:'ARG', name:'Argentina', flag:'\uD83C\uDDE6\uD83C\uDDF7', group:'Grupo C' }, away: { id:'MEX', name:'México', flag:'\uD83C\uDDF2\uD83C\uDDFD', group:'Grupo A' }, dateTime:'2026-06-30T18:00:00Z', phase:'octavos' },
  { id: 'M_PLAYOFF_2', home: { id:'BRA', name:'Brasil', flag:'\uD83C\uDDE7\uD83C\uDDF7', group:'Grupo E' }, away: { id:'USA', name:'EE. UU.', flag:'\uD83C\uDDFA\uD83C\uDDF8', group:'Grupo D' }, dateTime:'2026-07-01T20:00:00Z', phase:'octavos' },
  { id: 'M_PLAYOFF_3', home: { id:'FRA', name:'Francia', flag:'\uD83C\uDDEB\uD83C\uDDF7', group:'Grupo G' }, away: { id:'ESP', name:'España', flag:'\uD83C\uDDEA\uD83C\uDDF8', group:'Grupo F' }, dateTime:'2026-07-08T18:00:00Z', phase:'cuartos' },
  { id: 'M_PLAYOFF_4', home: { id:'COL', name:'Colombia', flag:'\uD83C\uDDE8\uD83C\uDDF4', group:'Grupo A' }, away: { id:'BRA', name:'Brasil', flag:'\uD83C\uDDE7\uD83C\uDDF7', group:'Grupo E' }, dateTime:'2026-07-14T20:00:00Z', phase:'semifinal' },
  { id: 'M_PLAYOFF_5', home: { id:'ARG', name:'Argentina', flag:'\uD83C\uDDE6\uD83C\uDDF7', group:'Grupo C' }, away: { id:'FRA', name:'Francia', flag:'\uD83C\uDDEB\uD83C\uDDF7', group:'Grupo G' }, dateTime:'2026-07-19T19:00:00Z', phase:'final' },
];

export default function ForceBootstrap({ onDone }: ForceBootstrapProps) {
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [log, setLog] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  const addLog = (msg: string) => setLog(prev => [...prev, msg]);

  const handleForce = async () => {
    setStatus('running');
    setLog([]);
    setProgress(0);
    try {
      addLog(`📋 Escribiendo ${MATCHES_WITH_FLAGS.length} partidos con banderas...`);
      for (let i = 0; i < MATCHES_WITH_FLAGS.length; i++) {
        const m = MATCHES_WITH_FLAGS[i];
        await setDoc(doc(db, 'matches', m.id), {
          id: m.id,
          homeTeam: m.home,
          awayTeam: m.away,
          dateTime: m.dateTime,
          phase: m.phase,
          status: 'scheduled',
        });
        setProgress(Math.round(((i + 1) / MATCHES_WITH_FLAGS.length) * 100));
      }
      addLog(`✅ ¡${MATCHES_WITH_FLAGS.length} partidos guardados con banderas!`);
      setStatus('done');
    } catch (err: any) {
      addLog(`❌ Error: ${err?.message || String(err)}`);
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center">
            <Database className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Forzar Carga de Datos</h2>
            <p className="text-xs text-slate-400">Escribe partidos con banderas emoji directamente</p>
          </div>
        </div>

        {status === 'running' && (
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div className="bg-indigo-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        )}

        {log.length > 0 && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 max-h-40 overflow-y-auto space-y-1">
            {log.map((line, i) => <p key={i} className="text-xs text-slate-300 font-mono">{line}</p>)}
          </div>
        )}

        <div className="flex gap-2">
          {status === 'idle' && (
            <button onClick={handleForce} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-2">
              <Database className="w-4 h-4" /> Cargar datos con banderas
            </button>
          )}
          {status === 'running' && (
            <div className="flex-1 py-2.5 bg-slate-800 text-slate-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Cargando... {progress}%
            </div>
          )}
          {status === 'done' && (
            <button onClick={onDone} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" /> ¡Listo! Cerrar y recargar
            </button>
          )}
          {status === 'error' && (
            <>
              <button onClick={handleForce} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4" /> Reintentar
              </button>
              <button onClick={onDone} className="flex-1 py-2.5 bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer">Cerrar</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}