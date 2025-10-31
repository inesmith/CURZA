import React, { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, StyleSheet } from 'react-native';

export type SectionTestParams = {
  subject: string;
  grade: string | number;
  mode: 'section';
  topic?: string;
  count?: number;
  timed: boolean;
};

type Props = {
  subject: string;
  grade: string | number;
  topics: string[];
  questionCounts: number[];
  onStart: (params: SectionTestParams) => void;
};

export default function SectionTestPanel({
  subject,
  grade,
  topics,
  questionCounts,
  onStart,
}: Props) {
  const [showTopicDrop, setShowTopicDrop] = useState(false);
  const [topic, setTopic] = useState<string | undefined>(undefined);

  const [showNumQDrop, setShowNumQDrop] = useState(false);
  const [numQuestions, setNumQuestions] = useState<number | undefined>(undefined);

  const [timed, setTimed] = useState(false);

  return (
    <View style={s.panel}>
      <Text style={s.panelTitle}>OPTION 1: SECTION TEST{'\n'}(TOPIC BASED TESTS)</Text>

      {/* Topic */}
      <Pressable style={s.selectTrigger} onPress={() => setShowTopicDrop(true)} hitSlop={6}>
        <Text style={s.selectLabel}>{topic ?? 'CHOOSE A TOPIC'}</Text>
        <Text style={s.selectChevron}>▾</Text>
      </Pressable>

      <Modal transparent visible={showTopicDrop} animationType="fade" onRequestClose={() => setShowTopicDrop(false)}>
        <View style={s.ddBackdrop}>
          <View style={s.ddSheet}>
            <Text style={s.ddTitle}>Choose a topic</Text>
            <ScrollView style={{ maxHeight: 340 }}>
              {topics.map((t) => (
                <Pressable
                  key={t}
                  style={s.ddRow}
                  onPress={() => {
                    setTopic(t);
                    setShowTopicDrop(false);
                  }}
                >
                  <Text style={s.ddRowText}>{t}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable style={s.ddCancel} onPress={() => setShowTopicDrop(false)}>
              <Text style={s.ddCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Number of questions */}
      <Pressable style={[s.selectTrigger, { marginTop: 16 }]} onPress={() => setShowNumQDrop(true)} hitSlop={6}>
        <Text style={s.selectLabel}>{numQuestions ? `${numQuestions} QUESTIONS` : 'NUMBER OF QUESTIONS'}</Text>
        <Text style={s.selectChevron}>▾</Text>
      </Pressable>

      <Modal transparent visible={showNumQDrop} animationType="fade" onRequestClose={() => setShowNumQDrop(false)}>
        <View style={s.ddBackdrop}>
          <View style={s.ddSheet}>
            <Text style={s.ddTitle}>Number of questions</Text>
            <ScrollView style={{ maxHeight: 340 }}>
              {questionCounts.map((n) => (
                <Pressable
                  key={String(n)}
                  style={s.ddRow}
                  onPress={() => {
                    setNumQuestions(n);
                    setShowNumQDrop(false);
                  }}
                >
                  <Text style={s.ddRowText}>{n}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable style={s.ddCancel} onPress={() => setShowNumQDrop(false)}>
              <Text style={s.ddCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Time constraint */}
      <Pressable style={s.timeRow} onPress={() => setTimed((v) => !v)} hitSlop={8}>
        <View style={[s.checkbox, timed && s.checkboxOn]} />
        <Text style={s.timeLabel}>Set time constraint.</Text>
      </Pressable>

      <Pressable
        style={s.primaryBtn}
        onPress={() =>
          onStart({
            subject,
            grade,
            mode: 'section',
            topic,
            count: numQuestions,
            timed,
          })
        }
      >
        <Text style={s.primaryBtnText}>Start Section Test</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: 'rgba(148,163,184,0.45)', // slate-400 @45%
    borderRadius: 28,
    padding: 18,
  },
  panelTitle: {
    color: '#FFFFFF',
    fontFamily: 'Antonio_700Bold',
    fontSize: 18,
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 18,
  },
  selectTrigger: {
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E6C34A',
    backgroundColor: 'none',
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  selectLabel: {
   color: '#F9FAFB',
    fontFamily: 'Antonio_700Bold',
    fontSize: 16,
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  selectChevron: { color: '#FFFFFF', fontSize: 18, marginLeft: 10 },

  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18, marginBottom: 12 },
  checkbox: {
    width: 28, height: 28, borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.55)',
  },
  checkboxOn: { backgroundColor: '#E5E7EB', borderColor: '#FACC15' },
  timeLabel: { color: '#E5E7EB', fontFamily: 'AlumniSans_500Medium', fontSize: 16, letterSpacing: 0.3 },

  primaryBtn: {
    height: 54,
    borderRadius: 14,
    backgroundColor: '#FACC15',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  primaryBtnText: { 
    color: '#1F2937',
    fontFamily: 'Antonio_700Bold',
    fontSize: 16,
  },

  // Modal (matches your app’s dropdown modal)
  ddBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  ddSheet: { width: '100%', maxWidth: 520, backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16 },
  ddTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 8 },
  ddRow: { paddingVertical: 12, paddingHorizontal: 8, borderRadius: 10 },
  ddRowText: { fontSize: 16, color: '#1F2937' },
  ddCancel: { marginTop: 8, alignSelf: 'flex-end', padding: 8 },
  ddCancelText: { color: '#1F2937', textDecorationLine: 'underline' },
});
