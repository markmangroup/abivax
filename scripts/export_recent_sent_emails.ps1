param(
  [int]$DaysBack = 5,
  [int]$MaxItems = 300
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$tempDir = Join-Path $root "temp"
$outPath = Join-Path $tempDir "recent-sent-emails.json"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

try {
  $outlook = New-Object -ComObject Outlook.Application
  $ns = $outlook.GetNamespace("MAPI")
  $sent = $ns.GetDefaultFolder(5) # olFolderSentMail
  $items = $sent.Items
  $items.Sort("[SentOn]", $true)

  $cutoff = (Get-Date).Date.AddDays(-1 * $DaysBack)
  $rows = @()

  foreach ($m in $items) {
    if ($rows.Count -ge $MaxItems) { break }
    if ($null -eq $m) { continue }
    try { if ($m.Class -ne 43) { continue } } catch { continue } # MailItem
    try { if ($m.SentOn -lt $cutoff) { break } } catch { continue }

    $attachments = @()
    try {
      for ($i = 1; $i -le $m.Attachments.Count; $i++) {
        $attachments += [string]$m.Attachments.Item($i).FileName
      }
    } catch {}

    $rows += [pscustomobject]@{
      sent = (Get-Date $m.SentOn).ToString("o")
      senderName = [string]$m.SenderName
      senderEmail = ""
      subject = [string]$m.Subject
      to = [string]$m.To
      cc = [string]$m.CC
      hasAttachments = $attachments.Count -gt 0
      attachments = $attachments
    }
  }

  @{ emails = $rows } | ConvertTo-Json -Depth 8 | Set-Content -Path $outPath -Encoding UTF8
  Write-Output $outPath
}
catch {
  @{ emails = @() } | ConvertTo-Json -Depth 4 | Set-Content -Path $outPath -Encoding UTF8
  Write-Output $outPath
}

