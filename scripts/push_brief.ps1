$ErrorActionPreference = "Stop"

param(
  [string]$WebhookUrl = $env:BRIEF_WEBHOOK_URL
)

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$boardDir = Join-Path $root "outputs\\board"

if ([string]::IsNullOrWhiteSpace($WebhookUrl)) {
  Write-Error "Webhook URL is not configured. Set BRIEF_WEBHOOK_URL or pass -WebhookUrl."
  exit 1
}

if (-not (Test-Path $boardDir)) {
  Write-Error "Brief directory not found: $boardDir"
  exit 1
}

$latest = Get-ChildItem -Path $boardDir -Filter "brief-*.md" -File |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1

if (-not $latest) {
  Write-Error "No brief files found in $boardDir"
  exit 1
}

$content = Get-Content -Path $latest.FullName -Raw
$payload = @{
  source = "abivax-meeting-prep"
  filename = $latest.Name
  content = $content
  sentAt = (Get-Date).ToString("o")
} | ConvertTo-Json -Depth 4

Invoke-RestMethod -Method Post -Uri $WebhookUrl -ContentType "application/json" -Body $payload | Out-Null
Write-Output "Posted $($latest.Name) to webhook."
