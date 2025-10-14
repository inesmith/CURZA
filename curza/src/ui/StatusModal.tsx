import React, { useEffect, useRef } from "react";
import { Modal, View, Text, StyleSheet, Pressable, Animated } from "react-native";

type Variant = "success" | "error";

export default function StatusModal({
  visible,
  message,
  variant = "success",
  autoHideMs = 2200,
  onClose,
}: {
  visible: boolean;
  message: string;
  variant?: Variant;
  autoHideMs?: number;
  onClose?: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();

    const id = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
        onClose?.();
      });
    }, autoHideMs);

    return () => clearTimeout(id);
  }, [visible, autoHideMs, onClose, opacity]);

  if (!visible) return null;

  const isError = variant === "error";

  return (
    <Modal transparent animationType="none" visible>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, { opacity }, isError ? styles.cardError : styles.cardSuccess]}>
          <Text style={[styles.msg, isError ? styles.msgError : styles.msgSuccess]}>{message}</Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const DARK = "#1F2937";

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    minWidth: "35%",
    minHeight: 120,
    borderRadius: 28,
    paddingVertical: 24,
    paddingHorizontal: 20,
    shadowColor: "#0B1220",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    alignItems: "center",
    marginTop: -600,
    justifyContent: "center",
  },
  cardSuccess: {
    backgroundColor: "#F8FAFC", 
  },
  cardError: {
    backgroundColor: "#F8FAFC", 
  },
  msg: {
    textAlign: "center",
    fontFamily: 'AlumniSans_500Medium',
    fontSize: 20,
    lineHeight: 24,
    marginBottom: 8,
  },
  msgSuccess: {
    color: DARK, 
    fontFamily: 'AlumniSans_500Medium',
    fontSize: 20,
  },
  msgError: {
    color: "#EF4444", 
    fontFamily: 'AlumniSans_500Medium',
    fontSize: 20,
  },
});
