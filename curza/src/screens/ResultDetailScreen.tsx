// src/screens/ResultDetailScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../App';

// Components
import TopicBreakdownCard from '../components/TopicBreakdownCard';
import PartialCreditCard from '../components/PartialCreditCard';
import KeyFeedbackTipsCard from '../components/KeyFeedbackTipsCard';

// Firebase 
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

type NavParams = {
  paper?: string;
  date?: string;
  score?: string;        
  marksEarned?: number;  
  marksTotal?: number;   
  outcome?: string;     
};

export default function ResultDetailScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<any>();
  const {
    paper = 'REVIEW YOUR TEST',
    date = '—',
    score = '—',
    marksEarned = 0,
    marksTotal = 0,
    outcome = '—',
  } = (route.params || {}) as NavParams;

  //  Top-right pills
  const [curriculum, setCurriculum] = useState('CAPS');
  const [grade, setGrade]         = useState<number | string>('12');
  const [subject, setSubject]     = useState('Mathematics');
  const [showSubjectDrop, setShowSubjectDrop] = useState(false);
  const [subjects, setSubjects]   = useState<string[]>([]);

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
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      try {
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
      } catch {
        // keep defaults
      }
    });
    return () => unsub();
  }, []);

  return (
    <View style={s.page}>
      <View style={s.imageWrapper}>
        {/* Left rail artwork */}
        <Image source={require('../../assets/DashboardTab.png')}  style={s.tab} resizeMode="contain" />
        <Image source={require('../../assets/SummariesTab.png')} style={s.tab} resizeMode="contain" />
        <Image source={require('../../assets/PractiseTab.png')}   style={s.tab} resizeMode="contain" />
        <Image source={require('../../assets/ProfileTab.png')}    style={s.tab} resizeMode="contain" />

        {/* Corner logo */}
        <Image source={require('../../assets/curza-logo.png')} style={s.cornerLogo} resizeMode="contain" />

        {/* Background */}
        <ImageBackground
          source={require('../../assets/ResultsOpenTab.png')}
          style={s.card}
          imageStyle={s.cardImage}
          resizeMode="cover"
        >
          {/* Dashboard label */}
          <View style={[s.tabTextWrapper, s.posSummaries, { zIndex: 6 }]}>
            <Pressable
              onPress={() => navigation.navigate('Dashboard')}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={[s.tabText, s.dashboardTab]}>DASHBOARD</Text>
            </Pressable>
          </View>

          {/* Left rail labels */}
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

          <View style={[s.tabTextWrapper, s.posResults, { zIndex: 7 }]}>
            <Pressable onPress={() => navigation.navigate('Results')} hitSlop={{ top:12, bottom:12, left:12, right:12 }}>
              <Text style={[s.tabText, s.resultsTab]}>RESULTS</Text>
            </Pressable>
          </View>

          <View style={[s.tabTextWrapper, s.posProfile]}>
            <Pressable onPress={() => navigation.navigate('ProfileSettings')} hitSlop={{ top:12, bottom:12, left:12, right:12 }}>
              <Text style={[s.tabText, s.profileTab]}>PROFILE & SETTINGS</Text>
            </Pressable>
          </View>

          {/* 🔵 Top-right pills*/}
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
          </View>

          {/* ===== Content ===== */}
          <View style={s.cardInner}>
            <Image source={require('../../assets/swoosh-yellow.png')} style={s.swoosh} resizeMode="contain" />
            <Image source={require('../../assets/dot-blue.png')}    style={s.dot}    resizeMode="contain" />

            {/* Page title = selected test */}
            <Text style={s.heading}>{paper}</Text>

            {/* Scrollable block */}
            <View style={s.bigBlock}>
              <ScrollView
                style={s.bigBlockScroll}
                contentContainerStyle={{ paddingBottom: 20, paddingRight: 6 }}
                showsVerticalScrollIndicator
              >
                {/* Grey rounded banner */}
                <View style={s.banner}>
                  <Text style={s.bannerTxt}>{paper}</Text>
                  <Text style={s.sep}>·</Text>
                  <Text style={s.bannerTxt}>{date}</Text>
                  <Text style={s.sep}>·</Text>
                  <Text style={s.bannerTxt}>{score}</Text>
                  <Text style={s.sep}>·</Text>
                  <Text style={s.bannerTxt}>
                    MARKS: {marksEarned} / {marksTotal}
                  </Text>
                  <Text style={s.sep}>·</Text>
                  <Text style={s.bannerTxt}>
                    OUTCOME: {String(outcome).toUpperCase()}
                  </Text>
                </View>

                <View style={s.feedbackBanner}>
                  <Text style={s.feedbackText}>
                    GOOD PROGRESS. YOU LOST MOST MARKS ON FACTORISATION AND INEQUALITIES. REVIEW TIPS BELOW, THEN RETAKE A SHORT SECTION TEST.
                  </Text>
                </View>

                {/* Buttons & Topic Breakdown */}
                <View style={s.rowInline}>
                  <View style={s.actionsCol}>
                    <View style={s.actionsRow}>
                      <Pressable style={s.actionBtn} onPress={() => {}}>
                        <Text style={s.actionText}>Review Questions</Text>
                      </Pressable>

                      <Pressable style={s.actionBtn} onPress={() => {}}>
                        <Text style={s.actionText}>Retake Section 10Q</Text>
                      </Pressable>

                      <Pressable style={s.actionBtn} onPress={() => {}}>
                        <Text style={s.actionText}>Download PDF</Text>
                      </Pressable>
                    </View>
                  </View>

                  <View style={s.breakdownCol}>
                    <TopicBreakdownCard />
                  </View>
                </View>

                {/* Partial Credit & Key Feedback*/}
                <View style={s.twoSmallCardsRow}>
                  <PartialCreditCard />
                  <KeyFeedbackTipsCard />
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

  tabTextWrapper: {
    position: 'absolute',
    left: '4.5%',
    alignItems: 'center',
    zIndex: 5,
  },

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

  dashboardTab: {
    fontWeight: 'bold',
    marginTop: -115,
  },

  summariesTab:    { opacity: 0.8, marginTop: -15 },
  practiseOpenTab: { opacity: 0.8, marginTop: 20 },
  resultsTab:      { opacity: 0.8, marginTop: 45 },
  profileTab:      { opacity: 0.8, marginTop: 72 },

  tab: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    zIndex: 1,
  },

  card: {
    flex: 1,
    borderRadius: 40,
    overflow: 'hidden',
    position: 'relative',
    zIndex: 1,
  },

  cardInner: {
    flex: 1,
    borderRadius: 40,
    padding: 28,
    marginLeft: 210,
    marginRight: 14,
  },

  cardImage: {
    borderRadius: 40,
    resizeMode: 'cover',
  },

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

  dot: {
    position: 'absolute',
    top: 100,
    left: 330,
    height: '5%',
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

  // Top-right pills
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

  // Modal dropdown (subject)
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

  ddTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },

  ddRow: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
  },

  ddRowText: {
    fontSize: 16,
    color: '#1F2937',
  },

  ddCancel: {
    marginTop: 8,
    alignSelf: 'flex-end',
    padding: 8,
  },

  ddCancelText: {
    color: '#1F2937',
    textDecorationLine: 'underline',
  },

  // Scrollable block
  bigBlock: {
    backgroundColor: 'none',
    borderRadius: 16,
    padding: 16,
    marginTop: 40,
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

  bigBlockScroll: {
    flex: 1,
  },

  
  banner: {
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
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },

  bannerTxt: {
    color: '#F9FAFB',
    fontFamily: 'Antonio_700Bold',
    fontSize: 18,
    letterSpacing: 0.4,
  },

  sep: {
    color: '#F9FAFB',
    opacity: 0.8,
    fontFamily: 'Antonio_700Bold',
    fontSize: 20,
    marginHorizontal: 10,
  },

  cornerLogo: {
    position: 'absolute',
    bottom: 40,
    left: -55,
    height: 130,
    opacity: 0.9,
    zIndex: 10,
  },

  feedbackBanner: {
    backgroundColor: '#2763F6',    
    borderRadius: 28,
    paddingVertical: 22,
    paddingHorizontal: 26,
    marginTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center', 
  },

  feedbackText: {
    color: '#FFFFFF',
    fontFamily: 'Antonio_700Bold',
    fontSize: 18,
    letterSpacing: 0.4,
    textAlign: 'center',
    lineHeight: 26,
  },


  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: 12,
    flexWrap: 'wrap',
  },

  actionBtn: {
    backgroundColor: '#FACC15',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    maxWidth: 170,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

  actionText: {
    color: '#1C1917',
    fontFamily: 'Antonio_700Bold',
    fontSize: 16,
    letterSpacing: 0.3,
    textAlign: 'center',
  },

  rowInline: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 12,
    alignItems: 'flex-start',
    flexWrap: 'nowrap',
  },
  actionsCol: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 280,
  },
  breakdownCol: {
    flexGrow: 0,
    flexShrink: 0,
    alignSelf: 'flex-start',
  },

  twoSmallCardsRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: -235,
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
});
