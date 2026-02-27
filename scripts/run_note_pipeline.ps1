$ErrorActionPreference = "Stop"

$noteId = $null
if ($args.Count -ge 1 -and $args[0]) {
  $noteId = $args[0]
}

$scriptPath = Join-Path $PSScriptRoot "link_note_entities.js"

if ($noteId) {
  & node $scriptPath --note-id $noteId
} else {
  & node $scriptPath
}

if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

Write-Output "Note pipeline complete"
