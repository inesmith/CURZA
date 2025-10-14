// src/ui/Select.tsx
import React, { useMemo, useState } from "react";
import { Modal, View, Text, Pressable, StyleSheet, ScrollView } from "react-native";

export type Option = { label: string; value: string };

export default function Select({
  placeholder,
  value,
  onChange,
  options,
  style,
  textStyle,
}: {
  placeholder: string;
  value?: string | null;
  onChange: (val: string) => void;
  options: Option[];
  style?: any;
  textStyle?: any;
}) {
  const [open, setOpen] = useState(false);
  const label = useMemo(() => options.find(o => o.value === value)?.label, [options, value]);

  return (
    <>
      <Pressable style={[styles.input, style]} onPress={() => setOpen(true)}>
        <Text style={[styles.valueText, textStyle]}> {label ? label : placeholder}</Text>
      </Pressable>

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.title}>{placeholder}</Text>
            <ScrollView style={{ maxHeight: 340 }}>
              {options.map((o) => (
                <Pressable
                  key={o.value}
                  style={styles.row}
                  onPress={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                >
                  <Text style={styles.rowText}>{o.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable style={styles.cancel} onPress={() => setOpen(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: 'rgba(59,130,246,0.92)',
    borderColor: '#60A5FA',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  valueText: {
  color: '#E5E7EB', 
  fontFamily: 'AlumniSans_500Medium',
  fontSize: 17,
  letterSpacing: 0.2,
},
  backdrop: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center", padding: 20,
  },
  sheet: {
    width: '100%', maxWidth: 520, backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16,
  },
  title: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 8 },
  row: { paddingVertical: 12, paddingHorizontal: 8, borderRadius: 10 },
  rowText: { fontSize: 16, color: '#1F2937' },
  cancel: { marginTop: 8, alignSelf: 'flex-end', padding: 8 },
  cancelText: { color: '#1F2937', textDecorationLine: 'underline' },
});
