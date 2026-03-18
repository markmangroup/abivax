$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$tempDir = Join-Path $root "temp"
$meetingPath = Join-Path $tempDir "meeting.txt"

New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

function Get-OutlookApplication {
  try {
    return [Runtime.InteropServices.Marshal]::GetActiveObject("Outlook.Application")
  }
  catch {
    return New-Object -ComObject Outlook.Application
  }
}

function Format-OutlookFilterDate {
  param([datetime]$Value)
  return $Value.ToString("MM/dd/yyyy hh:mm tt", [System.Globalization.CultureInfo]::InvariantCulture)
}

function Write-NoMeeting {
  Set-Content -Path $meetingPath -Value "NO_MEETING" -Encoding UTF8
}

try {
  $outlook = Get-OutlookApplication
  $namespace = $outlook.GetNamespace("MAPI")
  $calendar = $namespace.GetDefaultFolder(9)
  $items = $calendar.Items
  $items.IncludeRecurrences = $true
  $items.Sort("[Start]")

  $now = Get-Date
  $windowEnd = $now.AddHours(36)
  $windowStart = $now.AddHours(-6)
  $dateFilter = "[Start] >= '" + (Format-OutlookFilterDate -Value $windowStart) + "' AND [Start] <= '" + (Format-OutlookFilterDate -Value $windowEnd) + "'"
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
