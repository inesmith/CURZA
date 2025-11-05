import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  ImageBackground,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../App';
import { scoreTestAI, db, generateTestAI } from '../../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// inline pad
import InlineWorkingPad from '../components/InlineWorkingPad';

type Nav = StackNavigationProp<RootStackParamList>;

type Part = {
  label?: string;         // e.g. "(a)"
  text?: string;          // sub-question text
  marks?: number;         // marks for this part
  type?: string;          // 'short' | 'calc' | 'mcq' etc (optional, for future)
  options?: { id: string; text: string }[]; // optional MCQ choices
};

type Block =
  | {
      type: 'section';
      title?: string;
      instructions?: string;
      marks?: number | null;
    }
  | {
      type: 'question';
      number?: string | number;
      prompt?: string;
      marks?: number;
      parts?: Part[];
      resources?: any;     // may contain { images: [{id, uri}], graphs: [...] }
    }
  | Record<string, any>;

type Params = {
  mode: 'section' | 'full';
  title: string;          // Topic or Paper name
  subject: string;
  totalMarks: number;     // from AI
  timed?: boolean;        // if true -> countdown
  durationSec?: number;   // required when timed=true
  blocks?: Block[];       // AI-generated blocks
};

const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
const fmt = (secs: number) => {
  const s = Math.max(0, Math.floor(secs));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${pad(h)}:${pad(m)}:${pad(ss)}`;
};

export default function TestRunnerScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<any>();
  const {
    title,
    subject,
    totalMarks = 0,
    timed = false,
    durationSec = 0,
    blocks = [],
  } = (route.params || {}) as Params;

  // 🔹 Local paper state (so we can auto-generate if none provided)
  const [paperBlocks, setPaperBlocks] = useState<Block[]>(Array.isArray(blocks) ? blocks : []);
  const [paperTitle, setPaperTitle] = useState<string>(String(title || 'TEST'));
  const [loadingGen, setLoadingGen] = useState(false);

  // Auto-generate once if no blocks were passed in
  useEffect(() => {
    (async () => {
      if (paperBlocks.length > 0) return;
      setLoadingGen(true);
      try {
        const data = await generateTestAI({
          subject: subject || 'Mathematics',
          topic: paperTitle || 'Mixed Revision',
          level: 'Grade 12 CAPS',
          totalMarks: totalMarks || 50,
          numQuestions: 6,
          allowGraphs: true,
        });

        // ✅ Handle both shapes: helper returns data OR { data }
        const d: any = (data as any)?.data ?? data;

        if (d?.blocks?.length) {
          setPaperBlocks(d.blocks as Block[]);
          if (d.title) setPaperTitle(String(d.title));
        }
      } catch (e) {
        console.log('generateTestAI error:', e);
      } finally {
        setLoadingGen(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer
  const [paused, setPaused] = useState(false);
  const [ended, setEnded] = useState(false);
  const [seconds, setSeconds] = useState<number>(timed ? Math.max(0, durationSec) : 0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // local typed answers
  const [answers, setAnswers] = useState<Record<string, string>>({});
  // handwritten artifacts (PNG data URLs). We send to scorer, but only save metadata to Firestore.
  const [workArtifacts, setWorkArtifacts] = useState<Record<string, { uri?: string; mime?: string }>>({});
  // which pads are open inline
  const [openPads, setOpenPads] = useState<Record<string, boolean>>({});

  const [submitting, setSubmitting] = useState(false);

  // Start/stop the ticking based on paused/ended
  useEffect(() => {
    if (ended || paused) {
      if (intervalRef.current != null) {
        clearInterval(intervalRef.current as ReturnType<typeof setInterval>);
        intervalRef.current = null;
      }
      return;
    }
    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (timed) {
          if (prev <= 1) {
            setEnded(true);
            return 0;
          }
          return prev - 1;
        }
        return prev + 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current != null) {
        clearInterval(intervalRef.current as ReturnType<typeof setInterval>);
        intervalRef.current = null;
      }
    };
  }, [paused, ended, timed]);

  const togglePause = () => {
    if (ended) return;
    setPaused((p) => !p);
  };

  // Small “answer area” box to mimic exam paper lines/space
  const AnswerBox = ({ lines = 3 }: { lines?: number }) => (
    <View style={[styles.answerBox, { height: 16 * lines + 20 }]} />
  );

  // keys for answers/artifacts
  const qKey = (qIndex: number, qNumber?: string | number) => `q-${qNumber ?? qIndex + 1}`;
  const qpKey = (qIndex: number, pIndex?: number, qNumber?: string | number) =>
    pIndex != null ? `${qKey(qIndex, qNumber)}-p-${pIndex + 1}` : `${qKey(qIndex, qNumber)}-whole`;

  // Toggle button
  const WorkingBtn = ({ targetKey }: { targetKey: string }) => {
    const hasImg = !!workArtifacts[targetKey]?.uri;
    const open = !!openPads[targetKey];
    return (
      <View style={styles.workRow}>
        <Pressable
          onPress={() => setOpenPads((prev) => ({ ...prev, [targetKey]: !prev[targetKey] }))}
          style={[styles.workBtn, open ? styles.workBtnOn : styles.workBtnOff]}
          hitSlop={8}
        >
          <Text style={[styles.workBtnText, open ? styles.workBtnTextOn : styles.workBtnTextOff]}>
            {open ? 'Hide working' : hasImg ? 'Edit working' : 'Write working'}
          </Text>
        </Pressable>
        {hasImg ? <Text style={styles.workBadge}>1 attachment</Text> : null}
      </View>
    );
  };

  // SCROLL LOCK: if any pad is open, disable ScrollView scrolling
  const anyPadOpen = Object.values(openPads).some(Boolean);

  // Plain renderer (now reads from paperBlocks + shows graph images if present)
  const Content = (
    <View style={styles.paperInner}>
      {loadingGen ? (
        <View style={styles.placeholderBlock}>
          <Text style={styles.placeholderText}>Generating your paper…</Text>
        </View>
      ) : Array.isArray(paperBlocks) && paperBlocks.length > 0 ? (
        paperBlocks.map((b: Block, i: number) => {
          if ((b as any)?.type === 'section') {
            const sec = b as Extract<Block, { type: 'section' }>;
            return (
              <View key={`sec-${i}`} style={{ marginBottom: 12 }}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    {String(sec.title ?? 'SECTION').toUpperCase()}
                  </Text>
                </View>
                {sec.instructions ? (
                  <View style={styles.sectionBody}>
                    <Text style={styles.sectionText}>{sec.instructions}</Text>
                  </View>
                ) : null}
              </View>
            );
          }

          if ((b as any)?.type === 'question') {
            const q = b as Extract<Block, { type: 'question' }>;
            return (
              <View key={`q-${q.number ?? i}`} style={{ marginBottom: 12 }}>
                <View style={styles.questionHeader}>
                  <Text style={styles.qTitle}>
                    QUESTION {String(q.number ?? i + 1)}
                  </Text>
                  <Text style={styles.qMarks}>
                    {(q.marks ?? 0)} MARKS
                  </Text>
                </View>

                <View style={styles.promptBlock}>
                  {q.prompt ? (
                    <Text style={styles.promptText}>{q.prompt}</Text>
                  ) : null}

                  {!!(q as any)?.resources?.images?.length && (
                    <View style={{ marginTop: 10 }}>
                      {(q as any).resources.images.map((img: { id: string; uri: string }) => (
                        <Image
                          key={img.id}
                          source={{ uri: img.uri }}
                          style={styles.resourceImg}
                          resizeMode="contain"
                        />
                      ))}
                    </View>
                  )}
                </View>

                {Array.isArray(q.parts) && q.parts.length > 0 ? (
                  <View style={{ marginTop: 6 }}>
                    {q.parts.map((p: Part, j: number) => {
                      const key = qpKey(i, j, q.number);
                      const label = p.label ?? `(${String.fromCharCode(97 + j)})`;
                      const isMCQ = Array.isArray(p.options) && p.options.length > 0;
                      const open = !!openPads[key];

                      return (
                        <View key={`q-${i}-p-${j}`} style={styles.partBlock}>
                          <View style={styles.partHeader}>
                            <Text style={styles.partLabel}>{label}</Text>
                            {typeof p.marks === 'number' ? (
                              <Text style={styles.partMarks}>{p.marks} marks</Text>
                            ) : null}
                          </View>

                          {p.text ? <Text style={styles.partText}>{p.text}</Text> : null}

                          <AnswerBox lines={p.type === 'short' ? 2 : 4} />

                          {isMCQ ? (
                            <View style={styles.optRow}>
                              {p.options!.map((opt) => (
                                <Pressable
                                  key={opt.id}
                                  onPress={() => setAnswers((prev) => ({ ...prev, [key]: opt.id }))}
                                  style={[
                                    styles.optChip,
                                    answers[key] === opt.id ? styles.optChipOn : styles.optChipOff,
                                  ]}
                                  hitSlop={6}
                                >
                                  <Text
                                    style={[
                                      styles.optChipText,
                                      answers[key] === opt.id ? styles.optChipTextOn : styles.optChipTextOff,
                                    ]}
                                  >
                                    {opt.text ?? opt.id}
                                  </Text>
                                </Pressable>
                              ))}
                            </View>
                          ) : (
                            <TextInput
                              placeholder="Type your answer…  (or add handwritten working)"
                              placeholderTextColor="rgba(229,231,235,0.7)"
                              value={answers[key] ?? ''}
                              onChangeText={(t) => setAnswers((prev) => ({ ...prev, [key]: t }))}
                              style={styles.input}
                              multiline
                            />
                          )}

                          <WorkingBtn targetKey={key} />

                          {open ? (
                            <InlineWorkingPad
                              value={workArtifacts[key]?.uri}
                              onChange={(dataUrl: any) =>
                                setWorkArtifacts((prev) => ({
                                  ...prev,
                                  [key]: { uri: dataUrl, mime: 'image/png' },
                                }))
                              }
                              height={220}
                            />
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View style={{ marginTop: 6 }}>
                    <AnswerBox lines={6} />
                    <TextInput
                      placeholder="Type your answer…  (or add handwritten working)"
                      placeholderTextColor="rgba(229,231,235,0.7)"
                      value={answers[qpKey(i, undefined, q.number)] ?? ''}
                      onChangeText={(t) =>
                        setAnswers((prev) => ({
                          ...prev,
                          [qpKey(i, undefined, q.number)]: t,
                        }))
                      }
                      style={styles.input}
                      multiline
                    />

                    <WorkingBtn targetKey={qpKey(i, undefined, q.number)} />
                    {openPads[qpKey(i, undefined, q.number)] ? (
                      <InlineWorkingPad
                        value={workArtifacts[qpKey(i, undefined, q.number)]?.uri}
                        onChange={(dataUrl: any) =>
                          setWorkArtifacts((prev) => ({
                            ...prev,
                            [qpKey(i, undefined, q.number)]: { uri: dataUrl, mime: 'image/png' },
                          }))
                        }
                        height={220}
                      />
                    ) : null}
                  </View>
                )}
              </View>
            );
          }

          return (
            <View key={`x-${i}`} style={{ marginBottom: 12 }}>
              <View style={styles.placeholderBlock}>
                <Text style={styles.placeholderText}>{JSON.stringify(b)}</Text>
              </View>
            </View>
          );
        })
      ) : (
        <View style={styles.placeholderBlock}>
          <Text style={styles.placeholderText}>
            Your generated test content goes here. Render questions, inputs, and diagrams inside this
            scroll area.
          </Text>
        </View>
      )}
    </View>
  );

  const handleSubmit = async () => {
    if (submitting) return;
    try {
      setSubmitting(true);

      const items = Object.entries(answers).map(([id, value]) => ({
        qid: id,
        id: typeof value === 'string' ? value : String(value),
        text: typeof value === 'string' ? value : undefined,
      }));

      const working = Object.entries(workArtifacts).map(([id, v]) => ({
        qid: id,
        uri: v?.uri,
        mime: v?.mime ?? 'image/png',
      }));

      const res = await scoreTestAI({
        questions: paperBlocks, // use generated/received blocks
        answers: { items },
        working,
        rubric: { stepwise: true, methodMarks: true },
        meta: { title: paperTitle, subject, totalMarks, timed, durationSec },
      });

      // ✅ Handle both shapes: helper returns data OR { data }
      const result: any = (res as any)?.data ?? res;

      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        const attemptId = Date.now().toString();
        const workingMeta = Object.keys(workArtifacts).map((qid) => ({
          qid,
          hasImage: !!workArtifacts[qid]?.uri,
        }));

        await setDoc(
          doc(db, 'users', user.uid, 'attempts', attemptId),
          {
            mode: (route.params as Params)?.mode ?? 'full',
            title: paperTitle,
            subject,
            totalMarks,
            timed: !!timed,
            durationSec: durationSec ?? null,
            answers,
            workingMeta,
            result,
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      navigation.navigate('ResultDetail', { result });
    } catch (err) {
      console.log('scoreTest error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.page}>
      <View style={styles.imageWrapper}>
        {/* Left rail artwork (same stack visuals) */}
        <Image source={require('../../assets/DashboardTab.png')} style={styles.tab} resizeMode="contain" />
        <Image source={require('../../assets/SummariesTab.png')} style={styles.tab} resizeMode="contain" />
        <Image source={require('../../assets/PractiseTab.png')} style={styles.tab} resizeMode="contain" />
        <Image source={require('../../assets/ResultsTab.png')} style={styles.tab} resizeMode="contain" />
        <Image source={require('../../assets/ProfileTab.png')} style={styles.tab} resizeMode="contain" />

        {/* Clickable text labels */}
        <View style={[styles.tabTextWrapper, styles.posSummaries]}>
          <Pressable onPress={() => navigation.navigate('Summaries' as never)} hitSlop={12}>
            <Text style={[styles.tabText, styles.summariesTab]}>SUMMARIES</Text>
          </Pressable>
        </View>

        <View style={[styles.tabTextWrapper, styles.posPractice]}>
          <Pressable onPress={() => navigation.navigate('PracticeTests' as never)} hitSlop={12}>
            <Text style={[styles.tabText, styles.practiseOpenTab]}>PRACTISE TESTS</Text>
          </Pressable>
        </View>

        <View style={[styles.tabTextWrapper, styles.posResults]}>
          <Pressable onPress={() => navigation.navigate('Results' as never)} hitSlop={12}>
            <Text style={[styles.tabText, styles.resultsTab]}>RESULTS</Text>
          </Pressable>
        </View>

        <View style={[styles.tabTextWrapper, styles.posProfile]}>
          <Pressable onPress={() => navigation.navigate('ProfileSettings' as never)} hitSlop={12}>
            <Text style={[styles.tabText, styles.profileTab]}>PROFILE & SETTINGS</Text>
          </Pressable>
        </View>

        {/* Corner logo */}
        <Image source={require('../../assets/curza-logo.png')} style={styles.cornerLogo} resizeMode="contain" />

        {/* Main background */}
        <ImageBackground
          source={require('../../assets/PractiseOpenTab.png')}
          style={styles.card}
          imageStyle={styles.cardImage}
          resizeMode="cover"
        >
          {/* DASHBOARD link */}
          <View style={[styles.tabTextWrapper, styles.posDashboard]}>
            <Pressable onPress={() => navigation.navigate('Dashboard' as never)} hitSlop={12}>
              <Text style={[styles.tabText, styles.dashboardTab]}>DASHBOARD</Text>
            </Pressable>
          </View>

          {/* Header */}
          <View style={styles.cardInner}>
            <Text style={styles.heading}>
              {String(paperTitle || 'TEST')}
            </Text>

            {/* Pills: total marks • timer • pause/continue */}
            <View style={styles.pillRow}>
              <View style={styles.pill}>
                <Text style={styles.pillMain}>{totalMarks} Marks</Text>
              </View>

              <View style={styles.pill}>
                <Text style={styles.pillMain}>{fmt(seconds)}</Text>
              </View>

              <Pressable style={[styles.pill, styles.pillAction]} onPress={togglePause} disabled={ended}>
                <Text style={styles.pillMain}>{ended ? 'Time Up' : paused ? 'Continue' : 'Pause'}</Text>
              </Pressable>
            </View>

            {/* Grey scrollable test body */}
            <View style={styles.bigBlock}>
              <ScrollView
                style={styles.bigBlockScroll}
                contentContainerStyle={{ padding: 16, paddingBottom: 90 }}
                showsVerticalScrollIndicator
                scrollEnabled={!paused && !ended && !anyPadOpen}
                pointerEvents={paused || ended ? 'none' : 'auto'}
              >
                {Content}
              </ScrollView>

              {(paused || ended) && (
                <View style={styles.overlay}>
                  <Text style={styles.overlayText}>{ended ? 'TIME UP' : 'PAUSED'}</Text>
                </View>
              )}

              {/* Sticky submit bar */}
              <View style={styles.submitBar}>
                <Pressable
                  onPress={handleSubmit}
                  disabled={submitting}
                  style={[styles.submitBtn, submitting ? styles.submitBtnDisabled : styles.submitBtnEnabled]}
                >
                  <Text style={styles.submitText}>{submitting ? 'Submitting…' : 'Submit Test'}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ImageBackground>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#0B1220',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    width: '94%',
    height: '95%',
    marginVertical: 10,
    borderRadius: 40,
    overflow: 'hidden',
    shadowColor: '#0B1220',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    position: 'relative',
  },

  // Left rail tabs (artwork layers)
  tab: { position: 'absolute', height: '100%', width: '100%', zIndex: 1 },

  tabTextWrapper: { position: 'absolute', left: '4.5%', alignItems: 'center', zIndex: 5 },
  posDashboard: { top: '22%' },
  posSummaries: { top: '22%' },
  posPractice: { top: '30%' },
  posResults: { top: '39%' },
  posProfile: { top: '48%' },

  tabText: {
    fontFamily: 'AlumniSans_500Medium',
    fontSize: 20,
    letterSpacing: 1,
    marginBottom: 18,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginLeft: -20,
    color: '#E5E7EB',
  },
  dashboardTab: { fontWeight: 'bold', marginTop: -115 },
  summariesTab: { opacity: 0.8, marginTop: -15 },
  practiseOpenTab: { opacity: 0.8, marginTop: 20 },
  resultsTab: { opacity: 0.8, marginTop: 45 },
  profileTab: { opacity: 0.8, marginTop: 72 },

  cornerLogo: { position: 'absolute', bottom: 40, left: -55, height: 130, opacity: 0.9, zIndex: 10 },

  card: { flex: 1, borderRadius: 40, overflow: 'hidden', position: 'relative', zIndex: 1 },
  cardInner: { flex: 1, borderRadius: 40, padding: 28, marginLeft: 210, marginRight: 14 },
  cardImage: { borderRadius: 40, resizeMode: 'cover' },

  heading: {
    fontFamily: 'Antonio_700Bold',
    color: 'white',
    fontSize: 48,
    letterSpacing: 0.5,
    marginBottom: 12,
    zIndex: 2,
    marginTop: 12,
    textShadowColor: 'rgba(0,0,0,0.22)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  pillRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  pill: {
    backgroundColor: '#2763F6',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    minWidth: 110,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  pillAction: { backgroundColor: '#3B82F6' },
  pillMain: {
    color: '#FFFFFF',
    fontFamily: 'Antonio_700Bold',
    fontSize: 16,
    letterSpacing: 0.3,
  },

  bigBlock: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    height: 590,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  bigBlockScroll: { flex: 1 },

  // Paper content wrapper
  paperInner: {
    backgroundColor: 'rgba(17,24,39,0.25)',
    borderRadius: 16,
    padding: 12,
  },

  // SECTION
  sectionHeader: {
    backgroundColor: '#2763F6',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 6,
    shadowColor: '#0B1220',
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionTitle: { color: '#FFFFFF', fontFamily: 'Antonio_700Bold', fontSize: 16, letterSpacing: 0.5 },
  sectionBody: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 10,
  },
  sectionText: { color: '#F3F4F6', fontFamily: 'AlumniSans_500Medium', fontSize: 15 },

  // QUESTION
  questionHeader: {
    backgroundColor: '#FACC15',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    shadowColor: '#0B1220',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  qTitle: { color: '#1F2937', fontFamily: 'Antonio_700Bold', fontSize: 16, letterSpacing: 0.4 },
  qMarks: { color: '#1F2937', fontFamily: 'Antonio_700Bold', fontSize: 14, letterSpacing: 0.4 },

  // prompt text area (question stem)
  promptBlock: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 12,
  },
  promptText: {
    color: '#F3F4F6',
    fontFamily: 'AlumniSans_500Medium',
    fontSize: 16,
  },

  // 🔹 NEW: generated resource image
  resourceImg: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginTop: 8,
  },

  // PARTS
  partBlock: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
  },
  partHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  partLabel: {
    color: '#FFFFFF',
    fontFamily: 'Antonio_700Bold',
    fontSize: 15,
    letterSpacing: 0.4,
  },
  partMarks: {
    color: '#E5E7EB',
    fontFamily: 'AlumniSans_500Medium',
    fontSize: 14,
  },
  partText: {
    color: '#F3F4F6',
    fontFamily: 'AlumniSans_500Medium',
    fontSize: 15,
    marginBottom: 6,
  },

  // Simple “answer lines” box
  answerBox: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 16,
    marginTop: 4,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },

  // Input (text)
  input: {
    marginTop: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 10,
    color: '#FFFFFF',
    fontFamily: 'AlumniSans_500Medium',
    fontSize: 15,
  },

  // MCQ chips
  optRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  optChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1 },
  optChipOff: { borderColor: 'rgba(255,255,255,0.35)', backgroundColor: 'rgba(255,255,255,0.03)' },
  optChipOn: { borderColor: '#FACC15', backgroundColor: 'rgba(250,204,21,0.18)' },
  optChipText: { fontFamily: 'Antonio_700Bold', fontSize: 14, letterSpacing: 0.3 },
  optChipTextOff: { color: '#E5E7EB' },
  optChipTextOn: { color: '#FACC15' },

  // Working (handwriting) button
  workRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  workBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1 },
  workBtnOff: { borderColor: 'rgba(255,255,255,0.35)', backgroundColor: 'rgba(255,255,255,0.03)' },
  workBtnOn: { borderColor: '#2763F6', backgroundColor: 'rgba(39,99,246,0.18)' },
  workBtnText: { fontFamily: 'Antonio_700Bold', fontSize: 14, letterSpacing: 0.3 },
  workBtnTextOff: { color: '#E5E7EB' },
  workBtnTextOn: { color: '#2763F6' },
  workBadge: { color: '#9CA3AF', fontFamily: 'AlumniSans_500Medium' },

  // Fallback/plain text block
  placeholderBlock: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
  },
  placeholderText: { color: '#F3F4F6', fontFamily: 'AlumniSans_500Medium', fontSize: 16 },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(12, 17, 31, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayText: {
    color: '#FFFFFF',
    fontFamily: 'Antonio_700Bold',
    fontSize: 22,
    letterSpacing: 1,
  },

  // Sticky submit bar
  submitBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    backgroundColor: 'rgba(11,18,32,0.75)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  submitBtn: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  submitBtnEnabled: { backgroundColor: '#FACC15' },
  submitBtnDisabled: { backgroundColor: '#9CA3AF' },
  submitText: {
    color: '#1F2937',
    fontFamily: 'Antonio_700Bold',
    fontSize: 16,
    letterSpacing: 0.3,
  },
});
