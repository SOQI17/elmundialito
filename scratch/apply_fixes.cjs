const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/teamStats.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace CRLF with LF to make replacements robust
content = content.replace(/\r\n/g, '\n');

// 1. Correct Canada vs Tunisia match on 2026-03-31
content = content.replace(
  /CAN: \{[\s\S]*?ultimosPartidos: \[\n\s+\{ date: '2026-03-31', opponent: 'Túnez', score: '0-3', result: 'P' \}/,
  (match) => match.replace("score: '0-3', result: 'P'", "score: '0-0', result: 'E'")
);

// 2. Correct USA vs Australia match on 2025-10-14
content = content.replace(
  /USA: \{[\s\S]*?\{ date: '2025-10-14', opponent: 'Austria', score: '4-0', result: 'G' \}/,
  (match) => match.replace("opponent: 'Austria', score: '4-0', result: 'G'", "opponent: 'Australia', score: '2-1', result: 'G'")
);

// 3. Correct Qatar vs UAE match on 2025-10-14, and Zimbabwe match on 2025-11-17
content = content.replace(
  /QAT: \{[\s\S]*?ultimosPartidos: \[\n\s+\{ date: '2026-03-31', opponent: 'Túnez', score: '0-3', result: 'P' \},\n\s+\{ date: '2026-03-28', opponent: 'Siria', score: '1-1', result: 'E' \},\n\s+\{ date: '2025-11-18', opponent: 'Palestina', score: '0-1', result: 'P' \},\n\s+\{ date: '2025-11-17', opponent: 'Zimbabue', score: '1-2', result: 'P' \},\n\s+\{ date: '2025-10-14', opponent: 'Egipto', score: '2-1', result: 'G' \}/,
  `QAT: {
    id: 'QAT',
    name: 'Catar',
    pj: 5,
    g: 1,
    e: 1,
    p: 3,
    gf: 4,
    gc: 8,
    dg: -4,
    puntos: 4,
    winRate: '20%',
    racha: ["P","E","P","P","G"],
    ultimosPartidos: [
      { date: '2026-03-31', opponent: 'Túnez', score: '0-3', result: 'P' },
      { date: '2026-03-28', opponent: 'Siria', score: '1-1', result: 'E' },
      { date: '2025-11-18', opponent: 'Palestina', score: '0-1', result: 'P' },
      { date: '2025-11-17', opponent: 'Zimbabue', score: '1-0', result: 'G' },
      { date: '2025-10-14', opponent: 'Emiratos Árabes Unidos', score: '2-2', result: 'E' }`
);

// 4. Correct Jordan vs Iraq match on 2026-03-27
content = content.replace(
  /JOR: \{[\s\S]*?\{ date: '2026-03-27', opponent: 'Costa Rica', score: '2-2', result: 'E' \}/,
  (match) => match.replace("opponent: 'Costa Rica', score: '2-2', result: 'E'", "opponent: 'Irak', score: '1-0', result: 'G'")
);

// 5. Correct Saudi Arabia vs Jordan match on 2025-12-15
content = content.replace(
  /KSA: \{[\s\S]*?\{ date: '2025-12-18', opponent: 'Jordania', score: '0-0', result: 'E' \}/,
  (match) => match.replace("date: '2025-12-18', opponent: 'Jordania', score: '0-0', result: 'E'", "date: '2025-12-15', opponent: 'Jordania', score: '0-1', result: 'P'")
);

// 6. Correct Uzbekistan vs Iran match on 2026-01-03
content = content.replace(
  /UZB: \{[\s\S]*?\{ date: '2026-01-03', opponent: 'China', score: '2-0', result: 'G' \}/,
  (match) => match.replace("opponent: 'China', score: '2-0', result: 'G'", "opponent: 'Irán', score: '0-0', result: 'E'")
);

// 7. Correct Curaçao vs Colombia match on 2025-10-14
content = content.replace(
  /CUW: \{[\s\S]*?\{ date: '2025-10-14', opponent: 'Trinidad y Tobago', score: '1-1', result: 'E' \}/,
  (match) => match.replace("opponent: 'Trinidad y Tobago', score: '1-1', result: 'E'", "opponent: 'Colombia', score: '0-0', result: 'E'")
);

// 8. Correct South Africa's matches to fit the spreadsheet (GF: 2, GC: 8, G: 1, E: 1, P: 3)
content = content.replace(
  /RSA: \{[\s\S]*?ultimosPartidos: \[\n\s+\{ date: '2026-03-31', opponent: 'Camerún', score: '1-2', result: 'P' \},\n\s+\{ date: '2026-03-27', opponent: 'Zimbabue', score: '3-2', result: 'G' \},\n\s+\{ date: '2026-01-04', opponent: 'Camerún', score: '1-2', result: 'P' \},\n\s+\{ date: '2025-12-29', opponent: 'Zimbabue', score: '3-2', result: 'G' \},\n\s+\{ date: '2025-11-22', opponent: 'Egipto', score: '0-1', result: 'P' \}/,
  `RSA: {
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
      { date: '2025-11-22', opponent: 'Egipto', score: '0-3', result: 'P' }`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('¡Discrepancias tipográficas corregidas en el archivo teamStats.ts!');
