import React from 'react';

// Map 3-letter team ID to 2-letter flag code (lowercase) for flagcdn.com
export const TEAM_FLAG_CODES: Record<string, string> = {
  MEX: 'mx',
  COL: 'co',
  SWE: 'se',
  CMR: 'cm',
  CAN: 'ca',
  BEL: 'be',
  KOR: 'kr',
  GHA: 'gh',
  ARG: 'ar',
  URU: 'uy',
  UKR: 'ua',
  AUS: 'au',
  USA: 'us',
  JPN: 'jp',
  DEN: 'dk',
  NGA: 'ng',
  BRA: 'br',
  TUR: 'tr',
  CIV: 'ci',
  SCO: 'gb-sct',
  ESP: 'es',
  MAR: 'ma',
  AUT: 'at',
  EGY: 'eg',
  FRA: 'fr',
  SUI: 'ch',
  SEN: 'sn',
  SLO: 'sk', // Eslovaquia -> Slovakia (sk)
  GER: 'de',
  ECU: 'ec',
  NOR: 'no',
  IRQ: 'iq',
  ENG: 'gb-eng',
  POL: 'pl',
  CRC: 'cr',
  RSA: 'za',
  POR: 'pt',
  CRO: 'hr',
  ALG: 'dz',
  HON: 'hn',
  ITA: 'it',
  PER: 'pe',
  TUN: 'tn',
  NZL: 'nz',
  NED: 'nl',
  CHI: 'cl',
  VEN: 've',
  QAT: 'qa'
};

export function getTeamFlagUrl(teamId: string): string {
  const code = TEAM_FLAG_CODES[teamId.toUpperCase()] || 'un';
  return `https://flagcdn.com/w80/${code}.png`;
}

interface TeamFlagProps {
  team: { id: string; name: string; flag?: string };
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function TeamFlag({ team, className = '', size = 'md' }: TeamFlagProps) {
  const url = getTeamFlagUrl(team.id);
  
  const sizeClasses = {
    sm: 'w-5 h-3.5 object-cover rounded shadow-xs inline-block align-middle',
    md: 'w-7 h-5 object-cover rounded shadow-xs inline-block align-middle',
    lg: 'w-10 h-7 object-cover rounded-md shadow-sm inline-block align-middle',
    xl: 'w-16 h-11 object-cover rounded-md shadow-md inline-block align-middle'
  };

  return (
    <img
      src={url}
      alt={`Bandera de ${team.name}`}
      title={team.name}
      className={`${sizeClasses[size]} ${className}`}
      onError={(e) => {
        // Fallback to text initials if there is any error
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
      }}
    />
  );
}
