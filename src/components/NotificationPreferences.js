import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Switch, Text, TouchableOpacity, View } from "react-native";
import { BLACK, ORANGE } from "../constants/theme";
import { preferencesApi } from "../services/api";
import { styles } from "../styles/globalStyles";
import { INTEREST_CATEGORIES, normalizeNotificationPreferences } from "../utils/notificationPreferences";

const notificationItems = [
  { key: "lembretesEventos", title: "Lembretes de eventos", icon: "notifications-outline",
    description: "Permite avisos automáticos de eventos por e-mail." },
  { key: "alertasCertificados", title: "Avisos de certificado", icon: "document-text-outline",
    description: "Permite avisos relacionados aos seus certificados." },
  { key: "recomendacoes", title: "Recomendações por interesse", icon: "heart-outline",
    description: "Receba por e-mail sugestões conforme as categorias escolhidas." },
];

export default function NotificationPreferences({ token, theme }) {
  const [preferences, setPreferences] = useState(normalizeNotificationPreferences);
  const [loading, setLoading] = useState(Boolean(token));
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [retry, setRetry] = useState(0);
  const currentToken = useRef(token);
  currentToken.current = token;
  const isLight = theme.mode === "light";

  useEffect(() => {
    let active = true;
    setReady(false);
    setDirty(false);
    setError("");
    setMessage("");
    setSaving(false);
    setPreferences(normalizeNotificationPreferences());
    setLoading(Boolean(token));
    if (token) {
      preferencesApi.get(token).then(item => {
        if (!active) return;
        setPreferences(normalizeNotificationPreferences(item));
        setReady(true);
      }).catch(err => {
        if (active) setError(err.message || "Não foi possível carregar suas preferências.");
      }).finally(() => { if (active) setLoading(false); });
    }
    return () => { active = false; };
  }, [token, retry]);

  function update(key, value) {
    if (!ready || saving) return;
    setPreferences(current => ({ ...current, [key]: value }));
    setDirty(true);
    setError("");
    setMessage("");
  }

  function toggleCategory(value) {
    update("categorias", preferences.categorias.includes(value)
      ? preferences.categorias.filter(category => category !== value)
      : [...preferences.categorias, value]);
  }

  async function save() {
    if (!ready || saving || !dirty) return;
    const savedToken = token;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const item = await preferencesApi.update(token, preferences);
      if (currentToken.current !== savedToken) return;
      setPreferences(normalizeNotificationPreferences(item));
      setDirty(false);
      setMessage("Preferências salvas.");
    } catch (err) {
      if (currentToken.current === savedToken)
        setError(err.message || "Não foi possível salvar. Suas alterações foram mantidas para tentar novamente.");
    } finally {
      if (currentToken.current === savedToken) setSaving(false);
    }
  }

  if (!token) return <Text style={{ color: theme.soft, padding: 16 }}>Faça login para escolher seus interesses.</Text>;
  if (loading) return <Text accessibilityLiveRegion="polite" style={{ color: theme.soft, padding: 16 }}>Carregando preferências...</Text>;
  if (!ready) return <View style={{ padding: 16, gap: 12 }}>
    <Text accessibilityRole="alert" style={{ color: theme.text }}>{error}</Text>
    <TouchableOpacity accessibilityRole="button" onPress={() => setRetry(value => value + 1)}
      style={{ minHeight: 46, justifyContent: "center" }}>
      <Text style={{ color: theme.text, fontWeight: "800" }}>Tentar novamente</Text>
    </TouchableOpacity>
  </View>;

  return <>
    {notificationItems.map(item => (
      <View key={item.key} style={styles.settingsRow}>
        <View style={[styles.settingsRowIcon, { backgroundColor: isLight ? "#F2F2F2" : "#2B2B2B" }]}>
          <Ionicons name={item.icon} size={18} color={isLight ? BLACK : ORANGE} />
        </View>
        <View style={styles.settingsRowText}>
          <Text style={[styles.settingsRowTitle, { color: theme.text }]}>{item.title}</Text>
          <Text style={[styles.settingsRowDescription, { color: theme.soft }]}>{item.description}</Text>
        </View>
        <Switch accessibilityLabel={item.title} value={preferences[item.key]} disabled={saving}
          onValueChange={value => update(item.key, value)}
          trackColor={{ false: "#767577", true: ORANGE }} thumbColor="#FFFFFF" />
      </View>
    ))}
    <View style={{ padding: 16, gap: 12 }}>
      <Text style={[styles.settingsSectionTitle, { color: theme.text }]}>Meus interesses</Text>
      <Text style={{ color: theme.soft, lineHeight: 20 }}>
        Selecione as categorias de eventos que você gosta. Você pode escolher mais de uma.
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {INTEREST_CATEGORIES.map(category => {
          const selected = preferences.categorias.includes(category.value);
          return <TouchableOpacity key={category.value} accessibilityRole="checkbox"
            accessibilityLabel={category.label} accessibilityState={{ checked: selected, disabled: saving }}
            disabled={saving} onPress={() => toggleCategory(category.value)}
            style={{ minHeight: 46, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10,
              borderWidth: 1, borderColor: selected ? ORANGE : theme.soft,
              backgroundColor: selected ? "#FFEDD5" : "transparent",
              flexDirection: "row", alignItems: "center", gap: 8, opacity: saving ? 0.6 : 1 }}>
            {selected && <Ionicons name="checkmark" size={17} color={BLACK} />}
            <Text style={{ color: selected ? BLACK : theme.text, fontWeight: "800" }}>{category.label}</Text>
          </TouchableOpacity>;
        })}
      </View>
      <Text style={{ color: theme.soft, lineHeight: 20 }}>
        Para receber sugestões, ative Lembretes de eventos e Recomendações por interesse.
        A automação também pode recomendar eventos nos próximos sete dias.
      </Text>
      {dirty && <Text style={{ color: theme.soft }}>Você tem alterações não salvas.</Text>}
      {error ? <Text accessibilityRole="alert" style={{ color: theme.text }}>{error}</Text> : null}
      {message ? <Text accessibilityLiveRegion="polite" style={{ color: theme.text }}>{message}</Text> : null}
      <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: saving || !dirty, busy: saving }}
        disabled={saving || !dirty} onPress={save}
        style={{ minHeight: 48, borderRadius: 10, padding: 14, alignItems: "center",
          justifyContent: "center", backgroundColor: ORANGE, opacity: saving || !dirty ? 0.5 : 1 }}>
        <Text style={{ color: BLACK, fontWeight: "900" }}>{saving ? "Salvando..." : "Salvar preferências"}</Text>
      </TouchableOpacity>
    </View>
  </>;
}
