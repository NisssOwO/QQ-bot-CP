$ErrorActionPreference = 'Stop'
$androidRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$dir = Join-Path $androidRoot 'runtime-deps'
Set-Location $dir
npm.cmd install --omit=dev --ignore-scripts --no-audit --no-fund
Write-Host "Installed production runtime dependencies under $dir"
