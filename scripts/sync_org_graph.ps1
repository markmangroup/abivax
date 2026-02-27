param(
  [string]$ImportFile = "",
  [switch]$UseAzCli = $true,
  [int]$Top = 250,
  [switch]$PreferOutlookGal = $true,
  [int]$MaxCacheAgeMinutes = 240,
  [switch]$ForceRefresh = $false
)

$ErrorActionPreference = "Stop"

function Write-OrgCache($path, $payload) {
  $json = $payload | ConvertTo-Json -Depth 12
  $enc = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($path, $json, $enc)
}

function Get-GraphJson($uri, $token) {
  $headers = @{ Authorization = "Bearer $token" }
  return Invoke-RestMethod -Method Get -Uri $uri -Headers $headers
}

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$outPath = Join-Path $root "data\abivax\org_graph.json"
$tempReport = Join-Path $root "temp\org-graph-sync-status.json"
New-Item -ItemType Directory -Force -Path (Split-Path $tempReport -Parent) | Out-Null

if (-not $ForceRefresh -and (Test-Path $outPath) -and $MaxCacheAgeMinutes -gt 0) {
  try {
    $existing = Get-Content -Raw -Path $outPath | ConvertFrom-Json
    $generatedAt = $null
    try { $generatedAt = [datetimeoffset]::Parse([string]$existing.generatedAt) } catch {}
    if ($generatedAt -and [string]$existing.status -eq "ok") {
      $ageMinutes = ((Get-Date).ToUniversalTime() - $generatedAt.UtcDateTime).TotalMinutes
      if ($ageMinutes -lt $MaxCacheAgeMinutes) {
        Write-OrgCache $tempReport ([pscustomobject]@{
          generatedAt = (Get-Date).ToString("o")
          status = "skipped-fresh-cache"
          mode = [string]$existing.source
          userCount = @($existing.users).Count
          message = "Org cache is fresh ($([math]::Round($ageMinutes,1)) min old); skipping refresh."
        })
        Write-Output $outPath
        exit 0
      }
    }
  } catch {
    # Ignore cache parse issues and continue with refresh.
  }
}

try {
  if ($ImportFile) {
    if (-not (Test-Path $ImportFile)) { throw "Import file not found: $ImportFile" }
    $raw = Get-Content -Raw -Path $ImportFile
    $import = $raw | ConvertFrom-Json
    $users = @()

    if ($import.users) {
      $users = @($import.users)
    } elseif ($import.value) {
      $users = @($import.value)
    } elseif ($import -is [System.Collections.IEnumerable]) {
      $users = @($import)
    }

    $payload = [pscustomobject]@{
      generatedAt = (Get-Date).ToString("o")
      source = "import"
      status = "ok"
      statusMessage = "Imported org data from local file."
      users = $users
    }
    Write-OrgCache $outPath $payload
    Write-OrgCache $tempReport ([pscustomobject]@{
      generatedAt = (Get-Date).ToString("o")
      status = "ok"
      mode = "import"
      userCount = $users.Count
      message = "Imported org graph cache from local file."
    })
    Write-Output $outPath
    exit 0
  }

  if ($PreferOutlookGal) {
    try {
      $outlook = New-Object -ComObject Outlook.Application
      $ns = $outlook.GetNamespace("MAPI")
      $gal = $ns.AddressLists | Where-Object { $_.Name -match "Offline Global Address List|Global Address List" } | Select-Object -First 1
      if ($gal) {
        $users = @()
        foreach ($entry in $gal.AddressEntries) {
          if ($null -eq $entry) { continue }
          $xu = $null
          try { $xu = $entry.GetExchangeUser() } catch {}
          if ($null -eq $xu) { continue }

          $mail = ""
          try { $mail = [string]$xu.PrimarySmtpAddress } catch {}
          $upn = ""
          try { $upn = [string]$xu.Address } catch {}
          $displayName = ""
          try { $displayName = [string]$xu.Name } catch { $displayName = [string]$entry.Name }
          if ([string]::IsNullOrWhiteSpace($displayName)) { continue }

          # Filter to likely internal users when a mail exists.
          if (-not [string]::IsNullOrWhiteSpace($mail)) {
            if ($mail -notmatch "@abivax\.com$") { continue }
          }

          $jobTitle = ""
          $department = ""
          try { $jobTitle = [string]$xu.JobTitle } catch {}
          try { $department = [string]$xu.Department } catch {}

          $managerObj = $null
          try { $managerObj = $xu.GetExchangeUserManager() } catch {}
          $manager = $null
          if ($managerObj) {
            $mgrMail = ""
            try { $mgrMail = [string]$managerObj.PrimarySmtpAddress } catch {}
            $manager = [pscustomobject]@{
              id = $null
              displayName = [string]$managerObj.Name
              mail = $mgrMail
              userPrincipalName = $mgrMail
            }
          }

          $directReports = @()
          try {
            $dr = $xu.GetDirectReports()
            if ($dr) {
              foreach ($d in $dr) {
                if ($null -eq $d) { continue }
                $dMail = ""
                try { $dMail = [string]$d.PrimarySmtpAddress } catch {}
                $directReports += [pscustomobject]@{
                  id = $null
                  displayName = [string]$d.Name
                  mail = $dMail
                  userPrincipalName = $dMail
                }
              }
            }
          } catch {}

          $users += [pscustomobject]@{
            id = $null
            displayName = $displayName
            mail = $mail
            userPrincipalName = $(if ($upn) { $upn } else { $mail })
            jobTitle = $jobTitle
            department = $department
            manager = $manager
            directReports = $directReports
          }
        }

        if ($users.Count -gt 0) {
          $payload = [pscustomobject]@{
            generatedAt = (Get-Date).ToString("o")
            source = "outlook-gal"
            status = "ok"
            statusMessage = "Org cache updated from Outlook Global Address List."
            users = $users
          }
          Write-OrgCache $outPath $payload
          Write-OrgCache $tempReport ([pscustomobject]@{
            generatedAt = (Get-Date).ToString("o")
            status = "ok"
            mode = "outlook-gal"
            userCount = $users.Count
            message = "Org cache refreshed from Outlook GAL."
          })
          Write-Output $outPath
          exit 0
        }
      }
    } catch {
      # Fall through to Graph path.
    }
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
    } catch {
      # AZ CLI not available or not logged in.
    }
  }

  if (-not $token) {
    $payload = [pscustomobject]@{
      generatedAt = (Get-Date).ToString("o")
      source = "microsoft-graph"
      status = "not-configured"
      statusMessage = "No Graph token found. Set ABIVAX_GRAPH_TOKEN or log in with az CLI (if tenant permits)."
      users = @()
    }
    Write-OrgCache $outPath $payload
    Write-OrgCache $tempReport ([pscustomobject]@{
      generatedAt = (Get-Date).ToString("o")
      status = "not-configured"
      mode = "graph"
      userCount = 0
      message = "No token available. Wrote placeholder cache."
    })
    Write-Output $outPath
    exit 0
  }

  # Requires directory permissions in most tenants (User.Read.All / Directory.Read.All).
  $select = "id,displayName,mail,userPrincipalName,jobTitle,department"
  $usersUri = "https://graph.microsoft.com/v1.0/users?`$top=$Top&`$select=$select"
  $usersResp = Get-GraphJson -uri $usersUri -token $token
  $users = @($usersResp.value)

  foreach ($u in $users) {
    try {
      $mgrUri = "https://graph.microsoft.com/v1.0/users/$($u.id)/manager?`$select=id,displayName,mail,userPrincipalName"
      $mgr = Get-GraphJson -uri $mgrUri -token $token
      if ($mgr) {
        $u | Add-Member -NotePropertyName manager -NotePropertyValue $mgr -Force
      }
    } catch {
      # Common when lacking manager/directory permissions; keep going.
    }
  }

  $payload = [pscustomobject]@{
    generatedAt = (Get-Date).ToString("o")
    source = "microsoft-graph"
    status = "ok"
    statusMessage = "Graph org cache updated."
    users = $users
  }
  Write-OrgCache $outPath $payload
  Write-OrgCache $tempReport ([pscustomobject]@{
    generatedAt = (Get-Date).ToString("o")
    status = "ok"
    mode = "graph"
    userCount = $users.Count
    message = "Org graph cache refreshed from Microsoft Graph."
  })
  Write-Output $outPath
}
catch {
  $msg = $_.Exception.Message
  $payload = [pscustomobject]@{
    generatedAt = (Get-Date).ToString("o")
    source = "microsoft-graph"
    status = "error"
    statusMessage = $msg
    users = @()
  }
  Write-OrgCache $outPath $payload
  Write-OrgCache $tempReport ([pscustomobject]@{
    generatedAt = (Get-Date).ToString("o")
    status = "error"
    mode = "graph"
    userCount = 0
    message = $msg
  })
  Write-Output $outPath
}
