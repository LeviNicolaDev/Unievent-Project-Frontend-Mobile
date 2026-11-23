import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useEffect, useState } from "react";

import CancelRegistrationButton from '../components/CancelRegistrationButton';
import BottomNav from "../components/BottomNav";
import Screen from "../components/Screen";
import { BLACK, LIGHT_BG, ORANGE } from "../constants/theme";
import { useEvents } from "../context/EventContext";
import { useAuth } from "../context/AuthContext";
import { eventsApi } from "../services/api";
import { generateCertificatePdf } from "../utils/certificatePdf";
import { styles } from "../styles/globalStyles";

export default function TicketQrScreen({ theme, navigation, route }) {
  const isLight = theme.mode === "light";
  const {
    getEventById,
    hasAttended,
    hasIssuedCertificate,
    refreshEvents,
    isCancelled,
  } = useEvents();
  const { token } = useAuth();
  useFocusEffect(useCallback(() => { void refreshEvents(); }, [refreshEvents]));
  const event = getEventById(route.params?.eventId);
  const [ticketCode, setTicketCode] = useState(null);
  const [ticketError, setTicketError] = useState(null);
  const attended = event ? hasAttended(event.id) : false;
  const cancelled = event ? isCancelled(event.id) : false;
  const qrRead = attended;
  const certificateIssued = event ? hasIssuedCertificate(event.id) : false;

  useEffect(() => {
    let active = true;
    setTicketCode(null);
    setTicketError(null);
    if (!event || event.isDemo || !token || cancelled) return;
    eventsApi.getTicket(event.id, token)
      .then((ticket) => {
        if (active && String(ticket.statusInscricao ?? ticket.StatusInscricao).toLowerCase() !== "cancelada")
          setTicketCode(ticket.codigoIngresso ?? ticket.CodigoIngresso);
      })
      .catch((error) => active && setTicketError(error.message));
    return () => { active = false; };
  }, [event?.id, event?.isDemo, token, cancelled]);

  if (!event || event.isDemo) {
    return (
      <Screen theme={theme} bg={isLight ? LIGHT_BG : BLACK}>
        <Text style={{ color: theme.text }}>Ingresso indisponível. Atualize a lista de eventos.</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Home")}>
          <Text style={{ color: theme.text }}>Voltar aos eventos</Text>
        </TouchableOpacity>
      </Screen>
    );
  }

  async function handleCertificatePress() {
    try {
      await generateCertificatePdf({ event, token });
    } catch (error) {
      Alert.alert("Certificado indisponível", error.message);
    }
  }

  return (
    <Screen theme={theme} bg={isLight ? LIGHT_BG : BLACK}>
      <View style={styles.qrScreen}>
        <View style={styles.qrTop}>
          <TouchableOpacity
            onPress={() =>
              navigation.canGoBack()
                ? navigation.goBack()
                : navigation.navigate("Home")
            }
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={isLight ? BLACK : ORANGE}
            />
          </TouchableOpacity>

          <Text style={[styles.qrHeaderTitle, { color: theme.text }]}>
            Validar ingresso
          </Text>

          <View style={{ width: 22 }} />
        </View>

        <View style={styles.qrCard}>
          <Text style={styles.qrEventTitle}>{event.title}</Text>

          <Text style={styles.qrInfo}>
            {event.fullDate || event.date} • {event.displayTime || event.time}
          </Text>
          <Text style={styles.qrInfo}>
            {event.local || event.location || event.place}
          </Text>

          <View style={styles.qrBox}>
            {ticketCode ? <QRCode
              value={ticketCode}
              size={210}
              backgroundColor="#FFFFFF"
              color="#000000"
            /> : <Text>{cancelled ? "Inscrição cancelada" : ticketError || "Carregando ingresso..."}</Text>}
          </View>

          {ticketCode ? <Text style={styles.qrCodeText}>Código: {ticketCode}</Text> : null}

          <Text style={styles.qrHelpText}>
            {cancelled ? "Sua inscrição foi cancelada. Este ingresso não permite check-in." : "Apresente este QR Code na entrada do evento para validar seu ingresso."}
          </Text>

          {!cancelled && !attended && ticketCode && (
            <CancelRegistrationButton eventId={event.id} theme={theme}
              onCancelled={() => navigation.navigate("Ticket")} />
          )}
          <TouchableOpacity onPress={refreshEvents} accessibilityRole="button">
            <Text style={styles.qrHelpText}>Atualizar presença</Text>
          </TouchableOpacity>
          <View style={styles.qrActions}>
            {qrRead ? (
              <>
                <View style={styles.qrReadBadge}>
                  <Ionicons name="checkmark-circle" size={18} color={ORANGE} />
                  <Text style={styles.qrReadText}>Presença confirmada</Text>
                </View>

                {event.hasCertificate && event.certificate ? (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    disabled={!certificateIssued || !attended}
                    onPress={handleCertificatePress}
                    style={[
                      styles.certificateButton,
                      (!certificateIssued || !attended) &&
                        styles.certificateButtonDisabled,
                    ]}
                  >
                    <Ionicons
                      name={
                        certificateIssued
                          ? "checkmark-done"
                          : "document-text-outline"
                      }
                      size={18}
                      color="#FFFFFF"
                    />
                    <Text style={styles.certificateButtonText}>
                      {certificateIssued
                        ? "Abrir certificado"
                        : attended
                        ? "Certificado em preparação"
                        : "Validando presença..."}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.certificateUnavailableBadge}>
                    <Ionicons
                      name="information-circle-outline"
                      size={17}
                      color="#DADADA"
                    />
                    <Text style={styles.certificateUnavailableText}>
                      Este evento não emite certificado
                    </Text>
                  </View>
                )}
              </>
            ) : !cancelled ? <Text style={styles.qrHelpText}>A presença será confirmada por um operador na entrada.</Text> : null}
          </View>
        </View>
      </View>

      <BottomNav navigation={navigation} routeName={route.name} theme={theme} />
    </Screen>
  );
}
