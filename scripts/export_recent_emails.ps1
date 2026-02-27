param(
  [int]$DaysBack = 2,
  [int]$MaxItems = 300,
  [switch]$SaveAttachments,
  [string]$AttachmentSenderContains = "",
  [string]$AttachmentSubjectContains = ""
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$tempDir = Join-Path $root "temp"
$outPath = Join-Path $tempDir "recent-emails.json"
$attachmentRoot = Join-Path $tempDir "recent-email-attachments"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
if ($SaveAttachments) {
  New-Item -ItemType Directory -Path $attachmentRoot -Force | Out-Null
}

function Normalize-Slug([string]$value) {
  if ([string]::IsNullOrWhiteSpace($value)) { return "untitled" }
  $v = $value -replace '[^a-zA-Z0-9\-_ ]', ''
  $v = ($v -replace '\s+', ' ').Trim()
  if ($v.Length -gt 80) { $v = $v.Substring(0, 80) }
  if ([string]::IsNullOrWhiteSpace($v)) { return "untitled" }
  return ($v -replace ' ', '_')
}

try {
  $outlook = New-Object -ComObject Outlook.Application
  $ns = $outlook.GetNamespace("MAPI")
  $inbox = $ns.GetDefaultFolder(6)
  $items = $inbox.Items
  $items.Sort("[ReceivedTime]", $true)

  $cutoff = (Get-Date).Date.AddDays(-1 * $DaysBack)
  $rows = @()

  foreach ($m in $items) {
    if ($rows.Count -ge $MaxItems) { break }
    if ($null -eq $m) { continue }
    if ($m.Class -ne 43) { continue } # MailItem
    if ($m.ReceivedTime -lt $cutoff) { break }

    $sender = [string]$m.SenderName
    $senderEmail = ""
    try { $senderEmail = [string]$m.SenderEmailAddress } catch {}

    $attachments = @()
    $savedAttachmentPaths = @()
    try {
      for ($i = 1; $i -le $m.Attachments.Count; $i++) {
        $att = $m.Attachments.Item($i)
        $fileName = [string]$att.FileName
        $attachments += $fileName

        if ($SaveAttachments) {
          $senderMatch = [string]::IsNullOrWhiteSpace($AttachmentSenderContains) -or ($sender -like "*$AttachmentSenderContains*")
          $subjectMatch = [string]::IsNullOrWhiteSpace($AttachmentSubjectContains) -or ([string]$m.Subject -like "*$AttachmentSubjectContains*")
          if ($senderMatch -and $subjectMatch) {
            $stamp = ""
            try { $stamp = (Get-Date $m.ReceivedTime).ToString("yyyyMMdd-HHmmss") } catch { $stamp = (Get-Date).ToString("yyyyMMdd-HHmmss") }
            $folderName = "{0} - {1}" -f $stamp, (Normalize-Slug([string]$m.Subject))
            $targetDir = Join-Path $attachmentRoot $folderName
            New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
            $targetPath = Join-Path $targetDir $fileName
            try {
              $att.SaveAsFile($targetPath)
              $savedAttachmentPaths += [string](Resolve-Path $targetPath)
            } catch {
              # ignore individual attachment save errors
            }
          }
        }
      }
    } catch {}

    $bodyPreview = ""
    $links = @()
    try {
      $bodyText = [string]$m.Body
      if ($bodyText) {
        $bodyPreview = ($bodyText -replace "\s+", " ").Trim()
        if ($bodyPreview.Length -gt 600) {
          $bodyPreview = $bodyPreview.Substring(0, 600)
        }
        $matches = [System.Text.RegularExpressions.Regex]::Matches($bodyText, 'https?://[^\s<>"'']+')
        foreach ($match in $matches) {
          if ($links.Count -ge 5) { break }
          $url = [string]$match.Value
          if (-not [string]::IsNullOrWhiteSpace($url) -and -not ($links -contains $url)) {
            $links += $url
          }
        }
      }
    } catch {}

    $rows += [pscustomobject]@{
      received = (Get-Date $m.ReceivedTime).ToString("o")
      senderName = $sender
      senderEmail = $senderEmail
      subject = [string]$m.Subject
      to = [string]$m.To
      cc = [string]$m.CC
      hasAttachments = $attachments.Count -gt 0
      attachments = $attachments
      savedAttachments = $savedAttachmentPaths
      bodyPreview = $bodyPreview
      links = $links
    }
  }

  @{ emails = $rows } | ConvertTo-Json -Depth 8 | Set-Content -Path $outPath -Encoding UTF8
  Write-Output $outPath
}
catch {
  @{ emails = @() } | ConvertTo-Json -Depth 4 | Set-Content -Path $outPath -Encoding UTF8
  Write-Output $outPath
}
