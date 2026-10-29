$ErrorActionPreference = 'Stop'
$skipDshDump = $args -contains '--skip-dsh-dump'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root
$env:DSH_HOME = Join-Path $root '.dsh-home'
$env:DSH_PRESET_ROOT = Join-Path $root 'presets'
$env:DSH_CWD = $root

$nodeVersion = (node --version).TrimStart('v')
if ([version]$nodeVersion -lt [version]'22.19.0') { throw "Node.js $nodeVersion is too old" }
$workspacePkg = Join-Path $root 'node_modules\@tencent-connect\dsh-qqbot'
if (-not (Test-Path -LiteralPath (Join-Path $workspacePkg 'dist\index.js'))) { throw 'workspace dsh-qqbot package is missing' }
$profilePkg = Join-Path $env:DSH_HOME 'profiles\qqbot\node_modules\@tencent-connect\dsh-qqbot'
if (-not (Test-Path -LiteralPath $profilePkg)) { throw 'profile dsh-qqbot package is missing' }
$item = Get-Item -LiteralPath $profilePkg -Force
if ($item.LinkType -ne 'Junction') { throw 'profile dsh-qqbot package is not normalized to a junction' }
$requiredEnv = @('QQBOT_APPID', 'QQBOT_SECRET', 'LLM_API_KEY')
$missing = @($requiredEnv | Where-Object { [string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($_)) })
if (-not $skipDshDump) {
  & .\node_modules\.bin\dsh.cmd --profile qqbot --dump-config *> $null
  if ($LASTEXITCODE -ne 0) { throw 'dsh profile dump-config failed' }
}
node .\runtime\test-role-preset-service.mjs *> $null
if ($LASTEXITCODE -ne 0) { throw 'role preset service check failed' }
Write-Host "PASS offline preflight (Node $nodeVersion)"
if ($missing.Count -gt 0) {
  Write-Host "Missing local environment variables: $($missing -join ', ')"
  Write-Host 'The profile is ready, but real QQ startup is intentionally not attempted.'
} else {
  Write-Host 'All required environment variables are present; run dsh --profile qqbot to start.'
}


