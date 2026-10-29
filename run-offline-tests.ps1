$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root
$temp = Join-Path $root '.tmp-tests-f'
New-Item -ItemType Directory -Force -Path $temp | Out-Null
$env:TEMP = $temp
$env:TMP = $temp
try {
  node .\validate-presets.mjs
  $tests = Get-ChildItem -LiteralPath (Join-Path $root 'runtime') -Filter 'test-*.mjs' | Sort-Object Name
  foreach ($test in $tests) {
    node $test.FullName
    if ($LASTEXITCODE -ne 0) { throw "test failed: $($test.Name)" }
  }
  Write-Host "PASS all offline tests ($($tests.Count) runtime files)"
} finally {
  if (Test-Path -LiteralPath $temp) { Remove-Item -LiteralPath $temp -Recurse -Force -ErrorAction SilentlyContinue }
}
