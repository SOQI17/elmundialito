# PowerShell script to generate src/data.ts from the Excel sheet

$excelPath = "C:\Users\DESKTOPLM4-MD\Downloads\calendario_mundial_2026_horarios_ecuador.xlsx"
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$workbook = $excel.Workbooks.Open($excelPath)
$sheet = $workbook.Sheets.Item(1)
$range = $sheet.UsedRange
$rows = $range.Rows.Count

# Mapping of English team names to IDs, Spanish names, and emoji flags
$teamMap = @{
  "Algeria" = @{ id = "ALG"; name = "Argelia"; flag = "🇩🇿" }
  "Argentina" = @{ id = "ARG"; name = "Argentina"; flag = "🇦🇷" }
  "Australia" = @{ id = "AUS"; name = "Australia"; flag = "🇦🇺" }
  "Austria" = @{ id = "AUT"; name = "Austria"; flag = "🇦🇹" }
  "Belgium" = @{ id = "BEL"; name = "Bélgica"; flag = "🇧🇪" }
  "Bosnia and Herzegovina" = @{ id = "BIH"; name = "Bosnia y H."; flag = "🇧🇦" }
  "Brazil" = @{ id = "BRA"; name = "Brasil"; flag = "🇧🇷" }
  "Cabo Verde" = @{ id = "CPV"; name = "Cabo Verde"; flag = "🇨🇻" }
  "Canada" = @{ id = "CAN"; name = "Canadá"; flag = "🇨🇦" }
  "Colombia" = @{ id = "COL"; name = "Colombia"; flag = "🇨🇴" }
  "Congo DR" = @{ id = "COD"; name = "R. D. Congo"; flag = "🇨🇩" }
  "Côte d'Ivoire" = @{ id = "CIV"; name = "Costa de Marfil"; flag = "🇨🇮" }
  "Cote d'Ivoire" = @{ id = "CIV"; name = "Costa de Marfil"; flag = "🇨🇮" }
  "Croatia" = @{ id = "CRO"; name = "Croacia"; flag = "🇭🇷" }
  "Curaçao" = @{ id = "CUW"; name = "Curazao"; flag = "🇨🇼" }
  "Curaao" = @{ id = "CUW"; name = "Curazao"; flag = "🇨🇼" }
  "Czechia" = @{ id = "CZE"; name = "República Checa"; flag = "🇨🇿" }
  "Ecuador" = @{ id = "ECU"; name = "Ecuador"; flag = "🇪🇨" }
  "Egypt" = @{ id = "EGY"; name = "Egipto"; flag = "🇪🇬" }
  "England" = @{ id = "ENG"; name = "Inglaterra"; flag = "🏴󠁧󠁢󠁥󠁮󠁧󠁿" }
  "France" = @{ id = "FRA"; name = "Francia"; flag = "🇫🇷" }
  "Germany" = @{ id = "GER"; name = "Alemania"; flag = "🇩🇪" }
  "Ghana" = @{ id = "GHA"; name = "Ghana"; flag = "🇬🇭" }
  "Haiti" = @{ id = "HAI"; name = "Haití"; flag = "🇭🇹" }
  "IR Iran" = @{ id = "IRN"; name = "Irán"; flag = "🇮🇷" }
  "Iraq" = @{ id = "IRQ"; name = "Irak"; flag = "🇮🇶" }
  "Japan" = @{ id = "JPN"; name = "Japón"; flag = "🇯🇵" }
  "Jordan" = @{ id = "JOR"; name = "Jordania"; flag = "🇯🇴" }
  "Korea Republic" = @{ id = "KOR"; name = "Corea del Sur"; flag = "🇰🇷" }
  "Mexico" = @{ id = "MEX"; name = "México"; flag = "🇲🇽" }
  "Morocco" = @{ id = "MAR"; name = "Marruecos"; flag = "🇲🇦" }
  "Netherlands" = @{ id = "NED"; name = "Países Bajos"; flag = "🇳🇱" }
  "New Zealand" = @{ id = "NZL"; name = "Nueva Zelanda"; flag = "🇳🇿" }
  "Norway" = @{ id = "NOR"; name = "Noruega"; flag = "🇳🇴" }
  "Panama" = @{ id = "PAN"; name = "Panamá"; flag = "🇵🇦" }
  "Paraguay" = @{ id = "PAR"; name = "Paraguay"; flag = "🇵🇾" }
  "Portugal" = @{ id = "POR"; name = "Portugal"; flag = "🇵🇹" }
  "Qatar" = @{ id = "QAT"; name = "Catar"; flag = "🇶🇦" }
  "Saudi Arabia" = @{ id = "KSA"; name = "Arabia Saudita"; flag = "🇸🇦" }
  "Scotland" = @{ id = "SCO"; name = "Escocia"; flag = "🏴󠁧󠁢󠁳󠁣󠁴󠁿" }
  "Senegal" = @{ id = "SEN"; name = "Senegal"; flag = "🇸🇳" }
  "South Africa" = @{ id = "RSA"; name = "Sudáfrica"; flag = "🇿🇦" }
  "Spain" = @{ id = "ESP"; name = "España"; flag = "🇪🇸" }
  "Sweden" = @{ id = "SWE"; name = "Suecia"; flag = "🇸🇪" }
  "Switzerland" = @{ id = "SUI"; name = "Suiza"; flag = "🇨🇭" }
  "Tunisia" = @{ id = "TUN"; name = "Túnez"; flag = "🇹🇳" }
  "Türkiye" = @{ id = "TUR"; name = "Turquía"; flag = "🇹🇷" }
  "Trkiye" = @{ id = "TUR"; name = "Turquía"; flag = "🇹🇷" }
  "Uruguay" = @{ id = "URU"; name = "Uruguay"; flag = "🇺🇾" }
  "USA" = @{ id = "USA"; name = "EE. UU."; flag = "🇺🇸" }
  "Uzbekistan" = @{ id = "UZB"; name = "Uzbekistán"; flag = "🇺🇿" }
}

# Auto-detect group for each team
$teamGroups = @{}
for ($r = 2; $r -le $rows; $r++) {
  $fase = $sheet.Cells.Item($r, 2).Text.Trim()
  if ($fase -match "Fecha") {
    $teamA = $sheet.Cells.Item($r, 5).Text.Trim()
    $teamB = $sheet.Cells.Item($r, 6).Text.Trim()
    $group = $sheet.Cells.Item($r, 7).Text.Trim()
    
    if ($teamA -and -not $teamGroups.ContainsKey($teamA)) {
      $teamGroups[$teamA] = $group
    }
    if ($teamB -and -not $teamGroups.ContainsKey($teamB)) {
      $teamGroups[$teamB] = $group
    }
  }
}

# Generate TEAMS object
$teamsOutput = "export const TEAMS: Record<string, Team> = {`n"

# First output the real teams
$sortedEnglishNames = $teamMap.Keys | Sort-Object
foreach ($engName in $sortedEnglishNames) {
  $mapped = $teamMap[$engName]
  $id = $mapped.id
  $name = $mapped.name
  $flag = $mapped.flag
  $group = $teamGroups[$engName]
  if (-not $group) { $group = "Grupo A" } # fallback
  $teamsOutput += "  ${id}: { id: '$id', name: '$name', flag: '$flag', group: '$group' },`n"
}

# Add placeholder teams for knockout stages
$placeholderTeams = @{}
for ($r = 2; $r -le $rows; $r++) {
  $teamA = $sheet.Cells.Item($r, 5).Text.Trim()
  $teamB = $sheet.Cells.Item($r, 6).Text.Trim()
  
  foreach ($t in ($teamA, $teamB)) {
    if ($t -and ($t -match "To be announced|2A|2B|1C|2F|1E|3ABCDF|1F|2C|2E|2I|1I|3CDFGH|1A|3CEFHI|1L|3EHIJK|1G|3AEHIJ|1D|3BEFIJ|1H|2J|2K|2L|1B|3EFGIJ|2D|2G|1J|2H|1K|3DEIJL")) {
      $id = $t
      if ($id -eq "To be announced") {
        $id = "TBD_TBA"
      }
      if (-not $placeholderTeams.ContainsKey($id)) {
        $placeholderTeams[$id] = $t
      }
    }
  }
}

foreach ($placeholderId in $placeholderTeams.Keys) {
  $displayName = $placeholderTeams[$placeholderId]
  if ($placeholderId -eq "TBD_TBA") {
    $displayName = "Por definir"
  }
  $teamsOutput += "  ${placeholderId}: { id: '$placeholderId', name: '$displayName', flag: '🏳️', group: 'Eliminatoria' },`n"
}

$teamsOutput = $teamsOutput.Substring(0, $teamsOutput.Length - 2) + "`n};`n`n"

# Generate INITIAL_MATCHES array
$matchesOutput = "export const INITIAL_MATCHES: Match[] = [`n"

for ($r = 2; $r -le $rows; $r++) {
  $matchNum = $sheet.Cells.Item($r, 1).Text.Trim()
  $fase = $sheet.Cells.Item($r, 2).Text.Trim()
  $teamA = $sheet.Cells.Item($r, 5).Text.Trim()
  $teamB = $sheet.Cells.Item($r, 6).Text.Trim()
  $groupRonda = $sheet.Cells.Item($r, 7).Text.Trim()
  $utcTime = $sheet.Cells.Item($r, 9).Text.Trim() # e.g. "2026-06-11 19:00 UTC"
  
  # Format ISO Date String
  # "2026-06-11 19:00 UTC" -> "2026-06-11T19:00:00Z"
  if ($utcTime -match "(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})\s+UTC") {
    $isoTime = "$($Matches[1])T$($Matches[2]):00Z"
  } else {
    $isoTime = "2026-06-11T19:00:00Z"
  }

  # Map Phase
  # group | dieciseisavos | octavos | cuartos | semifinal | final
  $phase = "group"
  if ($fase -match "Round of 32") {
    $phase = "dieciseisavos"
  } elseif ($fase -match "Round of 16") {
    $phase = "octavos"
  } elseif ($fase -match "Quarter Finals") {
    $phase = "cuartos"
  } elseif ($fase -match "Semi Finals") {
    $phase = "semifinal"
  } elseif ($fase -match "Finals") {
    $phase = "final"
  }

  # Map Home/Away team to TEAMS key
  $homeKey = "TEAMS."
  if ($teamMap.ContainsKey($teamA)) {
    $homeKey += $teamMap[$teamA].id
  } else {
    $id = $teamA
    if ($id -eq "To be announced") { $id = "TBD_TBA" }
    $homeKey += $id
  }

  $awayKey = "TEAMS."
  if ($teamMap.ContainsKey($teamB)) {
    $awayKey += $teamMap[$teamB].id
  } else {
    $id = $teamB
    if ($id -eq "To be announced") { $id = "TBD_TBA" }
    $awayKey += $id
  }

  $matchesOutput += "  { id: 'M_$matchNum', homeTeam: $homeKey, awayTeam: $awayKey, dateTime: '$isoTime', phase: '$phase', status: 'scheduled' },`n"
}

$matchesOutput = $matchesOutput.Substring(0, $matchesOutput.Length - 2) + "`n];`n`n"

# Base templates for the rest of data.ts
$restOfData = @"
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
"@

$finalContent = "import { Match, Team, UserProfile, Forecast, League } from './types';`n`n" + $teamsOutput + $matchesOutput + $restOfData

# Save to src/data.ts
$outputPath = "c:\Users\DESKTOPLM4-MD\Documents\mundialito\polla-mundialista (2)\src\data.ts"
[System.IO.File]::WriteAllText($outputPath, $finalContent, [System.Text.Encoding]::UTF8)

$workbook.Close($false)
$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null

Write-Output "Successfully generated data.ts with 104 matches!"
