# 官方 QQ Bot + dsh-qqbot 迁移任务

当前主体：`@tencent-connect/dsh-qqbot`

原项目：`F:\产出\shiny colors`

原则：保留原项目的角色、人格、上下文和业务规则；废止 SnowLuma、OneBot 和 QQ 客户端注入链路。

## P0：官方插件基线

- [x] 固定 DSH 版本：`@deepseek-ai/dsh@0.2.1-rc.2`
- [x] 固定 `@tencent-connect/dsh-qqbot` 版本：`0.5.2`
- [x] 确认 Node.js：当前环境 `v24.16.0`，满足 `>=22.19.0`
- [x] 创建工作区限定安装脚本：`setup-p0.ps1`
- [x] 解决当前环境到 npm registry 的 HTTPS 套接字限制（npm registry 已可访问）
- [x] 建立独立 DSH profile（`qqbot`）
- [x] 建立独立 DSH profile：`.dsh-home/profiles/qqbot`
- [x] 安装官方插件 `@tencent-connect/dsh-qqbot@0.5.2`
- [x] `dsh --version` 通过：`0.2.1-rc.2`
- [x] `--dump-config` 确认 `im-qqbot` patch 和 `preset: nanoka` 已生效
- [x] 处理 `dsh-agent-presets` 兼容问题：采用 workspace-local role-presets fallback，不再依赖不兼容外部包
- [x] 生成不依赖 `agent-presets` 的 `nanoka` directPrompt/groupPrompt fallback
- [x] 将工作区 qqbot profile 切换到 directPrompt 基线并通过 `--dump-config` 验证
- [ ] 配置 AppID/AppSecret（等待本地填写；只通过环境变量或 DSH 配置，不提交密钥）
- [ ] 启动插件并确认 WebSocket 已连接
- [ ] 验证私聊收发文字
- [ ] 验证目标群 `@机器人` 收发文字
- [ ] 验证断线重连
- [ ] 验证重启后会话恢复

## P1：迁移角色和会话

- [x] 抽取原项目 `roles/` 角色卡
- [x] 完成首个角色 `custom.example` 的 DSH preset 草稿
- [x] 批量转换其余角色为 DSH preset 草稿
- [x] 本地检查 5 个 preset 的 front matter 和元数据一致性
- [x] 增加角色 preset 注册表和别名路由
- [x] 增加私聊/群聊独立角色绑定持久化
- [x] 实现 `/role`、`/角色`、`/roles`、`/角色重置` 命令解析和管理员权限边界
- [x] 实现官方 Bot 私聊/群聊触发策略和命令排除
- [x] 生成 5 个 DSH `agent.cordis.yml` 角色组合
- [x] 用固定版本 DSH 实际加载并切换 `nanoka` preset（F 盘 live 实例已验证 `/preset 日花`）
- [x] 生成官方 Bot + `nanoka` 的无密钥 profile patch 示例
- [x] 迁移角色别名、世界观和回复规则（5 个 preset 已生成并通过离线检查）
- [x] 配置私聊/群聊默认角色（默认 nanoka，按 peer 独立覆盖）
- [x] 验证多角色切换（已完成多角色切换验收（角色内容不纳入仓库））
- [x] 验证上下文隔离和恢复（真实 `/new` 已验收；重启恢复策略进入长期运行阶段）

## P2：迁移桥接业务

### P2-A：固定工作目录与启动方式（已完成）

- [x] 固定工作目录为 `F:\产出\official-bot-migration`
- [x] 启动脚本按自身所在目录解析路径，不依赖当前 PowerShell 目录
- [x] 加密凭据、DSH profile、角色 preset 均从 F 盘读取
- [x] 从 `C:\Windows\System32` 调用 F 盘 preflight 仍能通过
- [x] 修复迁移后 preset 路径残留，确认 `/preset 日花` 可用
- [ ] 连续运行 6–12 小时并记录断线、重连和异常日志（后置，当前设备条件不足）

- [x] 静默时段（离线状态机已迁移，待官方事件接线验收）
- [x] 迁移静默时段状态机到 `runtime/quiet-hours.mjs`
- [x] 通过工作日、周末、管理员 @ 例外测试
- [ ] 白名单/黑名单
- [x] 消息去重（官方事件去重器已通过测试）
- [x] 迁移官方事件去重器（message_id + msg_seq + scope）
- [x] 迁移 `data_inspection_failed` 400 的一次性压缩重试策略
- [x] 压缩重试再次失败后暂停会话，避免无限重试
- [x] 组合成 `OfficialMessagePipeline` 适配层并通过管线测试
- [x] 统一官方单聊/群聊事件为内部消息格式
- [x] 组合官方 Bot 入站编排器并通过端到端离线测试
- [x] 实现官方 Bot 回复文本分块（默认 4500 字符上限）
- [x] 消息分块（4500 字符上限适配已完成）
- [x] 模型超时处理（适配器支持超时和取消，真实接口待验收）
- [x] 400 错误自动压缩上下文（离线策略已完成，待真实模型接口验收）
- [x] 压缩失败后的新会话降级（离线策略已通过测试，真实接口待验收）
- [ ] 敏感内容拦截和日志审计

## P3：迁移 DSH 工具

- [ ] 盘点原项目 MCP/DSH 工具
- [ ] 移除 SnowLuma/OneBot 专属调用
- [ ] 将通用工具改成 DSH preset 或 Cordis 插件
- [ ] 文件和图片路径白名单
- [ ] 工具超时和权限确认

## P4：媒体功能

- [ ] 图片接收和理解
- [ ] 文件发送
- [ ] Markdown 和流式回复
- [ ] 官方语音上传验证
- [ ] 日语 TTS
- [ ] 表情和空间动态（最后验收）

## P5：安卓化

- [ ] 验证 DSH/插件运行时在 Android 的可行性
- [ ] 设计手机本地后台服务或 APK + 服务架构
- [ ] 使用 Android Keystore 保存凭据
- [ ] 前台服务、锁屏运行、断线重连
- [ ] 进程被系统回收后的恢复
- [ ] 全天无人值守测试

## 当前执行入口

```powershell
$env:QQBOT_APPID = "你的AppID"
$env:QQBOT_SECRET = "你的AppSecret"
npx @deepseek-ai/dsh plugin --profile qqbot add @tencent-connect/dsh-qqbot@0.5.2
npx @deepseek-ai/dsh --profile qqbot
```

不要把真实 AppSecret 写入仓库、聊天记录或截图。


验证记录（2026-10-27）：
- [x] workspace-local verify-p0-config.ps1 离线读取 qqbot profile 成功。
- [x] 11 个 runtime 离线测试通过；测试临时目录使用工作区内目录，未写入系统临时目录。
- [ ] 下一关：本地填入 QQBOT_APPID、QQBOT_SECRET、DEEPSEEK_API_KEY 后启动真实网关。

- [x] 添加 workspace-local role-presets 服务，支持 5 个角色的 DSH preset 列表、别名解析和 agent prompt 挂载。
- [x] 将 profile 的内置 /preset 路由接到 role-presets 服务；不依赖版本不兼容的外部 agent-presets 包。
- [x] 真实 QQ 会话中验证 /preset 切换和上下文隔离。

- [x] 修复 profile 依赖目录权限，并将官方插件目录规范化为工作区 junction，避免 Node ESM 读取 EPERM。
- [x] 通过 dsh --profile qqbot --help 触发实际 profile 装载；官方插件已进入扫码绑定流程（随后手动中止，未登录）。
- [ ] 使用真实 AppID/AppSecret/DeepSeek Key 做一次 QQ 官方网关收发验收。

- [x] 建立可重复的官方 QQ 真实验收清单：[LIVE-VALIDATION.md](./LIVE-VALIDATION.md)。
- [ ] 依据清单完成真实 Bot ready、私聊、群聊和角色切换验收。

- [x] 新增 preflight-p0.ps1，自动检查 Node、profile junction、DSH 配置、角色服务和本地密钥状态（不输出密钥）。

- [x] 添加 .gitignore，忽略 profile 依赖、npm 缓存、DSH 会话和日志，防止真实运行时凭据或状态文件进入提交。

- [x] 将 preflight 和基础离线验证加入 package.json：
pm run preflight、
pm run validate:offline。

- [x] 统一离线测试入口 
pm test，工作区内临时目录运行，12 个测试文件全部通过。

- [x] DSH 会话适配器增加模型调用超时、调用方取消和统一错误结果。

- [x] 审核 400 二次失败后切换新会话并保留旧会话审计信息。

- [x] 修正官方编排器角色绑定键为 scope:peerId，避免一个群切换角色影响其他群。



- [x] 新增 start-live.ps1：交互读取密钥、预检、启动和退出清理，不把密钥写入文件或聊天。

- [x] 将模型凭据改为通用 OpenAI-compatible relay 配置：LLM_PROVIDER、LLM_MODEL、LLM_BASE_URL、LLM_API_KEY；不再强绑 DeepSeek。

- [x] 真实启动记录：官方 QQ Bot 已输出 Bot ready!，网关连接成功。

- [x] 真实验收结果：私聊、群聊 @、/preset 角色切换和 /new 上下文切换均成功。

- [x] 通用 OpenAI-compatible relay 实机验证：Bot ready 且最短测试消息成功得到模型回复。


- [x] 改为 DPAPI 加密本地凭据：首次输入后，start-live.ps1 自动读取，不再重复输入。

- [x] 优化真实启动速度：start-live 不再先重复执行一次完整 DSH dump-config。

- [x] 修复重复 im-qqbot patch 覆盖 relay 配置；暂时关闭图片理解/图片压缩旁路，避免未配置 deepseek-official 时影响文字链路。

- [x] 增加 `config.example.json`，提供不含密钥的配置模板。
- [x] 增加 `npm run verify:secrets`，检查本地配置字段和 DPAPI 载荷结构且不输出密钥。
- [x] 确认 `.local-secrets/`、`.env`、日志和临时目录均已加入忽略规则。

- [x] 完成 Android Bot Runtime / Control UI 两层架构、回环 API、状态机和凭据边界设计：见 `android/RUNTIME-DESIGN.md`。
- [x] 固化 Android 运行时 API 契约：见 `android/runtime-contract.json`。
- [x] 创建 Android Mock APK 工程骨架：前台 Runtime Service、启动/停止 UI 和锁屏通知，不含真实 QQ 凭据。
- [x] 安装 JDK、Gradle、SDK platform 35 和 build-tools，并编译 debug APK。
- [x] 下载并解压 Android Command-line Tools 到 `android/tools/cmdline-tools`。
- [x] 增加 JDK 17 分段下载脚本 `android/tools/download-jdk17.mjs`，避免大文件单连接截断。
- [x] 准备 JDK 17、Gradle 8.9、SDK Platform 35、Build Tools 35.0.1 和 Platform Tools。
- [x] 编译 Mock APK：`android/mock-apk/app/build/outputs/apk/debug/app-debug.apk`。
- [x] 将 Mock APK 的本机 API 接入前台 Runtime Service，并用随机 Bearer Token保护。
- [x] 增加 `android/build-mock-apk.ps1`，避免手动设置 `JAVA_HOME`、SDK 和 Gradle 路径。
- [x] ADB 真机安装 Mock APK 成功（使用 `--no-streaming`）。
- [x] 真机启动前台 Runtime，Control UI 通过 `127.0.0.1` API 获得 `ONLINE` 状态。
- [x] 真机回到桌面后 Runtime Service 仍保持前台状态；测试结束后已停止 Mock 进程。
- [x] 接入 Android Keystore-backed `CredentialStore`，凭据 API 只返回配置状态，不返回密钥。
- [x] 重新编译并真机验证凭据 API（Keystore AES-GCM，真机返回三项 configured=true）。
- [x] Keystore/API Java 源码已通过 `android/verify-java-sources.ps1` 的 Android API 35 编译检查。
- [x] 增加不依赖 Gradle native 缓存的 `android/build-manual-apk.ps1`，已手工生成并签名 Keystore 版本 APK。
- [x] 增加公开配置 API：provider、model、Base URL、默认角色与凭据接口分离。
- [x] 建立 Android 到 Node/DSH 的 Runtime Process Controller：校验 `filesDir/runtime/bin/node`、注入运行时环境变量并回收子进程。
- [x] 增加 `android/runtime-entry.mjs` 和 `android/prepare-runtime-bundle.ps1`，明确 Node ABI 载荷与密钥边界。
- [x] 预生成 Android assets 运行时源代码包，并让手工 APK 构建包含 RuntimeProcessController。
- [x] 修正手工打包脚本，确认 `assets/runtime`、角色 preset 和 `runtime-entry.mjs` 已进入 APK。
- [x] 确认目标手机 ABI 为 `arm64-v8a`、Android API 36。
- [x] 下载并在真机执行 Node 26 arm64 standalone（`v26.11.2-pre`）。
- [x] 将 Node、`libc++_shared.so`、DSH 源码、角色 preset 和 production 依赖闭包打入 APK；系统原生库目录可执行 Node。
- [x] 将 Android Service 改为有 Node 载荷时解密 Keystore 凭据并启动真实 DSH，无载荷时保留 Mock。
- [x] 公开配置页字段已接入真实 Service 环境：provider、model、Base URL 会传入 DSH 子进程。
- [x] 下载 Node 26 Android arm64 standalone 载荷并打入 APK；改为首次启动复制到 `codeCache` 可执行目录，规避 Android `filesDir` 的 noexec 限制。
- [ ] 安装含 Node 载荷的 APK，验证真实 DSH 启动和官方 QQ WebSocket（设备当前内部存储仅余约 181 MB，需先释放空间）。
- [x] 生成 DSH production 依赖闭包：477 个包已进入 APK；2 个 npm 不存在的实验包已记录，剩余动态依赖清单见 `android/mock-apk/app/src/main/assets/runtime/runtime-missing-dependencies.txt`。
- [ ] 读取真实 Node 子进程启动错误并补齐必要 DSH 包；当前旧启动路径已确认 exit code 1，已加入 stdout/stderr 状态回读。
- [x] 改为当前 Node 进程直接加载 DSH CLI，并确认真机可回传 ESM 模块错误；状态接口保存最近 8KB 错误片段。
- [x] 确认 runtime-deps 独立安装会造成 DSH 插件版本错配；Android bundle 改用原项目已验证的根 `node_modules` 兼容集合，并在 Windows 本机启动检查通过。
- [x] 准备 Android NDK 28.2 并交叉编译 `node-addon-require-builtin` Android arm64 原生 addon；真机已成功加载该 addon。
- [ ] 补齐少量可选 DSH 插件的普通 npm 依赖并完成官方 QQ WebSocket 验收。
- [x] 补入 `@opentelemetry/api-logs`、`diff`、`ipaddr.js`、`turndown`、`eventsource-parser` 等普通依赖并生成可安装 APK。
- [x] 真机使用已保存的官方 QQ 凭据启动 DSH，收到 `[im-qqbot] Bot ready! appId=<本机配置>`。
- [ ] 在真机 Bot ready 状态下完成私聊、群聊 @、角色切换和 `/new` 实际消息验收。
- [x] 修复 `relay` provider 未注册：补齐 `@earendil-works/pi-ai` 及其依赖，v5 真机日志已不再出现 `llm-pi-ai` 导入失败。
- [ ] Android 真机验证私聊、群聊 `@`、角色切换和 `/new`。
- [x] 在设备上安装并验证 Keystore 配置 API；测试数据已在验收后清除。

- [x] 建立 Android 两层架构和验收门槛：[android/PORTING.md](./android/PORTING.md)。
- [x] 在工作区内准备 Android SDK/Gradle 工具链。
- [x] Android v8 绕过 `flock` 的 arm64 限制；v9 增加 `fs.link`/`fs.promises.link` 的 Android 权限兼容回退，改用同目录 `rename` 完成会话原子提交。
- [x] v9/v10 真机发送文字消息，确认 `session.v4.jsonl.zstd` 成功落盘且不再出现 `EACCES ... link`。
- [x] v10 修复 relay + Qwen 流式调用仍误启用思考模式的问题；Android 包强制 `enable_thinking=false`，并重新安装后确认 Bot ready。
- [x] 第一阶段角色卡数据层：新增 Android 私有目录角色卡仓库，支持自定义角色卡保存、读取、删除和当前角色设置；内置角色保持只读。
- [x] 第一阶段 APK 页面：增加自定义角色 ID、名称、提示词编辑和保存入口；v11 APK 已编译并安装，Bot Runtime 可正常启动。
- [x] 增加运行配置页面：QQ AppID、AppSecret、模型 API Key 可修改并加密保存到 Android Keystore；Provider、Model、Base URL 可修改并持久化；v12 APK 已安装并确认 Bot ready。
- [x] 内部角色命令接入 `/preset`、`/预设` 及列表/重置别名；角色绑定键统一为 `private:<用户>` 和 `group:<群>`，离线测试覆盖私聊与群聊隔离。
- [x] APK 页面加入逐条会话指令复制按钮；每次只复制一条指令，v14 APK 已安装并确认 Bot ready。
- [x] 将 APK 控制页改为深色 WebView UI：运行状态、角色、会话指令、配置卡片和底部导航；配置保存接入 Keystore/Runtime，v16 APK 已安装并确认界面加载。
- [x] 将分类后的深色 UI 正式写入 APK：总览、角色、指令、设置四个标签页，运行配置归入设置，角色作用范围使用选择控件；v17 APK 已安装并确认 Bot ready。
- [x] 接通 UI 已具备后端能力的操作：角色卡保存、私聊/群聊角色范围保存、Keystore 配置保存、Runtime 重启/状态刷新和单条指令复制；v18 APK 已安装并确认 Bot ready。
- [ ] 真机使用官方 QQ Bot 验收 `/preset custom.test`，并在一个测试群确认群聊切换不影响私聊。
- [ ] 完成角色卡页面的真机填写保存、列表刷新和自定义 `/preset` 切换验收；下一阶段再增加完整角色列表编辑器、导入导出和删除按钮。
- [x] 通过真机 Loopback API 验证自定义角色卡 `custom.test` 的保存与列表返回；重启 Runtime 后 Bot ready。
- [x] 角色管理完善：动态读取内置/自定义角色列表，内置角色只读；支持新建、编辑、删除自定义角色、导出 JSON、导入 JSON；私聊/群聊作用范围下拉随角色仓库同步；v19 APK 已编译、安装并打开角色页验证。
- [ ] 真机在角色页实际新建一个 custom.* 角色，保存后通过 `/preset custom.*` 验收，再验证删除和导入导出。

