package com.shinycolors.officialbot.mock;

import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import org.json.JSONObject;
import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;

public final class MainActivity extends Activity {
    private WebView web;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        web = new WebView(this);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        web.setBackgroundColor(0xff111522);
        web.setWebViewClient(new WebViewClient());
        web.addJavascriptInterface(new UiBridge(), "AndroidBridge");
        setContentView(web);
        web.loadUrl("file:///android_asset/ui/index.html");
        CredentialStore store = new CredentialStore(this);
        if (store.has("qqbotAppId") && store.has("qqbotSecret") && store.has("llmApiKey")) {
            new Handler(Looper.getMainLooper()).postDelayed(() ->
                    startForegroundService(new Intent(MainActivity.this, BotRuntimeService.class)), 350L);
        }
    }

    private final class UiBridge {
        @JavascriptInterface public String state() {
            android.content.SharedPreferences p = getSharedPreferences(BotRuntimeService.PREFS, MODE_PRIVATE);
            try {
                JSONObject out = new JSONObject();
                out.put("running", p.getBoolean("runtimeProcessAlive", false));
                out.put("port", p.getInt("port", 0));
                out.put("token", p.getString("token", ""));
                out.put("lastOutput", p.getString("runtimeLastOutput", ""));
                out.put("lastError", p.getString("runtimeLastError", ""));
                out.put("runtimeExitCode", p.getInt("runtimeExitCode", -1));
                out.put("assetVersion", p.getString("assetVersion", ""));
                return out.toString();
            } catch (Exception error) { return "{}"; }
        }

        @JavascriptInterface public String config() {
            android.content.SharedPreferences p = getSharedPreferences("public-config", MODE_PRIVATE);
            CredentialStore store = new CredentialStore(MainActivity.this);
            try {
                JSONObject out = new JSONObject();
                out.put("appId", store.has("qqbotAppId") ? store.read("qqbotAppId") : "");
                out.put("qqbotConfigured", store.has("qqbotAppId") && store.has("qqbotSecret"));
                out.put("llmConfigured", store.has("llmApiKey"));
                out.put("provider", p.getString("provider", "relay"));
                out.put("model", p.getString("model", "deepseek-chat"));
                out.put("baseUrl", p.getString("baseUrl", ""));
                out.put("activeRole", p.getString("activeRole", "shiny-colors.nanoka"));
                out.put("privateRole", p.getString("privateRole", "shiny-colors.nanoka"));
                out.put("groupRole", p.getString("groupRole", "shiny-colors.nanoka"));
                return out.toString();
            } catch (Exception error) { return "{}"; }
        }

        @JavascriptInterface public void start() { runOnUiThread(() -> startForegroundService(new Intent(MainActivity.this, BotRuntimeService.class))); }
        @JavascriptInterface public void stop() { runOnUiThread(() -> stopService(new Intent(MainActivity.this, BotRuntimeService.class))); }
        @JavascriptInterface public void restart() {
            runOnUiThread(() -> {
                Intent intent = new Intent(MainActivity.this, BotRuntimeService.class);
                stopService(intent);
                new Handler(Looper.getMainLooper()).postDelayed(() -> startForegroundService(intent), 1400L);
            });
        }

        @JavascriptInterface public boolean saveConfig(String raw) {
            try {
                JSONObject input = new JSONObject(raw);
                CredentialStore store = new CredentialStore(MainActivity.this);
                if (input.optString("appId").trim().length() > 0) store.save("qqbotAppId", input.optString("appId").trim());
                if (input.optString("secret").length() > 0) store.save("qqbotSecret", input.optString("secret"));
                if (input.optString("apiKey").length() > 0) store.save("llmApiKey", input.optString("apiKey"));
                getSharedPreferences("public-config", MODE_PRIVATE).edit()
                        .putString("provider", input.optString("provider", "relay"))
                        .putString("model", input.optString("model", "deepseek-chat"))
                        .putString("baseUrl", input.optString("baseUrl", ""))
                        .apply();
                return true;
            } catch (Exception error) { return false; }
        }

        @JavascriptInterface public boolean saveRole(String raw) {
            try { new RoleCardStore(MainActivity.this).save(new JSONObject(raw)); return true; }
            catch (Exception error) { return false; }
        }

        @JavascriptInterface public String roles() {
            try {
                org.json.JSONArray out = new org.json.JSONArray();
                addBuiltin(out, "nanoka", "七草日花", "日花", "内置角色");
                addBuiltin(out, "hazuki", "七草はづき", "はづき,羽月", "内置角色");
                addBuiltin(out, "tsun", "傲娇助手", "傲娇", "内置角色");
                addBuiltin(out, "tooru", "浅仓透", "透", "内置角色");
                addBuiltin(out, "whale", "鲸鱼", "鲸鱼", "内置角色");
                for (JSONObject card : new RoleCardStore(MainActivity.this).list()) {
                    card.put("builtin", false);
                    out.put(card);
                }
                return out.toString();
            } catch (Exception error) { return "[]"; }
        }

        private void addBuiltin(org.json.JSONArray out, String shortId, String name, String aliases, String description) throws Exception {
            String prompt = "";
            try (java.io.InputStream input = getAssets().open("runtime/presets/preset." + shortId + ".md")) {
                java.io.ByteArrayOutputStream bytes = new java.io.ByteArrayOutputStream();
                byte[] buffer = new byte[4096]; int count;
                while ((count = input.read(buffer)) >= 0) bytes.write(buffer, 0, count);
                prompt = new String(bytes.toByteArray(), StandardCharsets.UTF_8);
                int marker = prompt.indexOf("---", 3);
                if (marker >= 0) prompt = prompt.substring(marker + 3).trim();
            } catch (Exception ignored) { }
            if (prompt.trim().isEmpty()) return;
            JSONObject card = new JSONObject();
            card.put("id", "shiny-colors." + shortId); card.put("displayName", name); card.put("description", description); card.put("prompt", prompt);
            card.put("aliases", new org.json.JSONArray(aliases.split(","))); card.put("builtin", true);
            out.put(card);
        }

        @JavascriptInterface public boolean deleteRole(String id) {
            return id != null && new RoleCardStore(MainActivity.this).delete(id);
        }

        @JavascriptInterface public boolean saveRoleScope(String privateRole, String groupRole) {
            getSharedPreferences("public-config", MODE_PRIVATE).edit()
                    .putString("privateRole", privateRole == null ? "" : privateRole)
                    .putString("groupRole", groupRole == null ? "" : groupRole)
                    .commit();
            try {
                CredentialStore credentials = new CredentialStore(MainActivity.this);
                String appId = credentials.has("qqbotAppId") ? credentials.read("qqbotAppId") : "";
                if (appId.isEmpty()) return false;
                File file = new File(getFilesDir(), "runtime/.dsh-qqbot/model-prefs.json");
                JSONObject data = file.isFile() ? new JSONObject(new String(Files.readAllBytes(file.toPath()), StandardCharsets.UTF_8)) : new JSONObject();
                JSONObject presets = data.optJSONObject("presets");
                if (presets == null) { presets = new JSONObject(); data.put("presets", presets); }
                presets.put("qqbot:" + appId + ":private:*", privateRole == null ? "" : privateRole);
                presets.put("qqbot:" + appId + ":group:*", groupRole == null ? "" : groupRole);
                file.getParentFile().mkdirs();
                Files.write(file.toPath(), (data.toString(2) + "\n").getBytes(StandardCharsets.UTF_8));
                return true;
            } catch (Exception error) { return false; }
        }

        @JavascriptInterface public void copy(String value) {
            ClipboardManager clipboard = (ClipboardManager) getSystemService(CLIPBOARD_SERVICE);
            clipboard.setPrimaryClip(ClipData.newPlainText("QQ 会话指令", value));
        }

        @JavascriptInterface public String checkUpdate() { return UpdateChecker.check(); }

        @JavascriptInterface public void openRelease(String url) {
            UpdateChecker.openRelease(MainActivity.this, url);
        }
    }
}

