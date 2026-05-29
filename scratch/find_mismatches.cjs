const fs = require('fs');
const path = require('path');

// Read the teamStats.ts file
const filePath = path.join(__dirname, '../src/data/teamStats.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace CRLF with LF to normalize newlines
content = content.replace(/\r\n/g, '\n');

// Strip out TS types and exports to make it evaluate-able JS
content = content.replace(/export interface [\s\S]*?\n\n/g, '');
content = content.replace(/: Record<string, TeamStatistics>/, '');
content = content.replace(/export const TEAM_STATS/, 'const TEAM_STATS');
content += '\n\nmodule.exports = TEAM_STATS;';

// Write to a temporary js file
const tempFilePath = path.join(__dirname, 'tempTeamStats.cjs');
fs.writeFileSync(tempFilePath, content, 'utf8');

// Load the stats
const TEAM_STATS = require(tempFilePath);

// Find mismatches
const mismatches = [];

for (const [key, team] of Object.entries(TEAM_STATS)) {
  const matches = team.ultimosPartidos;
  let computedG = 0;
  let computedE = 0;
  let computedP = 0;
  let computedGF = 0;
  let computedGC = 0;
  const computedRacha = [];

  matches.forEach(m => {
    computedRacha.push(m.result);
    if (m.result === 'G') computedG++;
    else if (m.result === 'E') computedE++;
    else if (m.result === 'P') computedP++;

    const [gf, gc] = m.score.split('-').map(Number);
    computedGF += gf;
    computedGC += gc;
  });

  const computedPJ = matches.length;
  const computedDG = computedGF - computedGC;
  const computedPuntos = computedG * 3 + computedE * 1;
  const computedWinRate = `${Math.round((computedG / computedPJ) * 100)}%`;

  const isMismatched = 
    team.pj !== computedPJ ||
    team.g !== computedG ||
    team.e !== computedE ||
    team.p !== computedP ||
    team.gf !== computedGF ||
    team.gc !== computedGC ||
    team.dg !== computedDG ||
    team.puntos !== computedPuntos ||
    team.winRate !== computedWinRate ||
    JSON.stringify(team.racha) !== JSON.stringify(computedRacha);

  if (isMismatched) {
    mismatches.push({
      id: key,
      name: team.name,
      declared: {
        pj: team.pj,
        g: team.g,
        e: team.e,
        p: team.p,
        gf: team.gf,
        gc: team.gc,
        dg: team.dg,
        puntos: team.puntos,
        winRate: team.winRate,
        racha: team.racha
      },
      computed: {
        pj: computedPJ,
        g: computedG,
        e: computedE,
        p: computedP,
        gf: computedGF,
        gc: computedGC,
        dg: computedDG,
        puntos: computedPuntos,
        winRate: computedWinRate,
        racha: computedRacha
      }
    });
  }
}

console.log(`Encontrados ${mismatches.length} países con discrepancias de estadísticas.`);
if (mismatches.length > 0) {
  console.log(JSON.stringify(mismatches, null, 2));
}

// Clean up
try {
  fs.unlinkSync(tempFilePath);
} catch (_) {}
