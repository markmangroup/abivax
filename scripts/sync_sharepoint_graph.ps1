param(
  [switch]$UseAzCli = $true,
  [int]$MaxCacheAgeMinutes = 240,
  [switch]$ForceRefresh = $false
)

$ErrorActionPreference = "Stop"

function Write-Utf8Json($path, $obj) {
  $json = $obj | ConvertTo-Json -Depth 12
  $enc = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($path, $json, $enc)
}

function Get-GraphJson($uri, $token) {
  $headers = @{ Authorization = "Bearer $token" }
  return Invoke-RestMethod -Method Get -Uri $uri -Headers $headers
}

function Parse-SharePointSiteCandidates($artifacts) {
  $results = @()
  foreach ($a in @($artifacts)) {
    $url = [string]$a.canonicalUrl
    if (-not $url) { continue }
    try {
      $u = [uri]$url
      if ($u.Host -notmatch "sharepoint\.com$") { continue }
      $parts = $u.AbsolutePath.Trim("/").Split("/")
      $candidate = [ordered]@{
        host = $u.Host
        kind = "unknown"
        sitePath = ""
        sourceArtifactId = [string]$a.id
        sourceTitle = [string]$a.title
      }
      $siteIdx = [Array]::IndexOf($parts, "sites")
      if ($siteIdx -ge 0 -and $siteIdx + 1 -lt $parts.Length) {
        $candidate.kind = "sites"
        $candidate.sitePath = "/sites/$($parts[$siteIdx + 1])"
      } else {
        $sIdx = [Array]::IndexOf($parts, "s")
        if ($sIdx -ge 0 -and $sIdx + 1 -lt $parts.Length) {
          $candidate.kind = "shared-alias"
          $candidate.sitePath = "/s/$($parts[$sIdx + 1])"
        }
      }
      $results += [pscustomobject]$candidate
    } catch {
      continue
    }
  }

  # Deduplicate by host + sitePath
  $seen = @{}
  $deduped = @()
  foreach ($r in $results) {
    $key = "$($r.host)|$($r.sitePath)"
    if ($seen.ContainsKey($key)) { continue }
    $seen[$key] = $true
    $deduped += $r
  }
  return $deduped
}

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$tempDir = Join-Path $root "temp"
$dataDir = Join-Path $root "data\abivax"
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

$artifactsPath = Join-Path $dataDir "sharepoint_artifacts.json"
$indexPath = Join-Path $dataDir "sharepoint_remote_index.json"
$statusPath = Join-Path $tempDir "sharepoint-graph-sync-status.json"

$candidateSites = @()
if (Test-Path $artifactsPath) {
  try {
    $artifactsDoc = Get-Content -Raw -Path $artifactsPath | ConvertFrom-Json
    $candidateSites = Parse-SharePointSiteCandidates -artifacts $artifactsDoc.artifacts
  } catch {
    $candidateSites = @()
  }
}

if (-not $ForceRefresh -and (Test-Path $indexPath) -and $MaxCacheAgeMinutes -gt 0) {
  try {
    $existing = Get-Content -Raw -Path $indexPath | ConvertFrom-Json
    $generatedAt = $null
    try { $generatedAt = [datetimeoffset]::Parse([string]$existing.generatedAt) } catch {}
    if ($generatedAt -and [string]$existing.status -eq "ok") {
      $ageMinutes = ((Get-Date).ToUniversalTime() - $generatedAt.UtcDateTime).TotalMinutes
      if ($ageMinutes -lt $MaxCacheAgeMinutes) {
        Write-Utf8Json $statusPath ([pscustomobject]@{
          generatedAt = (Get-Date).ToString("o")
          status = "skipped-fresh-cache"
          mode = "graph"
          candidateSites = $candidateSites.Count
          resolvedSites = @($existing.sites).Count
          message = "SharePoint remote index cache is fresh ($([math]::Round($ageMinutes,1)) min old); skipping refresh."
        })
        Write-Output $indexPath
        exit 0
      }
    }
  } catch {}
}

$token = $env:ABIVAX_GRAPH_TOKEN
if (-not $token -and $UseAzCli) {
  try {
    $az = Get-Command az -ErrorAction Stop
    $azJson = & $az.Source account get-access-token --resource-type ms-graph --output json 2>$null
    if ($LASTEXITCODE -eq 0 -and $azJson) {
      $tok = $azJson | ConvertFrom-Json
      $token = [string]$tok.accessToken
    }
  } catch {}
}

if (-not $token) {
  $payload = [pscustomobject]@{
    generatedAt = (Get-Date).ToString("o")
    source = "microsoft-graph"
    status = "not-configured"
    summary = [pscustomobject]@{
      candidateSites = $candidateSites.Count
      resolvedSites = 0
      failedSites = 0
    }
    sites = @()
  }
  Write-Utf8Json $indexPath $payload
  Write-Utf8Json $statusPath ([pscustomobject]@{
    generatedAt = (Get-Date).ToString("o")
    status = "not-configured"
    mode = "graph"
    candidateSites = $candidateSites.Count
    resolvedSites = 0
    message = "No Graph token available. Set ABIVAX_GRAPH_TOKEN or use az login if tenant permits."
  })
  Write-Output $indexPath
  exit 0
}

$sitesOut = @()
$failCount = 0
foreach ($c in $candidateSites) {
  $result = [ordered]@{
    host = [string]$c.host
    kind = [string]$c.kind
    sitePath = [string]$c.sitePath
    sourceArtifactId = [string]$c.sourceArtifactId
    sourceTitle = [string]$c.sourceTitle
    graphStatus = "unsupported"
    graphSiteId = $null
    graphWebUrl = $null
    error = $null
  }
  try {
    if ($c.kind -eq "sites" -and $c.sitePath) {
      $uri = "https://graph.microsoft.com/v1.0/sites/$($c.host):$($c.sitePath)"
      $resp = Get-GraphJson -uri $uri -token $token
      $result.graphStatus = "ok"
      $result.graphSiteId = [string]$resp.id
      $result.graphWebUrl = [string]$resp.webUrl
    } else {
      $result.graphStatus = "needs-url-resolution"
    }
  } catch {
    $result.graphStatus = "error"
    $result.error = $_.Exception.Message
    $failCount += 1
  }
  $sitesOut += [pscustomobject]$result
}

$resolvedCount = @($sitesOut | Where-Object { $_.graphStatus -eq "ok" }).Count
$payload = [pscustomobject]@{
  generatedAt = (Get-Date).ToString("o")
  source = "microsoft-graph"
  status = "ok"
  summary = [pscustomobject]@{
    candidateSites = $candidateSites.Count
    resolvedSites = $resolvedCount
    failedSites = $failCount
  }
  sites = $sitesOut
}
Write-Utf8Json $indexPath $payload
Write-Utf8Json $statusPath ([pscustomobject]@{
  generatedAt = (Get-Date).ToString("o")
  status = "ok"
  mode = "graph"
  candidateSites = $candidateSites.Count
  resolvedSites = $resolvedCount
  message = "SharePoint site index sync completed."
})
Write-Output $indexPath

