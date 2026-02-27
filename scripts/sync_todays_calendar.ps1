$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$tempDir = Join-Path $root "temp"
$outPath = Join-Path $tempDir "todays-meetings.json"

New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

function Clean-TeamsLink {
  param([string]$Body)
  if ([string]::IsNullOrWhiteSpace($Body)) { return "" }
  $m = [regex]::Match($Body, 'https?:\/\/teams\.microsoft\.com\/[^\s<)]+', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
  if ($m.Success) {
    return $m.Value.TrimEnd('>', ')', ',', '.', ';')
  }
  return ""
}

try {
  $outlook = New-Object -ComObject Outlook.Application
  $namespace = $outlook.GetNamespace("MAPI")
  $calendar = $namespace.GetDefaultFolder(9)
  $items = $calendar.Items
  $items.IncludeRecurrences = $true
  $items.Sort("[Start]")

  $today = (Get-Date).Date
  $tomorrow = $today.AddDays(1)
  $dateFilter = "[Start] >= '" + $today.ToString("g") + "' AND [Start] < '" + $tomorrow.ToString("g") + "'"
  $restricted = $items.Restrict($dateFilter)

  $meetings = @()
  foreach ($item in $restricted) {
    if ($null -eq $item) { continue }
    if ($item.Class -ne 26) { continue } # olAppointment

    $start = Get-Date $item.Start
    $attendees = [string]$item.RequiredAttendees
    if ([string]::IsNullOrWhiteSpace($attendees)) {
      $attendees = [string]$item.OptionalAttendees
    }

    $entry = [ordered]@{
      title = [string]$item.Subject
      date = $start.ToString("yyyy-MM-dd")
      time = $start.ToString("h:mm tt") + " EST"
      location = [string]$item.Location
      organizer = [string]$item.Organizer
      attendees = $attendees
      purpose = ""
      prep = @()
      link = Clean-TeamsLink -Body ([string]$item.Body)
      source = "outlook-sync"
      sourceUpdatedAt = (Get-Date).ToString("o")
    }
    $meetings += $entry
  }

  $payload = [ordered]@{ meetings = $meetings }
  $payload | ConvertTo-Json -Depth 8 | Set-Content -Path $outPath -Encoding UTF8
  Write-Output $outPath
}
catch {
  # Keep pipeline resilient when Outlook isn't available in current environment.
  @{ meetings = @() } | ConvertTo-Json -Depth 3 | Set-Content -Path $outPath -Encoding UTF8
  Write-Output $outPath
}

