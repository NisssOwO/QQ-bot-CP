# 官方 QQ Bot 真实验收清单

本清单用于 P0/P1 首次真实运行。密钥只放在当前 PowerShell 会话的环境变量中，不写入仓库。

## 启动前

```powershell
cd "C:\Users\Nis\Documents\Codex\2026-10-24\new-chat\official-bot-migration"
$env:QQBOT_APPID = "你的 AppID"
$env:QQBOT_SECRET = "你的 AppSecret"
$env:LLM_PROVIDER = "relay"
$env:LLM_MODEL = "deepseek-chat"
$env:LLM_BASE_URL = "https://api.deepseek.com/v1"
$env:LLM_API_KEY = "你的中转 API Key"
.\run-p0.example.ps1
.\node_modules\.bin\dsh.cmd --profile qqbot
```

预期：日志出现 `Bot ready!`。如果没有 AppID/AppSecret，插件会进入扫码绑定流程；当前项目按官方机器人身份运行，不使用普通 QQ 客户端注入。

## 私聊

从已授权的测试 QQ 账号发送一条短文字，确认：

1. 收到一次模型回复。
2. 回复内容保持七草日花角色格式（日语 + 中文翻译）。
3. 重复投递同一消息不会产生第二次回复。

## 群聊

在已配置的测试群发送：

1. 不 @机器人：默认不回复。
2. @机器人 + 文字：回复一次。
3. 连续快速发送两条：按同一 peer 串行处理，不交叉输出。

## 角色切换

在私聊中依次发送：

```text
/preset
/preset shiny-colors.hazuki
/new
```

确认 `/preset` 列出五个角色，`/new` 后新会话使用叶月人格。再测试别名：

```text
/preset 日花
/new
```

切换只影响当前私聊 peer；群聊另有独立绑定。

## 上下文与错误恢复

```text
/compact
/new
/bot-status
```

确认 `/compact` 不改变 session 身份，`/new` 创建新会话；模型接口返回 `data_inspection_failed` 时只进行一次压缩重试，仍失败则暂停当前会话并给出提示。

## 停止和回滚

停止进程使用 `Ctrl+C`。profile 中的官方插件目录由 `normalize-profile-plugin.ps1` 指向工作区依赖，原始物化目录保留为同目录的 `.profile-copy` 备份。

