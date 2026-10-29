$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$secretDir = Join-Path $root '.local-secrets'
New-Item -ItemType Directory -Force -Path $secretDir | Out-Null
Add-Type -AssemblyName System.Security.Cryptography.ProtectedData
function Protect-Text([string]$Text) {
  $bytes = [Text.Encoding]::UTF8.GetBytes($Text)
  $protected = [Security.Cryptography.ProtectedData]::Protect($bytes, $null, [Security.Cryptography.DataProtectionScope]::CurrentUser)
  return [Convert]::ToBase64String($protected)
}
function Save-ProtectedSecret([string]$Name, [string]$Prompt) {
  $secure = Read-Host -Prompt $Prompt -AsSecureString
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try {
    $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    Protect-Text $plain | Set-Content -LiteralPath (Join-Path $secretDir "$Name.dpapi") -Encoding ASCII
  } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}
$existingConfigFile = Join-Path $secretDir 'config.json'
$existing = if (Test-Path $existingConfigFile) { Get-Content $existingConfigFile -Raw | ConvertFrom-Json } else { $null }
$config = [ordered]@{
  format = 'dpapi-v2'
  appId = if ($existing -and $existing.appId) { [string]$existing.appId } else { (Read-Host 'QQ Bot AppID').Trim() }
  provider = if ($existing -and $existing.provider) { [string]$existing.provider } else { (Read-Host 'LLM provider route (default: relay)').Trim() }
  model = if ($existing -and $existing.model) { [string]$existing.model } else { (Read-Host 'LLM model (default: deepseek-chat)').Trim() }
  baseUrl = if ($existing -and $existing.baseUrl) { [string]$existing.baseUrl } else { (Read-Host 'OpenAI-compatible Base URL (default: https://api.deepseek.com/v1)').Trim().TrimEnd('/') }
}
if ([string]::IsNullOrWhiteSpace($config.provider)) { $config.provider = 'relay' }
if ([string]::IsNullOrWhiteSpace($config.model)) { $config.model = 'deepseek-chat' }
if ([string]::IsNullOrWhiteSpace($config.baseUrl)) { $config.baseUrl = 'https://api.deepseek.com/v1' }
$config | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $secretDir 'config.json') -Encoding UTF8
Save-ProtectedSecret 'qqbot-secret' 'QQ Bot AppSecret'
Save-ProtectedSecret 'llm-api-key' 'LLM API Key (relay or provider key)'
Write-Host "Encrypted local config saved: $secretDir"
Write-Host 'Run .\start-live.ps1 next time; credentials will be loaded automatically.'

