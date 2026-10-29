# 配置 API

公开配置保存在应用私有 SharedPreferences，可由 UI 编辑：

```text
GET /v1/config/public
PUT /v1/config/public
```

字段：`provider`、`model`、`baseUrl`、`defaultRole`。

凭据使用独立接口并由 Android Keystore 加密：

```text
GET  /v1/config/credentials
POST /v1/config/credentials
```

凭据接口只返回布尔状态；日志、公开配置和状态接口都不返回密钥。
