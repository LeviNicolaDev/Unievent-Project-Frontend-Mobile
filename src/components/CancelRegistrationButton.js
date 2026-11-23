import { useState } from "react";
import { Alert, Platform, Text, TouchableOpacity } from "react-native";
import { useEvents } from "../context/EventContext";

export default function CancelRegistrationButton({ eventId, theme, onCancelled }) {
  const { cancelRegistration } = useEvents();
  const [busy, setBusy] = useState(false);
  async function cancel() {
    if (busy) return;
    setBusy(true);
    try {
      await cancelRegistration(eventId);
      onCancelled?.();
    } catch (error) {
      Alert.alert("Não foi possível cancelar", error.message);
    } finally {
      setBusy(false);
    }
  }
  function confirm() {
    if (Platform.OS === "web") {
      if (window.confirm("Deseja cancelar sua inscrição neste evento?")) cancel();
      return;
    }
    Alert.alert("Cancelar inscrição", "Deseja cancelar sua inscrição neste evento?", [
      { text: "Manter inscrição", style: "cancel" },
      { text: "Cancelar inscrição", style: "destructive", onPress: cancel },
    ]);
  }
  return (
    <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={confirm}
      style={{ minHeight: 48, padding: 14, marginTop: 12, borderWidth: 1,
        borderColor: theme.soft, borderRadius: 10, alignItems: "center", opacity: busy ? 0.6 : 1 }}>
      <Text style={{ color: theme.text }}>{busy ? "Cancelando..." : "Cancelar inscrição"}</Text>
    </TouchableOpacity>
  );
}
