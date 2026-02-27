$ErrorActionPreference = "Stop"

$scriptPath = Join-Path $PSScriptRoot "export_recent_emails.ps1"

powershell -ExecutionPolicy Bypass -File $scriptPath `
  -DaysBack 7 `
  -MaxItems 400 `
  -SaveAttachments `
  -AttachmentSenderContains "Youness" `
  -AttachmentSubjectContains "SOX findings and reporting process documentation"

