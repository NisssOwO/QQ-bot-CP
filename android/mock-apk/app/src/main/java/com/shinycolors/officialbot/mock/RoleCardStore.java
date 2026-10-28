package com.shinycolors.officialbot.mock;

import android.content.Context;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;

final class RoleCardStore {
    private final File root;
    RoleCardStore(Context context) {
        root = new File(context.getFilesDir(), "runtime/user-presets");
        root.mkdirs();
    }

    List<JSONObject> list() {
        List<JSONObject> result = new ArrayList<>();
        File[] files = root.listFiles((dir, name) -> name.endsWith(".json"));
        if (files == null) return result;
        for (File file : files) try { result.add(new JSONObject(read(file))); } catch (Exception ignored) { }
        return result;
    }

    JSONObject get(String id) {
        for (JSONObject card : list()) if (id.equals(card.optString("id"))) return card;
        return null;
    }

    synchronized JSONObject save(JSONObject input) throws Exception {
        String id = input.optString("id", "").trim();
        if (!id.matches("custom\\.[a-z0-9][a-z0-9._-]{0,48}")) throw new IllegalArgumentException("id must match custom.<slug>");
        String displayName = input.optString("displayName", id.substring("custom.".length())).trim();
        String prompt = input.optString("prompt", "").trim();
        if (displayName.isEmpty() || prompt.isEmpty()) throw new IllegalArgumentException("displayName and prompt are required");
        JSONObject card = new JSONObject();
        card.put("id", id);
        card.put("displayName", displayName);
        card.put("description", input.optString("description", ""));
        card.put("aliases", input.optJSONArray("aliases") == null ? new JSONArray() : input.optJSONArray("aliases"));
        card.put("prompt", prompt);
        String slug = id.substring("custom.".length());
        write(new File(root, "preset." + slug + ".json"), card.toString(2));
        StringBuilder md = new StringBuilder("---\n");
        md.append("name: ").append(displayName.replace("\n", " ")).append("\n");
        md.append("description: ").append(card.optString("description").replace("\n", " ")).append("\n---\n\n");
        md.append(prompt).append("\n");
        write(new File(root, "preset." + slug + ".md"), md.toString());
        return card;
    }

    synchronized boolean delete(String id) {
        if (!id.startsWith("custom.")) return false;
        String slug = id.substring("custom.".length());
        boolean a = new File(root, "preset." + slug + ".json").delete();
        boolean b = new File(root, "preset." + slug + ".md").delete();
        return a || b;
    }

    private static String read(File file) throws Exception { return new String(Files.readAllBytes(file.toPath()), StandardCharsets.UTF_8); }
    private static void write(File file, String value) throws Exception { Files.write(file.toPath(), value.getBytes(StandardCharsets.UTF_8)); }
}
