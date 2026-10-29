$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$secretDir = Join-Path $root '.local-secrets'
$configFile = Join-Path $secretDir 'config.json'
$qqSecretFile = Join-Path $secretDir 'qqbot-secret.dpapi'
$llmKeyFile = Join-Path $secretDir 'llm-api-key.dpapi'

foreach ($path in @($configFile, $qqSecretFile, $llmKeyFile)) {
  if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw "missing local secret file: $path" }
}
$config = Get-Content -LiteralPath $configFile -Raw | ConvertFrom-Json
if ($config.format -ne 'dpapi-v2') { throw 'config format is not dpapi-v2' }
foreach ($name in @('appId', 'provider', 'model', 'baseUrl')) {
  if ([string]::IsNullOrWhiteSpace([string]$config.$name)) { throw "config field is empty: $name" }
}
if ([string]$config.baseUrl -notmatch '^https://') { throw 'baseUrl must use HTTPS' }
foreach ($path in @($qqSecretFile, $llmKeyFile)) {
  $encoded = (Get-Content -LiteralPath $path -Raw).Trim()
  $protected = [Convert]::FromBase64String($encoded)
  if ($protected.Length -lt 32) { throw "DPAPI payload is unexpectedly short: $([IO.Path]::GetFileName($path))" }
}
Write-Host 'PASS local secrets: config and DPAPI payload structure are valid; secret values were not printed.'
