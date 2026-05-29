const fs = require('fs');
const path = require('path');

const rawDataPath = path.join(__dirname, 'raw_schedule.json');
const outputPath = path.join(__dirname, '..', 'src', 'data.ts');

const rawMatches = JSON.parse(fs.readFileSync(rawDataPath, 'utf8').replace(/^\uFEFF/, ''));

// Exact team mapping from English name to ID, Spanish Name, and Flag Emoji
const TEAM_MAP = {
  "Algeria": { id: "ALG", name: "Argelia", flag: "🇩🇿" },
  "Argentina": { id: "ARG", name: "Argentina", flag: "🇦🇷" },
  "Australia": { id: "AUS", name: "Australia", flag: "🇦🇺" },
  "Austria": { id: "AUT", name: "Austria", flag: "🇦🇹" },
  "Belgium": { id: "BEL", name: "Bélgica", flag: "🇧🇪" },
  "Bosnia and Herzegovina": { id: "BIH", name: "Bosnia y H.", flag: "🇧🇦" },
  "Brazil": { id: "BRA", name: "Brasil", flag: "🇧🇷" },
  "Cabo Verde": { id: "CPV", name: "Cabo Verde", flag: "🇨🇻" },
  "Canada": { id: "CAN", name: "Canadá", flag: "🇨🇦" },
  "Colombia": { id: "COL", name: "Colombia", flag: "🇨🇴" },
  "Congo DR": { id: "COD", name: "R. D. Congo", flag: "🇨🇩" },
  "Côte d'Ivoire": { id: "CIV", name: "Costa de Marfil", flag: "🇨🇮" },
  "Cote d'Ivoire": { id: "CIV", name: "Costa de Marfil", flag: "🇨🇮" },
  "Croatia": { id: "CRO", name: "Croacia", flag: "🇭🇷" },
  "Curaçao": { id: "CUW", name: "Curazao", flag: "🇨🇼" },
  "Curaao": { id: "CUW", name: "Curazao", flag: "🇨🇼" },
  "Czechia": { id: "CZE", name: "República Checa", flag: "🇨🇿" },
  "Ecuador": { id: "ECU", name: "Ecuador", flag: "🇪🇨" },
  "Egypt": { id: "EGY", name: "Egipto", flag: "🇪🇬" },
  "England": { id: "ENG", name: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  "France": { id: "FRA", name: "Francia", flag: "🇫🇷" },
  "Germany": { id: "GER", name: "Alemania", flag: "🇩🇪" },
  "Ghana": { id: "GHA", name: "Ghana", flag: "🇬🇭" },
  "Haiti": { id: "HAI", name: "Haití", flag: "🇭🇹" },
  "IR Iran": { id: "IRN", name: "Irán", flag: "🇮🇷" },
  "Iraq": { id: "IRQ", name: "Irak", flag: "🇮🇶" },
  "Japan": { id: "JPN", name: "Japón", flag: "🇯🇵" },
  "Jordan": { id: "JOR", name: "Jordania", flag: "🇯🇴" },
  "Korea Republic": { id: "KOR", name: "Corea del Sur", flag: "🇰🇷" },
  "Mexico": { id: "MEX", name: "México", flag: "🇲🇽" },
  "Morocco": { id: "MAR", name: "Marruecos", flag: "🇲🇦" },
  "Netherlands": { id: "NED", name: "Países Bajos", flag: "🇳🇱" },
  "New Zealand": { id: "NZL", name: "Nueva Zelanda", flag: "🇳🇿" },
  "Norway": { id: "NOR", name: "Noruega", flag: "🇳🇴" },
  "Panama": { id: "PAN", name: "Panamá", flag: "🇵🇦" },
  "Paraguay": { id: "PAR", name: "Paraguay", flag: "🇵🇾" },
  "Portugal": { id: "POR", name: "Portugal", flag: "🇵🇹" },
  "Qatar": { id: "QAT", name: "Catar", flag: "🇶🇦" },
  "Saudi Arabia": { id: "KSA", name: "Arabia Saudita", flag: "🇸🇦" },
  "Scotland": { id: "SCO", name: "Escocia", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  "Senegal": { id: "SEN", name: "Senegal", flag: "🇸🇳" },
  "South Africa": { id: "RSA", name: "Sudáfrica", flag: "🇿🇦" },
  "Spain": { id: "ESP", name: "España", flag: "🇪🇸" },
  "Sweden": { id: "SWE", name: "Suecia", flag: "🇸🇪" },
  "Switzerland": { id: "SUI", name: "Suiza", flag: "🇨🇭" },
  "Tunisia": { id: "TUN", name: "Túnez", flag: "🇹🇳" },
  "Türkiye": { id: "TUR", name: "Turquía", flag: "🇹🇷" },
  "Tűrkiye": { id: "TUR", name: "Turquía", flag: "🇹🇷" },
  "T&uacute;rkiye": { id: "TUR", name: "Turquía", flag: "🇹🇷" },
  "Uruguay": { id: "URU", name: "Uruguay", flag: "🇺🇾" },
  "USA": { id: "USA", name: "EE. UU.", flag: "🇺🇸" },
  "Uzbekistan": { id: "UZB", name: "Uzbekistán", flag: "🇺🇿" }
};

// Normalize team names to match our TEAM_MAP keys
function getNormalizedTeam(rawName) {
  const clean = rawName.trim().replace(/\uFFFD/g, 'u');
  
  // Try exact match
  if (TEAM_MAP[clean]) return TEAM_MAP[clean];
  
  // Fuzzy match case insensitive
  for (const k of Object.keys(TEAM_MAP)) {
    if (k.toLowerCase() === clean.toLowerCase()) {
      return TEAM_MAP[k];
    }
  }
  
  // Handlers for specific weird encodings from Excel
  if (clean.includes('rkiye') || clean.includes('RKIYE') || clean.includes('Trkiye') || clean.includes('Tűrkiye')) {
    return TEAM_MAP['Türkiye'];
  }
  if (clean.includes('Cote') || clean.includes('Cte')) {
    return TEAM_MAP["Côte d'Ivoire"];
  }
  if (clean.includes('Cura') || clean.includes('Curaao')) {
    return TEAM_MAP['Curaçao'];
  }
  
  return null;
}

// Auto-detect group for each team
const teamGroups = {};
for (const match of rawMatches) {
  if (match.fase.includes('Fecha')) {
    const tA = getNormalizedTeam(match.teamA);
    const tB = getNormalizedTeam(match.teamB);
    const group = match.groupRonda.trim();
    
    if (tA && !teamGroups[tA.id]) {
      teamGroups[tA.id] = group;
    }
    if (tB && !teamGroups[tB.id]) {
      teamGroups[tB.id] = group;
    }
  }
}

// Generate TEAMS object without duplicate keys
const uniqueTeams = {};
const sortedKeys = Object.keys(TEAM_MAP).sort();
for (const k of sortedKeys) {
  const team = TEAM_MAP[k];
  if (!uniqueTeams[team.id]) {
    const group = teamGroups[team.id] || 'Grupo A';
    uniqueTeams[team.id] = {
      id: team.id,
      name: team.name,
      flag: team.flag,
      group: group
    };
  }
}

let teamsOutput = "export const TEAMS: Record<string, Team> = {\n";
for (const id of Object.keys(uniqueTeams).sort()) {
  const t = uniqueTeams[id];
  teamsOutput += `  '${id}': { id: '${t.id}', name: '${t.name}', flag: '${t.flag}', group: '${t.group}' },\n`;
}

// Extract TBD placeholders from knockout stages
const placeholderList = new Set();
const placeholderLabels = {};

const placeholderRegex = /^(To be announced|2A|2B|1C|2F|1E|3ABCDF|1F|2C|2E|2I|1I|3CDFGH|1A|3CEFHI|1L|3EHIJK|1G|3AEHIJ|1D|3BEFIJ|1H|2J|2K|2L|1B|3EFGIJ|2D|2G|1J|2H|1K|3DEIJL)$/;

for (const match of rawMatches) {
  const ta = match.teamA.trim();
  const tb = match.teamB.trim();
  
  for (const t of [ta, tb]) {
    if (placeholderRegex.test(t)) {
      let id = t;
      if (t === "To be announced") {
        id = "TBD_TBA";
      }
      placeholderList.add(id);
      placeholderLabels[id] = t === "To be announced" ? "Por definir" : t;
    }
  }
}

for (const pId of Array.from(placeholderList).sort()) {
  const label = placeholderLabels[pId];
  teamsOutput += `  '${pId}': { id: '${pId}', name: '${label}', flag: '🏳️', group: 'Eliminatoria' },\n`;
}

teamsOutput = teamsOutput.slice(0, -2) + "\n};\n\n";

// Generate INITIAL_MATCHES array
let matchesOutput = "export const INITIAL_MATCHES: Match[] = [\n";

for (const match of rawMatches) {
  const matchNum = match.matchNum.trim();
  const rawFase = match.fase.trim();
  const teamA = match.teamA.trim();
  const teamB = match.teamB.trim();
  const utcTime = match.utcTime.trim(); // e.g. "2026-06-11 19:00 UTC"
  
  // Format ISO Date String
  let isoTime = "2026-06-11T19:00:00Z";
  const dateMatch = utcTime.match(/(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})\s+UTC/);
  if (dateMatch) {
    isoTime = `${dateMatch[1]}T${dateMatch[2]}:00Z`;
  }
  
  // Map phase
  let phase = "group";
  if (rawFase.includes("Round of 32")) {
    phase = "dieciseisavos";
  } else if (rawFase.includes("Round of 16")) {
    phase = "octavos";
  } else if (rawFase.includes("Quarter Finals")) {
    phase = "cuartos";
  } else if (rawFase.includes("Semi Finals")) {
    phase = "semifinal";
  } else if (rawFase.includes("Finals")) {
    phase = "final";
  }
  
  // Map Home/Away team keys
  let homeKey = "";
  const normA = getNormalizedTeam(teamA);
  if (normA) {
    homeKey = `TEAMS['${normA.id}']`;
  } else {
    const pKey = teamA === "To be announced" ? "TBD_TBA" : teamA;
    homeKey = `TEAMS['${pKey}']`;
  }

  let awayKey = "";
  const normB = getNormalizedTeam(teamB);
  if (normB) {
    awayKey = `TEAMS['${normB.id}']`;
  } else {
    const pKey = teamB === "To be announced" ? "TBD_TBA" : teamB;
    awayKey = `TEAMS['${pKey}']`;
  }
  
  matchesOutput += `  { id: 'M_${matchNum}', homeTeam: ${homeKey}, awayTeam: ${awayKey}, dateTime: '${isoTime}', phase: '${phase}', status: 'scheduled' },\n`;
}

matchesOutput = matchesOutput.slice(0, -2) + "\n];\n\n";

const restOfData = `export const INITIAL_USERS: UserProfile[] = [
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
`;

const finalFileContent = `import { Match, Team, UserProfile, Forecast, League } from './types';\n\n` + teamsOutput + matchesOutput + restOfData;

fs.writeFileSync(outputPath, finalFileContent, 'utf8');
console.log("Successfully generated src/data.ts in UTF-8!");
