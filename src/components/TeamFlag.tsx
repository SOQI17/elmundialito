import React from 'react';

// Map 2026 World Cup 3-letter team ID to 2-letter flag code (lowercase) for flagcdn.com
export const TEAM_FLAG_CODES: Record<string, string> = {
  ALG: 'dz', // Algeria
  ARG: 'ar', // Argentina
  AUS: 'au', // Australia
  AUT: 'at', // Austria
  BEL: 'be', // Belgium
  BIH: 'ba', // Bosnia and Herzegovina
  BRA: 'br', // Brazil
  CPV: 'cv', // Cabo Verde
  CAN: 'ca', // Canada
  COL: 'co', // Colombia
  COD: 'cd', // Congo DR
  CIV: 'ci', // Côte d'Ivoire
  CRO: 'hr', // Croatia
  CUW: 'cw', // Curaçao
  CZE: 'cz', // Czechia
  ECU: 'ec', // Ecuador
  EGY: 'eg', // Egypt
  ENG: 'gb-eng', // England
  FRA: 'fr', // France
  GER: 'de', // Germany
  GHA: 'gh', // Ghana
  HAI: 'ht', // Haiti
  IRN: 'ir', // IR Iran
  IRQ: 'iq', // Iraq
  JPN: 'jp', // Japan
  JOR: 'jo', // Jordan
  KOR: 'kr', // Korea Republic
  MEX: 'mx', // Mexico
  MAR: 'ma', // Morocco
  NED: 'nl', // Netherlands
  NZL: 'nz', // New Zealand
  NOR: 'no', // Norway
  PAN: 'pa', // Panama
  PAR: 'py', // Paraguay
  POR: 'pt', // Portugal
  QAT: 'qa', // Qatar
  KSA: 'sa', // Saudi Arabia
  SCO: 'gb-sct', // Scotland
  SEN: 'sn', // Senegal
  RSA: 'za', // South Africa
  ESP: 'es', // Spain
  SWE: 'se', // Sweden
  SUI: 'ch', // Switzerland
  TUN: 'tn', // Tunisia
  TUR: 'tr', // Türkiye
  URU: 'uy', // Uruguay
  USA: 'us', // USA
  UZB: 'uz'  // Uzbekistan
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
  const isTbd = 
    team.id.toUpperCase().startsWith('TBD') || 
    team.name.toLowerCase().includes('to be announced') || 
    team.name.toLowerCase().includes('por definir') || 
    team.id.length < 3 ||
    /^\d+[A-L]$/.test(team.name) || // Matches "1A", "2B", etc.
    /^3[A-L]{3,6}$/.test(team.name); // Matches "3ABCDF", "3CEFHI", etc.
  
  const sizeClasses = {
    sm: 'w-5 h-3.5 object-cover rounded shadow-xs inline-block align-middle',
    md: 'w-7 h-5 object-cover rounded shadow-xs inline-block align-middle',
    lg: 'w-10 h-7 object-cover rounded-md shadow-sm inline-block align-middle',
    xl: 'w-16 h-11 object-cover rounded-md shadow-md inline-block align-middle'
  };

  const tbdSizeClasses = {
    sm: 'w-5 h-3.5 rounded text-[8px]',
    md: 'w-7 h-5 rounded text-[9px]',
    lg: 'w-10 h-7 rounded-md text-[10px]',
    xl: 'w-16 h-11 rounded-md text-[13px]'
  };

  if (isTbd) {
    return (
      <div 
        className={`bg-slate-100 border border-slate-300/80 text-slate-400 font-extrabold flex items-center justify-center select-none shadow-inner inline-flex align-middle ${tbdSizeClasses[size]} ${className}`}
        title={team.name}
      >
        ❓
      </div>
    );
  }

  const url = getTeamFlagUrl(team.id);

  return (
    <img
      src={url}
      alt={`Bandera de ${team.name}`}
      title={team.name}
      className={`${sizeClasses[size]} ${className}`}
      onError={(e) => {
        // Fallback if image fails to load
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
      }}
    />
  );
}