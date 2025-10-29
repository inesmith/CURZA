// src/screens/SummariesScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Image, ImageBackground } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../App';

// AI callables (no UI changes required)
import { summarizeAI, buildQuizAI } from '../../firebase';

// 🔵 Firebase (to read user curriculum/grade/subjects)
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function SummariesScreen() {
  const [centre, setCentre] = useState(false);
  const [terms, setTerms] = useState(false);
  const [showDrop, setShowDrop] = useState(false);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // 🔵 Top-right blocks state
  const [curriculum, setCurriculum] = useState<string>('CAPS');
  const [grade, setGrade] = useState<number | string>('12');
  const [subject, setSubject] = useState<string>('Mathematics');
  const [showSubjectDrop, setShowSubjectDrop] = useState(false);
  const [subjects, setSubjects] = useState<string[]>([]); // only user’s subjects

  // Minimal helpers (same logic as on Dashboard)
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
      .map(w => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
      .join(' ');

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
          if (profile?.subject) {
            const chosen = titleCase(profile.subject);
            setSubject(cleaned.includes(chosen) ? chosen : cleaned[0]);
          } else {
            setSubject(cleaned[0]);
          }
        } else {
          setSubjects([]); // only show what user signed up for (none -> none)
        }
      } catch {
        // ignore; keep defaults
      }
    });
    return () => unsub();
  }, []);

  // Minimal handlers that trigger on long-press (no visual change)
  const handleSummarize = async () => {
    try {
      const res = await summarizeAI({
        text: "Photosynthesis allows plants to convert light energy into chemical energy stored in glucose.",
        subject: "Life Sciences",
        grade: 10,
      });
      console.log('summarizeAI ->', res.data);
    } catch (err) {
      console.log('summarizeAI error:', err);
    }
  };

  const handleBuildQuiz = async () => {
    try {
      const res = await buildQuizAI({
        text: "Newton's three laws of motion and their applications in everyday scenarios.",
        subject: "Physical Sciences",
        grade: 11,
        count: 8,
      });
      console.log('buildQuizAI ->', res.data);
    } catch (err) {
      console.log('buildQuizAI error:', err);
    }
  };

  return (
    <View style={s.page}>
      <View style={s.imageWrapper}>
        {/* Left rail artwork (base layers) */}
        <Image source={require('../../assets/DashboardTab.png')} style={s.tab} resizeMode="contain" />
        <Image source={require('../../assets/PractiseTab.png')}   style={s.tab} resizeMode="contain" />
        <Image source={require('../../assets/ResultsTab.png')}    style={s.tab} resizeMode="contain" />
        <Image source={require('../../assets/ProfileTab.png')}    style={s.tab} resizeMode="contain" />

        {/* When dropdown is open, show the different-looking Summaries rail art */}
        {showDrop && (
          <Image
            source={require('../../assets/SummariesDropTab.png')}
            style={s.dropTab}
            resizeMode="contain"
          />
        )}

        {/* Clickable text labels */}
        <View style={[s.tabTextWrapper, s.posSummaries]}>
          <Pressable
            onPress={() => setShowDrop(v => !v)}
            onLongPress={handleSummarize}
            delayLongPress={300}
            hitSlop={{ top:12, bottom:12, left:12, right:12 }}
          >
            <Text style={[s.tabText, showDrop ? s.summariesActive : s.summariesTab]}>
              SUMMARIES
            </Text>
          </Pressable>
        </View>

        <View style={[s.tabTextWrapper, s.posPractice]}>
          <Pressable
            onPress={() => navigation.navigate('PracticeTests')}
            onLongPress={handleBuildQuiz}
            delayLongPress={300}
            hitSlop={{ top:12, bottom:12, left:12, right:12 }}
          >
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

        {/* Main background (Summaries open page) */}
        <ImageBackground
          source={require('../../assets/SummariesOpenTab.png')}
          style={s.card}
          imageStyle={s.cardImage}
          resizeMode="cover"
        >
          {/* Optional quick link */}
          <View style={[s.tabTextWrapper, s.posSummaries]}>
            <Pressable onPress={() => navigation.navigate('Dashboard')} hitSlop={{ top:12, bottom:12, left:12, right:12 }}>
              <Text style={[s.tabText, s.dashboardTab]}>DASHBOARD</Text>
            </Pressable>
          </View>

          {/* 🔵 TOP-RIGHT BLUE BLOCKS (same look/placement as Dashboard) */}
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

            {/* Subject dropdown (only user's subjects) */}
            <View style={[s.pill, s.subjectPill]}>
              <Pressable
                onPress={() => setShowSubjectDrop(v => !v)}
                hitSlop={6}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <View>
                  <Text style={s.pillTop}>SUBJECT</Text>
                  <Text style={s.pillMain}>{subject}</Text>
                </View>
                <Text style={s.chev}>{showSubjectDrop ? '▴' : '▾'}</Text>
              </Pressable>

              {showSubjectDrop && subjects.length > 0 && (
                <View style={s.dropdown}>
                  {subjects.map((subj) => (
                    <Pressable
                      key={subj}
                      onPress={() => { setSubject(subj); setShowSubjectDrop(false); }}
                      style={s.dropItem}
                    >
                      <Text style={s.dropTxt}>{subj}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </View>
          {/* 🔵 END TOP-RIGHT BLUE BLOCKS */}

          <View style={s.cardInner}>
            <ScrollView contentContainerStyle={s.scroll}>
              <Image source={require('../../assets/swoosh-yellow.png')} style={s.swoosh} resizeMode="contain" />
              <Image source={require('../../assets/dot-blue.png')} style={s.dot} resizeMode="contain" />
              <Text style={s.heading}>SUMMARISE YOUR STUDIES</Text>
              <Text style={s.sub}>Ready to learn today?</Text>
            </ScrollView>
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
    zIndex: 6, // above rail art
  },

  // Positions
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
  dashboardTab:   { fontWeight: 'bold', marginTop: -115 },
  summariesTab:   { opacity: 0.9, marginTop: -15 },
  summariesActive:{ opacity: 1, marginTop: -15, fontWeight: '800', color: '#FACC15' }, // active look
  practiseTab:    { opacity: 0.8, marginTop: 20 },
  resultsTab:     { opacity: 0.8, marginTop: 45 },
  profileTab:     { opacity: 0.8, marginTop: 72 },
  practiseOpenTab:{ opacity: 0.8, marginTop: 20 },

  // Rail art
  tab: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    zIndex: 1,
  },
  // The “different-looking” summaries rail when dropdown open
  dropTab: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    top: 0,
    left: 0,
    zIndex: 5, // above base rail art, below labels
  },

  // Main card
  card: {
    flex: 1,
    borderRadius: 40,
    overflow: 'hidden',
    position: 'relative',
    zIndex: 2, // card is above rail art
  },

  // 🔵 top-right container (inside the card)
  topRightWrap: {
    position: 'absolute',
    top: 22,
    right: 26,
    zIndex: 7,
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
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#1F2937',
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
    marginTop: 6,
    zIndex: 10,
    elevation: 6,
  },
  dropItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  dropTxt: {
    color: '#E5E7EB',
    fontFamily: 'AlumniSans_500Medium',
    fontSize: 16,
  },

  cardInner: { flex: 1, borderRadius: 40, padding: 28, marginLeft: 210, marginRight: 14 },
  cardImage: { borderRadius: 40, resizeMode: 'cover' },

  scroll: { paddingBottom: 44 },

  swoosh: {
    position: 'absolute',
    top: 10,
    left: '-8%',
    width: 380,
    height: 90,
    transform: [{ rotateZ: '-2deg' }],
    opacity: 0.9,
    zIndex: 3,
  },
  dot: {
    position: 'absolute',
    top: 50,
    left: 420,
    height: '35%',
    zIndex: 2,
    opacity: 0.95,
  },

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

  cornerLogo: {
    position: 'absolute',
    bottom: 40,
    left: -55,
    height: 130,
    opacity: 0.9,
    zIndex: 10,
  },
});
