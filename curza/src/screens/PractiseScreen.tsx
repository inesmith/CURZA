// src/screens/PractiseScreen.tsx
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

// content
import SectionTestPanel from '../components/SectionTestPanel';
import FullExamPanel from '../components/FullExamPanel';

// AI callable
import { createTestAI } from '../../firebase';

// Firebase (for user data)
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

// Panel option lists 
const TOPICS = [
  'Algebra', 'Functions & Graphs', 'Trigonometry', 'Geometry', 'Probability',
  'Calculus: Differentiation', 'Calculus: Integration', 'Financial Maths'
];
const QUESTION_COUNTS = [5, 10, 15, 20, 25, 30];
const PAPERS = ['Paper 1', 'Paper 2', 'Paper 3'];

// Start handlers
const startSection = async (params: import('../components/SectionTestPanel').SectionTestParams) => {
  await createTestAI({
    subject: params.subject,
    grade: params.grade,
    mode: 'section',
    topic: params.topic,
    count: params.count,
    timed: params.timed,
  });
};

const startFull = async (params: import('../components/FullExamPanel').FullExamParams) => {
  await createTestAI({
    subject: params.subject,
    grade: params.grade,
    mode: 'full',
    examType: params.examType, // Paper 1 / 2 / 3
    timed: params.timed,
  });
};


export default function PractiseScreen() {
  const [centre, setCentre] = useState(false);
  const [terms, setTerms] = useState(false);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // 🔵 top-right info
  const [curriculum, setCurriculum] = useState('CAPS');
  const [grade, setGrade] = useState<number | string>('12');
  const [subject, setSubject] = useState('Mathematics');
  const [showSubjectDrop, setShowSubjectDrop] = useState(false);
  const [subjects, setSubjects] = useState<string[]>([]);

  const normalizeCurriculum = (value: any): string => {
    const raw = String(value ?? '').toLowerCase().replace(/[_-]+/g, ' ').trim();
    if (!raw) return 'CAPS';
    if (raw.includes('caps')) return 'CAPS';
    if (raw.includes('ieb')) return 'IEB';
    if (raw.includes('cambridge')) return 'Cambridge';
    if (
      raw.includes('international baccalaureate') ||
      raw === 'ib' ||
      /\bib\b/.test(raw)
    )
      return 'IB';
    return raw.split(' ')[0].toUpperCase();
  };

  const titleCase = (s: any): string =>
    String(s ?? '')
      .replace(/[_-]+/g, ' ')
      .trim()
      .split(/\s+/)
      .map((w) =>
        w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w
      )
      .join(' ');

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        const profile = snap.exists() ? (snap.data() as any) : undefined;

        if (profile?.curriculum) setCurriculum(normalizeCurriculum(profile.curriculum));
        if (profile?.grade) setGrade(profile.grade);

        const subs: any[] =
          profile?.subjects ||
          profile?.selectedSubjects ||
          profile?.subjectsChosen ||
          [];
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
      } catch {
        // ignore errors
      }
    });
    return () => unsub();
  }, []);

  // Full test (example)
  const handleFullTest = async () => {
    try {
      const res = await createTestAI({
        subject,
        grade,
        mode: 'full',
        examType: 'Paper 1',
      });
      console.log('createTestAI(full) ->', res.data);
    } catch (err) {
      console.log('createTestAI(full) error:', err);
    }
  };

  // Section test (example)
  const handleSectionTest = async () => {
    try {
      const res = await createTestAI({
        subject,
        grade,
        mode: 'section',
        topic: 'Mechanics: Work, Energy and Power',
      });
      console.log('createTestAI(section) ->', res.data);
    } catch (err) {
      console.log('createTestAI(section) error:', err);
    }
  };

  return (
    <View style={s.page}>
      <View style={s.imageWrapper}>
        {/* Left rail artwork */}
        <Image
          source={require('../../assets/DashboardTab.png')}
          style={s.logintab}
          resizeMode="contain"
        />
        <Image
          source={require('../../assets/SummariesTab.png')}
          style={s.logintab}
          resizeMode="contain"
        />
        <Image
          source={require('../../assets/ResultsTab.png')}
          style={s.logintab}
          resizeMode="contain"
        />
        <Image
          source={require('../../assets/ProfileTab.png')}
          style={s.logintab}
          resizeMode="contain"
        />

        {/* Clickable text labels */}
        <View style={[s.tabTextWrapper, s.posSummaries]}>
          <Pressable onPress={() => navigation.navigate('Summaries')} hitSlop={12}>
            <Text style={[s.tabText, s.summariesTab]}>SUMMARIES</Text>
          </Pressable>
        </View>

        <View style={[s.tabTextWrapper, s.posPractice]}>
          <Pressable
            onPress={() => navigation.navigate('PracticeTests')}
            onLongPress={handleFullTest}
            delayLongPress={300}
            hitSlop={12}
          >
            <Text style={[s.tabText, s.practiseOpenTab]}>PRACTISE TESTS</Text>
          </Pressable>
        </View>

        <View style={[s.tabTextWrapper, s.posResults]}>
          <Pressable
            onPress={() => navigation.navigate('Results')}
            onLongPress={handleSectionTest}
            delayLongPress={300}
            hitSlop={12}
          >
            <Text style={[s.tabText, s.resultsTab]}>RESULTS</Text>
          </Pressable>
        </View>

        <View style={[s.tabTextWrapper, s.posProfile]}>
          <Pressable onPress={() => navigation.navigate('ProfileSettings')} hitSlop={12}>
            <Text style={[s.tabText, s.profileTab]}>PROFILE & SETTINGS</Text>
          </Pressable>
        </View>

        {/* Corner logo */}
        <Image
          source={require('../../assets/curza-logo.png')}
          style={s.cornerLogo}
          resizeMode="contain"
        />

        {/* Main background */}
        <ImageBackground
          source={require('../../assets/PractiseOpenTab.png')}
          style={s.card}
          imageStyle={s.cardImage}
          resizeMode="cover"
        >
          <View style={[s.tabTextWrapper, s.posSummaries]}>
            <Pressable onPress={() => navigation.navigate('Dashboard')} hitSlop={12}>
              <Text style={[s.tabText, s.dashboardTab]}>DASHBOARD</Text>
            </Pressable>
          </View>

          {/* 🔵 TOP-RIGHT BLUE BLOCKS (unchanged) */}
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

            {/* Subject dropdown */}
            <View style={[s.pill, s.subjectPill]}>
              <Pressable
                onPress={() => setShowSubjectDrop(true)}
                hitSlop={6}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <View>
                  <Text style={s.pillTop}>SUBJECT</Text>
                  <Text style={s.pillMain}>{subject}</Text>
                </View>
                <Text style={s.chev}>▾</Text>
              </Pressable>

              {/* Modal options */}
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
          {/* 🔵 END TOP-RIGHT BLOCKS */}

          <View style={s.cardInner}>
            {/* 🚫 Removed the outer page ScrollView (like Dashboard) */}
            <Image
              source={require('../../assets/swoosh-yellow.png')}
              style={s.swoosh}
              resizeMode="contain"
            />
            <Image
              source={require('../../assets/dot-blue.png')}
              style={s.dot}
              resizeMode="contain"
            />

            <Text style={s.heading}>PRACTISE WITH WRITING TESTS</Text>
            <Text style={s.sub}>Ready to learn today?</Text>

            {/* Scrollable block */}
            <View style={s.bigBlock}>
            <ScrollView
              style={s.bigBlockScroll}
              contentContainerStyle={{ paddingBottom: 20, paddingRight: 6 }}
              showsVerticalScrollIndicator
            >
              <View style={s.panelsRow}>
                <SectionTestPanel
                  subject={subject}
                  grade={grade}
                  topics={TOPICS}
                  questionCounts={QUESTION_COUNTS}
                  onStart={startSection}
                />
                <FullExamPanel
                  subject={subject}
                  grade={grade}
                  papers={PAPERS}
                  onStart={startFull}
                />
              </View>
              {/* Info banner under panels */}
                <View style={s.infoBanner}>
                  <Text style={s.infoText}>
                    FULL EXAMS FOLLOW THE OFFICIAL CAPS STRUCTURE AND INCLUDE MULTIPLE SECTIONS.{'\n'}
                    AI WILL MARK STEP-BY-STEP AND PROVIDE FEEDBACK.
                  </Text>
                </View>
              </ScrollView>
            </View>
            {/* End scrollable block */}
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
  tabTextWrapper: { position: 'absolute', left: '4.5%', alignItems: 'center', zIndex: 5 },
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
    color: '#E5E7EB',
  },
  dashboardTab: { fontWeight: 'bold', marginTop: -115 },
  summariesTab: { opacity: 0.8, marginTop: -15 },
  practiseTab: { opacity: 0.8, marginTop: 20 },
  resultsTab: { opacity: 0.8, marginTop: 45 },
  profileTab: { opacity: 0.8, marginTop: 72 },
  practiseOpenTab: { opacity: 0.8, marginTop: 20 },

  logintab: { position: 'absolute', height: '100%', width: '100%', zIndex: 1 },

  card: { flex: 1, borderRadius: 40, overflow: 'hidden', position: 'relative', zIndex: 1 },
  cardInner: { flex: 1, borderRadius: 40, padding: 28, marginLeft: 210, marginRight: 14 },
  cardImage: { borderRadius: 40, resizeMode: 'cover' },

  // 🔵 Top-right info (unchanged)
  topRightWrap: { position: 'absolute', top: 22, right: 26, zIndex: 7, width: 360 },
  row: { flexDirection: 'row', gap: 14, marginBottom: 14, justifyContent: 'flex-end', marginTop: 15 },
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
  curriculumPill: { flexGrow: 0, width: 135, height: 55, alignItems: 'center', justifyContent: 'center' },
  gradePill: { flexGrow: 0, width: 110, height: 55, alignItems: 'center', justifyContent: 'center' },
  subjectPill: { flexGrow: 0, width: 260, height: 55, alignSelf: 'flex-end', justifyContent: 'center' },
  pillTop: { color: 'rgba(255,255,255,0.85)', fontFamily: 'AlumniSans_500Medium', fontSize: 12, letterSpacing: 1 },
  pillMain: { color: '#FFFFFF', fontFamily: 'Antonio_700Bold', fontSize: 18, letterSpacing: 0.3, marginTop: 2 },
  chev: { color: '#FFFFFF', fontSize: 18, marginLeft: 8 },

  // Modal dropdown
  ddBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  ddSheet: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
  },
  ddTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 8 },
  ddRow: { paddingVertical: 12, paddingHorizontal: 8, borderRadius: 10 },
  ddRowText: { fontSize: 16, color: '#1F2937' },
  ddCancel: { marginTop: 8, alignSelf: 'flex-end', padding: 8 },
  ddCancelText: { color: '#1F2937', textDecorationLine: 'underline' },

  // --- Heading visuals (unchanged)
  swoosh: {
    position: 'absolute',
    top: 20,
    left: '28%',
    width: 380,
    height: 100,
    transform: [{ rotateZ: '-2deg' }],
    opacity: 0.9,
    zIndex: 2,
  },
  dot: { position: 'absolute', top: 10, left: 470, height: '5%', zIndex: 1, opacity: 0.95 },
  heading: {
    fontFamily: 'Antonio_700Bold',
    color: 'white',
    fontSize: 48,
    letterSpacing: 0.5,
    marginBottom: 8,
    zIndex: 2,
    marginTop: 12,
  },
  sub: {
    fontFamily: 'AlumniSans_500Medium',
    color: '#E5E7EB',
    fontSize: 22,
    lineHeight: 28,
    marginBottom: 18,
    maxWidth: 560,
    marginTop: -10,
    opacity: 0.95,
    zIndex: 2,
  },
  cornerLogo: {
    position: 'absolute',
    bottom: 40,
    left: -55,
    height: 130,
    opacity: 0.9,
    zIndex: 10,
  },

  // scrollable block
  bigBlock: {
    backgroundColor: 'none',
    borderRadius: 16,
    padding: 16,
    marginTop: 30,
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

  scrollBlockItem: {
    width: 220,
    height: 180,
    borderRadius: 22,
    backgroundColor: '#6B7280',
    opacity: 0.5,
  },
  panelsRow: {
  flexDirection: 'row',
  gap: 18,
  marginBottom: 18,
  },
  infoBanner: {
  backgroundColor: '#2763F6', // your bright Curza blue
  borderRadius: 18,
  paddingVertical: 14,
  paddingHorizontal: 22,
  marginTop: 0,
  shadowColor: '#000',
  shadowOpacity: 0.25,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
},

infoText: {
  color: '#FFFFFF',
  fontFamily: 'Antonio_700Bold',
  fontSize: 16,
  textAlign: 'center',
  letterSpacing: 0.4,
  lineHeight: 20,
  paddingVertical: 10,
},

});
