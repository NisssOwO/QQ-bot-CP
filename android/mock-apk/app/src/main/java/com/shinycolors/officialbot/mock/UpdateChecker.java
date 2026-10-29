package com.shinycolors.officialbot.mock;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import org.json.JSONObject;

final class UpdateChecker {
    static final String CURRENT_VERSION = "0.2.3";
    private static final String RELEASES_URL = "https://api.github.com/repos/NisssOwO/QQ-bot-CP/releases/latest";

    private UpdateChecker() { }

    static String check() {
        HttpURLConnection connection = null;
        try {
            connection = (HttpURLConnection) new URL(RELEASES_URL).openConnection();
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(8000);
            connection.setReadTimeout(8000);
            connection.setRequestProperty("Accept", "application/vnd.github+json");
            connection.setRequestProperty("User-Agent", "QQ-bot-CP/" + CURRENT_VERSION);
            int code = connection.getResponseCode();
            if (code < 200 || code >= 300) return error("GitHub 返回 HTTP " + code);
            StringBuilder body = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream(), "UTF-8"))) {
                String line;
                while ((line = reader.readLine()) != null) body.append(line);
            }
            JSONObject release = new JSONObject(body.toString());
            String tag = release.optString("tag_name", "").trim();
            String latest = tag.startsWith("v") ? tag.substring(1) : tag;
            JSONObject out = new JSONObject();
            out.put("ok", !latest.isEmpty());
            out.put("currentVersion", CURRENT_VERSION);
            out.put("latestVersion", latest);
            out.put("hasUpdate", compare(latest, CURRENT_VERSION) > 0);
            out.put("name", release.optString("name", tag));
            out.put("body", release.optString("body", ""));
            out.put("url", release.optString("html_url", "https://github.com/NisssOwO/QQ-bot-CP/releases"));
            return out.toString();
        } catch (Exception error) {
            return error(error.getMessage() == null ? "无法连接 GitHub" : error.getMessage());
        } finally {
            if (connection != null) connection.disconnect();
        }
    }

    private static int compare(String left, String right) {
        try {
            String[] a = left.split("\\."), b = right.split("\\.");
            for (int i = 0; i < Math.max(a.length, b.length); i++) {
                int x = i < a.length ? Integer.parseInt(a[i].replaceAll("[^0-9].*", "")) : 0;
                int y = i < b.length ? Integer.parseInt(b[i].replaceAll("[^0-9].*", "")) : 0;
                if (x != y) return Integer.compare(x, y);
            }
        } catch (Exception ignored) { }
        return left.compareTo(right);
    }

    private static String error(String message) {
        try { return new JSONObject().put("ok", false).put("error", message).put("currentVersion", CURRENT_VERSION).toString(); }
        catch (Exception ignored) { return "{\"ok\":false}"; }
    }

    static void openRelease(Context context, String url) {
        try { context.startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))); }
        catch (Exception ignored) { }
    }
}
