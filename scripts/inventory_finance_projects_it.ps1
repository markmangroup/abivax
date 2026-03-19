param(
  [string]$Root = "O:\Commun\Support\Finance projects- IT",
  [string]$OutputDir = "data/abivax/source-docs/finance-projects-it-inventory-2026-03-19"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-LanguageGuess {
  param([string]$Text)

  if ([string]::IsNullOrWhiteSpace($Text)) {
    return "unknown"
  }

  $frenchHints = @(
    "procédure", "etapes", "étapes", "saisie", "facture", "achat", "paiement",
    "virement", "compta", "comptabilité", "fournisseur", "banque", "réunion",
    "annexe", "justificatif", "tresorerie", "trésorerie", "contrat"
  )

  foreach ($hint in $frenchHints) {
    if ($Text.ToLowerInvariant().Contains($hint)) {
      return "french-likely"
    }
  }

  return "english-or-mixed"
}

function Get-DocType {
  param([string]$Name, [string]$Extension)

  $lower = $Name.ToLowerInvariant()

  if ($lower -match "sop|procedure|procédure|process|workflow|guide|manuel|manual") { return "process-doc" }
  if ($lower -match "matrix|matrice|raci|approval|signature|delegation|authority|policy") { return "policy-matrix" }
  if ($lower -match "control|sox|rcm|risk") { return "controls" }
  if ($lower -match "mapping|dictionary|master data|supplier|vendor|chart|coa") { return "master-data" }
  if ($lower -match "project plan|plan|tracker|actions|raid|governance|steering") { return "program-doc" }
  if ($lower -match "interface|integration|api|agicap|trustpair|concur|lucca|adp") { return "integration-doc" }
  if ($lower -match "payment|virement|cash|bank|treasury|trésorerie|trésorerie") { return "treasury-doc" }
  if ($Extension -in @(".xlsx", ".xls", ".xlsb", ".csv")) { return "workbook" }
  if ($Extension -in @(".ppt", ".pptx")) { return "deck" }
  if ($Extension -in @(".pdf", ".doc", ".docx")) { return "document" }
  return "other"
}

function Get-PillarTags {
  param([string]$Text)

  $lower = $Text.ToLowerInvariant()
  $tags = New-Object System.Collections.Generic.List[string]

  if ($lower -match "p2p|ptp|procure|purchase|invoice|vendor|supplier|docushare|ap|achat|facture|fournisseur") { $tags.Add("p2p") }
  if ($lower -match "r2r|record|close|gl|general ledger|fixed asset|bank rec|reconciliation|compta") { $tags.Add("record-to-report") }
  if ($lower -match "report|planning|budget|forecast|fp&a|consolidation|adaptive") { $tags.Add("reporting-planning") }
  if ($lower -match "sox|control|sod|risk|audit|rcm") { $tags.Add("controls") }
  if ($lower -match "master data|supplier|vendor|customer|chart|coa") { $tags.Add("master-data") }
  if ($lower -match "integration|interface|api|agicap|trustpair|concur|lucca|adp|workday") { $tags.Add("integrations") }
  if ($lower -match "treasury|cash|payment|bank|virement") { $tags.Add("treasury") }
  if ($lower -match "change|training|communication|adoption") { $tags.Add("change") }
  if ($lower -match "governance|project plan|steering|raid|workshop") { $tags.Add("program-governance") }
  if ($lower -match "otc|order to cash|customer|billing|ar") { $tags.Add("order-to-cash") }
  if ($lower -match "inventory|stock|item master") { $tags.Add("inventory") }

  return ($tags | Select-Object -Unique)
}

function Get-Relevance {
  param(
    [string]$Name,
    [string]$RelativePath,
    [string]$DocType,
    [string]$Extension,
    [double]$SizeKb,
    [datetime]$LastWriteTime
  )

  $score = 0
  $lower = ($RelativePath + "\" + $Name).ToLowerInvariant()

  switch ($DocType) {
    "process-doc" { $score += 35 }
    "policy-matrix" { $score += 35 }
    "controls" { $score += 32 }
    "master-data" { $score += 28 }
    "integration-doc" { $score += 28 }
    "treasury-doc" { $score += 24 }
    "program-doc" { $score += 18 }
    "workbook" { $score += 12 }
    "deck" { $score += 8 }
    default { $score += 4 }
  }

  foreach ($hint in @("final", "approved", "effective", "v1", "v2", "v3", "current", "maj")) {
    if ($lower.Contains($hint)) { $score += 4 }
  }

  foreach ($hint in @("draft", "old", "backup", "~$", "test", "temp", "archive")) {
    if ($lower.Contains($hint)) { $score -= 10 }
  }

  foreach ($hint in @("erp", "finance", "support", "project")) {
    if ($lower.Contains($hint)) { $score += 3 }
  }

  if ($LastWriteTime -ge (Get-Date "2025-01-01")) { $score += 8 }
  elseif ($LastWriteTime -lt (Get-Date "2022-01-01")) { $score -= 6 }

  if ($SizeKb -lt 10) { $score -= 4 }
  elseif ($SizeKb -gt 100 -and $DocType -in @("process-doc", "policy-matrix", "controls", "master-data")) { $score += 4 }

  if ($score -ge 50) { return @{ Score = $score; Bucket = "core-source"; Action = "deep-review" } }
  if ($score -ge 32) { return @{ Score = $score; Bucket = "supporting-evidence"; Action = "targeted-review" } }
  if ($score -ge 18) { return @{ Score = $score; Bucket = "archive-only"; Action = "hold" } }
  return @{ Score = $score; Bucket = "ignore"; Action = "skip" }
}

if (-not (Test-Path -LiteralPath $Root)) {
  throw "Root path not found: $Root"
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$items = Get-ChildItem -LiteralPath $Root -Recurse -Force -File
$rootPath = (Resolve-Path -LiteralPath $Root).Path
$files = foreach ($item in $items) {
  $relativeDir = Split-Path -Path $item.FullName.Substring($rootPath.Length).TrimStart('\') -Parent
  $language = Get-LanguageGuess -Text ($item.Name + " " + $relativeDir)
  $docType = Get-DocType -Name $item.Name -Extension $item.Extension.ToLowerInvariant()
  $tags = Get-PillarTags -Text ($item.Name + " " + $relativeDir)
  $relevance = Get-Relevance -Name $item.Name -RelativePath $relativeDir -DocType $docType -Extension $item.Extension.ToLowerInvariant() -SizeKb ([math]::Round($item.Length / 1kb, 1)) -LastWriteTime $item.LastWriteTime

  [pscustomobject]@{
    root = $Root
    fullPath = $item.FullName
    relativeDir = $relativeDir
    fileName = $item.Name
    extension = $item.Extension.ToLowerInvariant()
    sizeBytes = $item.Length
    sizeKb = [math]::Round($item.Length / 1kb, 1)
    lastWriteTime = $item.LastWriteTime.ToString("s")
    year = $item.LastWriteTime.Year
    languageGuess = $language
    docType = $docType
    pillarTags = @($tags)
    relevanceScore = $relevance.Score
    relevanceBucket = $relevance.Bucket
    suggestedAction = $relevance.Action
  }
}

$filesPathJson = Join-Path $OutputDir "files.json"
$filesPathCsv = Join-Path $OutputDir "files.csv"
$summaryPathJson = Join-Path $OutputDir "summary.json"
$shortlistPathJson = Join-Path $OutputDir "shortlist.json"
$shortlistPathMd = Join-Path $OutputDir "shortlist.md"

$files | ConvertTo-Json -Depth 6 | Set-Content -Path $filesPathJson -Encoding UTF8
$files | Export-Csv -Path $filesPathCsv -NoTypeInformation -Encoding UTF8

$folderSummary = $files |
  Group-Object relativeDir |
  ForEach-Object {
    $group = $_.Group
    [pscustomobject]@{
      relativeDir = $_.Name
      fileCount = $group.Count
      coreSourceCount = @($group | Where-Object relevanceBucket -eq "core-source").Count
      supportingCount = @($group | Where-Object relevanceBucket -eq "supporting-evidence").Count
      latestWriteTime = ($group | Sort-Object lastWriteTime -Descending | Select-Object -First 1).lastWriteTime
      topDocTypes = @($group | Group-Object docType | Sort-Object Count -Descending | Select-Object -First 3 | ForEach-Object { $_.Name })
    }
  } | Sort-Object -Property coreSourceCount, supportingCount, fileCount -Descending

$bucketSummary = $files | Group-Object relevanceBucket | ForEach-Object {
  [pscustomobject]@{
    bucket = $_.Name
    fileCount = $_.Count
  }
}

$extensionSummary = $files | Group-Object extension | ForEach-Object {
  [pscustomobject]@{
    extension = $_.Name
    fileCount = $_.Count
  }
} | Sort-Object fileCount -Descending

$pillarSummary = $files |
  ForEach-Object { $_.pillarTags } |
  Where-Object { $_ } |
  Group-Object |
  ForEach-Object {
    [pscustomobject]@{
      pillar = $_.Name
      fileCount = $_.Count
    }
  } | Sort-Object fileCount -Descending

$shortlist = $files |
  Where-Object { $_.relevanceBucket -in @("core-source", "supporting-evidence") } |
  Sort-Object -Property relevanceScore, lastWriteTime -Descending |
  Select-Object -First 150

$summary = [pscustomobject]@{
  generatedAt = (Get-Date).ToString("s")
  root = $Root
  totalFiles = $files.Count
  bucketSummary = @($bucketSummary)
  extensionSummary = @($extensionSummary)
  pillarSummary = @($pillarSummary)
  topFolders = @($folderSummary | Select-Object -First 40)
}

$summary | ConvertTo-Json -Depth 6 | Set-Content -Path $summaryPathJson -Encoding UTF8
$shortlist | ConvertTo-Json -Depth 6 | Set-Content -Path $shortlistPathJson -Encoding UTF8

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("# Finance Projects-IT Inventory Shortlist")
$lines.Add("")
$lines.Add("Generated: " + (Get-Date).ToString("yyyy-MM-dd HH:mm:ss"))
$lines.Add("Root: " + $Root)
$lines.Add("")
$lines.Add("## Summary")
$lines.Add("")
$lines.Add("- Total files: " + $files.Count)
foreach ($bucket in $bucketSummary) {
  $lines.Add("- " + $bucket.bucket + ": " + $bucket.fileCount)
}
$lines.Add("")
$lines.Add("## Top folders by likely value")
$lines.Add("")
foreach ($folder in ($folderSummary | Select-Object -First 15)) {
  $lines.Add("- " + $folder.relativeDir + " | files: " + $folder.fileCount + " | core: " + $folder.coreSourceCount + " | supporting: " + $folder.supportingCount)
}
$lines.Add("")
$lines.Add("## Top files to review first")
$lines.Add("")
foreach ($file in ($shortlist | Select-Object -First 40)) {
  $tagText = if ($file.pillarTags.Count -gt 0) { ($file.pillarTags -join ", ") } else { "unclassified" }
  $pathText = if ([string]::IsNullOrWhiteSpace($file.relativeDir)) { $file.fileName } else { $file.relativeDir + "\" + $file.fileName }
  $lines.Add("- score " + $file.relevanceScore + " | " + $pathText + " | " + $file.docType + " | " + $tagText)
}

Set-Content -Path $shortlistPathMd -Value $lines -Encoding UTF8

Write-Host "Inventory complete."
Write-Host ("Files indexed: {0}" -f $files.Count)
Write-Host ("Output: {0}" -f (Resolve-Path -LiteralPath $OutputDir))
