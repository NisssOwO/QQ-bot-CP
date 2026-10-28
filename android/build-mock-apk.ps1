$ErrorActionPreference = 'Stop'
$androidRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $androidRoot
$tools = Join-Path $androidRoot 'tools'
$env:JAVA_HOME = Join-Path $tools 'jdk17\jdk-17.0.20+8'
$env:ANDROID_SDK_ROOT = Join-Path $tools 'sdk'
$env:ANDROID_HOME = $env:ANDROID_SDK_ROOT
$env:ANDROID_USER_HOME = Join-Path $androidRoot '.android'
$env:GRADLE_USER_HOME = Join-Path $androidRoot 'gradle-cache-final'
$gradle = Join-Path $tools 'gradle\gradle-8.9\bin\gradle.bat'
$project = Join-Path $androidRoot 'mock-apk'
if (-not (Test-Path -LiteralPath $gradle)) { throw "Gradle not found: $gradle" }
if (-not (Test-Path -LiteralPath (Join-Path $env:JAVA_HOME 'bin\java.exe'))) { throw "JDK not found: $env:JAVA_HOME" }
Set-Location $project
& $gradle '-Dorg.gradle.native=false' '--no-daemon' '--offline' '--console' 'plain' ':app:assembleDebug'
if ($LASTEXITCODE -ne 0) { throw "Mock APK build failed with exit code $LASTEXITCODE" }
$apk = Join-Path $project 'app\build\outputs\apk\debug\app-debug.apk'
Write-Host "BUILD_SUCCESS: $apk"
