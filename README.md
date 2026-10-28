# QQ Bot CP

一个基于 **官方 QQ Bot + `@tencent-connect/dsh-qqbot` + DSH** 的角色对话机器人迁移工程，并提供 Android 前台服务宿主和控制页面。

本仓库只发布通用运行代码、配置模板、测试和 Android 宿主源码。真实 QQ 凭据、模型 API Key、会话记录、角色卡和本地运行数据不应进入 Git 仓库。

## 项目目标

- 使用 QQ 官方机器人身份接入 QQ，不修改普通 QQ 客户端。
- 保留角色对话、上下文隔离、私聊/群聊角色范围、静默时段和 `/preset` 等能力。
- 支持 OpenAI-compatible 模型接口，可使用不同的中转或模型服务。
- Android 端以 Node Runtime + 前台 Service + WebView 控制页运行，支持锁屏后继续工作。

## 目录说明

```text
runtime/                       消息规范化、角色路由、会话和错误恢复逻辑
plugins/                       DSH/QQ Bot 适配层
android/mock-apk/              Android 宿主源码和控制 UI
android/RUNTIME-DESIGN.md      Android 运行时设计
android/PORTING.md             Android 移植说明
config.example.env             环境变量模板
config.example.json            配置字段模板
LIVE-VALIDATION.md             官方 Bot 验收清单
TODO.md                        迁移进度
```

角色卡和角色提示词属于本地数据，不随仓库发布。将自己的角色卡放入本地 profile 或通过 Android 应用的角色管理页面导入。

## 前置条件

桌面运行：

- Windows PowerShell
- Node.js `>=22.19.0`
- npm
- 一个已在 QQ 开放平台创建的官方机器人 AppID/AppSecret
- 一个 OpenAI-compatible 模型接口和 API Key

Android 构建：

- Android 手机 ABI 为 `arm64-v8a`
- JDK 17
- Android SDK Platform 35 或更高
- Build Tools 35.0.1
- Android NDK（仅编译原生 addon 时需要）

## 安装桌面依赖

在仓库根目录执行：

```powershell
npm install
npm run preflight
npm test
```

`npm test` 只运行离线测试，不会连接 QQ，也不会调用模型接口。

## 配置官方 QQ Bot

复制配置模板并在当前 PowerShell 会话设置环境变量：

```powershell
$env:QQBOT_APPID = "你的 AppID"
$env:QQBOT_SECRET = "你的 AppSecret"
$env:LLM_PROVIDER = "relay"
$env:LLM_MODEL = "你的模型名称"
$env:LLM_BASE_URL = "https://你的接口/v1"
$env:LLM_API_KEY = "你的模型 API Key"
```

安装官方插件：

```powershell
npm run install-plugin
```

启动：

```powershell
npm run dsh
```

更适合日常使用的方式是先运行本地凭据初始化脚本，再使用启动脚本：

```powershell
powershell -ExecutionPolicy Bypass -File .\setup-local-secrets.ps1
powershell -ExecutionPolicy Bypass -File .\start-live.ps1
```

凭据脚本使用 Windows DPAPI 保存本机密钥；密钥文件位于被 Git 忽略的 `.local-secrets/`。

## Android 运行

Android 端不是 QQ 客户端，也不需要 NapCat、OneBot、QQ 注入或 Root。APK 内的前台 Service 负责启动 Node Runtime，WebView 控制页负责：

- 启停 Runtime 和查看状态
- 配置 QQ AppID、AppSecret、模型 API Key
- 配置模型接口类型、模型名和 Base URL
- 管理自定义角色卡
- 设置私聊和群聊默认角色
- 复制 `/preset`、`/presets`、`/new` 等指令

敏感凭据由 Android Keystore 加密保存，运行时通过环境变量传给 Node 子进程，不显示在控制页面或日志中。

Android 手工构建：

```powershell
cd .\android
powershell -ExecutionPolicy Bypass -File .\build-manual-apk.ps1
```

构建脚本会使用 `android/tools/` 下的本地工具链。工具链和生成的 APK 默认被 `.gitignore` 排除，不上传到 GitHub。

## 角色和会话

内置角色 ID 由运行时定义，例如：

```text
shiny-colors.nanoka
shiny-colors.tsun
```

自定义角色 ID 使用 `custom.` 前缀，例如：

```text
custom.my-role
```

QQ 指令示例：

```text
/preset
/presets
/preset custom.my-role
/new
```

私聊和群聊使用独立的会话作用域，群聊切换角色不会覆盖私聊角色。角色卡可以通过 Android 控制页保存为本地自定义 preset，也可以由管理员使用 `/preset` 切换。

## 验证

离线验证：

```powershell
npm run validate:offline
npm test
```

真实 QQ 验收顺序见 [LIVE-VALIDATION.md](./LIVE-VALIDATION.md)，建议依次验证：

1. Bot WebSocket 连接和 `Bot ready`。
2. 私聊文字收发。
3. 群聊 `@` 触发和回复。
4. `/preset` 角色切换。
5. `/new` 上下文重置。
6. 断线重连和重启恢复。

## 隐私和提交边界

以下内容明确禁止提交：

- QQ AppSecret、模型 API Key、访问令牌
- `.local-secrets/`、`.dsh-home/`、`.env`
- 角色卡、人格提示词和私有 preset
- QQ 会话记录、日志、截图和导出的运行状态
- Android APK、Node 二进制、SDK、NDK、Gradle 和构建缓存

提交前检查：

```powershell
npm run verify:secrets
rg -n --hidden -g '!node_modules/**' -g '!.dsh-home/**' -g '!.local-secrets/**' '(AppSecret|API_KEY|QQBOT_SECRET|Bearer )' .
```

## 当前状态

桌面官方 QQ Bot 链路、角色路由、上下文隔离、错误恢复和 Android Runtime 原型已经完成验证。Android 仍需要在目标设备上继续做长时间运行、断线重连、群聊和自定义角色卡的最终验收。

本项目依赖官方 QQ Bot 开放平台账号和第三方模型接口；二者的申请、额度、地域和平台规则由对应服务商决定。
