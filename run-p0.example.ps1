$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

# Set secrets only in this local shell. Do not commit them.
# $env:QQBOT_APPID = '...'
# $env:QQBOT_SECRET = '...'
# $env:LLM_API_KEY = '...'
$env:DSH_HOME = Join-Path $root '.dsh-home'
$env:DSH_PRESET_ROOT = Join-Path $root 'presets'
$env:DSH_CWD = $root

$profilePatch = Join-Path $root 'cordis.nanoka-direct-prompt.patch.yml'
$activePatch = Join-Path $env:DSH_HOME 'profiles\qqbot\cordis.patch.yml'
if (-not (Test-Path -LiteralPath $activePatch)) {
  Copy-Item -LiteralPath $profilePatch -Destination $activePatch
  Write-Host "Installed fallback patch: $activePatch"
}

& (Join-Path $root 'setup-role-presets.ps1')
& (Join-Path $root 'preflight-p0.ps1')
Write-Host "DSH_HOME=$env:DSH_HOME"
Write-Host "DSH_PRESET_ROOT=$env:DSH_PRESET_ROOT"
Write-Host ''
Write-Host 'Offline config check:'
Write-Host '  & .\node_modules\.bin\dsh.cmd --profile qqbot --dump-config'
Write-Host ''
Write-Host 'After setting local credentials, start:'
Write-Host '  $env:QQBOT_APPID = "your AppID"'
Write-Host '  $env:QQBOT_SECRET = "your AppSecret"'
Write-Host '  $env:LLM_PROVIDER = "relay"'
Write-Host '  $env:LLM_MODEL = "deepseek-chat"'
Write-Host '  $env:LLM_BASE_URL = "https://your-relay.example/v1"'
Write-Host '  $env:LLM_API_KEY = "your relay key"'
Write-Host '  & .\node_modules\.bin\dsh.cmd --profile qqbot'
Write-Host ''
Write-Host 'The profile now uses the workspace-local role-presets service and the built-in /preset command.'



