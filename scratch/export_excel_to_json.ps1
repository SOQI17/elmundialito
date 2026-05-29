# PowerShell script to export Excel sheet to a clean JSON file

$excelPath = "C:\Users\DESKTOPLM4-MD\Downloads\calendario_mundial_2026_horarios_ecuador.xlsx"
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$workbook = $excel.Workbooks.Open($excelPath)
$sheet = $workbook.Sheets.Item(1)
$range = $sheet.UsedRange
$rows = $range.Rows.Count

$matchesList = @()

for ($r = 2; $r -le $rows; $r++) {
  $matchNum = $sheet.Cells.Item($r, 1).Text.Trim()
  $fase = $sheet.Cells.Item($r, 2).Text.Trim()
  $fechaEcu = $sheet.Cells.Item($r, 3).Text.Trim()
  $horaEcu = $sheet.Cells.Item($r, 4).Text.Trim()
  $teamA = $sheet.Cells.Item($r, 5).Text.Trim()
  $teamB = $sheet.Cells.Item($r, 6).Text.Trim()
  $groupRonda = $sheet.Cells.Item($r, 7).Text.Trim()
  $sede = $sheet.Cells.Item($r, 8).Text.Trim()
  $utcTime = $sheet.Cells.Item($r, 9).Text.Trim()
  
  if ($matchNum) {
    $matchObj = [PSCustomObject]@{
      matchNum   = $matchNum
      fase       = $fase
      fechaEcu   = $fechaEcu
      horaEcu    = $horaEcu
      teamA      = $teamA
      teamB      = $teamB
      groupRonda = $groupRonda
      sede       = $sede
      utcTime    = $utcTime
    }
    $matchesList += $matchObj
  }
}

$workbook.Close($false)
$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null

$jsonOutput = $matchesList | ConvertTo-Json -Depth 5
[System.IO.File]::WriteAllText("c:\Users\DESKTOPLM4-MD\Documents\mundialito\polla-mundialista (2)\scratch\raw_schedule.json", $jsonOutput, [System.Text.Encoding]::UTF8)

Write-Output "Successfully exported raw schedule to JSON!"
