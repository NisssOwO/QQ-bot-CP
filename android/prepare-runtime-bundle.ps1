$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$project = Join-Path $root 'mock-apk'
$assets = Join-Path $project 'app\src\main\assets\runtime'
Remove-Item -LiteralPath $assets -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force $assets | Out-Null
Copy-Item (Join-Path $root 'runtime-entry.mjs') (Join-Path $assets 'runtime-entry.mjs')
Copy-Item (Join-Path $root 'android-fs-compat.cjs') (Join-Path $assets 'android-fs-compat.cjs')
Copy-Item (Join-Path (Split-Path $root -Parent) 'runtime') (Join-Path $assets 'runtime') -Recurse -Force
Copy-Item (Join-Path (Split-Path $root -Parent) 'presets') (Join-Path $assets 'presets') -Recurse -Force
Copy-Item (Join-Path (Split-Path $root -Parent) 'plugins\role-presets') (Join-Path $assets 'plugins\role-presets') -Recurse -Force
$runtimeDeps = Join-Path $root 'runtime-deps\node_modules'
$workspaceDeps = Join-Path (Split-Path $root -Parent) 'node_modules'
if (Test-Path (Join-Path $workspaceDeps '@deepseek-ai\dsh')) {
  $env:SHINY_RUNTIME_SOURCE = $workspaceDeps
} elseif (Test-Path $runtimeDeps) {
  $env:SHINY_RUNTIME_SOURCE = $runtimeDeps
}
node (Join-Path $root 'prepare-node-closure.mjs')
# DSH discovers a number of optional/profile plugins dynamically. Preserve the
# production @deepseek-ai namespace so those imports do not depend on closure
# traversal order or nested peer dependency layout.
$sourceDeepseek = Join-Path $env:SHINY_RUNTIME_SOURCE '@deepseek-ai'
$targetDeepseek = Join-Path $assets 'node_modules\@deepseek-ai'
if (Test-Path $sourceDeepseek) {
  New-Item -ItemType Directory -Force $targetDeepseek | Out-Null
  Copy-Item (Join-Path $sourceDeepseek '*') $targetDeepseek -Recurse -Force
}
$extraPackages = @('@opentelemetry/sdk-logs', '@opentelemetry/api-logs', '@opentelemetry/core', '@opentelemetry/resources', '@earendil-works/pi-ai', '@earendil-works/pi-telemetry', '@joplin/turndown-plugin-gfm', '@mixmark-io/domino', 'diff', 'ipaddr.js', 'turndown', 'eventsource-parser', 'execa', 'yocto-queue', 'is-plain-obj')
foreach ($packageName in $extraPackages) {
  $sourcePackage = Join-Path $env:SHINY_RUNTIME_SOURCE $packageName
  $targetPackage = Join-Path $assets "node_modules\$packageName"
  if (Test-Path $sourcePackage) {
    New-Item -ItemType Directory -Force (Split-Path $targetPackage) | Out-Null
    Copy-Item $sourcePackage $targetPackage -Recurse -Force
  }
}
# Some DSH packages resolve OpenTelemetry from nested dependency roots.
$nestedOtelRoots = @(
  (Join-Path $assets 'node_modules\@deepseek-ai\dsh-base\node_modules\@opentelemetry'),
  (Join-Path $assets 'node_modules\@deepseek-ai\dsh-session-telemetry-otel\node_modules\@opentelemetry')
)
foreach ($nestedRoot in $nestedOtelRoots) {
  $sourceSdkLogs = Join-Path $env:SHINY_RUNTIME_SOURCE '@opentelemetry\sdk-logs'
  if (Test-Path $sourceSdkLogs) {
    New-Item -ItemType Directory -Force $nestedRoot | Out-Null
    Copy-Item $sourceSdkLogs (Join-Path $nestedRoot 'sdk-logs') -Recurse -Force
  }
}
$piCompletions = Join-Path $assets 'node_modules\@earendil-works\pi-ai\dist\api\openai-completions.js'
if (Test-Path $piCompletions) {
  $piText = Get-Content $piCompletions -Raw
  $piText = $piText.Replace('params.enable_thinking = !!options?.reasoningEffort;', "params.enable_thinking = model.provider === 'relay' ? false : !!options?.reasoningEffort;")
  $piText = $piText.Replace('enable_thinking: !!options?.reasoningEffort,', "enable_thinking: model.provider === 'relay' ? false : !!options?.reasoningEffort,")
  $needle = '    if (options?.temperature !== undefined) {\n        params.temperature = options.temperature;\n    }'
  $replacement = $needle + "`n    if (model.provider === 'relay') {`n        params.enable_thinking = false;`n    }"
  $piText = $piText.Replace($needle, $replacement)
  Set-Content $piCompletions $piText -Encoding UTF8
}
$prefsStore = Join-Path $assets 'node_modules\@tencent-connect\dsh-qqbot\dist\model\prefs-store.js'
if (Test-Path $prefsStore) {
  $prefsText = Get-Content $prefsStore -Raw
  $prefsReplacement = @'
getPreset(sessionKey) {
        return this.presets.get(sessionKey) ?? this.presets.get(String(sessionKey).replace(/:[^:]+$/, ":*"));
    }
'@
  $prefsText = [regex]::Replace($prefsText, 'getPreset\(sessionKey\) \{\s*return this\.presets\.get\(sessionKey\);\s*\}', $prefsReplacement)
  Set-Content $prefsStore $prefsText -Encoding UTF8
}
$flockShim = Join-Path $assets 'node_modules\@deepseek-ai\node-addon-system\lib\flock.js'
if (Test-Path $flockShim) {
  @'
/** Android single-process fallback: session persistence remains enabled. */
export async function tryLockExclusive(_fd) { return; }
'@ | Set-Content $flockShim -Encoding UTF8
}
# Android has no published node-addon-require-builtin-android-arm64 package.
# Keep the native path when available, but allow DSH's builtin accessors to
# fall back to the regular Node require implementation.
$builtinShim = Join-Path $assets 'node_modules\node-addon-require-builtin\lib\index.js'
if (Test-Path $builtinShim) {
  @'
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireBuiltin = requireBuiltin;
exports.isAllowedInternalId = isAllowedInternalId;
exports.getBindingInfo = getBindingInfo;
function requireBuiltin(moduleId) { return require(moduleId); }
function isAllowedInternalId() { return true; }
function getBindingInfo() { return { backend: "javascript-fallback", platform: process.platform, arch: process.arch }; }
exports.default = { requireBuiltin, isAllowedInternalId, getBindingInfo };
'@ | Set-Content $builtinShim -Encoding UTF8
}
$nativeAddon = Join-Path $root 'native\dsh-node-addon-require-builtin\android-build\require_builtin.node'
if (Test-Path $nativeAddon) {
  $originalBuiltinShim = Join-Path $env:SHINY_RUNTIME_SOURCE 'node-addon-require-builtin\lib\index.js'
  if (Test-Path $originalBuiltinShim) { Copy-Item $originalBuiltinShim $builtinShim -Force }
  $nativeTarget = Join-Path $assets 'node_modules\node-addon-require-builtin\build\napi\napi-v9-android-arm64'
  New-Item -ItemType Directory -Force $nativeTarget | Out-Null
  Copy-Item $nativeAddon (Join-Path $nativeTarget 'require_builtin.node') -Force
}
# Towartz's Android Node build omits ICU Unicode-property regexp support.
# DSH uses these properties only for identifier/tool-name validation; narrow
# them to ASCII-compatible classes so the text/chat path can boot on Android.
Get-ChildItem (Join-Path $assets 'node_modules\@deepseek-ai') -Recurse -File -Include *.js,*.mjs | ForEach-Object {
  $text = Get-Content $_.FullName -Raw
  if ($null -eq $text) { return }
  $patched = $text.Replace('\p{XID_Start}', 'A-Za-z_').Replace('\p{XID_Continue}', 'A-Za-z0-9_').Replace('\p{L}', 'A-Za-z').Replace('\p{N}', '0-9')
  if ($patched -ne $text) { Set-Content $_.FullName $patched -Encoding UTF8 }
}
New-Item -ItemType Directory -Force (Join-Path $assets 'node_modules\@shiny-colors\role-presets') | Out-Null
Copy-Item (Join-Path (Split-Path $root -Parent) 'plugins\role-presets\package.json') (Join-Path $assets 'node_modules\@shiny-colors\role-presets\package.json') -Force
Copy-Item (Join-Path (Split-Path $root -Parent) 'plugins\role-presets\index.js') (Join-Path $assets 'node_modules\@shiny-colors\role-presets\index.js') -Force
New-Item -ItemType Directory -Force (Join-Path $assets '.dsh-home\profiles\qqbot') | Out-Null
Copy-Item (Join-Path (Split-Path $root -Parent) '.dsh-home\profiles\qqbot\package.json') (Join-Path $assets '.dsh-home\profiles\qqbot\package.json') -Force
Copy-Item (Join-Path (Split-Path $root -Parent) '.dsh-home\profiles\qqbot\cordis.yml') (Join-Path $assets '.dsh-home\profiles\qqbot\cordis.yml') -Force
$profileRoleRoot = Join-Path $assets '.dsh-home\profiles\qqbot\node_modules\@shiny-colors\role-presets'
New-Item -ItemType Directory -Force $profileRoleRoot | Out-Null
Copy-Item (Join-Path (Split-Path $root -Parent) 'plugins\role-presets\package.json') (Join-Path $profileRoleRoot 'package.json') -Force
Copy-Item (Join-Path (Split-Path $root -Parent) 'plugins\role-presets\index.js') (Join-Path $profileRoleRoot 'index.js') -Force
$patch = Get-Content (Join-Path (Split-Path $root -Parent) '.dsh-home\profiles\qqbot\cordis.patch.yml') -Raw
$patch = $patch -replace 'F:/产出/official-bot-migration/presets', './presets'
$patch = $patch -replace '            maxTokens: 8192', "            maxTokens: 8192`n            reasoning: true`n            compat:`n              thinkingFormat: qwen"
Set-Content (Join-Path $assets '.dsh-home\profiles\qqbot\cordis.patch.yml') $patch -Encoding UTF8
New-Item -ItemType Directory -Force (Join-Path $assets 'bin') | Out-Null
$nodePayload = Join-Path $root 'tools\node-arm64-v26'
if (-not (Test-Path (Join-Path $nodePayload 'node'))) { throw "Node arm64 payload missing: $nodePayload" }
Copy-Item (Join-Path $nodePayload 'node') (Join-Path $assets 'bin\node') -Force
Copy-Item (Join-Path $nodePayload 'libc++_shared.so') (Join-Path $assets 'bin\libc++_shared.so') -Force
Write-Host "Prepared runtime sources under $assets"
Write-Host 'Node arm64 payload copied to assets/runtime/bin; Service installs it into filesDir/runtime/bin.'
