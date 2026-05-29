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
const tempFilePath = path.join(__dirname, 'tempTeamStatsForMutual.cjs');
fs.writeFileSync(tempFilePath, content, 'utf8');

// Load the stats
const TEAM_STATS = require(tempFilePath);

// Find mutual matches
const mutualMatches = [];

// Helper to normalize country names
const nameToCodeMap = {};
for (const [key, team] of Object.entries(TEAM_STATS)) {
  nameToCodeMap[team.name.toLowerCase()] = key;
}
// Add manual overrides
nameToCodeMap['méxico'] = 'MEX';
nameToCodeMap['mexico'] = 'MEX';
nameToCodeMap['estados unidos'] = 'USA';
nameToCodeMap['united states'] = 'USA';
nameToCodeMap['corea del sur'] = 'KOR';
nameToCodeMap['república de irlanda'] = 'IRL';
nameToCodeMap['reública de irlanda'] = 'IRL';
nameToCodeMap['rep. de irlanda'] = 'IRL';
nameToCodeMap['republic of ireland'] = 'IRL';
nameToCodeMap['bosnia y herz.'] = 'BIH';
nameToCodeMap['bosnia y herzegovina'] = 'BIH';
nameToCodeMap['costa de marfil'] = 'CIV';
nameToCodeMap['cabo verde'] = 'CPV';
nameToCodeMap['nueva zelanda'] = 'NZL';
nameToCodeMap['alemania'] = 'GER';
nameToCodeMap['países bajos'] = 'NED';
nameToCodeMap['curaçao'] = 'CUW';
nameToCodeMap['bélgica'] = 'BEL';
nameToCodeMap['camerún'] = 'CMR';
nameToCodeMap['zimbabue'] = 'ZIM';
nameToCodeMap['egipto'] = 'EGY';
nameToCodeMap['bolivia'] = 'BOL';
nameToCodeMap['panamá'] = 'PAN';
nameToCodeMap['irlanda'] = 'IRL';
nameToCodeMap['gambia'] = 'GAM';
nameToCodeMap['perú'] = 'PER';
nameToCodeMap['venezuela'] = 'VEN';
nameToCodeMap['gabón'] = 'GAB';
nameToCodeMap['irán'] = 'IRN';
nameToCodeMap['croacia'] = 'CRO';
nameToCodeMap['jamaica'] = 'JAM';
nameToCodeMap['bermudas'] = 'BER';

const mismatches = [];

for (const [key, team] of Object.entries(TEAM_STATS)) {
  const matches = team.ultimosPartidos;
  
  matches.forEach(m => {
    const oppKey = nameToCodeMap[m.opponent.toLowerCase()];
    if (!oppKey) return; // Opponent is not one of our 48 teams
    
    const oppTeam = TEAM_STATS[oppKey];
    if (!oppTeam) return;
    
    // Find the corresponding match in opponent's list
    const oppMatch = oppTeam.ultimosPartidos.find(om => om.date === m.date);
    if (!oppMatch) {
      mismatches.push({
        type: 'missing_match',
        teamA: team.name,
        teamB: oppTeam.name,
        date: m.date,
        matchA: m
      });
      return;
    }
    
    // Verify scores and results are exact inverses
    const [scoreA_for, scoreA_against] = m.score.split('-').map(Number);
    const [scoreB_for, scoreB_against] = oppMatch.score.split('-').map(Number);
    
    const scoreMatches = (scoreA_for === scoreB_against) && (scoreA_against === scoreB_for);
    
    const expectedResultB = m.result === 'G' ? 'P' : m.result === 'P' ? 'G' : 'E';
    const resultMatches = oppMatch.result === expectedResultB;
    
    if (!scoreMatches || !resultMatches) {
      mismatches.push({
        type: 'mismatched_score_or_result',
        date: m.date,
        teamA: team.name,
        teamAKey: key,
        matchA: m,
        teamB: oppTeam.name,
        teamBKey: oppKey,
        matchB: oppMatch
      });
    }
  });
}

// Deduplicate mismatches
const uniqueMismatches = [];
const seen = new Set();
mismatches.forEach(m => {
  const hash = [m.date, m.teamA, m.teamB].sort().join('|');
  if (!seen.has(hash)) {
    seen.add(hash);
    uniqueMismatches.push(m);
  }
});

console.log(`Encontradas ${uniqueMismatches.length} discrepancias en partidos mutuos.`);
console.log(JSON.stringify(uniqueMismatches, null, 2));

// Clean up
try {
  fs.unlinkSync(tempFilePath);
} catch (_) {}
