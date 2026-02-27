$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")

& (Join-Path $PSScriptRoot "fetch_next_meeting.ps1")
$briefPath = & node (Join-Path $PSScriptRoot "parseMeeting.js")

if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

Write-Output $briefPath
