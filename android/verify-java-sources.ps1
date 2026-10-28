$ErrorActionPreference = 'Stop'
$androidRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $androidRoot
$java = Join-Path $androidRoot 'tools\jdk17\jdk-17.0.20+8\bin\javac.exe'
$jar = Join-Path $androidRoot 'tools\sdk\platforms\android-35\android.jar'
$out = Join-Path $androidRoot 'manual-classes-next'
Remove-Item -LiteralPath $out -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force $out | Out-Null
$sources = Get-ChildItem (Join-Path $root 'android\mock-apk\app\src\main\java') -Recurse -Filter '*.java' | Select-Object -ExpandProperty FullName
& $java -encoding UTF-8 -source 8 -target 8 -cp $jar -d $out $sources
if ($LASTEXITCODE -ne 0) { throw 'Java source verification failed' }
Write-Host "PASS Java sources compile against Android API 35: $($sources.Count) files"
