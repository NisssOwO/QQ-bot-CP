# Mock API 真机验收

1. 编译并安装：

```powershell
cd F:\产出\official-bot-migration\android
.\build-mock-apk.ps1
$adb = 'F:\产出\official-bot-migration\android\tools\sdk\platform-tools\adb.exe'
& $adb install --no-streaming -r .\mock-apk\app\build\outputs\apk\debug\app-debug.apk
```

2. 打开应用并点击“启动 Mock Runtime”。页面应显示 `Runtime API 正常` 和 `ONLINE`。

3. Runtime API 绑定到 `127.0.0.1`，端口和令牌只保存在应用私有 SharedPreferences；页面不会显示令牌。

4. 凭据接口只返回布尔状态。真实版本应通过页面输入后立即写入 Android Keystore，不应把密钥写入普通配置或日志。
