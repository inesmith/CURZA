// src/components/ExampleSection.tsx
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

export default function ExampleSection({
  exampleTitle = 'EXAMPLE',
  exampleSteps = [],
  onGenerateExamples,
  onDownloadSummary,
  onMarkRevised,
}: {
  exampleTitle?: string;
  exampleSteps: string[];
  onGenerateExamples?: () => void;
  onDownloadSummary?: () => void;
  onMarkRevised?: () => void;
}) {
  return (
    <View style={s.container}>
      {/* Left grey box */}
      <View style={s.exampleCard}>
        <Text style={s.exampleTitle}>{exampleTitle}</Text>
        <View style={s.exampleInner}>
          {exampleSteps.map((line, i) => (
            <Text key={i} style={s.exampleText}>{line}</Text>
          ))}
        </View>
      </View>

      {/* Right buttons */}
      <View style={s.buttonsCol}>
        <Pressable style={s.button} onPress={onGenerateExamples}>
          <Text style={s.buttonText}>Generate Examples</Text>
        </Pressable>

        <Pressable style={s.button} onPress={onDownloadSummary}>
          <Text style={s.buttonText}>Download Summary</Text>
        </Pressable>

        <Pressable style={[s.button, s.largeButton]} onPress={onMarkRevised}>
          <Text style={s.buttonText}>Mark as Chapter{'\n'}Revised</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 12,
  },
  exampleCard: {
    backgroundColor: '#6B7280',
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 20,
    width: 285,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  exampleTitle: {
    color: '#F3F4F6',
    fontFamily: 'Antonio_700Bold',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 14,
    letterSpacing: 0.3,
  },
  exampleInner: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAB308',
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#EAB308',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  exampleText: {
    color: '#F3F4F6',
    fontFamily: 'Antonio_700Bold',
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
  },
  buttonsCol: {
    flexDirection: 'column',
    gap: 12,
  },
  button: {
    backgroundColor: '#FACC15',
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    width: 162,
  },
  buttonText: {
    color: '#111827',
    fontFamily: 'Antonio_700Bold',
    fontSize: 16,
    textAlign: 'center',
  },
  largeButton: {
    paddingVertical: 12,
  },
});
