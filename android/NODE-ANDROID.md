# Node Android 载荷

已读取真机：`arm64-v8a`，Android API 36。

DSH 当前要求 Node.js `>=22.19.0`，所以 Node.js Mobile v18 不能作为真实 DSH 运行时。目标载荷改为 Node Android arm64 standalone：

- 项目：`Towartz/nodejs-arm`
- 版本：`v26.11.2-dev`
- 下载包：`node-v26.11.2-dev-android-arm64-v8a.zip`
- 载荷位置：`filesDir/runtime/bin/node`
- 运行时入口：`filesDir/runtime/runtime-entry.mjs`

下载包因当前网络到 GitHub Release 的连接超时尚未落地到工作区；收到后用 `prepare-runtime-bundle.ps1` 复制源文件，并将压缩包中的 `node` 放到载荷目录。脚本和 Service 已支持“有载荷启动真实 DSH、无载荷保留 Mock”。
