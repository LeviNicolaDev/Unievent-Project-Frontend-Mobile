import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { BLACK, ORANGE } from "../constants/theme";
import { preferencesApi } from "../services/api";
import { styles } from "../styles/globalStyles";
import { INTEREST_CATEGORIES, normalizeNotificationPreferences } from "../utils/notificationPreferences";

export default function ProfileInterests({ token, theme, onEdit }) {
  const [snapshot, setSnapshot] = useState(null);
  const [retry, setRetry] = useState(0);
  const isLight = theme.mode === "light";

  useFocusEffect(useCallback(() => {
    let active = true;
    setSnapshot({ token, loading: Boolean(token), categories: [], error: "" });
    if (token) {
      preferencesApi.get(token).then(item => {
        if (active) setSnapshot({
          token, loading: false, categories: normalizeNotificationPreferences(item).categorias, error: "",
        });
      }).catch(error => {
        if (active) setSnapshot({
          token, loading: false, categories: [],
          error: error.message || "Não foi possível carregar seus interesses.",
        });
      });
    }
    return () => { active = false; };
  }, [token, retry]));

  // Never show interests belonging to a previously authenticated account.
  const current = snapshot?.token === token ? snapshot : null;
  if (!token) return <Text style={{ color: theme.soft }}>Faça login para visualizar seus interesses.</Text>;
  if (!current || current.loading)
    return <Text accessibilityLiveRegion="polite" style={{ color: theme.soft }}>Carregando interesses...</Text>;
  if (current.error) return <View style={{ gap: 8 }}>
    <Text accessibilityRole="alert" style={{ color: theme.text }}>{current.error}</Text>
    <TouchableOpacity accessibilityRole="button" onPress={() => setRetry(value => value + 1)}
      style={{ minHeight: 44, justifyContent: "center", alignSelf: "flex-start" }}>
      <Text style={{ color: theme.text, fontWeight: "800" }}>Tentar novamente</Text>
    </TouchableOpacity>
  </View>;

  const selected = INTEREST_CATEGORIES.filter(category => current.categories.includes(category.value));
  return <View style={{ gap: 12 }}>
    {selected.length ? (
      <View style={styles.profileTags}>
        {selected.map(category => (
          <View key={category.value} style={[styles.profileTag, {
            borderColor: isLight ? BLACK : ORANGE,
            backgroundColor: isLight ? "transparent" : "#1A1A1A",
          }]}>
            <Text style={[styles.profileTagText, { color: isLight ? BLACK : "#FFFFFF" }]}>
              {category.label}
            </Text>
          </View>
        ))}
      </View>
    ) : <Text style={{ color: theme.soft }}>Você ainda não selecionou interesses.</Text>}
    <TouchableOpacity accessibilityRole="button" onPress={onEdit}
      style={{ minHeight: 44, justifyContent: "center", alignSelf: "flex-start" }}>
      <Text style={{ color: theme.text, fontWeight: "800" }}>
        {selected.length ? "Editar interesses" : "Escolher interesses"}
      </Text>
    </TouchableOpacity>
  </View>;
}
