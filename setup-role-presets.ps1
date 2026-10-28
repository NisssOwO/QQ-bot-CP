$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$profile = Join-Path $root '.dsh-home\profiles\qqbot'
$source = Join-Path $root 'plugins\role-presets'
$target = Join-Path $profile 'node_modules\@shiny-colors\role-presets'
if (-not (Test-Path -LiteralPath $profile)) { throw "qqbot profile does not exist; run setup-p0.ps1 first" }
New-Item -ItemType Directory -Force -Path $target | Out-Null
Copy-Item -LiteralPath (Join-Path $source 'package.json') -Destination (Join-Path $target 'package.json') -Force
Copy-Item -LiteralPath (Join-Path $source 'index.js') -Destination (Join-Path $target 'index.js') -Force
Write-Host "role-presets service ready: $target"
