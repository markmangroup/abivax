$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$dataPath = Join-Path $root "data\abivax\presentations.json"
$diagramPayloadPath = Join-Path $root "data\abivax\process_flow_diagram_payloads.json"
$outDir = Join-Path $root "outputs\presentations"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

if (-not (Test-Path $dataPath)) {
  throw "Missing presentations data file: $dataPath"
}

$data = Get-Content -Raw -Path $dataPath | ConvertFrom-Json
$diagramPayloads = $null
if (Test-Path $diagramPayloadPath) {
  try {
    $diagramPayloads = Get-Content -Raw -Path $diagramPayloadPath | ConvertFrom-Json
  } catch {
    $diagramPayloads = $null
  }
}

function New-Bullets {
  param(
    [Parameter(Mandatory = $true)]
    $shape,
    [Parameter(Mandatory = $true)]
    [string[]]$lines
  )
  $tf = $shape.TextFrame.TextRange
  $tf.Text = ""
  if ($lines.Count -eq 0) {
    $tf.Text = "-"
    return
  }
  $joined = ($lines | Where-Object { $_ -and $_.Trim().Length -gt 0 }) -join "`r`n"
  if ([string]::IsNullOrWhiteSpace($joined)) {
    $joined = "-"
  }
  $tf.Text = $joined
  $tf.ParagraphFormat.Bullet.Visible = -1
}

function Apply-BrandStyle {
  param(
    [Parameter(Mandatory = $true)]
    $slide,
    [string]$title = "",
    [string[]]$bullets = @(),
    [string]$subtitle = ""
  )

  $titleShape = $slide.Shapes.Title
  if ($titleShape) {
    $titleShape.TextFrame.TextRange.Text = $title
    $titleShape.TextFrame.TextRange.Font.Name = "Calibri"
    $titleShape.TextFrame.TextRange.Font.Size = 34
    $titleShape.TextFrame.TextRange.Font.Bold = -1
    $titleShape.TextFrame.TextRange.Font.Color.RGB = 16777215
  }

  $accent = $slide.Shapes.AddShape(1, 0, 0, 960, 10)
  $accent.Fill.ForeColor.RGB = 47656
  $accent.Line.Visible = 0

  if ($slide.Layout -eq 2 -and $slide.Shapes.Count -ge 2) {
    $body = $slide.Shapes.Item(2)
    New-Bullets -shape $body -lines $bullets
    $body.TextFrame.TextRange.Font.Name = "Calibri"
    $body.TextFrame.TextRange.Font.Size = 22
    $body.TextFrame.TextRange.Font.Color.RGB = 15790320
    if ($subtitle) {
      $sub = $slide.Shapes.AddTextbox(1, 55, 92, 860, 30)
      $sub.TextFrame.TextRange.Text = $subtitle
      $sub.TextFrame.TextRange.Font.Name = "Calibri"
      $sub.TextFrame.TextRange.Font.Size = 14
      $sub.TextFrame.TextRange.Font.Color.RGB = 10066329
      $sub.Line.Visible = 0
      $sub.Fill.Visible = 0
    }
  }
}

function Get-ProcessDiagramPayload {
  param(
    [Parameter(Mandatory = $true)] $diagramData,
    [Parameter(Mandatory = $true)] [string] $flowId
  )
  if (-not $diagramData -or -not $diagramData.payloads) { return $null }
  return @($diagramData.payloads) | Where-Object { $_.flowId -eq $flowId } | Select-Object -First 1
}

function Resolve-ProcessVisualFlowIds {
  param(
    [Parameter(Mandatory = $true)] $deck,
    [Parameter(Mandatory = $true)] $item
  )

  $notes = ""
  if ($null -ne $item.notes) { $notes = [string]$item.notes }
  $visual = ""
  if ($null -ne $item.visual) { $visual = [string]$item.visual }
  $text = ($notes + " " + $visual).ToLowerInvariant()
  $ids = New-Object System.Collections.Generic.List[string]

  if ($text.Contains("france p2p") -or $text.Contains("p2p")) {
    $ids.Add("p2p-france-current-to-future")
  }
  if ($text.Contains("reporting/fp&a") -or $text.Contains("reporting / fp&a") -or $text.Contains("reporting")) {
    $ids.Add("reporting-fpa-bridge-current-to-future")
  }
  if ($text.Contains("controls/remediation") -or $text.Contains("controls / auditability") -or $text.Contains("control-by-design")) {
    $ids.Add("controls-remediation-current-to-future")
  }

  # Common fallback for the living deck baseline slide
  if ($ids.Count -eq 0 -and $deck.id -eq "exec-erp-program-backbone-living" -and $item.id -eq "exec-slide-3") {
    $ids.Add("p2p-france-current-to-future")
    $ids.Add("reporting-fpa-bridge-current-to-future")
  }

  return @($ids | Select-Object -Unique)
}

function Add-ProcessVisualSummary {
  param(
    [Parameter(Mandatory = $true)] $slide,
    [Parameter(Mandatory = $true)] $payloads
  )
  if (-not $payloads -or @($payloads).Count -eq 0) { return }

  $left = 520
  $top = 120
  $width = 380
  $height = 210

  $panel = $slide.Shapes.AddShape(1, $left, $top, $width, $height)
  $panel.Fill.ForeColor.RGB = 2500134
  $panel.Fill.Transparency = 0.08
  $panel.Line.ForeColor.RGB = 5592405

  $text = $slide.Shapes.AddTextbox(1, $left + 10, $top + 8, $width - 20, $height - 16)
  $lines = New-Object System.Collections.Generic.List[string]
  $lines.Add("Process Visual Summary (source-backed)")
  foreach ($p in (@($payloads) | Select-Object -First 2)) {
    if (-not $p) { continue }
    $steps = @($p.nodes | Where-Object { $_.type -eq "step" } | Sort-Object stepIndex)
    $clusters = @($p.nodes | Where-Object { $_.type -eq "control-cluster" })
    $stepNames = @($steps | Select-Object -First 3 | ForEach-Object { [string]$_.label })
    $clusterLabels = @($clusters | Select-Object -First 2 | ForEach-Object { [string]$_.label + ($(if ($_.subtitle) { " | " + [string]$_.subtitle } else { "" })) })
    $lines.Add("")
    $lines.Add([string]$p.title)
    if ($stepNames.Count -gt 0) { $lines.Add("Steps: " + ($stepNames -join " -> ")) }
    $lines.Add("Control overlays: " + (($clusters | Measure-Object).Count))
    foreach ($cl in $clusterLabels) { $lines.Add(" - " + $cl) }
  }
  $text.TextFrame.TextRange.Text = ($lines -join "`r`n")
  $text.TextFrame.TextRange.Font.Name = "Calibri"
  $text.TextFrame.TextRange.Font.Size = 10
  $text.TextFrame.TextRange.Font.Color.RGB = 15790320
  $text.Line.Visible = 0
  $text.Fill.Visible = 0
}

$created = @()

foreach ($deck in $data.presentations) {
  $ppt = $null
  $presentation = $null
  try {
    $ppt = New-Object -ComObject PowerPoint.Application
    $ppt.Visible = 1
    $presentation = $ppt.Presentations.Add()
    $presentation.PageSetup.SlideSize = 16 # widescreen

    # Title slide
    $slide = $presentation.Slides.Add(1, 1)
    $slide.Shapes.Title.TextFrame.TextRange.Text = [string]$deck.title
    $slide.Shapes.Item(2).TextFrame.TextRange.Text = "$($deck.audience) | $($deck.meetingDate)`r`nOwner: $($deck.owner)"
    $slide.FollowMasterBackground = 0
    $slide.Background.Fill.ForeColor.RGB = 1842204
    $slide.Shapes.Title.TextFrame.TextRange.Font.Name = "Calibri"
    $slide.Shapes.Title.TextFrame.TextRange.Font.Size = 42
    $slide.Shapes.Title.TextFrame.TextRange.Font.Bold = -1
    $slide.Shapes.Title.TextFrame.TextRange.Font.Color.RGB = 16777215
    $slide.Shapes.Item(2).TextFrame.TextRange.Font.Name = "Calibri"
    $slide.Shapes.Item(2).TextFrame.TextRange.Font.Size = 18
    $slide.Shapes.Item(2).TextFrame.TextRange.Font.Color.RGB = 14606046

    # Strategy frame
    $slide = $presentation.Slides.Add($presentation.Slides.Count + 1, 2)
    $slide.FollowMasterBackground = 0
    $slide.Background.Fill.ForeColor.RGB = 1842204
    $messages = @([string]$deck.objective) + @($deck.keyMessages | Select-Object -First 3)
    Apply-BrandStyle -slide $slide -title "Executive Frame" -subtitle "$($deck.audience) focus" -bullets $messages

    # Slide-plan-driven content
    foreach ($item in $deck.slidePlan) {
      $slide = $presentation.Slides.Add($presentation.Slides.Count + 1, 2)
      $slide.FollowMasterBackground = 0
      $slide.Background.Fill.ForeColor.RGB = 1842204
      $lines = @($item.content)
      if ($lines.Count -eq 0) {
        $lines = @($item.notes)
      }
      Apply-BrandStyle -slide $slide -title $item.title -subtitle "$($item.section) | Visual: $($item.visual)" -bullets ($lines | Select-Object -First 5)

      $flowIds = Resolve-ProcessVisualFlowIds -deck $deck -item $item
      $allowProcessVisualInjection = @("board-erp-readout-20260319") -contains [string]$deck.id
      if ($allowProcessVisualInjection -and $flowIds.Count -gt 0 -and $diagramPayloads) {
        $payloadsForSlide = @()
        foreach ($fid in $flowIds) {
          $dp = Get-ProcessDiagramPayload -diagramData $diagramPayloads -flowId $fid
          if ($dp) { $payloadsForSlide += $dp }
        }
        if ($payloadsForSlide.Count -gt 0) {
          try {
            Add-ProcessVisualSummary -slide $slide -payloads $payloadsForSlide
          } catch {
            Write-Warning "Process visual summary skipped on slide '$($item.id)' in deck '$($deck.id)': $($_.Exception.Message)"
          }
        }
      }
    }

    # Executive close
    $slide = $presentation.Slides.Add($presentation.Slides.Count + 1, 2)
    $slide.FollowMasterBackground = 0
    $slide.Background.Fill.ForeColor.RGB = 1842204
    $closeLines = @()
    if ($deck.audience -match "Audit") {
      $closeLines = @(
        "Confirm control-by-design standard for ERP blueprint",
        "Confirm owner and due-date accountability on top gaps",
        "Confirm monthly remediation reporting cadence",
        "Escalate slippage on critical controls within 5 business days"
      )
      Apply-BrandStyle -slide $slide -title "Audit Committee Decision" -subtitle "Approval and governance asks" -bullets $closeLines
    } else {
      $closeLines = @(
        "Confirm selection direction and implementation posture",
        "Confirm staffing commitments for design/build/cutover",
        "Confirm governance cadence through go-live",
        "Authorize immediate closure of critical execution risks"
      )
      Apply-BrandStyle -slide $slide -title "Board Decision and Actions" -subtitle "Approval and governance asks" -bullets $closeLines
    }

    $safeName = ([string]$deck.title) -replace '[\\/:*?"<>|]', '-'
    $outPath = Join-Path $outDir "$safeName.pptx"
    $presentation.SaveAs($outPath, 24)
    $presentation.Close()
    $created += $outPath
  } catch {
    Write-Warning "Deck generation failed for '$($deck.title)': $($_.Exception.Message)"
    if ($presentation) {
      try { $presentation.Close() } catch {}
    }
  } finally {
    if ($ppt) {
      try {
        $ppt.Quit()
      } catch {
        Write-Warning "PowerPoint COM quit failed: $($_.Exception.Message)"
      }
    }
  }
}

$created | ForEach-Object { Write-Output $_ }
