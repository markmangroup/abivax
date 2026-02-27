param(
  [switch]$FailFast,
  [string[]]$Stages
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$tempDir = Join-Path $root "temp"
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null
$outPath = Join-Path $tempDir "swarm-waterfall-report.json"

function Invoke-Step {
  param(
    [Parameter(Mandatory = $true)][hashtable]$Step
  )

  $start = Get-Date
  $status = "ok"
  $output = ""
  $attempt = 1
  $maxAttempts = 2

  while ($attempt -le $maxAttempts) {
    try {
      $stdoutFile = [System.IO.Path]::GetTempFileName()
      $stderrFile = [System.IO.Path]::GetTempFileName()
      $proc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c $($Step.cmd)" -PassThru -Wait -NoNewWindow -RedirectStandardOutput $stdoutFile -RedirectStandardError $stderrFile
      $stdout = if (Test-Path $stdoutFile) { Get-Content -Raw -Path $stdoutFile } else { "" }
      $stderr = if (Test-Path $stderrFile) { Get-Content -Raw -Path $stderrFile } else { "" }
      Remove-Item -Path $stdoutFile,$stderrFile -Force -ErrorAction SilentlyContinue
      $output = ($stdout + " " + $stderr).Trim()
      if ($proc.ExitCode -eq 0) { break }
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
  $normalizedOutput = ($output -replace "\s+", " ").Trim()
  return [pscustomobject]@{
    id = $Step["id"]
    label = $Step["label"]
    command = $Step["cmd"]
    status = $status
    startedAt = $start.ToString("o")
    finishedAt = $end.ToString("o")
    durationMs = [int][Math]::Round(($end - $start).TotalMilliseconds)
    outputPreview = if ([string]::IsNullOrWhiteSpace($normalizedOutput)) { "" } else { $normalizedOutput.Substring(0, [Math]::Min(300, $normalizedOutput.Length)) }
  }
}

function Read-JsonSafe {
  param(
    [Parameter(Mandatory = $true)][string]$Path
  )
  try {
    if (-not (Test-Path $Path)) { return $null }
    $raw = Get-Content -Raw -Path $Path
    if ($null -eq $raw) { return $null }
    if ($raw.Length -gt 0 -and [int][char]$raw[0] -eq 65279) {
      $raw = $raw.Substring(1)
    }
    return ($raw | ConvertFrom-Json -Depth 100)
  } catch {
    return $null
  }
}

function Get-StageMetrics {
  param(
    [string]$RootPath
  )
  $dataDir = Join-Path $RootPath "data\abivax"
  $temp = Join-Path $RootPath "temp"

  $wikiQueue = Read-JsonSafe -Path (Join-Path $dataDir "wiki_review_queue.json")
  $wikiBacklog = Read-JsonSafe -Path (Join-Path $dataDir "wiki_agent_backlog.json")
  $companyQueue = Read-JsonSafe -Path (Join-Path $dataDir "company_intel_review_queue.json")
  $companyBacklog = Read-JsonSafe -Path (Join-Path $dataDir "company_intel_agent_backlog.json")
  $digest = Read-JsonSafe -Path (Join-Path $dataDir "company_intel_daily_digest.json")
  $entities = Read-JsonSafe -Path (Join-Path $dataDir "entities.json")
  $todayMeetings = Read-JsonSafe -Path (Join-Path $temp "todays-meetings.json")
  $swarmStatus = Read-JsonSafe -Path (Join-Path $temp "agent-swarm-status.json")

  $feedStatuses = @()
  if ($digest -and $digest.feedStatuses) {
    foreach ($fs in $digest.feedStatuses) {
      $feedStatuses += [pscustomobject]@{
        name = [string]$fs.name
        status = [string]$fs.status
      }
    }
  }

  $anomalies = @()
  if ($wikiQueue -and $wikiQueue.summary -and [int]$wikiQueue.summary.highPriorityPending -gt 0) {
    $anomalies += "Wiki queue has $($wikiQueue.summary.highPriorityPending) high-priority pending item(s)."
  }
  if ($companyQueue -and $companyQueue.summary -and [int]$companyQueue.summary.highPriorityPending -gt 0) {
    $anomalies += "Company intel queue has $($companyQueue.summary.highPriorityPending) high-priority pending item(s)."
  }
  foreach ($fs in $feedStatuses) {
    if ($fs.status -in @("sync-failed", "degraded")) {
      $anomalies += "Company intel feed '$($fs.name)' is $($fs.status)."
    }
  }
  if ($swarmStatus -and $swarmStatus.overallStatus -and $swarmStatus.overallStatus -ne "ok") {
    $anomalies += "Last agent swarm status is $($swarmStatus.overallStatus)."
  }

  return [pscustomobject]@{
    entityCount = if ($entities -and $entities.entities) { [int]$entities.entities.Count } else { 0 }
    todayMeetingCount = if ($todayMeetings -and $todayMeetings.meetings) { [int]$todayMeetings.meetings.Count } else { 0 }
    wikiQueuePending = if ($wikiQueue -and $wikiQueue.summary) { [int]$wikiQueue.summary.pendingReview } else { 0 }
    wikiQueueHigh = if ($wikiQueue -and $wikiQueue.summary) { [int]$wikiQueue.summary.highPriorityPending } else { 0 }
    companyQueuePending = if ($companyQueue -and $companyQueue.summary) { [int]$companyQueue.summary.pendingReview } else { 0 }
    companyQueueHigh = if ($companyQueue -and $companyQueue.summary) { [int]$companyQueue.summary.highPriorityPending } else { 0 }
    wikiBacklogOpen = if ($wikiBacklog -and $wikiBacklog.summary) { [int]$wikiBacklog.summary.openTodos } else { 0 }
    companyBacklogOpen = if ($companyBacklog -and $companyBacklog.summary) { [int]$companyBacklog.summary.openTodos } else { 0 }
    companyIntelFeedStatuses = $feedStatuses
    anomalies = $anomalies | Select-Object -Unique
  }
}

$allStages = @(
  @{
    id = "ingest"
    label = "Ingest"
    goal = "Pull raw snapshots and attachments from external/local sources."
    steps = @(
      @{ id = "calendar_sync"; label = "Calendar Sync Agent"; cmd = "npm.cmd run calendar:sync-today" },
      @{ id = "email_context"; label = "Email Context Agent"; cmd = "npm.cmd run email:scan-context" },
      @{ id = "email_sent_export"; label = "Sent Email Export Agent"; cmd = "npm.cmd run email:export-sent" },
      @{ id = "cfti_attachment_export"; label = "CFTI Attachment Export Agent"; cmd = "npm.cmd run email:export-cfti-attachments" },
      @{ id = "sharepoint_graph_sync"; label = "SharePoint Graph Sync Agent"; cmd = "npm.cmd run agent:sharepoint-graph-sync" },
      @{ id = "org_graph_sync"; label = "Org Graph Sync Agent"; cmd = "npm.cmd run org:sync-graph" }
    )
  },
  @{
    id = "normalize"
    label = "Normalize"
    goal = "Convert raw inputs into canonical datasets and reconcile deterministic records."
    steps = @(
      @{ id = "cfti_controls_intake"; label = "CFTI Controls Intake Agent"; cmd = "npm.cmd run agent:cfti-controls-intake" },
      @{ id = "cfti_control_register"; label = "CFTI Control Register Agent"; cmd = "npm.cmd run agent:cfti-control-register" },
      @{ id = "trinidad_p2p_bundle"; label = "Trinidad P2P Bundle Intake Agent"; cmd = "npm.cmd run agent:trinidad-p2p-bundle" },
      @{ id = "sharepoint_ingest"; label = "SharePoint Ingest Agent"; cmd = "npm.cmd run agent:sharepoint-ingest" },
      @{ id = "sharepoint_content"; label = "SharePoint Content Import Agent"; cmd = "npm.cmd run agent:sharepoint-content" },
      @{ id = "meeting_attendee_seed"; label = "Meeting Attendee Seed Agent"; cmd = "npm.cmd run agent:meeting-attendee-seed" },
      @{ id = "org_graph_merge"; label = "Org Graph Merge Agent"; cmd = "npm.cmd run agent:org-merge" },
      @{ id = "people_dedupe"; label = "People Dedupe Agent"; cmd = "npm.cmd run agent:people-dedupe" },
      @{ id = "notes_linking"; label = "Notes Linking Agent"; cmd = "npm.cmd run note:sync" },
      @{ id = "people_canonical"; label = "People Canonical Agent"; cmd = "npm.cmd run agent:people-canonical" },
      @{ id = "pillar_email_sync"; label = "Pillar Email Reconciliation Agent"; cmd = "npm.cmd run agent:pillar-email-sync" }
    )
  },
  @{
    id = "enrich"
    label = "Enrich"
    goal = "Build derived relationships, profiles, and process visual payloads."
    steps = @(
      @{ id = "entity_profiles"; label = "Entity Profile Agent"; cmd = "npm.cmd run entity:build" },
      @{ id = "process_flow_overlays"; label = "Process Flow Overlay Agent"; cmd = "npm.cmd run agent:process-flow-overlays" },
      @{ id = "process_flow_diagrams"; label = "Process Flow Diagram Payload Agent"; cmd = "npm.cmd run agent:process-flow-diagrams" }
    )
  },
  @{
    id = "detect"
    label = "Detect"
    goal = "Detect drift, quality issues, and generate review queues/backlogs."
    steps = @(
      @{ id = "wiki_specificity"; label = "Wiki Specificity Agent"; cmd = "npm.cmd run agent:wiki-specificity" },
      @{ id = "person_quality"; label = "Person Content Quality Agent"; cmd = "npm.cmd run agent:person-quality" },
      @{ id = "person_redundancy"; label = "Person Redundancy Agent"; cmd = "npm.cmd run agent:person-redundancy" },
      @{ id = "person_relevance"; label = "Person Relevance Mismatch Agent"; cmd = "npm.cmd run agent:person-relevance" },
      @{ id = "page_readability"; label = "Page Readability Detector"; cmd = "npm.cmd run agent:page-readability" },
      @{ id = "today_content_quality"; label = "Today Content Quality Detector"; cmd = "npm.cmd run agent:today-content-quality" },
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
      @{ id = "company_intel_agent_backlog"; label = "Company Intel Agent Backlog Agent"; cmd = "npm.cmd run agent:company-intel-agent-backlog" }
    )
  },
  @{
    id = "outputs"
    label = "Outputs"
    goal = "Validate app surfaces and build external-facing presentation outputs."
    steps = @(
      @{ id = "connectivity_verify"; label = "Connectivity QA Agent"; cmd = "npm.cmd run verify:connectivity" },
      @{ id = "presentations_build"; label = "Presentation Build Agent"; cmd = "npm.cmd run presentations:build" }
    )
  }
)

$requestedStages = @()
if ($Stages) {
  $requestedStages = $Stages | Where-Object { $_ } | ForEach-Object { $_.Trim().ToLower() } | Where-Object { $_ }
}

$selectedStages = if ($requestedStages.Count -gt 0) {
  $allStages | Where-Object { $requestedStages -contains ([string]$_["id"]).ToLower() }
} else {
  $allStages
}

$stageResults = @()
$allStepResults = @()
$stageIndex = 0

foreach ($stage in $selectedStages) {
  $stageIndex += 1
  $stageStart = Get-Date
  $stepResults = @()
  $stageStatus = "ok"

  foreach ($step in @($stage["steps"])) {
    $result = Invoke-Step -Step $step
    $stepResults += $result
    $allStepResults += $result

    if ($result.status -eq "failed") {
      $stageStatus = "failed"
      if ($FailFast) { break }
    } elseif ($stageStatus -ne "failed") {
      $stageStatus = "ok"
    }
  }

  $stageEnd = Get-Date
  $metrics = Get-StageMetrics -RootPath $root
  $failedCount = ($stepResults | Where-Object { $_.status -eq "failed" }).Count
  if ($failedCount -gt 0 -and $stepResults.Count -gt $failedCount) {
    $stageStatus = "partial-failure"
  }

  $stageResults += [pscustomobject]@{
    id = $stage["id"]
    label = $stage["label"]
    goal = $stage["goal"]
    status = $stageStatus
    stageIndex = $stageIndex
    startedAt = $stageStart.ToString("o")
    finishedAt = $stageEnd.ToString("o")
    durationMs = [int][Math]::Round(($stageEnd - $stageStart).TotalMilliseconds)
    stepCount = $stepResults.Count
    failedSteps = $failedCount
    steps = $stepResults
    metrics = $metrics
  }

  if ($FailFast -and $stageStatus -in @("failed", "partial-failure")) {
    break
  }
}

$failedStages = ($stageResults | Where-Object { $_.status -in @("failed", "partial-failure") }).Count
$overall = if ($failedStages -eq 0) { "ok" } elseif ($failedStages -lt $stageResults.Count) { "partial-failure" } else { "failed" }

$report = [pscustomobject]@{
  generatedAt = (Get-Date).ToString("o")
  runMode = if ($FailFast) { "fail-fast" } else { "continue-on-failure" }
  framework = [pscustomobject]@{
    stages = $selectedStages | ForEach-Object { $_["id"] }
    reviewLayer = "Codex review occurs after detect/output stages using queues and backlogs; runner does not auto-patch."
  }
  overallStatus = $overall
  summary = [pscustomobject]@{
    stageCount = $stageResults.Count
    failedStages = $failedStages
    stepCount = $allStepResults.Count
    failedSteps = ($allStepResults | Where-Object { $_.status -eq "failed" }).Count
    topAnomalies = @(
      $stageResults |
        ForEach-Object { @($_.metrics.anomalies) } |
        Where-Object { $_ } |
        Select-Object -Unique |
        Select-Object -First 8
    )
  }
  stages = $stageResults
}

$json = $report | ConvertTo-Json -Depth 12
$enc = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($outPath, $json, $enc)

Write-Output $outPath
