$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root
$env:DSH_HOME = Join-Path $root '.dsh-home'
$env:DSH_PRESET_ROOT = Join-Path $root 'presets'
$env:DSH_CWD = $root
$dsh = Join-Path $root 'node_modules\.bin\dsh.cmd'
$config = & $dsh --profile qqbot --dump-config 2>&1 | Out-String
if ($LASTEXITCODE -ne 0) { throw $config }
$required = @('im-qqbot', 'requireMention', 'directPrompt', 'groupPrompt', 'textChunkLimit')
$missing = @($required | Where-Object { $config -notmatch [regex]::Escape($_) })
if ($missing.Count -gt 0) { throw "缺少配置字段: $($missing -join ', ')" }
Write-Host 'PASS qqbot profile offline configuration'
Write-Host '已确认官方 QQ 插件、触发策略、提示词和消息分块配置均被 DSH 读取。'
