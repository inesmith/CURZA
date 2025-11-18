// src/screens/ResultsScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  ImageBackground,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../App';

import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  doc,
  getDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { db } from '../../firebase';

type ResultRow = {
  id: string;
  title?: string;
  subject?: string;
  paper?: string;
  totalMarks?: number;
  totalScore?: number;
  percentage?: number | null;
  createdAt?: any;
  breakdown?: any[];
  partialCredit?: any;
  feedbackSummary?: string | null;
  feedbackTips?: any[];
};

type Nav = StackNavigationProp<RootStackParamList>;

const monthNames = [
  'JANUARY',
  'FEBRUARY',
  'MARCH',
  'APRIL',
  'MAY',
  'JUNE',
  'JULY',
  'AUGUST',
  'SEPTEMBER',
  'OCTOBER',
  'NOVEMBER',
  'DECEMBER',
];

const formatDate = (raw: any): string => {
  try {
    if (!raw) return '—';
    let d: Date;
    if (typeof raw?.toDate === 'function') {
      d = raw.toDate();
    } else {
      d = new Date(raw);
    }
    if (isNaN(d.getTime())) return '—';
    const day = d.getDate();
    const month = monthNames[d.getMonth()] ?? '';
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return '—';
  }
};

const deriveOutcome = (pct: number | null | undefined): string => {
  if (pct == null || isNaN(pct)) return '—';
  if (pct >= 80) return 'Distinction';
  if (pct >= 60) return 'Good';
  if (pct >= 40) return 'Needs Attention';
  return 'At Risk';
};

export default function ResultsScreen() {
  const navigation = useNavigation<Nav>();

  const [curriculum, setCurriculum] = useState('CAPS');
  const [grade, setGrade] = useState<number | string>('12');
  const [subject, setSubject] = useState('Mathematics');
  const [showSubjectDrop, setShowSubjectDrop] = useState(false);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [results, setResults] = useState<ResultRow[]>([]);

  const normalizeCurriculum = (value: any): string => {
    const raw = String(value ?? '').toLowerCase().replace(/[_-]+/g, ' ').trim();
    if (!raw) return 'CAPS';
    if (raw.includes('caps')) return 'CAPS';
    if (raw.includes('ieb')) return 'IEB';
    if (raw.includes('cambridge')) return 'Cambridge';
    if (raw.includes('international baccalaureate') || raw === 'ib' || /\bib\b/.test(raw)) return 'IB';
    return raw.split(' ')[0].toUpperCase();
  };

  const titleCase = (s: any): string =>
    String(s ?? '')
      .replace(/[_-]+/g, ' ')
      .trim()
      .split(/\s+/)
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
      .join(' ');

  useEffect(() => {
    const auth = getAuth();
    let resultsUnsub: (() => void) | undefined;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setResults([]);
        if (resultsUnsub) {
          resultsUnsub();
          resultsUnsub = undefined;
        }
        return;
      }
      try {
        // profile
        const snap = await getDoc(doc(db, 'users', user.uid));
        const profile = snap.exists() ? (snap.data() as any) : undefined;

        if (profile?.curriculum) setCurriculum(normalizeCurriculum(profile.curriculum));
        if (profile?.grade) setGrade(profile.grade);

        const subs: any[] = profile?.subjects || profile?.selectedSubjects || profile?.subjectsChosen || [];
        if (Array.isArray(subs) && subs.length > 0) {
          const cleaned = subs.map(titleCase).filter(Boolean);
          setSubjects(cleaned);
          if (profile?.subject) {
            const chosen = titleCase(profile.subject);
            setSubject(cleaned.includes(chosen) ? chosen : cleaned[0]);
          } else {
            setSubject(cleaned[0]);
          }
        }

        // results
        if (resultsUnsub) {
          resultsUnsub();
        }
        const qRef = query(
          collection(db, 'users', user.uid, 'results'),
          orderBy('createdAt', 'desc'),
        );
        resultsUnsub = onSnapshot(qRef, (snapResults) => {
          const rows: ResultRow[] = snapResults.docs.map((d) => {
            const data = d.data() as any;
            return {
              id: d.id,
              title: data.title,
              subject: data.subject,
              paper: data.paper,
              totalMarks: data.totalMarks,
              totalScore: data.totalScore,
              percentage: typeof data.percentage === 'number' ? data.percentage : null,
              createdAt: data.createdAt,
              breakdown: Array.isArray(data.breakdown) ? data.breakdown : [],
              partialCredit: data.partialCredit ?? null,
              feedbackSummary: data.feedbackSummary ?? null,
              feedbackTips: Array.isArray(data.feedbackTips) ? data.feedbackTips : [],
            };
          });
          setResults(rows);
        });
      } catch {
        // keep defaults on error
      }
    });

    return () => {
      unsub();
      if (resultsUnsub) resultsUnsub();
    };
  }, []);

  return (
    <View style={s.page}>
      <View style={s.imageWrapper}>
        {/* Left rail artwork (decorative, non-interactive) */}
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Image source={require('../../assets/DashboardTab.png')} style={s.tab} resizeMode="contain" />
          <Image source={require('../../assets/SummariesTab.png')} style={s.tab} resizeMode="contain" />
          <Image source={require('../../assets/PractiseTab.png')} style={s.tab} resizeMode="contain" />
          <Image source={require('../../assets/ProfileTab.png')} style={s.tab} resizeMode="contain" />
        </View>

        {/* Left rail labels (tappable) */}
        <View style={[s.tabTextWrapper, s.posSummaries]}>
          <Pressable onPress={() => navigation.navigate('Summaries')} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={[s.tabText, s.summariesTab]}>SUMMARIES</Text>
          </Pressable>
        </View>

        <View style={[s.tabTextWrapper, s.posPractice]}>
          <Pressable onPress={() => navigation.navigate('PracticeTests')} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={[s.tabText, s.practiseOpenTab]}>PRACTISE TESTS</Text>
          </Pressable>
        </View>

        <View style={[s.tabTextWrapper, s.posResults]}>
          <Pressable onPress={() => navigation.navigate('Results')} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={[s.tabText, s.resultsTab]}>RESULTS</Text>
          </Pressable>
        </View>

        <View style={[s.tabTextWrapper, s.posProfile]}>
          <Pressable onPress={() => navigation.navigate('ProfileSettings')} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={[s.tabText, s.profileTab]}>PROFILE & SETTINGS</Text>
          </Pressable>
        </View>

        {/* Corner logo (decorative, non-interactive) */}
        <View pointerEvents="none" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, top: 0 }}>
          <Image source={require('../../assets/curza-logo.png')} style={s.cornerLogo} resizeMode="contain" />
        </View>

        {/* Main background */}
        <ImageBackground
          source={require('../../assets/ResultsOpenTab.png')}
          style={s.card}
          imageStyle={s.cardImage}
          resizeMode="cover"
        >
          <View style={[s.tabTextWrapper, s.posSummaries]}>
            <Pressable onPress={() => navigation.navigate('Dashboard')} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={[s.tabText, s.dashboardTab]}>DASHBOARD</Text>
            </Pressable>
          </View>

          {/* 🔵 Top-right pills */}
          <View style={s.topRightWrap}>
            <View style={s.row}>
              <View style={[s.pill, s.curriculumPill]}>
                <Text style={s.pillTop}>CURRICULUM</Text>
                <Text style={s.pillMain}>{String(curriculum).toUpperCase()}</Text>
              </View>

              <View style={[s.pill, s.gradePill]}>
                <Text style={s.pillTop}>GRADE</Text>
                <Text style={s.pillMain}>{String(grade).toUpperCase()}</Text>
              </View>
            </View>

            <View style={[s.pill, s.subjectPill]}>
              <Pressable
                onPress={() => setShowSubjectDrop(true)}
                hitSlop={6}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <View style={{ flexShrink: 1, minWidth: 0 }}>
                  <Text style={s.pillTop}>SUBJECT</Text>
                  <Text style={s.pillMain} numberOfLines={1} ellipsizeMode="tail">
                    {subject}
                  </Text>
                </View>
                <Text style={s.chev}>▾</Text>
              </Pressable>

              {/* Subject dropdown modal */}
              <Modal
                transparent
                visible={showSubjectDrop}
                animationType="fade"
                onRequestClose={() => setShowSubjectDrop(false)}
              >
                <View style={s.ddBackdrop}>
                  <View style={s.ddSheet}>
                    <Text style={s.ddTitle}>Select Subject</Text>

                    <ScrollView style={{ maxHeight: 340 }}>
                      {subjects.map((subj) => (
                        <Pressable
                          key={subj}
                          style={s.ddRow}
                          onPress={() => {
                            setSubject(subj);
                            setShowSubjectDrop(false);
                          }}
                        >
                          <Text style={s.ddRowText}>{subj}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>

                    <Pressable style={s.ddCancel} onPress={() => setShowSubjectDrop(false)}>
                      <Text style={s.ddCancelText}>Cancel</Text>
                    </Pressable>
                  </View>
                </View>
              </Modal>
            </View>
          </View>

          {/* Content */}
          <View style={s.cardInner}>
            <Image source={require('../../assets/swoosh-yellow.png')} style={s.swoosh} resizeMode="contain" />
            <Image source={require('../../assets/dot-blue.png')} style={s.dot} resizeMode="contain" />
            <Text style={s.heading}>YOUR TEST RESULTS</Text>

            {/* Scrollable block */}
            <View style={s.bigBlock}>
              <ScrollView
                style={s.bigBlockScroll}
                contentContainerStyle={{ paddingBottom: 20, paddingRight: 6 }}
                showsVerticalScrollIndicator
              >
                {results.map((r) => {
                  const paperName = (r.paper || r.title || 'Test').toUpperCase();
                  const dateLabel = formatDate(r.createdAt);
                  const pct =
                    typeof r.percentage === 'number'
                      ? r.percentage
                      : r.totalMarks
                      ? Math.round(((r.totalScore || 0) / r.totalMarks) * 100)
                      : null;
                  const scoreLabel =
                    pct != null && !isNaN(pct)
                      ? `${pct}%`
                      : r.totalMarks
                      ? `${r.totalScore ?? 0}/${r.totalMarks}`
                      : '—';

                  const outcome = deriveOutcome(pct);

                  return (
                    <View key={r.id} style={s.resultRowWrap}>
                      <Pressable
                        style={s.resultRow}
                        onPress={() =>
                          navigation.navigate('ResultDetail', {
                            paper: paperName,
                            date: dateLabel,
                            score: scoreLabel,
                            marksEarned: r.totalScore ?? 0,
                            marksTotal: r.totalMarks ?? 0,
                            outcome,
                            breakdown: r.breakdown ?? [],
                            partialCredit: r.partialCredit ?? null,
                            feedbackSummary: r.feedbackSummary ?? null,
                            tipsBlocks: r.feedbackTips ?? [],
                          } as any)
                        }
                      >
                        <Text style={s.resultPaper}>{paperName}</Text>
                        <Text style={s.sep}>·</Text>
                        <Text style={s.resultDate}>{dateLabel}</Text>
                        <Text style={s.sep}>·</Text>
                        <Text style={s.resultScore}>{scoreLabel}</Text>
                      </Pressable>

                      <View style={s.arrow} />
                    </View>
                  );
                })}

                {results.length === 0 && (
                  <View style={s.resultRowWrap}>
                    <View style={s.resultRow}>
                      <Text style={s.resultPaper}>
                        No tests marked yet. Write a practise test to see your results here.
                      </Text>
                    </View>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </ImageBackground>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
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

  tabTextWrapper: {
    position: 'absolute',
    left: '4.5%',
    alignItems: 'center',
    zIndex: 20,
  },

  posActive: { top: '15%' },
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
    color: 'white',
  },

  dashboardTab: { fontWeight: 'bold', marginTop: -115 },
  summariesTab: { opacity: 0.8, marginTop: -15 },
  practiseOpenTab: { opacity: 0.8, marginTop: 20 },
  resultsTab: { opacity: 0.8, marginTop: 45 },
  profileTab: { opacity: 0.8, marginTop: 72 },

  tab: { position: 'absolute', height: '100%', width: '100%', zIndex: 1 },

  card: { flex: 1, borderRadius: 40, overflow: 'hidden', position: 'relative', zIndex: 1 },

  cardInner: { flex: 1, borderRadius: 40, padding: 28, marginLeft: 210, marginRight: 14 },

  cardImage: { borderRadius: 40, resizeMode: 'cover' },

  swoosh: {
    position: 'absolute',
    top: 20,
    left: '6%',
    width: 380,
    height: 100,
    transform: [{ rotateZ: '-2deg' }],
    opacity: 0.9,
    zIndex: 2,
  },

  dot: { position: 'absolute', top: 100, left: 330, height: '5%', zIndex: 1, opacity: 0.95 },

  heading: {
    fontFamily: 'Antonio_700Bold',
    color: 'white',
    fontSize: 48,
    letterSpacing: 0.5,
    marginBottom: 8,
    zIndex: 2,
    marginTop: 12,
    textShadowColor: 'rgba(0,0,0,0.22)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // 🔵 Top-right pills
  topRightWrap: { position: 'absolute', top: 22, right: 26, zIndex: 7, width: 360 },

  row: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 14,
    justifyContent: 'flex-end',
    marginTop: 15,
  },

  pill: {
    flexGrow: 1,
    backgroundColor: '#2763F6',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },

  curriculumPill: {
    flexGrow: 0,
    width: 135,
    height: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },

  gradePill: {
    flexGrow: 0,
    width: 110,
    height: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },

  subjectPill: {
    flexGrow: 0,
    width: 260,
    height: 55,
    alignSelf: 'flex-end',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  pillTop: {
    color: 'rgba(255,255,255,0.85)',
    fontFamily: 'AlumniSans_500Medium',
    fontSize: 12,
    letterSpacing: 1,
  },

  pillMain: {
    color: '#FFFFFF',
    fontFamily: 'Antonio_700Bold',
    fontSize: 18,
    letterSpacing: 0.3,
    marginTop: 2,
  },

  chev: { color: '#FFFFFF', fontSize: 18, marginLeft: 8 },

  // Subject dropdown modal
  ddBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  ddSheet: { width: '100%', maxWidth: 520, backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16 },

  ddTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 8 },

  ddRow: { paddingVertical: 12, paddingHorizontal: 8, borderRadius: 10 },

  ddRowText: { fontSize: 16, color: '#1F2937' },

  ddCancel: { marginTop: 8, alignSelf: 'flex-end', padding: 8 },

  ddCancelText: { color: '#1F2937', textDecorationLine: 'underline' },

  // Scrollable block
  bigBlock: {
    backgroundColor: 'none',
    borderRadius: 16,
    padding: 16,
    marginTop: 70,
    marginLeft: -20,
    marginRight: -40,
    height: 620,
    alignSelf: 'stretch',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  bigBlockScroll: { flex: 1 },

  // Result rows
  resultRowWrap: { position: 'relative', marginBottom: 18 },

  resultRow: {
    borderRadius: 28,
    backgroundColor: 'rgba(148,163,184,0.55)',
    paddingVertical: 18,
    paddingHorizontal: 22,
    shadowColor: '#0B1220',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    flexDirection: 'row',
    alignItems: 'center',
  },

  resultPaper: { color: '#F9FAFB', fontFamily: 'Antonio_700Bold', fontSize: 16, letterSpacing: 0.3 },

  resultDate: { color: '#F9FAFB', fontFamily: 'Antonio_700Bold', fontSize: 16, letterSpacing: 0.3 },

  resultScore: { color: '#F9FAFB', fontFamily: 'Antonio_700Bold', fontSize: 16, letterSpacing: 0.3 },

  sep: { color: '#F9FAFB', opacity: 0.75, fontFamily: 'Antonio_700Bold', fontSize: 16, marginHorizontal: 14 },

  arrow: {
    position: 'absolute',
    right: 30,
    top: '50%',
    marginTop: -10,
    width: 0,
    height: 0,
    borderTopWidth: 10,
    borderBottomWidth: 10,
    borderLeftWidth: 14,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#FACC15',
  },

  cornerLogo: { position: 'absolute', bottom: 40, left: -55, height: 130, opacity: 0.9, zIndex: 10 },
});
