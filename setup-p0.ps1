$ErrorActionPreference = 'Stop'

# P0 本地安装脚本：所有 npm 缓存和依赖都留在本目录，不做全局安装。
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root
$cache = Join-Path $root '.npm-cache'
$env:npm_config_cache = $cache
$env:npm_config_fund = 'false'
$env:npm_config_audit = 'false'

$node = node --version
if ([version]($node.TrimStart('v')) -lt [version]'22.19.0') {
  throw "Node.js 版本过低：$node，需要 >= 22.19.0"
}

if (-not $env:QQBOT_APPID -or -not $env:QQBOT_SECRET) {
  Write-Warning '未设置 QQBOT_APPID/QQBOT_SECRET；可以先安装依赖，启动验证前再设置。'
}

npm install --ignore-scripts --no-audit --no-fund
npx --no-install @deepseek-ai/dsh plugin --profile qqbot add @tencent-connect/dsh-qqbot@0.5.2
& (Join-Path  'setup-role-presets.ps1')
Write-Host 'P0 依赖已准备。启动命令：npx --no-install @deepseek-ai/dsh --profile qqbot'



