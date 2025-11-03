// src/screens/SummariesScreen.tsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Image,
  ImageBackground,
  Modal,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../App';

// AI callables
import { summarizeAI, createTestAI } from '../../firebase';

// Firebase
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

// Content
import KeyConceptsCard from '../components/KeyConceptsCard';
import FormulasCard from '../components/FormulasCard';
import ExampleSection from '../components/ExampleSection';
import TipBoxCard from '../components/TipBoxCard';

// progress helpers
import { incSummariesStudied, incChaptersCovered } from '../utils/progress';

// 🔵 AI chapters util (returns total + names)
import { getChaptersMeta } from '../utils/chaptersMeta';

export default function SummariesScreen() {
  const [showDrop, setShowDrop] = useState(false);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // 🔵 Top-right blocks state
  const [curriculum, setCurriculum] = useState<string>('CAPS');
  const [grade, setGrade] = useState<number | string>('12');

  // subject (user’s subjects only)
  // start with empty => “CHOOSE” until user picks
  const [subject, setSubject] = useState<string>('');
  const [showSubjectDrop, setShowSubjectDrop] = useState(false);
  const [subjects, setSubjects] = useState<string[]>([]);

  // chapter = numeric only (UI shows heading "CHAPTER")
  // start with '-' until a chapter is selected (even after subject is chosen)
  const [chapter, setChapter] = useState<string>('-');
  const [showChapterDrop, setShowChapterDrop] = useState(false);

  // real chapter count for selected subject + chapter names
  const [chaptersTotal, setChaptersTotal] = useState<number>(0);
  const [chapterNames, setChapterNames] = useState<Record<string, string>>({});

  // helpers
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

  const formatSubjectTwoLine = (name: string) => {
    const parts = String(name || '').trim().split(/\s+/);
    if (parts.length <= 2) return name;
    const first = parts.slice(0, 2).join(' ');
    const rest = parts.slice(2).join(' ');
    return `${first}\n${rest}`;
  };

  // Build dynamic chapter options from total (1..N)
  const chapterOptions = useMemo(() => {
    const n = Math.max(0, chaptersTotal || 0);
    return Array.from({ length: n }, (_, i) => String(i + 1));
  }, [chaptersTotal]);

  // Pull profile (curriculum/grade/subjects)
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        const profile = snap.exists() ? (snap.data() as any) : undefined;

        if (profile?.curriculum) setCurriculum(normalizeCurriculum(profile.curriculum));
        if (profile?.grade) setGrade(profile.grade);

        const signedUpSubjects: any[] =
          profile?.subjects ||
          profile?.selectedSubjects ||
          profile?.subjectsChosen ||
          [];

        if (Array.isArray(signedUpSubjects) && signedUpSubjects.length > 0) {
          const cleaned = signedUpSubjects.map(titleCase).filter(Boolean);
          setSubjects(cleaned);
          // do NOT auto-select subject here. Show “CHOOSE”.
          setSubject('');
          setChapter('-');
          setChaptersTotal(0);
          setChapterNames({});
        } else {
          setSubjects([]);
          setSubject('');
          setChapter('-');
          setChaptersTotal(0);
          setChapterNames({});
        }
      } catch {
        // ignore; keep defaults
      }
    });
    return () => unsub();
  }, []);

  // —— AI actions ——
  const handleSummarize = async () => {
    try {
      const res = await summarizeAI({
        text:
          'Photosynthesis allows plants to convert light energy into chemical energy stored in glucose.',
        subject: 'Life Sciences',
        grade: 10,
      });
      console.log('summarizeAI ->', res.data);
      await incSummariesStudied(); // progress update
    } catch (err) {
      console.log('summarizeAI error:', err);
    }
  };

  // Build a quick test from the current Subject/Chapter (long-press PRACTISE TESTS)
  const handleBuildQuiz = async () => {
    try {
      const res = await createTestAI({
        subject: subject || '—',
        grade,
        mode: 'section',
        topic: chapter && chapter !== '-' ? `Chapter ${chapter}` : 'Chapter 1',
        count: 10,
        timed: false,
      });
      console.log('createTestAI(section) ->', res.data);
    } catch (err) {
      console.log('createTestAI(section) error:', err);
    }
  };

  // when subject is chosen, fetch real chapter total + names,
  // keep chapter at '-' (you’ll choose it next)
  const onSelectSubject = async (subj: string) => {
    setSubject(subj);
    setShowSubjectDrop(false);
    setChapter('-'); // ← keep "-" until user picks a chapter
    try {
      const meta = await getChaptersMeta({ curriculum, grade, subject: subj });
      setChaptersTotal(meta.total || 10);
      setChapterNames(meta.names || {});
    } catch (e) {
      console.log('getChaptersMeta failed, defaulting:', e);
      setChaptersTotal(10);
      setChapterNames({});
    }
  };

  // when chapter is picked manually, update and bump summaries studied
  const onSelectChapter = async (n: string) => {
    setChapter(n);
    setShowChapterDrop(false);
    try {
      await incSummariesStudied(); // dashboard "My Progress" updates via live listener
    } catch (e) {
      console.log('incSummariesStudied (on chapter select) failed:', e);
    }
  };

  // Derived display values
  const subjectDisplay = subject ? subject : 'CHOOSE';
  const chapterDisplay = !subject ? '–' : (chapter !== '-' ? `${chapter} / ${chaptersTotal || ''}` : '-');

  // Topic bar: “Select Your Subject & Chapter” until both chosen
  const topicBarText =
    subject && chapter !== '-'
      ? `${subject.toUpperCase()} – CHAPTER ${chapter}${chapterNames[chapter] ? ` – ${chapterNames[chapter]}` : ''}`
      : 'Select Your Subject & Chapter';

  return (
    <View style={s.page}>
      <View style={s.imageWrapper}>
        {/* Left rail artwork (base layers) */}
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Image source={require('../../assets/DashboardTab.png')} style={s.tab} resizeMode="contain" />
          <Image source={require('../../assets/PractiseTab.png')} style={s.tab} resizeMode="contain" />
          <Image source={require('../../assets/ResultsTab.png')} style={s.tab} resizeMode="contain" />
          <Image source={require('../../assets/ProfileTab.png')} style={s.tab} resizeMode="contain" />
        </View>

        {/* When dropdown is open, show the different-looking Summaries rail art */}
        {showDrop && (
          <Image source={require('../../assets/SummariesDropTab.png')} style={s.dropTab} resizeMode="contain" />
        )}

        {/* Clickable text labels */}
        <View style={[s.tabTextWrapper, s.posSummaries]}>
          <Pressable
            onPress={() => setShowDrop((v) => !v)}
            onLongPress={handleSummarize}
            delayLongPress={300}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={[s.tabText, showDrop ? s.summariesActive : s.summariesTab]}>SUMMARIES</Text>
          </Pressable>
        </View>

        <View style={[s.tabTextWrapper, s.posPractice]}>
          <Pressable
            onPress={() => navigation.navigate('PracticeTests')}
            onLongPress={handleBuildQuiz}
            delayLongPress={300}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
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

        {/* Corner logo */}
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Image source={require('../../assets/curza-logo.png')} style={s.cornerLogo} resizeMode="contain" />
        </View>

        {/* Main background */}
        <ImageBackground
          source={require('../../assets/SummariesOpenTab.png')}
          style={s.card}
          imageStyle={s.cardImage}
          resizeMode="cover"
        >
          {/* Quick link */}
          <View style={[s.tabTextWrapper, s.posSummaries]}>
            <Pressable onPress={() => navigation.navigate('Dashboard')} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={[s.tabText, s.dashboardTab]}>DASHBOARD</Text>
            </Pressable>
          </View>

          {/* 🔵 TOP-RIGHT BLUE BLOCKS (4 pills) */}
          <View style={s.topRightWrap}>
            {/* Row 1: Curriculum + Grade */}
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

            {/* Row 2: Subject + Chapter */}
            <View style={s.row2}>
              {/* SUBJECT */}
              <View style={[s.pill, s.subjectPill]}>
                <Pressable
                  onPress={() => setShowSubjectDrop(true)}
                  hitSlop={6}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <View style={s.subjectTextWrap}>
                    <Text style={s.pillTop}>SUBJECT</Text>
                    <Text
                      style={s.pillMain}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {subjectDisplay /* shows selected subject or CHOOSE */}
                    </Text>
                  </View>
                  <Text style={s.chev}>▾</Text>
                </Pressable>
              </View>

              {/* CHAPTER (numeric only) */}
              <View style={[s.pill, s.chapterPill]}>
                <Pressable
                  onPress={() => {
                    if (!subject) return; // disabled until subject selected
                    setShowChapterDrop(true);
                  }}
                  hitSlop={6}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', opacity: subject ? 1 : 0.5 }}
                >
                  <View style={{ flexShrink: 1, minWidth: 0 }}>
                    <Text style={s.pillTop}>CHAPTER</Text>
                    <Text style={s.pillMain} numberOfLines={1} ellipsizeMode="tail">
                      {chapterDisplay /* '-' until chosen; then "n / total" */}
                    </Text>
                  </View>
                  <Text style={s.chev}>▾</Text>
                </Pressable>
              </View>
            </View>

            {/* Subject modal */}
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
                        onPress={() => onSelectSubject(subj)}
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

            {/* Chapter modal (numeric only, driven by chaptersTotal) */}
            <Modal
              transparent
              visible={showChapterDrop}
              animationType="fade"
              onRequestClose={() => setShowChapterDrop(false)}
            >
              <View style={s.ddBackdrop}>
                <View style={s.ddSheet}>
                  <Text style={s.ddTitle}>Select Chapter</Text>
                  <ScrollView style={{ maxHeight: 340 }}>
                    {(chapterOptions.length ? chapterOptions : ['1','2','3','4','5','6','7','8','9','10']).map((n) => (
                      <Pressable
                        key={n}
                        style={s.ddRow}
                        onPress={() => onSelectChapter(n)}
                      >
                        <Text style={s.ddRowText}>{n}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                  <Pressable style={s.ddCancel} onPress={() => setShowChapterDrop(false)}>
                    <Text style={s.ddCancelText}>Cancel</Text>
                  </Pressable>
                </View>
              </View>
            </Modal>
          </View>
          {/* 🔵 END TOP-RIGHT BLUE BLOCKS */}

          <View style={s.cardInner}>
            <Image source={require('../../assets/swoosh-yellow.png')} style={s.swoosh} resizeMode="contain" />
            <Image source={require('../../assets/dot-blue.png')} style={s.dot} resizeMode="contain" />

            <Text style={s.heading}>SUMMARISE YOUR STUDIES</Text>
            <Text style={s.sub}>Ready to learn today?</Text>

            {/* Scrollable block */}
            <View style={s.bigBlock}>
              <ScrollView
                style={s.bigBlockScroll}
                contentContainerStyle={{ paddingBottom: 20, paddingRight: 6 }}
                showsVerticalScrollIndicator
              >
                {/* Topic bar at top of the scroll box */}
                <View style={s.topicBar}>
                  {/* dynamic label */}
                  <Text style={s.topicText}>{topicBarText}</Text>
                </View>

                <View style={s.contentRow}>
                  <View style={s.leftCol}>
                    <KeyConceptsCard
                      concepts={[
                        'EXPRESSIONS CAN BE SIMPLIFIED BY COMBINING LIKE TERMS.',
                        'FACTORISATION IS USED TO REWRITE EXPRESSIONS MORE SIMPLY.',
                        'THE DISTRIBUTIVE PROPERTY: A(B + C) = AB + AC.',
                      ]}
                    />
                    <ExampleSection
                      exampleSteps={['SIMPLIFY: 2X + 3X - 5', ' = (2 + 3)X - 5', ' = 5X - 5']}
                      onGenerateExamples={() => console.log('Generate Examples')}
                      onDownloadSummary={() => console.log('Download Summary')}
                      onMarkRevised={async () => { try { await incChaptersCovered(); } catch (e) { console.log(e);} }} // progress update
                    />
                  </View>

                  <View style={s.rightCol}>
                    <FormulasCard
                      formulas={[
                        '(X + Y)² = X² + 2XY + Y²',
                        '(X - Y)² = X² - 2XY + Y²',
                        '(X + A)(X + B) = X² + (A + B)X + AB',
                      ]}
                    />
                    <TipBoxCard
                      tips={[
                        'ALWAYS GROUP LIKE TERMS BEFORE YOU FACTORISE.',
                        'EXAMS USUALLY GIVE 1 MARK FOR WRITING THE THEOREM IN GEOMETRY PROOFS.',
                        'COMMON MISTAKE: FORGETTING TO SIMPLIFY FRACTIONS AT THE LAST STEP.',
                      ]}
                    />
                  </View>
                </View>
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

  tabTextWrapper: { position: 'absolute', left: '4.5%', alignItems: 'center', zIndex: 6 },

  // Positions
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
  summariesTab: { opacity: 0.9, marginTop: -15 },
  summariesActive: { opacity: 1, marginTop: -15, fontWeight: '800', color: '#FACC15' },
  practiseTab: { opacity: 0.8, marginTop: 20 },
  resultsTab: { opacity: 0.8, marginTop: 45 },
  profileTab: { opacity: 0.8, marginTop: 72 },
  practiseOpenTab: { opacity: 0.8, marginTop: 20 },

  // Rail art
  tab: { position: 'absolute', height: '100%', width: '100%', zIndex: 1 },
  dropTab: { position: 'absolute', height: '100%', width: '100%', top: 0, left: 0, zIndex: 5 },

  // Main card
  card: { flex: 1, borderRadius: 40, overflow: 'hidden', position: 'relative', zIndex: 2 },

  // 🔵 top-right container
  topRightWrap: { position: 'absolute', top: 22, right: 26, zIndex: 7, width: 360 },

  row: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 14,
    justifyContent: 'flex-end',
    marginTop: 15,
  },
  row2: { flexDirection: 'row', gap: 14, justifyContent: 'flex-end', marginTop: 0 },

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
    paddingVertical: 10,
    height: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradePill: {
    flexGrow: 0,
    width: 110,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    height: 55,
  },

  subjectPill: {
    flexGrow: 0,
    width: 155,
    height: 55,
    alignSelf: 'flex-end',
    justifyContent: 'center',
    overflow: 'hidden',
    paddingVertical: 10,
  },

  subjectTextWrap: {
    flexShrink: 1,
    minWidth: 0,
    alignSelf: 'stretch'
  },

  chapterPill: {
    flexGrow: 0,
    width: 90,
    height: 55,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },

  subjectTextSmall: { fontSize: 15 },

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

  // Dropdowns
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

  cardInner: { flex: 1, borderRadius: 40, padding: 28, marginLeft: 210, marginRight: 14 },
  cardImage: { borderRadius: 40, resizeMode: 'cover' },

  swoosh: {
    position: 'absolute',
    top: 30,
    left: '-8%',
    width: 380,
    height: 100,
    transform: [{ rotateZ: '-2deg' }],
    opacity: 0.9,
    zIndex: 3,
  },
  dot: { position: 'absolute', top: 70, left: 450, height: '7%', zIndex: 2, opacity: 0.95 },

  heading: {
    fontFamily: 'Antonio_700Bold',
    color: 'white',
    fontSize: 48,
    letterSpacing: 0.5,
    marginBottom: 8,
    zIndex: 3,
    marginTop: 12,
    textShadowColor: 'rgba(0,0,0,0.22)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
    zIndex: 3,
  },

  // Scrollable block
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

  cornerLogo: { position: 'absolute', bottom: 40, left: -55, height: 130, opacity: 0.9, zIndex: 10 },

  topicBar: {
    backgroundColor: '#6B7280',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignSelf: 'stretch',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

  topicText: {
    color: '#FFFFFF',
    fontFamily: 'Antonio_700Bold',
    fontSize: 22,
    textAlign: 'center',
    justifyContent: 'center',
    letterSpacing: 0.4,
    alignItems: 'flex-start',
  },

  contentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 0 },
  leftCol: { maxWidth: 460, flexShrink: 0 },
  rightCol: { maxWidth: 460, flexShrink: 0 },
});
