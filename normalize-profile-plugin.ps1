$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$profilePkg = Join-Path $root '.dsh-home\profiles\qqbot\node_modules\@tencent-connect\dsh-qqbot'
$workspacePkg = Join-Path $root 'node_modules\@tencent-connect\dsh-qqbot'
if (-not (Test-Path -LiteralPath $workspacePkg)) { throw "workspace dsh-qqbot package not found: $workspacePkg" }
if (-not (Test-Path -LiteralPath $profilePkg)) { Write-Host 'profile dsh-qqbot package not installed; skip link normalization'; exit 0 }
$item = Get-Item -LiteralPath $profilePkg -Force
if ($item.LinkType -eq 'Junction') {
  Write-Host 'profile dsh-qqbot link already normalized'
  exit 0
}
$backup = "$profilePkg.profile-copy"
if (Test-Path -LiteralPath $backup) { throw "profile backup already exists; review it before relinking: $backup" }
Move-Item -LiteralPath $profilePkg -Destination $backup
New-Item -ItemType Junction -Path $profilePkg -Target $workspacePkg | Out-Null
Write-Host "normalized profile dsh-qqbot package to workspace link; backup=$backup"
