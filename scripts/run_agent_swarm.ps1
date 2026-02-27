$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$tempDir = Join-Path $root "temp"
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null
$outPath = Join-Path $tempDir "agent-swarm-status.json"

$steps = @(
  @{ id = "calendar_sync"; label = "Calendar Sync Agent"; cmd = "npm.cmd run calendar:sync-today" },
  @{ id = "email_context"; label = "Email Context Agent"; cmd = "npm.cmd run email:scan-context" },
  @{ id = "cfti_attachment_export"; label = "CFTI Attachment Export Agent"; cmd = "npm.cmd run email:export-cfti-attachments" },
  @{ id = "cfti_controls_intake"; label = "CFTI Controls Intake Agent"; cmd = "npm.cmd run agent:cfti-controls-intake" },
  @{ id = "cfti_control_register"; label = "CFTI Control Register Agent"; cmd = "npm.cmd run agent:cfti-control-register" },
  @{ id = "process_flow_overlays"; label = "Process Flow Overlay Agent"; cmd = "npm.cmd run agent:process-flow-overlays" },
  @{ id = "process_flow_diagrams"; label = "Process Flow Diagram Payload Agent"; cmd = "npm.cmd run agent:process-flow-diagrams" },
  @{ id = "email_sent_export"; label = "Sent Email Export Agent"; cmd = "npm.cmd run email:export-sent" },
  @{ id = "pillar_email_sync"; label = "Pillar Email Reconciliation Agent"; cmd = "npm.cmd run agent:pillar-email-sync" },
  @{ id = "sharepoint_graph_sync"; label = "SharePoint Graph Sync Agent"; cmd = "npm.cmd run agent:sharepoint-graph-sync" },
  @{ id = "sharepoint_ingest"; label = "SharePoint Ingest Agent"; cmd = "npm.cmd run agent:sharepoint-ingest" },
  @{ id = "sharepoint_content"; label = "SharePoint Content Import Agent"; cmd = "npm.cmd run agent:sharepoint-content" },
  @{ id = "org_graph_sync"; label = "Org Graph Sync Agent"; cmd = "npm.cmd run org:sync-graph" },
  @{ id = "meeting_attendee_seed"; label = "Meeting Attendee Seed Agent"; cmd = "npm.cmd run agent:meeting-attendee-seed" },
  @{ id = "org_graph_merge"; label = "Org Graph Merge Agent"; cmd = "npm.cmd run agent:org-merge" },
  @{ id = "people_dedupe"; label = "People Dedupe Agent"; cmd = "npm.cmd run agent:people-dedupe" },
  @{ id = "notes_linking"; label = "Notes Linking Agent"; cmd = "npm.cmd run note:sync" },
  @{ id = "people_canonical"; label = "People Canonical Agent"; cmd = "npm.cmd run agent:people-canonical" },
  @{ id = "entity_profiles"; label = "Entity Profile Agent"; cmd = "npm.cmd run entity:build" },
  @{ id = "wiki_specificity"; label = "Wiki Specificity Agent"; cmd = "npm.cmd run agent:wiki-specificity" },
  @{ id = "person_quality"; label = "Person Content Quality Agent"; cmd = "npm.cmd run agent:person-quality" },
  @{ id = "person_redundancy"; label = "Person Redundancy Agent"; cmd = "npm.cmd run agent:person-redundancy" },
  @{ id = "person_relevance"; label = "Person Relevance Mismatch Agent"; cmd = "npm.cmd run agent:person-relevance" },
  @{ id = "wiki_queue"; label = "Wiki Review Queue Agent"; cmd = "npm.cmd run agent:wiki-queue" },
  @{ id = "wiki_agent_backlog"; label = "Wiki Agent Backlog Agent"; cmd = "npm.cmd run agent:wiki-agent-backlog" },
  @{ id = "feed_impact"; label = "Feed Impact Agent"; cmd = "npm.cmd run agent:feed-impact" },
  @{ id = "nav_governance"; label = "Nav Governance Agent"; cmd = "npm.cmd run agent:nav-governance" },
  @{ id = "focus_prompts"; label = "Operator Focus Prompt Agent"; cmd = "npm.cmd run agent:focus-prompts" },
  @{ id = "company_intel_ir"; label = "Company Intel IR Feed Agent"; cmd = "npm.cmd run agent:company-intel-ir" },
  @{ id = "company_intel_ir_email"; label = "Company Intel IR Email Feed Agent"; cmd = "npm.cmd run agent:company-intel-ir-email" },
  @{ id = "company_intel_sec"; label = "Company Intel SEC Feed Agent"; cmd = "npm.cmd run agent:company-intel-sec" },
  @{ id = "company_intel_queue"; label = "Company Intel Review Queue Agent"; cmd = "npm.cmd run agent:company-intel-queue" },
  @{ id = "company_intel_digest"; label = "Company Intel Digest Agent"; cmd = "npm.cmd run agent:company-intel-digest" },
  @{ id = "company_intel_agent_backlog"; label = "Company Intel Agent Backlog Agent"; cmd = "npm.cmd run agent:company-intel-agent-backlog" },
  @{ id = "connectivity_verify"; label = "Connectivity QA Agent"; cmd = "npm.cmd run verify:connectivity" },
  @{ id = "presentations_build"; label = "Presentation Build Agent"; cmd = "npm.cmd run presentations:build" }
)

$results = @()
foreach ($step in $steps) {
  $start = Get-Date
  $status = "ok"
  $output = ""
  $attempt = 1
  $maxAttempts = 2

  while ($attempt -le $maxAttempts) {
    try {
      $stdoutFile = [System.IO.Path]::GetTempFileName()
      $stderrFile = [System.IO.Path]::GetTempFileName()
      $proc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c $($step.cmd)" -PassThru -Wait -NoNewWindow -RedirectStandardOutput $stdoutFile -RedirectStandardError $stderrFile
      $stdout = if (Test-Path $stdoutFile) { Get-Content -Raw -Path $stdoutFile } else { "" }
      $stderr = if (Test-Path $stderrFile) { Get-Content -Raw -Path $stderrFile } else { "" }
      Remove-Item -Path $stdoutFile,$stderrFile -Force -ErrorAction SilentlyContinue
      $output = ($stdout + " " + $stderr).Trim()
      $exitCode = $proc.ExitCode
      if ($exitCode -eq 0) {
        break
      }

      # Retry once for transient file-lock cases (PowerPoint output file open).
      if ($attempt -lt $maxAttempts -and $output -match "being used by another process") {
        Start-Sleep -Seconds 2
        $attempt += 1
        continue
      }
      $status = "failed"
      break
    } catch {
      $status = "failed"
      $output = $_.Exception.Message
      break
    }
  }

  $end = Get-Date
  $results += [pscustomobject]@{
    id = $step.id
    label = $step.label
    command = $step.cmd
    status = $status
    startedAt = $start.ToString("o")
    finishedAt = $end.ToString("o")
    outputPreview = (($output -replace "\s+", " ").Trim()).Substring(0, [Math]::Min(350, (($output -replace "\s+", " ").Trim()).Length))
  }
}

$payload = [pscustomobject]@{
  generatedAt = (Get-Date).ToString("o")
  overallStatus = if (($results | Where-Object { $_.status -eq "failed" }).Count -gt 0) { "partial-failure" } else { "ok" }
  results = $results
}

$json = $payload | ConvertTo-Json -Depth 8
$enc = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText((Resolve-Path $outPath), $json, $enc)
Write-Output $outPath
