import { useState } from "react";
import { Linking, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { listCodec } from "../../lib/persist";
import {
  type ShortLink,
  createLink,
  isShortLink,
  recordClick,
  removeLink,
  shortUrl,
  totalClicks,
} from "../../lib/shortener";
import { usePersistentState } from "../../lib/usePersistentState";

const linksCodec = listCodec(isShortLink);

export default function LinksScreen() {
  const [links, setLinks] = usePersistentState<ShortLink[]>("shortener.links.v1", [], linksCodec);
  const [url, setUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  const shorten = () => {
    try {
      const result = createLink(links, { url, alias }, Date.now());
      setLinks(result.links);
      setMessage({
        text: result.existing ? `Already shortened: ${shortUrl(result.link.code)}` : `Created ${shortUrl(result.link.code)}`,
        error: false,
      });
      setUrl("");
      setAlias("");
    } catch (e) {
      setMessage({ text: (e as Error).message, error: true });
    }
  };

  const open = async (link: ShortLink) => {
    setLinks((list) => recordClick(list, link.code, Date.now()));
    try {
      await Linking.openURL(link.url);
    } catch {
      setMessage({ text: `Could not open ${link.url}`, error: true });
    }
  };

  const share = (link: ShortLink) => Share.share({ message: shortUrl(link.code) }).catch(() => undefined);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <TextInput
          accessibilityLabel="Long URL"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          onChangeText={setUrl}
          placeholder="https://example.com/very/long/link"
          style={styles.input}
          value={url}
        />
        <TextInput
          accessibilityLabel="Custom alias (optional)"
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setAlias}
          placeholder="Custom alias (optional)"
          style={styles.input}
          value={alias}
        />
        <Pressable accessibilityRole="button" accessibilityLabel="Shorten URL" onPress={shorten} style={styles.button}>
          <Text style={styles.buttonText}>Shorten</Text>
        </Pressable>
        {message && (
          <Text accessibilityLiveRegion="polite" style={message.error ? styles.error : styles.ok}>
            {message.text}
          </Text>
        )}
      </View>

      <Text style={styles.summary}>
        {links.length} links · {totalClicks(links)} clicks
      </Text>

      {links.length === 0 && <Text style={styles.empty}>Shortened links will appear here.</Text>}
      {links.map((link) => (
        <View key={link.code} style={styles.link}>
          <Text selectable style={styles.short}>
            {shortUrl(link.code)}
          </Text>
          <Text numberOfLines={1} style={styles.long}>
            {link.url}
          </Text>
          <View style={styles.row}>
            <Text style={styles.clicks}>{link.clicks} clicks</Text>
            <Pressable accessibilityLabel={`Open ${link.url}`} accessibilityRole="link" onPress={() => open(link)}>
              <Text style={styles.action}>Open</Text>
            </Pressable>
            <Pressable accessibilityLabel={`Share ${shortUrl(link.code)}`} accessibilityRole="button" onPress={() => share(link)}>
              <Text style={styles.action}>Share</Text>
            </Pressable>
            <Pressable
              accessibilityLabel={`Delete ${shortUrl(link.code)}`}
              accessibilityRole="button"
              onPress={() => setLinks((list) => removeLink(list, link.code))}
            >
              <Text style={[styles.action, styles.danger]}>Delete</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  content: { padding: 16, gap: 10 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 12, gap: 8 },
  input: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  button: { backgroundColor: "#2F6DB5", borderRadius: 8, paddingVertical: 10, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600" },
  error: { color: "#C62828" },
  ok: { color: "#2E7D32" },
  summary: { fontWeight: "600", color: "#333" },
  empty: { color: "#666", textAlign: "center", marginTop: 16 },
  danger: { color: "#B00020" },

  link: { backgroundColor: "#fff", borderRadius: 12, padding: 12, gap: 4 },
  short: { fontSize: 16, fontWeight: "700", color: "#2F6DB5" },
  long: { color: "#555", fontSize: 13 },
  row: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 4 },
  clicks: { flex: 1, color: "#333" },
  action: { color: "#2F6DB5", fontWeight: "600", paddingVertical: 4 },
});
