// src/ui/MultiSelect.tsx
import React, { useMemo, useState } from "react";
import { Modal, View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import type { Option } from "./Select";

export default function MultiSelect({
  placeholder,
  values,
  onChange,
  options,
  style,
  textStyle,
  max = 7,
}: {
  placeholder: string;
  values: string[];
  onChange: (vals: string[]) => void;
  options: Option[];
  style?: any;
  textStyle?: any;
  max?: number;
}) {
  const [open, setOpen] = useState(false);
  const [buffer, setBuffer] = useState<string[]>(values);
  const summary = useMemo(() => {
    if (values.length === 0) return placeholder;
    if (values.length <= 2) {
      return options.filter(o => values.includes(o.value)).map(o => o.label).join(", ");
    }
    return `${values.length} selected`;
  }, [values, options, placeholder]);

  const toggle = (v: string) => {
    setBuffer((cur) => {
      if (cur.includes(v)) return cur.filter(x => x !== v);
      if (cur.length >= max) return cur; // cap
      return [...cur, v];
    });
  };

  const apply = () => {
    onChange(buffer);
    setOpen(false);
  };

  return (
    <>
      <Pressable style={[styles.input, style]} onPress={() => { setBuffer(values); setOpen(true); }}>
        <Text style={[styles.valueText, textStyle]}>{summary}</Text>
      </Pressable>

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.title}>{placeholder}</Text>
            <Text style={styles.help}>Select up to {max} subjects</Text>
            <ScrollView style={{ maxHeight: 360 }}>
              {options.map((o) => {
                const checked = buffer.includes(o.value);
                return (
                  <Pressable key={o.value} style={styles.row} onPress={() => toggle(o.value)}>
                    <View style={[styles.checkbox, checked && styles.checkboxOn]} />
                    <Text style={styles.rowText}>{o.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.actions}>
              <Pressable onPress={() => setOpen(false)}><Text style={styles.cancelText}>Cancel</Text></Pressable>
              <Pressable onPress={apply} style={styles.done}><Text style={styles.doneText}>Done</Text></Pressable>
            </View>
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
  title: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  help: { marginTop: 4, marginBottom: 10, color: '#1F2937', opacity: 0.7 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderRadius: 10 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: '#1F2937', backgroundColor: 'transparent' },
  checkboxOn: { backgroundColor: '#1F2937' },
  rowText: { fontSize: 16, color: '#1F2937' },
  actions: { marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cancelText: { color: '#1F2937', textDecorationLine: 'underline' },
  done: { backgroundColor: '#1F2937', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  doneText: { color: 'white', fontWeight: '600' },
});
