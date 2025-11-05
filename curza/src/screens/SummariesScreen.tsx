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
import { summariseAI, createTestAI, listOptionsAI } from '../../firebase';

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

// AI chapters util (returns total + names)
import { getChaptersMeta } from '../utils/chaptersMeta';

// Per-chapter topics util
import { getTopicsForChapter, type TopicSection } from '../utils/chapterTopics';

// ✅ Use your top toast modal
import StatusModal from '../ui/StatusModal';

export default function SummariesScreen() {
  const [showDrop, setShowDrop] = useState(false);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // 🔵 Top-right blocks state
  const [curriculum, setCurriculum] = useState<string>('CAPS');
  const [grade, setGrade] = useState<number | string>('12');

  // subject
  const [subject, setSubject] = useState<string>('');
  const [showSubjectDrop, setShowSubjectDrop] = useState(false);
  const [subjects, setSubjects] = useState<string[]>([]);

  // chapter
  const [chapter, setChapter] = useState<string>('-');
  const [showChapterDrop, setShowChapterDrop] = useState(false);

  // chapters meta
  const [chaptersTotal, setChaptersTotal] = useState<number>(0);
  const [chapterNames, setChapterNames] = useState<Record<string | number, string>>({});

  // per-chapter topics
  const [topics, setTopics] = useState<TopicSection[]>([]);

  // examples loading
  const [examplesLoading, setExamplesLoading] = useState(false);

  // ✅ toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVariant, setToastVariant] = useState<'success' | 'error'>('success');

  // —— local helpers (self-contained for this screen) ——
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

  const stripLead = (s: string) => String(s ?? '').replace(/^[•\-\d\.\)\s]+/, '').trim();

  const dedupe = (arr: string[]) => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const t of arr) {
      const k = String(t ?? '').trim().toLowerCase();
      if (k && !seen.has(k)) { seen.add(k); out.push(String(t)); }
    }
    return out;
  };

  const buildFallbackExamples = (topic: string, chapName: string, subj: string) => {
    const t = topic || 'Topic';
    const c = chapName || (chapter ? `Chapter ${chapter}` : 'This Chapter');
    const s = subj || subject || 'Subject';
    return [
      `Worked example: Apply a core rule of ${t} in ${s}.`,
      `Step-by-step: Solve a typical ${t} question from ${c} with annotations.`,
      `Check: Verify the answer and reflect on common mistakes in ${t}.`,
    ];
  };

  // Fallback topics generator (used if API returns nothing or errors)
  const defaultTopicsForChapter = (chapName?: string): TopicSection[] => {
    const base = [
      'Overview & Key Ideas',
      'Core Definitions',
      'Formulas & Rules',
      'Worked Example',
      'Common Mistakes & Tips',
    ];
    return base.map((title) => ({
      title,
      keyConcepts: [],
      exampleSteps: [],
      formulas: [],
      tips: [],
    }));
  };

  // Build dynamic chapter options 1..N
  const chapterOptions = useMemo(() => {
    const n = Math.max(0, chaptersTotal || 0);
    return Array.from({ length: n }, (_, i) => String(i + 1));
  }, [chaptersTotal]);

  // Pull profile
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
          setSubject('');
          setChapter('-');
          setChaptersTotal(0);
          setChapterNames({});
          setTopics([]);
        } else {
          setSubjects([]);
          setSubject('');
          setChapter('-');
          setChaptersTotal(0);
          setChapterNames({});
          setTopics([]);
        }
      } catch {
        // ignore
      }
    });
    return () => unsub();
  }, []);

  // —— AI actions ——
  const handleSummarize = async () => {
    try {
      const res = await summariseAI({
        text:
          'Photosynthesis allows plants to convert light energy into chemical energy stored in glucose.',
        subject: 'Life Sciences',
        grade: 10,
      });
      console.log('summarizeAI ->', res.data);
      await incSummariesStudied();
    } catch (err) {
      console.log('summarizeAI error:', err);
    }
  };

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

  // Select subject → fetch chapter meta (keep chapter "-")
  const onSelectSubject = async (subj: string) => {
    setSubject(subj);
    setShowSubjectDrop(false);
    setChapter('-');
    setTopics([]); // clear topics until a chapter is chosen
    try {
      const meta = await getChaptersMeta({ curriculum, grade, subject: subj });
      setChaptersTotal(meta.total || 10);
      // accept names keyed by number or string
      const names = (meta.names || {}) as Record<string | number, string>;
      setChapterNames(names);
    } catch (e) {
      console.log('getChaptersMeta failed, defaulting:', e);
      setChaptersTotal(10);
      setChapterNames({});
    }
  };

  // Select chapter → fetch topics (already hydrated with keyConcepts)
  const onSelectChapter = async (n: string) => {
    setChapter(n);
    setShowChapterDrop(false);
    setTopics([]); // reset while loading

    try {
      const chapNum = String(n);

      // Try get chapterName from cached names
      let chapName =
        chapterNames[chapNum] ??
        chapterNames[Number(chapNum) as any] ??
        '';

      // If missing, re-fetch meta once to hydrate names
      if (!chapName) {
        try {
          const meta2 = await getChaptersMeta({ curriculum, grade, subject: subject || '' });
          const names2 = (meta2?.names || {}) as Record<string | number, string>;
          setChapterNames(names2);
          chapName = names2[chapNum] ?? names2[Number(chapNum) as any] ?? '';
        } catch (err) {
          console.log('Re-fetch chapter names failed:', err);
        }
      }

      // Attempt primary topics load (these now include keyConcepts)
      let t: any = [];
      try {
        t = await getTopicsForChapter({
          curriculum,
          grade,
          subject: subject || '',
          chapter: chapNum,
          chapterName: chapName,
        });
      } catch (err) {
        console.log('getTopicsForChapter error — using fallback:', err);
        t = [];
      }

      // Normalize to ensure each topic has a `.title`
      let normalized: TopicSection[] = (Array.isArray(t) ? t : []).map((x: any, i: number) => {
        const title =
          typeof x === 'string'
            ? x
            : x?.title ?? x?.name ?? x?.topic ?? x?.heading ?? `Topic ${i + 1}`;
        return {
          title,
          keyConcepts: Array.isArray(x?.keyConcepts) ? x.keyConcepts : [],
          exampleSteps: Array.isArray(x?.exampleSteps) ? x.exampleSteps : [],
          formulas: Array.isArray(x?.formulas) ? x.formulas : [],
          tips: Array.isArray(x?.tips) ? x.tips : [],
        } as TopicSection;
      });

      // Fallback if nothing came back
      if (!normalized.length) {
        normalized = defaultTopicsForChapter(chapName);
      }

      // Set topics (with key concepts if present)
      setTopics(normalized);

      // progress tick (optional to keep)
      try {
        await incSummariesStudied();
      } catch (e) {
        console.log('incSummariesStudied after topics failed:', e);
      }
    } catch (e) {
      console.log('onSelectChapter failed — using fallback topics:', e);
      const fallback = defaultTopicsForChapter();
      setTopics(fallback);
    }
  };

  // ✅ Generate more EXAMPLES + show StatusModal toast
  const handleGenerateExamples = async () => {
    if (!subject || chapter === '-' || topics.length === 0) {
      setToastMsg('Choose a subject and chapter first.');
      setToastVariant('error');
      setToastVisible(true);
      return;
    }

    const chapKey = String(chapter);
    const chapName =
      chapterNames[chapKey] ??
      chapterNames[Number(chapKey) as any] ??
      '';

    setExamplesLoading(true);
    let anyUpdated = false;

    try {
      await Promise.all(
        topics.map(async (t, idx) => {
          const title = t.title || `Topic ${idx + 1}`;

          let incoming: string[] = [];
          try {
            const res: any = await listOptionsAI({
              type: 'topics',
              mode: 'examples', // server can ignore; just a hint
              curriculum: curriculum || 'CAPS',
              grade,
              subject: subject || 'Mathematics',
              chapter: chapKey,
              chapterName: chapName || '',
              topic: title,
              max: 6,
            } as any);

            const rawArr: any[] =
              (res?.data?.examples as any[]) ??
              (res?.data?.items as any[]) ??
              (res?.data as any[]) ??
              [];

            incoming = (Array.isArray(rawArr) ? rawArr : [])
              .map((x) => typeof x === 'string' ? x : (x?.text ?? x?.step ?? x?.title ?? ''))
              .map((s) => stripLead(String(s)))
              .filter(Boolean)
              .filter((s) => s.length <= 200);
          } catch (e) {
            console.log('generate examples error for topic:', title, e);
          }

          if (!incoming || incoming.length === 0) {
            incoming = buildFallbackExamples(title, chapName, subject);
          }
          if (!incoming || incoming.length === 0) return;

          setTopics((prev) => {
            if (!prev[idx]) return prev;
            const before = Array.isArray(prev[idx].exampleSteps) ? prev[idx].exampleSteps : [];
            const merged = dedupe([...before, ...incoming]).slice(0, 10);
            if (merged.length > before.length) {
              anyUpdated = true;
            }
            const next = [...prev];
            next[idx] = { ...next[idx], exampleSteps: merged };
            return next;
          });
        })
      );
    } finally {
      setExamplesLoading(false);
      if (anyUpdated) {
        setToastMsg("New example steps generated for this chapter’s topics.");
        setToastVariant('success');
        setToastVisible(true);
      } else {
        setToastMsg("No new examples available right now.");
        setToastVariant('error');
        setToastVisible(true);
      }
    }
  };

  // Displays
  const subjectDisplay = subject ? subject : 'CHOOSE';
  const chapterDisplay = !subject
    ? '–'
    : (chapter !== '-' ? `${chapter} / ${chaptersTotal || ''}` : '-');

  const currentChapterName =
    chapter !== '-'
      ? (chapterNames[String(chapter)] ??
         chapterNames[Number(chapter) as any] ??
         '')
      : '';

  // CHAPTER NAME IN UPPERCASE (grey bar)
  const currentChapterNameUpper = currentChapterName ? currentChapterName.toUpperCase() : '';

  const topicBarText =
    subject && chapter !== '-'
      ? `${subject.toUpperCase()} – CHAPTER ${chapter}${currentChapterNameUpper ? ` – ${currentChapterNameUpper}` : ''}`
      : 'SELECT YOUR SUBJECT & CHAPTER TO BEGIN';

  return (
    <View style={s.page}>
      {/* ✅ Top toast (StatusModal) */}
      <StatusModal
        visible={toastVisible}
        message={toastMsg}
        variant={toastVariant}
        onClose={() => setToastVisible(false)}
      />

      <View style={s.imageWrapper}>
        {/* Left rail artwork */}
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Image source={require('../../assets/DashboardTab.png')} style={s.tab} resizeMode="contain" />
          <Image source={require('../../assets/PractiseTab.png')} style={s.tab} resizeMode="contain" />
          <Image source={require('../../assets/ResultsTab.png')} style={s.tab} resizeMode="contain" />
          <Image source={require('../../assets/ProfileTab.png')} style={s.tab} resizeMode="contain" />
        </View>

        {showDrop && (
          <Image source={require('../../assets/SummariesDropTab.png')} style={s.dropTab} resizeMode="contain" />
        )}

        {/* Clickable rail labels */}
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

          {/* 🔵 TOP-RIGHT BLUE BLOCKS */}
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

            <View style={s.row2}>
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
                      {subjectDisplay}
                    </Text>
                  </View>
                  <Text style={s.chev}>▾</Text>
                </Pressable>
              </View>

              <View style={[s.pill, s.chapterPill]}>
                <Pressable
                  onPress={() => {
                    if (!subject) return;
                    setShowChapterDrop(true);
                  }}
                  hitSlop={6}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', opacity: subject ? 1 : 0.5 }}
                >
                  <View style={{ flexShrink: 1, minWidth: 0 }}>
                    <Text style={s.pillTop}>CHAPTER</Text>
                    <Text style={s.pillMain} numberOfLines={1} ellipsizeMode="tail">
                      {chapterDisplay}
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

            {/* Chapter modal */}
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
                {/* Topic bar */}
                <View style={s.topicBar}>
                  <Text style={s.topicText}>{topicBarText}</Text>
                </View>

                {/*  Three long yellow buttons */}
                <View style={s.actionRow}>
                  <Pressable
                    style={[s.yellowBtn, examplesLoading && { opacity: 0.7 }]}
                    onPress={handleGenerateExamples}
                    disabled={!subject || chapter === '-' || topics.length === 0 || examplesLoading}
                  >
                    <Text style={s.yellowBtnText}>
                      {examplesLoading ? 'Generating…' : 'Generate More Examples'}
                    </Text>
                  </Pressable>

                  <Pressable style={s.yellowBtn} onPress={() => console.log('Download Summary')}>
                    <Text style={s.yellowBtnText}>Download Summary</Text>
                  </Pressable>
                  <Pressable
                    style={s.yellowBtn}
                    onPress={async () => {
                      try { await incChaptersCovered(); } catch (e) { console.log(e); }
                    }}
                  >
                    <Text style={s.yellowBtnText}>Mark Chapter as Revised</Text>
                  </Pressable>
                </View>

                {/* Render Topic 1..N */}
                {topics.map((t, idx) => (
                  <View key={`${idx}-${(t as any)?.title}`} style={{ marginTop: 0 }}>
                    {/* Blue bar per topic */}
                    <View style={s.blueBar}>
                      <Text style={s.blueBarText}>
                        {`Topic ${idx + 1}: ${(t as any)?.title ?? ''}`}
                      </Text>
                    </View>

                    <View style={s.contentRow}>
                      <View style={s.leftCol}>
                        <KeyConceptsCard
                          title="KEY CONCEPTS"
                          concepts={Array.isArray((t as any)?.keyConcepts) ? (t as any).keyConcepts : []}
                        />
                        <ExampleSection
                          exampleTitle="EXAMPLES"
                          exampleSteps={Array.isArray((t as any)?.exampleSteps) ? (t as any).exampleSteps : []}
                        />
                      </View>

                      <View style={s.rightCol}>
                        <FormulasCard
                          title="FORMULAS"
                          formulas={Array.isArray((t as any)?.formulas) ? (t as any).formulas : []}
                        />
                        <TipBoxCard
                          title="TIP BOX"
                          tips={Array.isArray((t as any)?.tips) ? (t as any).tips : []}
                        />
                      </View>
                    </View>
                  </View>
                ))}

                {/* If no topics yet and both subject+chapter chosen, keep UX obvious */}
                {subject && chapter !== '-' && topics.length === 0 && (
                  <View style={{ paddingVertical: 8 }}>
                    <Text style={{ color: '#E5E7EB', textAlign: 'center' }}>
                      Loading topics for this chapter…
                    </Text>
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

  /* Buttons row under topic bar */
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 0,
    marginBottom: 0,
  },
  yellowBtn: {
    flex: 1,
    backgroundColor: '#FACC15',
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  yellowBtnText: {
    fontFamily: 'Antonio_700Bold',
    fontSize: 18,
    letterSpacing: 0.3,
    color: '#111827',
  },

  /* Blue bar reused per topic section */
  blueBar: {
    backgroundColor: '#2763F6',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'stretch',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    justifyContent: 'flex-start',
    marginTop: 20,
  },
  blueBarText: {
    color: '#FFFFFF',
    fontFamily: 'Antonio_700Bold',
    fontSize: 20,
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  contentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 0 },
  leftCol: { maxWidth: 460, flexShrink: 0 },
  rightCol: { maxWidth: 460, flexShrink: 0 },
});
