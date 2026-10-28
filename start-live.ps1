$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root
$secretDir = Join-Path $root '.local-secrets'
$configFile = Join-Path $secretDir 'config.json'
$qqSecretFile = Join-Path $secretDir 'qqbot-secret.dpapi'
$llmKeyFile = Join-Path $secretDir 'llm-api-key.dpapi'
if (-not (Test-Path $configFile) -or -not (Test-Path $qqSecretFile) -or -not (Test-Path $llmKeyFile) -or ((Get-Content $configFile -Raw | ConvertFrom-Json).format -ne 'dpapi-v2')) {
  & (Join-Path $root 'setup-local-secrets.ps1')
}
$config = Get-Content -LiteralPath $configFile -Raw | ConvertFrom-Json
Add-Type -AssemblyName System.Security.Cryptography.ProtectedData
function Read-ProtectedSecret([string]$Path) {
  $protected = [Convert]::FromBase64String((Get-Content -LiteralPath $Path -Raw).Trim())
  $bytes = [Security.Cryptography.ProtectedData]::Unprotect($protected, $null, [Security.Cryptography.DataProtectionScope]::CurrentUser)
  return ([Text.Encoding]::UTF8.GetString($bytes)).Trim()
}
$env:DSH_HOME = Join-Path $root '.dsh-home'
$env:DSH_PRESET_ROOT = Join-Path $root 'presets'
$env:DSH_CWD = $root
try {
  $env:QQBOT_APPID = [string]$config.appId
  $env:QQBOT_SECRET = Read-ProtectedSecret $qqSecretFile
  $env:LLM_PROVIDER = [string]$config.provider
  $env:LLM_MODEL = [string]$config.model
  $env:LLM_BASE_URL = [string]$config.baseUrl
  $env:LLM_API_KEY = Read-ProtectedSecret $llmKeyFile
  & (Join-Path $root 'normalize-profile-plugin.ps1')
  & (Join-Path $root 'setup-role-presets.ps1')
  & (Join-Path $root 'preflight-p0.ps1') --skip-dsh-dump
  if ($LASTEXITCODE -ne 0) { throw 'preflight failed' }
  Write-Host 'Starting official QQ Bot. Press Ctrl+C to stop.'
  & (Join-Path $root 'node_modules\.bin\dsh.cmd') --profile qqbot
  exit $LASTEXITCODE
} finally {
  Remove-Item Env:QQBOT_APPID,Env:QQBOT_SECRET,Env:LLM_PROVIDER,Env:LLM_MODEL,Env:LLM_BASE_URL,Env:LLM_API_KEY -ErrorAction SilentlyContinue
}
