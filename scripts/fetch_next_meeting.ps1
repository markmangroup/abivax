$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$tempDir = Join-Path $root "temp"
$meetingPath = Join-Path $tempDir "meeting.txt"

New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

function Write-NoMeeting {
  Set-Content -Path $meetingPath -Value "NO_MEETING" -Encoding UTF8
}

try {
  $outlook = New-Object -ComObject Outlook.Application
  $namespace = $outlook.GetNamespace("MAPI")
  $calendar = $namespace.GetDefaultFolder(9)
  $items = $calendar.Items
  $items.IncludeRecurrences = $true
  $items.Sort("[Start]")

  $now = Get-Date
  $windowEnd = $now.AddHours(36)
  $dateFilter = "[Start] >= '" + $now.ToString("g") + "' AND [Start] <= '" + $windowEnd.ToString("g") + "'"
  $restricted = $items.Restrict($dateFilter)

  $nextMeeting = $null
  foreach ($item in $restricted) {
    if ($null -eq $item) { continue }
    if ($item.Class -ne 26) { continue } # olAppointment

    if ($item.Start -ge $now -and $item.Start -le $windowEnd) {
      if ($null -eq $nextMeeting -or $item.Start -lt $nextMeeting.Start) {
        $nextMeeting = $item
      }
    }
  }

  if ($null -eq $nextMeeting) {
    Write-NoMeeting
    exit 0
  }

  $subject = [string]$nextMeeting.Subject
  $start = (Get-Date $nextMeeting.Start).ToString("o")
  $end = (Get-Date $nextMeeting.End).ToString("o")
  $organizer = [string]$nextMeeting.Organizer
  $attendees = [string]$nextMeeting.RequiredAttendees
  if ([string]::IsNullOrWhiteSpace($attendees)) {
    $attendees = [string]$nextMeeting.OptionalAttendees
  }
  $location = [string]$nextMeeting.Location
  $body = [string]$nextMeeting.Body

  $content = @(
    "Subject: $subject"
    "Start: $start"
    "End: $end"
    "Organizer: $organizer"
    "Attendees: $attendees"
    "Location: $location"
    ""
    "Body:"
    $body
  ) -join "`r`n"

  Set-Content -Path $meetingPath -Value $content -Encoding UTF8
}
catch {
  Write-NoMeeting
}
