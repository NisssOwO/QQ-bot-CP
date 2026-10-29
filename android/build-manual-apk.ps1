$ErrorActionPreference = 'Stop'
$android = Split-Path -Parent $MyInvocation.MyCommand.Path
$project = Join-Path $android 'mock-apk'
$out = Join-Path $android 'manual-build-next'
$tools = Join-Path $android 'tools'
$signingDir = Join-Path $android 'signing'
$keystore = Join-Path $signingDir 'qqbot-cp-release.keystore'
$keyAlias = 'qqbotcp'
$keyPassword = 'qqbotcp'
$javaHome = Join-Path $tools 'jdk17\jdk-17.0.20+8'
$env:JAVA_HOME = $javaHome
$sdk = Join-Path $tools 'sdk'
$bt = Join-Path $sdk 'build-tools\35.0.1'
$jar = Join-Path $sdk 'platforms\android-35\android.jar'
$drive = 'Y:'
subst $drive $android
try {
  $x = "$drive\"
  $xOut = "$x\manual-build-next"
  $classes = "$xOut\classes"
  $res = "$xOut\res.zip"
  $apkDir = "$xOut\apk"
  Remove-Item $xOut -Recurse -Force -ErrorAction SilentlyContinue
  New-Item -ItemType Directory -Force "$classes","$xOut\dex","$apkDir" | Out-Null
  $sources = Get-ChildItem "$x\mock-apk\app\src\main\java" -Recurse -Filter '*.java' | Select-Object -ExpandProperty FullName
  & "$javaHome\bin\javac.exe" -encoding UTF-8 -source 8 -target 8 -cp "$x\tools\sdk\platforms\android-35\android.jar" -d $classes $sources
  if ($LASTEXITCODE) { throw 'javac failed' }
  & "$bt\aapt2.exe" compile --dir "$x\mock-apk\app\src\main\res" -o $res
  if ($LASTEXITCODE) { throw 'aapt compile failed' }
  & "$bt\aapt2.exe" link -o "$apkDir\base.apk" --manifest "$x\mock-apk\app\src\main\AndroidManifest.xml" -I "$x\tools\sdk\platforms\android-35\android.jar" -R $res --auto-add-overlay --min-sdk-version 26 --target-sdk-version 35 --version-code 20 --version-name 0.2.9 --debug-mode
  if ($LASTEXITCODE) { throw 'aapt link failed' }
  $assetStaging = "$xOut\asset-staging"
  New-Item -ItemType Directory -Force "$assetStaging\assets" | Out-Null
  Copy-Item "$x\mock-apk\app\src\main\assets\runtime" "$assetStaging\assets" -Recurse -Force
  if (Test-Path "$x\mock-apk\app\src\main\assets\ui") { Copy-Item "$x\mock-apk\app\src\main\assets\ui" "$assetStaging\assets" -Recurse -Force }
  & "$javaHome\bin\jar.exe" uf "$apkDir\base.apk" -C $assetStaging assets
  if ($LASTEXITCODE) { throw 'asset packaging failed' }
  $nativeStaging = "$xOut\native-staging\lib\arm64-v8a"
  New-Item -ItemType Directory -Force $nativeStaging | Out-Null
  Copy-Item "$x\mock-apk\app\src\main\assets\runtime\bin\node" "$nativeStaging\libnode.so" -Force
  Copy-Item "$x\mock-apk\app\src\main\assets\runtime\bin\libc++_shared.so" "$nativeStaging\libc++_shared.so" -Force
  & "$javaHome\bin\jar.exe" uf "$apkDir\base.apk" -C "$xOut\native-staging" lib
  if ($LASTEXITCODE) { throw 'native library packaging failed' }
  & "$javaHome\bin\jar.exe" cf "$xOut\classes.jar" -C $classes .
  & "$bt\d8.bat" --lib "$x\tools\sdk\platforms\android-35\android.jar" --output "$xOut\dex" "$xOut\classes.jar"
  if ($LASTEXITCODE) { throw 'd8 failed' }
  Copy-Item "$apkDir\base.apk" "$apkDir\unsigned.apk" -Force
  & "$javaHome\bin\jar.exe" uf "$apkDir\unsigned.apk" -C "$xOut\dex" classes.dex
  & "$bt\zipalign.exe" -f 4 "$apkDir\unsigned.apk" "$apkDir\aligned.apk"
  if ($LASTEXITCODE) { throw 'zipalign failed' }
  if (-not (Test-Path $keystore)) { throw "release keystore not found: $keystore" }
  & "$bt\apksigner.bat" sign --ks $keystore --ks-key-alias $keyAlias --ks-pass "pass:$keyPassword" --key-pass "pass:$keyPassword" --out "$apkDir\app-debug-keystore.apk" "$apkDir\aligned.apk"
  if ($LASTEXITCODE) { throw 'apksigner failed' }
  Write-Host "BUILD_SUCCESS: $android\manual-build-next\apk\app-debug-keystore.apk"
} finally { subst $drive /D | Out-Null }


