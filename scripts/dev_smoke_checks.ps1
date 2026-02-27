param(
  [int]$Port = 3000,
  [int]$StartupSeconds = 18
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$targets = @(
  @{ name = "Spine"; url = "http://localhost:$Port/abivax/spine"; match = "Operate" },
  @{ name = "Today"; url = "http://localhost:$Port/abivax/spine/today"; matchAny = @("Morning Brief","Post-Meeting Summary","Today's Brief","Program Update","Live Session","Mike Actions","Accomplishments","System queue") },
  @{ name = "Program"; url = "http://localhost:$Port/abivax/spine/program"; match = "Pillar Workboard" },
  @{ name = "Presentations"; url = "http://localhost:$Port/abivax/spine/presentations"; match = "Presentations Workspace" },
  @{ name = "Company"; url = "http://localhost:$Port/abivax/spine/company"; match = "Daily Headline Digest" },
  @{ name = "SystemMap"; url = "http://localhost:$Port/abivax/spine/system-map"; match = "Interactive Inspector" }
)

$proc = $null
try {
  $proc = Start-Process -FilePath "npm.cmd" -ArgumentList "run","dev","--","--port",$Port -PassThru -WorkingDirectory $root
  Start-Sleep -Seconds $StartupSeconds

  $results = @()
  foreach ($t in $targets) {
    try {
      $resp = Invoke-WebRequest -Uri $t.url -UseBasicParsing -TimeoutSec 20
      $body = [string]$resp.Content
      $matches = $false
      if ($t.ContainsKey("match")) {
        $matches = ($body -match [regex]::Escape($t.match))
      } elseif ($t.ContainsKey("matchAny")) {
        foreach ($m in $t.matchAny) {
          if ($body -match [regex]::Escape([string]$m)) { $matches = $true; break }
        }
      }
      $results += [pscustomobject]@{
        name = $t.name
        statusCode = [int]$resp.StatusCode
        contentMatch = $matches
      }
    } catch {
      $results += [pscustomobject]@{
        name = $t.name
        statusCode = 0
        contentMatch = $false
      }
    }
  }

  $ok = ($results | Where-Object { $_.statusCode -ne 200 -or -not $_.contentMatch }).Count -eq 0
  foreach ($r in $results) {
    Write-Output ("SMOKE:{0}:HTTP={1}:MATCH={2}" -f $r.name, $r.statusCode, $r.contentMatch)
  }
  if (-not $ok) {
    throw "One or more smoke checks failed."
  }
} finally {
  if ($proc) {
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
  }
}
