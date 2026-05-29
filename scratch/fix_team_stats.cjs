const fs = require('fs');
const path = require('path');

// Read the teamStats.ts file
const filePath = path.join(__dirname, '../src/data/teamStats.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace CRLF with LF to normalize newlines
content = content.replace(/\r\n/g, '\n');

// Strip out TS types and exports to make it evaluate-able JS
let evalContent = content.replace(/export interface [\s\S]*?\n\n/g, '');
evalContent = evalContent.replace(/: Record<string, TeamStatistics>/, '');
evalContent = evalContent.replace(/export const TEAM_STATS/, 'const TEAM_STATS');
evalContent += '\n\nmodule.exports = TEAM_STATS;';

// Write to a temporary js file
const tempFilePath = path.join(__dirname, 'tempTeamStatsForFix.cjs');
fs.writeFileSync(tempFilePath, evalContent, 'utf8');

// Load the stats
const TEAM_STATS = require(tempFilePath);

// Build the new file contents
let output = `export interface HistoricalMatch {
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

export const TEAM_STATS: Record<string, TeamStatistics> = {`;

const keys = Object.keys(TEAM_STATS);
keys.forEach((key, index) => {
  const team = TEAM_STATS[key];
  const matches = team.ultimosPartidos;
  
  let g = 0;
  let e = 0;
  let p = 0;
  let gf = 0;
  let gc = 0;
  const racha = [];

  matches.forEach(m => {
    racha.push(m.result);
    if (m.result === 'G') g++;
    else if (m.result === 'E') e++;
    else if (m.result === 'P') p++;

    const [h, a] = m.score.split('-').map(Number);
    gf += h;
    gc += a;
  });

  const pj = matches.length;
  const dg = gf - gc;
  const puntos = g * 3 + e * 1;
  const winRate = `${Math.round((g / pj) * 100)}%`;

  // Format team object
  output += `\n  ${key}: {
    id: '${team.id}',
    name: '${team.name}',
    pj: ${pj},
    g: ${g},
    e: ${e},
    p: ${p},
    gf: ${gf},
    gc: ${gc},
    dg: ${dg},
    puntos: ${puntos},
    winRate: '${winRate}',
    racha: ${JSON.stringify(racha)},
    ultimosPartidos: [`;

  matches.forEach((m, mIndex) => {
    output += `\n      { date: '${m.date}', opponent: '${m.opponent}', score: '${m.score}', result: '${m.result}' }${mIndex < matches.length - 1 ? ',' : ''}`;
  });

  output += `\n    ]
  }${index < keys.length - 1 ? ',' : ''}`;
});

output += `\n};\n`;

// Normalize output newlines back to CRLF on Windows if desired (or keep standard LF since Git handles it)
// We will write it with standard LF
fs.writeFileSync(filePath, output, 'utf8');
console.log('¡Estadísticas históricas de países corregidas exitosamente en teamStats.ts!');

// Clean up
try {
  fs.unlinkSync(tempFilePath);
} catch (_) {}
