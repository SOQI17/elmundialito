import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { TEAM_STATS } from '../data/teamStats';

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
  const [isOpen, setIsOpen] = useState(false);
  
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

  // Listen for Escape key to close the modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

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
  const stats = TEAM_STATS[team.id.toUpperCase()];
  const hasStats = !!stats;

  const flagImage = (
    <img
      src={url}
      alt={`Bandera de ${team.name}`}
      title={hasStats ? `${team.name} (Clic para ver estadísticas)` : team.name}
      className={`${sizeClasses[size]} ${className} ${
        hasStats 
          ? 'cursor-pointer hover:scale-110 hover:rotate-1 active:scale-95 transition-all duration-200 ring-2 ring-transparent hover:ring-indigo-400/50 hover:shadow-md' 
          : ''
      }`}
      onClick={(e) => {
        if (hasStats) {
          e.stopPropagation();
          setIsOpen(true);
        }
      }}
      onError={(e) => {
        // Fallback if image fails to load
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
      }}
    />
  );

  return (
    <>
      {flagImage}
      {isOpen && stats && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
        >
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes scaleIn {
              from { transform: scale(0.96); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
            .animate-fadeIn {
              animation: fadeIn 0.15s ease-out forwards;
            }
            .animate-scaleIn {
              animation: scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            }
          `}</style>
          
          <div 
            className="bg-white border border-slate-100 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl transition-all scale-100 p-5 space-y-5 animate-scaleIn text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <img 
                  src={url} 
                  alt={team.name} 
                  className="w-10 h-7 object-cover rounded-md shadow-sm border border-slate-150 shrink-0" 
                />
                <div>
                  <h3 className="text-base font-black text-slate-900 font-sans tracking-tight leading-tight">
                    {stats.name}
                  </h3>
                  <span className="text-[8px] font-black uppercase text-indigo-600 tracking-widest bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded-md inline-block mt-0.5">
                    Estadísticas Históricas
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-400 hover:text-slate-650 flex items-center justify-center text-xs font-black transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-slate-50/50 border border-slate-150 rounded-2xl p-2.5 text-center">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Partidos</span>
                <strong className="text-slate-800 text-sm font-extrabold block mt-0.5">{stats.pj}</strong>
              </div>
              <div className="bg-emerald-50/30 border border-emerald-100 rounded-2xl p-2.5 text-center">
                <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-wider block">Ganados</span>
                <strong className="text-emerald-600 text-sm font-extrabold block mt-0.5">{stats.g}</strong>
              </div>
              <div className="bg-amber-50/30 border border-amber-100 rounded-2xl p-2.5 text-center">
                <span className="text-[8px] font-bold text-amber-500 uppercase tracking-wider block">Empates</span>
                <strong className="text-amber-600 text-sm font-extrabold block mt-0.5">{stats.e}</strong>
              </div>
              <div className="bg-rose-50/30 border border-rose-100 rounded-2xl p-2.5 text-center">
                <span className="text-[8px] font-bold text-rose-500 uppercase tracking-wider block">Perdidos</span>
                <strong className="text-rose-600 text-sm font-extrabold block mt-0.5">{stats.p}</strong>
              </div>
            </div>

            {/* Goal Statistics & Win Rate */}
            <div className="grid grid-cols-2 gap-3">
              {/* Goals */}
              <div className="bg-slate-50/50 border border-slate-150 rounded-2xl p-3.5 flex flex-col justify-between">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Goles</span>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px] font-medium text-slate-600">
                    <span>A Favor (GF):</span>
                    <strong className="text-slate-800 font-extrabold">{stats.gf}</strong>
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-medium text-slate-600">
                    <span>En Contra (GC):</span>
                    <strong className="text-slate-800 font-extrabold">{stats.gc}</strong>
                  </div>
                  <div className="border-t border-slate-200/50 my-1"></div>
                  <div className="flex justify-between items-center text-[11px] font-medium text-slate-600">
                    <span>Diferencia:</span>
                    <span className={`font-black ${stats.dg > 0 ? 'text-emerald-600' : stats.dg < 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                      {stats.dg > 0 ? `+${stats.dg}` : stats.dg}
                    </span>
                  </div>
                </div>
              </div>

              {/* Win percentage & Streak */}
              <div className="bg-slate-50/50 border border-slate-150 rounded-2xl p-3.5 space-y-3">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Efectividad</span>
                  <span className="text-indigo-650 bg-indigo-50 border border-indigo-100 font-black text-[11px] px-2 py-0.5 rounded-lg inline-block">
                    {stats.winRate} de Victorias
                  </span>
                </div>
                
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Puntos & Racha</span>
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-medium text-slate-600">
                      Puntos: <strong className="text-slate-800 font-extrabold">{stats.puntos} pts</strong>
                    </div>
                    <div className="flex gap-1 pt-0.5">
                      {stats.racha.map((r, i) => (
                        <span 
                          key={i} 
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black uppercase text-white shadow-xs shrink-0 ${
                            r === 'G' ? 'bg-emerald-500' : r === 'E' ? 'bg-amber-500' : r === 'P' ? 'bg-rose-500' : 'bg-slate-500'
                          }`}
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Last 5 Matches Timeline */}
            <div className="space-y-2.5">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                🏟️ Últimos 5 Partidos:
              </h4>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5 scrollbar-thin">
                {stats.ultimosPartidos.map((m, index) => (
                  <div 
                    key={index}
                    className="p-2.5 bg-slate-50/50 border border-slate-150 rounded-2xl flex items-center justify-between text-[11px] hover:bg-slate-100/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span 
                        className={`w-4 h-4 rounded flex items-center justify-center text-[8px] font-black uppercase text-white shrink-0 ${
                          m.result === 'G' ? 'bg-emerald-500' : m.result === 'E' ? 'bg-amber-500' : m.result === 'P' ? 'bg-rose-500' : 'bg-slate-500'
                        }`}
                      >
                        {m.result}
                      </span>
                      <div>
                        <span className="font-bold text-slate-700">vs {m.opponent}</span>
                        <span className="text-[8px] text-slate-400 font-semibold block uppercase tracking-wider mt-0.5">{m.date}</span>
                      </div>
                    </div>
                    <span className="font-mono font-black text-slate-655 bg-white border border-slate-200 px-1.5 py-0.5 rounded-lg select-all text-[10px]">
                      {m.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}