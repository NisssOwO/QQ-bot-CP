package com.shinycolors.officialbot.mock;

import android.content.Context;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import org.json.JSONArray;
import org.json.JSONObject;

final class LoopbackApiServer implements Runnable {
    private final Context context;
    private final ServerSocket server;
    private final String token;
    private final CredentialStore credentials;
    private final RoleCardStore roles;

    LoopbackApiServer(Context context, ServerSocket server, String token) {
        this.context = context;
        this.server = server;
        this.token = token;
        this.credentials = new CredentialStore(context);
        this.roles = new RoleCardStore(context);
    }

    @Override public void run() {
        while (!server.isClosed()) {
            try { handle(server.accept()); } catch (IOException ignored) { }
        }
    }

    private void handle(Socket socket) throws IOException {
        try {
            BufferedReader reader = new BufferedReader(new InputStreamReader(socket.getInputStream(), StandardCharsets.US_ASCII));
            String request = reader.readLine();
            if (request == null) return;
            String line;
            boolean authorized = false;
            int contentLength = 0;
            while (!(line = reader.readLine()).isEmpty()) {
                if (line.regionMatches(true, 0, "Authorization: Bearer ", 0, 21)) {
                    authorized = token.equals(line.substring(21).trim());
                }
                if (line.regionMatches(true, 0, "Content-Length:", 0, 15)) contentLength = Integer.parseInt(line.substring(15).trim());
            }
            char[] bodyChars = new char[contentLength];
            if (contentLength > 0) reader.read(bodyChars);
            String body = new String(bodyChars);
            String[] parts = request.split(" ");
            String path = parts.length > 1 ? parts[1] : "/";
            if (!authorized) { send(socket, 401, "{\"code\":\"unauthorized\"}"); return; }
            if ("/v1/status".equals(path)) {
                boolean running = context.getSharedPreferences(BotRuntimeService.PREFS, Context.MODE_PRIVATE).getBoolean("running", false);
                String installError = context.getSharedPreferences(BotRuntimeService.PREFS, Context.MODE_PRIVATE).getString("runtimeInstallError", "");
                String startError = context.getSharedPreferences(BotRuntimeService.PREFS, Context.MODE_PRIVATE).getString("runtimeStartError", "");
                String lastError = context.getSharedPreferences(BotRuntimeService.PREFS, Context.MODE_PRIVATE).getString("runtimeLastError", "");
                String lastOutput = context.getSharedPreferences(BotRuntimeService.PREFS, Context.MODE_PRIVATE).getString("runtimeLastOutput", "");
                int exitCode = context.getSharedPreferences(BotRuntimeService.PREFS, Context.MODE_PRIVATE).getInt("runtimeExitCode", -1);
                send(socket, 200, "{\"state\":\"" + (running ? "ONLINE" : "STOPPED") + "\",\"mock\":true,\"runtimeInstallError\":\"" + escape(installError) + "\",\"runtimeStartError\":\"" + escape(startError) + "\",\"runtimeLastError\":\"" + escape(lastError) + "\",\"runtimeLastOutput\":\"" + escape(lastOutput) + "\",\"runtimeExitCode\":" + exitCode + "}");
            } else if ("/v1/roles".equals(path) && request.startsWith("GET ")) {
                send(socket, 200, rolesJson());
            } else if ("/v1/roles".equals(path) && request.startsWith("POST ")) {
                try { send(socket, 200, roles.save(new JSONObject(body)).toString()); }
                catch (Exception error) { send(socket, 400, "{\"code\":\"invalid_role_card\",\"message\":\"" + escape(error.getMessage()) + "\"}"); }
            } else if (path.startsWith("/v1/roles/") && request.startsWith("GET ")) {
                JSONObject card = roles.get(path.substring("/v1/roles/".length()));
                send(socket, card == null ? 404 : 200, card == null ? "{\"code\":\"not_found\"}" : card.toString());
            } else if (path.startsWith("/v1/roles/") && request.startsWith("DELETE ")) {
                send(socket, roles.delete(path.substring("/v1/roles/".length())) ? 200 : 404, "{\"deleted\":true}");
            } else if ("/v1/roles/active".equals(path) && request.startsWith("PUT ")) {
                savePublicIfPresent(body, "activeRole", "shiny-colors.nanoka");
                send(socket, 200, publicConfig());
            } else if ("/v1/logs".equals(path)) {
                send(socket, 200, "{\"items\":[\"mock runtime ready\"]}");
            } else if ("/v1/config/credentials".equals(path) && request.startsWith("POST ")) {
                try {
                    saveIfPresent(body, "qqbotAppId");
                    saveIfPresent(body, "qqbotSecret");
                    saveIfPresent(body, "llmApiKey");
                    send(socket, 200, "{\"saved\":true,\"configured\":{\"qqbotAppId\":" + credentials.has("qqbotAppId") + ",\"qqbotSecret\":" + credentials.has("qqbotSecret") + ",\"llmApiKey\":" + credentials.has("llmApiKey") + "}}");
                } catch (IOException error) {
                    send(socket, 500, "{\"code\":\"credential_store_failed\",\"retryable\":false}");
                }
            } else if ("/v1/config/credentials".equals(path)) {
                send(socket, 200, "{\"configured\":{\"qqbotAppId\":" + credentials.has("qqbotAppId") + ",\"qqbotSecret\":" + credentials.has("qqbotSecret") + ",\"llmApiKey\":" + credentials.has("llmApiKey") + "}}");
            } else if ("/v1/config/public".equals(path) && request.startsWith("PUT ")) {
                savePublicIfPresent(body, "provider", "relay");
                savePublicIfPresent(body, "model", "deepseek-chat");
                savePublicIfPresent(body, "baseUrl", "https://api.example.com/v1");
                savePublicIfPresent(body, "defaultRole", "shiny-colors.nanoka");
                send(socket, 200, publicConfig());
            } else if ("/v1/config/public".equals(path)) {
                send(socket, 200, publicConfig());
            } else {
                send(socket, 404, "{\"code\":\"not_found\"}");
            }
        } finally {
            socket.close();
        }
    }

    private void saveIfPresent(String json, String jsonName) throws IOException {
        String marker = "\"" + jsonName + "\"";
        int start = json.indexOf(marker);
        if (start < 0) return;
        start = json.indexOf(':', start) + 1;
        while (start < json.length() && Character.isWhitespace(json.charAt(start))) start++;
        if (start >= json.length() || json.charAt(start) != '\"') return;
        int end = json.indexOf('\"', start + 1);
        if (end < 0) return;
        try { credentials.save(jsonName, json.substring(start + 1, end)); }
        catch (Exception error) { throw new IOException("credential encryption failed", error); }
    }

    private void savePublicIfPresent(String json, String name, String fallback) {
        String marker = "\"" + name + "\"";
        int start = json.indexOf(marker);
        if (start < 0) return;
        start = json.indexOf(':', start) + 1;
        while (start < json.length() && Character.isWhitespace(json.charAt(start))) start++;
        if (start >= json.length() || json.charAt(start) != '\"') return;
        int end = json.indexOf('\"', start + 1);
        if (end < 0) return;
        context.getSharedPreferences("public-config", Context.MODE_PRIVATE).edit().putString(name, json.substring(start + 1, end)).apply();
    }

    private String publicConfig() {
        android.content.SharedPreferences values = context.getSharedPreferences("public-config", Context.MODE_PRIVATE);
        String provider = values.getString("provider", "relay");
        String model = values.getString("model", "deepseek-chat");
        String baseUrl = values.getString("baseUrl", "https://api.example.com/v1");
        String role = values.getString("defaultRole", "shiny-colors.nanoka");
        String active = values.getString("activeRole", role);
        return "{\"provider\":\"" + escape(provider) + "\",\"model\":\"" + escape(model) + "\",\"baseUrl\":\"" + escape(baseUrl) + "\",\"defaultRole\":\"" + escape(role) + "\",\"activeRole\":\"" + escape(active) + "\"}";
    }

    private String rolesJson() {
        JSONArray items = new JSONArray();
        try {
            addBuiltin(items, "nanoka", "七草日花", "日花");
            addBuiltin(items, "hazuki", "七草はづき", "はづき,羽月");
            addBuiltin(items, "tsun", "傲娇助手", "傲娇助手");
            addBuiltin(items, "tooru", "浅仓透", "");
            addBuiltin(items, "whale", "鲸鱼", "鲸鱼");
        } catch (Exception ignored) { }
        for (JSONObject card : roles.list()) {
            try { card.put("builtin", false); items.put(card); } catch (Exception ignored) { }
        }
        return "{\"roles\":" + items.toString() + "}";
    }

    private void addBuiltin(JSONArray items, String shortId, String displayName, String aliases) {
        try (java.io.InputStream input = context.getAssets().open("runtime/presets/preset." + shortId + ".md")) {
            java.io.ByteArrayOutputStream bytes = new java.io.ByteArrayOutputStream();
            byte[] buffer = new byte[4096]; int count;
            while ((count = input.read(buffer)) >= 0) bytes.write(buffer, 0, count);
            String prompt = new String(bytes.toByteArray(), StandardCharsets.UTF_8);
            int marker = prompt.indexOf("---", 3);
            if (marker >= 0) prompt = prompt.substring(marker + 3).trim();
            if (prompt.isEmpty()) return;
            JSONObject item = new JSONObject();
            item.put("id", "shiny-colors." + shortId); item.put("displayName", displayName);
            item.put("aliases", new JSONArray(aliases.isEmpty() ? "[]" : "[\"" + aliases.replace(",", "\",\"") + "\"]"));
            item.put("prompt", prompt); item.put("builtin", true); items.put(item);
        } catch (Exception ignored) { }
    }

    private static String escape(String value) { return value.replace("\\", "\\\\").replace("\"", "\\\""); }

    private static void send(Socket socket, int code, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        OutputStream out = socket.getOutputStream();
        String response = "HTTP/1.1 " + code + " OK\r\nContent-Type: application/json; charset=utf-8\r\nContent-Length: " + bytes.length + "\r\nConnection: close\r\n\r\n";
        out.write(response.getBytes(StandardCharsets.US_ASCII));
        out.write(bytes);
        out.flush();
    }
}
