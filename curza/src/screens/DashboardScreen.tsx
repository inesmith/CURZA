// src/screens/DashboardScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Image, ImageBackground, Modal, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../App';
import { useResponsive } from '../ui/responsive';

// contents
import ProgressBlock from '../components/ProgressBlock';
import ToDoBlock, { TodoItem } from '../components/ToDoBlock';
import ProgressSummaryBar from '../components/ProgressSummaryBar';
import UpcomingTestsCard from '../components/UpcomingTestsCard';
import FeedbackCard from '../components/FeedbackCard';
import RecentActivitiesCard from '../components/RecentActivitiesCard';

// Firebase
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const SWOOSH_W = 380; // must match s.swoosh.width

// Fallback subjects if profile has none
const DEFAULT_SUBJECTS = [
  'Mathematics', 'Mathematical Literacy', 'Physical Sciences', 'Life Sciences',
  'Geography', 'History', 'Accounting', 'Business Studies', 'Economics',
];

// --- helpers: keep changes minimal ---
const normalizeCurriculum = (value: any): string => {
  const raw = String(value ?? '').toLowerCase().replace(/[_-]+/g, ' ').trim();
  if (!raw) return 'CAPS'; // sensible default
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
    .map(w => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(' ');
// -------------------------------------

const todos: TodoItem[] = [
  { id: '1', text: 'REVISE TRIGONOMETRY' },
  { id: '2', text: 'PRACTISE MONKEY PUZZLES IN TESTS' },
  { id: '3', text: 'COMPLETE 3 PRACTISE TESTS' },
];

export default function DashboardScreen() {
  const [firstName, setFirstName] = useState<string>('');
  const [headingW, setHeadingW] = useState(0);
  const [headingX, setHeadingX] = useState(0);

  // 🔵 Top-right blocks state
  const [curriculum, setCurriculum] = useState<string>('CAPS');
  const [grade, setGrade] = useState<number | string>('12');
  const [subject, setSubject] = useState<string>('Mathematics');
  const [showSubjectDrop, setShowSubjectDrop] = useState(false);
  const [subjects, setSubjects] = useState<string[]>(DEFAULT_SUBJECTS);

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const R = useResponsive();

  const getFirst = (raw?: string | null): string => {
    if (!raw) return '';
    const t = raw.trim();
    if (!t) return '';
    if (t.includes('@')) return t.split('@')[0];
    return t.split(/\s+/)[0];
  };

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setFirstName('');
        return;
      }
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        const profile = snap.exists() ? (snap.data() as any) : undefined;

        const profileFullName: string | undefined = profile?.fullName;
        const name =
          getFirst(profileFullName) ||
          getFirst(user.displayName) ||
          getFirst(user.email) ||
          '';
        setFirstName(name);

        // Curriculum (abbreviate)
        if (profile?.curriculum) {
          setCurriculum(normalizeCurriculum(profile.curriculum));
        }

        // Grade
        if (profile?.grade) setGrade(profile.grade);

        // Subjects list (only show what user signed up for)
        const signedUpSubjects: any[] =
          profile?.subjects ||
          profile?.selectedSubjects ||
          profile?.subjectsChosen ||
          [];

        if (Array.isArray(signedUpSubjects) && signedUpSubjects.length > 0) {
          const cleaned = signedUpSubjects.map(titleCase).filter(Boolean);
          setSubjects(cleaned);
          if (profile?.subject) {
            const chosen = titleCase(profile.subject);
            setSubject(cleaned.includes(chosen) ? chosen : cleaned[0]);
          } else {
            setSubject(cleaned[0]);
          }
        } else {
          // Fallback to defaults
          setSubjects(DEFAULT_SUBJECTS);
          if (profile?.subject && DEFAULT_SUBJECTS.includes(titleCase(profile.subject))) {
            setSubject(titleCase(profile.subject));
          } else {
            setSubject(DEFAULT_SUBJECTS[0]);
          }
        }
      } catch {
        const fallback =
          getFirst((getAuth().currentUser?.displayName) || '') ||
          getFirst((getAuth().currentUser?.email) || '') ||
          '';
        setFirstName(fallback);
      }
    });
    return () => unsub();
  }, []);

  const headingText = firstName
    ? `WELCOME BACK, ${firstName.toUpperCase()}`
    : 'WELCOME BACK';

  // Exact center alignment: center(swoosh) = center(text)
  const swooshLeft =
    headingW > 0 ? (headingX + headingW / 2) - (SWOOSH_W / 2) - 30 : '20%';

  return (
    <View style={s.page}>
      <View style={s.imageWrapper}>
        {/* Left rail artwork */}
        <Image source={require('../../assets/SummariesTab.png')} style={s.tab} resizeMode="contain" />
        <Image source={require('../../assets/PractiseTab.png')}   style={s.tab} resizeMode="contain" />
        <Image source={require('../../assets/ResultsTab.png')}   style={s.tab} resizeMode="contain" />
        <Image source={require('../../assets/ProfileTab.png')}   style={s.tab} resizeMode="contain" />

        {/* Clickable text labels */}
        <View style={[s.tabTextWrapper, s.posSummaries]}>
          <Pressable onPress={() => navigation.navigate('Summaries')} hitSlop={{ top:12, bottom:12, left:12, right:12 }}>
            <Text style={[s.tabText, s.summariesTab]}>SUMMARIES</Text>
          </Pressable>
        </View>

        <View style={[s.tabTextWrapper, s.posPractice]}>
          <Pressable onPress={() => navigation.navigate('PracticeTests')} hitSlop={{ top:12, bottom:12, left:12, right:12 }}>
            <Text style={[s.tabText, s.practiseOpenTab]}>PRACTISE TESTS</Text>
          </Pressable>
        </View>

        <View style={[s.tabTextWrapper, s.posResults]}>
          <Pressable onPress={() => navigation.navigate('Results')} hitSlop={{ top:12, bottom:12, left:12, right:12 }}>
            <Text style={[s.tabText, s.resultsTab]}>RESULTS</Text>
          </Pressable>
        </View>

        <View style={[s.tabTextWrapper, s.posProfile]}>
          <Pressable onPress={() => navigation.navigate('ProfileSettings')} hitSlop={{ top:12, bottom:12, left:12, right:12 }}>
            <Text style={[s.tabText, s.profileTab]}>PROFILE & SETTINGS</Text>
          </Pressable>
        </View>

        {/* Corner logo */}
        <Image source={require('../../assets/curza-logo.png')} style={s.cornerLogo} resizeMode="contain" />

        {/* Main background */}
        <ImageBackground
          source={require('../../assets/DashboardOpenTab.png')}
          style={s.card}
          imageStyle={s.cardImage}
          resizeMode="cover"
        >
          <View style={[s.tabTextWrapper, s.posSummaries]}>
            <Pressable onPress={() => navigation.navigate('Dashboard')} hitSlop={{ top:12, bottom:12, left:12, right:12 }}>
              <Text style={[s.tabText, s.dashboardTab]}>DASHBOARD</Text>
            </Pressable>
          </View>

          {/* 🔵 TOP-RIGHT BLUE BLOCKS */}
          <View style={s.topRightWrap}>
            <View style={s.row}>
              {/* Curriculum pill */}
              <View style={[s.pill, s.curriculumPill]}>
                <Text style={s.pillTop}>CURRICULUM</Text>
                <Text style={s.pillMain}>{String(curriculum).toUpperCase()}</Text>
              </View>

              {/* Grade pill */}
              <View style={[s.pill, s.gradePill]}>
                <Text style={s.pillTop}>GRADE</Text>
                <Text style={s.pillMain}>{String(grade).toUpperCase()}</Text>
              </View>
            </View>

            {/* Subject pill (button unchanged) */}
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

              {/* ⚪ Modal options panel matching SignUp Select */}
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
          {/* 🔵 END TOP-RIGHT BLUE BLOCKS */}

          <View style={s.cardInner}>
            {/* no outer ScrollView: the page is static */}
            <Image
              source={require('../../assets/swoosh-yellow.png')}
              style={[s.swoosh, { left: swooshLeft }]}
              resizeMode="contain"
            />

            <Image source={require('../../assets/dot-blue.png')} style={s.dot} resizeMode="contain" />

            <Text
              style={s.heading}
              onLayout={(e) => {
                const { x, width } = e.nativeEvent.layout;
                setHeadingX(x);
                setHeadingW(width);
              }}
            >
              {headingText}
            </Text>

            <Text style={s.sub}>Ready to learn today?</Text>

            {/* Scrollable block */}
            <View style={s.bigBlock}>
              <ScrollView
                style={s.bigBlockScroll}
                contentContainerStyle={{ paddingBottom: 20, paddingRight: 6 }}
                showsVerticalScrollIndicator
              >
                <View style={s.contentRow}>
                  {/* LEFT: progress + blue summary bar */}
                  <View style={s.leftCol}>
                    <ProgressBlock
                      stats={{ summariesStudied: 15, chaptersCovered: 25, quizzesDone: 20, testsCompleted: 40 }}
                    />
                    <View style={{ marginTop: 0,}}>
                      <ProgressSummaryBar text="YOU HAVE COMPLETED 4/12 MATH TOPICS" />
                    </View>
                    {/* two cards row */}
                    <View style={s.smallCardsRow}>
                      <UpcomingTestsCard onStart={() => console.log('Start suggested test')} />
                      <FeedbackCard
                        areas={['FRACTIONS', 'ALGEBRA']}
                        onView={() => console.log('Open feedback')}
                      />
                    </View>
                  </View>

                  {/* RIGHT: To-Do list + Recent Activities (stacked) */}
                  <View style={s.rightCol}>
                    <ToDoBlock
                      items={todos}
                      onAdd={() => console.log('Add a new to-do')}
                    />
                    <View style={s.recentSpacer}>
                      <RecentActivitiesCard
                        items={[
                          { id: 'a1', text: 'COMPLETED ALGEBRA TEST', score: 65, showArrow: true },
                          { id: 'a2', text: 'READ GEOMETRY SUMMARY - CHAPTER 4' },
                        ]}
                      />
                    </View>
                  </View>
                </View>

              </ScrollView>
            </View>
            {/* Scrollable block */}
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

  // Base text wrapper (left rail anchor)
  tabTextWrapper: {
    position: 'absolute',
    left: '4.5%',
    alignItems: 'center',
    zIndex: 5,
  },

  // Individual vertical positions
  posActive:    { top: '15%' },
  posSummaries: { top: '22%' },
  posPractice:  { top: '30%' },
  posResults:   { top: '39%' },
  posProfile:   { top: '48%' },

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
  dashboardTab:  { fontWeight: 'bold', marginTop: -115, },
  summariesTab:{ opacity: 0.8, marginTop: -15 },
  practiseTab: { opacity: 0.8, marginTop: 20 },
  resultsTab:  { opacity: 0.8, marginTop: 45 },
  profileTab:  { opacity: 0.8, marginTop: 72},
  practiseOpenTab: { opacity: 0.8, marginTop: 20 },

  // Tab artwork
  tab: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    zIndex: 1,
  },

  // Main card
  card: {
    flex: 1,
    borderRadius: 40,
    overflow: 'hidden',
    position: 'relative',
    zIndex: 1,
  },

  // 🔵 top-right container (inside the card)
  topRightWrap: {
    position: 'absolute',
    top: 22,
    right: 26,
    zIndex: 6,
    width: 360,
  },
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
    width: 260,
    paddingVertical: 10,
    alignSelf: 'flex-end',
    justifyContent: 'center',
    height: 55,
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
  chev: {
    color: '#FFFFFF',
    fontSize: 18,
    marginLeft: 8,
  },

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

  cardInner: {
    flex: 1,
    borderRadius: 40,
    padding: 28,
    marginLeft: 210,
    marginRight: 14,
  },
  cardImage: { borderRadius: 40, resizeMode: 'cover' },

  // removed outer ScrollView to stop page scrolling
  // scroll: { paddingBottom: 44 },

  swoosh: {
    position: 'absolute',
    top: 25,
    width: SWOOSH_W,
    height: 90,
    transform: [{ rotateZ: '-2deg' }],
    opacity: 0.9,
    zIndex: 2,
  },
  dot: {
    position: 'absolute',
    top: 80,
    left: 10,
    height: '7%',
    zIndex: 1,
    opacity: 0.95,
  },

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

  // Scrollable block
  bigBlock: {
    backgroundColor: 'none',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    marginLeft: -20,
    marginRight: -40,
    height: 620,              // adjust to taste
    alignSelf: 'stretch',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  bigBlockScroll: { flex: 1 },
  bigBlockText: {
    color: '#111827',
    fontFamily: 'AlumniSans_500Medium',
    fontSize: 18,
    marginBottom: 8,
  },
  bigBlockItem: {
    color: '#111827',
    fontFamily: 'AlumniSans_500Medium',
    fontSize: 16,
    opacity: 0.85,
    marginBottom: 6,
  },

  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start', // keeps top edges aligned
    gap: 12,
  },

  leftCol: {
    maxWidth: 430, // matches your ProgressBlock width
    flexShrink: 0,
  },

  // NEW: wrapper so RecentActivities sits directly under To-Do
  rightCol: {
    maxWidth: 520,
    flexShrink: 1,
    alignSelf: 'stretch',
  },

  cornerLogo: {
    position: 'absolute',
    bottom: 40,
    left: -55,
    height: 130,
    opacity: 0.9,
    zIndex: 10,
  },

  smallCardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },

  recentSpacer: {
    marginTop: 12, // nudge it down; tweak 12–20 to taste
  },

});
