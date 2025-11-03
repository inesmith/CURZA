// src/screens/DashboardScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Image, ImageBackground, Modal, ScrollView, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../App';
import { useResponsive } from '../ui/responsive';

import ProgressBlock from '../components/ProgressBlock';
import ToDoBlock, { TodoItem } from '../components/ToDoBlock';
import ProgressSummaryBar from '../components/ProgressSummaryBar';
import UpcomingTestsCard from '../components/UpcomingTestsCard';
import FeedbackCard from '../components/FeedbackCard';
import RecentActivitiesCard from '../components/RecentActivitiesCard';

import { onAuthStateChanged } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db, auth } from '../../firebase';

import { useNotice } from '../contexts/NoticeProvider';

// (AI suggestions)
import {
  refreshSuggestedTodos,
  subscribeSuggestedTodos,
  applySuggestedTodo,
  removeSuggestedTodo,
} from '../utils/suggestions';

// topic totals helper
import { getTopicTotal } from '../utils/topicTotals';

// subject-specific progress (increments may be called from other screens)
import { incSummariesStudied, incChaptersCovered, incTestsCompleted } from '../utils/progress';

const SWOOSH_W = 380;

// Fallback subjects if profile has none
const DEFAULT_SUBJECTS = [
  'Mathematics',
  'Mathematical Literacy',
  'Physical Sciences',
  'Life Sciences',
  'Geography',
  'History',
  'Accounting',
  'Business Studies',
  'Economics',
];

// ------- helpers -------
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

const cleanSubject = (s: string) =>
  String(s ?? '')
    .replace(/[_-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(' ');

const toSlug = (s: string) =>
  String(s || 'default')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'default';
// ------- end helpers -------

type ActivityItem = {
  id: string;
  text: string;
  score?: number | string;
  showArrow?: boolean;
};

export default function DashboardScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const R = useResponsive();
  const { show } = useNotice();

  const [firstName, setFirstName] = useState<string>('');
  const [headingW, setHeadingW] = useState(0);
  const [headingX, setHeadingX] = useState(0);

  // Top-right blue blocks
  const [curriculum, setCurriculum] = useState<string>('CAPS');
  const [grade, setGrade] = useState<number | string>('12');
  const [subject, setSubject] = useState<string>('Mathematics');
  const [showSubjectDrop, setShowSubjectDrop] = useState(false);
  const [subjects, setSubjects] = useState<string[]>(DEFAULT_SUBJECTS);

  // To-Dos
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [suggestedTodos, setSuggestedTodos] = useState<TodoItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTodoText, setNewTodoText] = useState('');

  // progress state (live for currently selected subject)
  const [stats, setStats] = useState({
    summariesStudied: 0,
    chaptersCovered: 0,
    testsCompleted: 0,
  });

  // total topics (for the blue summary bar)
  const [totalTopics, setTotalTopics] = useState<number>(12);

  // dynamic content per subject/grade/curriculum
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [upcomingTests, setUpcomingTests] = useState<string[]>([]);
  const [weakAreas, setWeakAreas] = useState<string[]>([]);

  // Auth + Profile & Subjects + To-Dos + Progress
  useEffect(() => {
    let unsubTodos: undefined | (() => void);
    let unsubProgress: undefined | (() => void);
    let unsubSuggested: undefined | (() => void);

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubTodos) { unsubTodos(); unsubTodos = undefined; }
      if (unsubProgress) { unsubProgress(); unsubProgress = undefined; }
      if (unsubSuggested) { unsubSuggested(); unsubSuggested = undefined; }

      if (!user) {
        setFirstName('');
        setTodos([]);
        setSuggestedTodos([]);
        setStats({ summariesStudied: 0, chaptersCovered: 0, testsCompleted: 0 });
        setTotalTopics(12);
        setRecentActivities([]);
        setUpcomingTests([]);
        setWeakAreas([]);
        return;
      }

      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        const profile = snap.exists() ? (snap.data() as any) : undefined;

        const profileFullName: string | undefined = profile?.fullName;
        const getFirst = (raw?: string | null): string => {
          if (!raw) return '';
          const t = raw.trim();
          if (!t) return '';
          if (t.includes('@')) return t.split('@')[0];
          return t.split(/\s+/)[0];
        };

        const name =
          getFirst(profileFullName) ||
          getFirst(user.displayName) ||
          getFirst(user.email) ||
          '';
        setFirstName(name);

        let curr = 'CAPS';
        let grd: number | string = '12';

        if (profile?.curriculum) curr = normalizeCurriculum(profile.curriculum);
        if (profile?.grade) grd = profile.grade;

        setCurriculum(curr);
        setGrade(grd);

        const signedUpSubjects: any[] =
          profile?.subjects ||
          profile?.selectedSubjects ||
          profile?.subjectsChosen ||
          [];

        let chosenSubject = 'Mathematics';
        if (Array.isArray(signedUpSubjects) && signedUpSubjects.length > 0) {
          const cleaned = signedUpSubjects.map(titleCase).filter(Boolean);
          setSubjects(cleaned);
          if (profile?.subject) {
            const chosen = titleCase(profile.subject);
            chosenSubject = cleaned.includes(chosen) ? chosen : cleaned[0];
          } else {
            chosenSubject = cleaned[0];
          }
        } else {
          setSubjects(DEFAULT_SUBJECTS);
          const chosen = profile?.subject ? titleCase(profile.subject) : DEFAULT_SUBJECTS[0];
          chosenSubject = DEFAULT_SUBJECTS.includes(chosen) ? chosen : DEFAULT_SUBJECTS[0];
        }
        setSubject(chosenSubject);

        // Fetch total topic count for the current curriculum+grade+subject
        try {
          const total = await getTopicTotal(curr, grd, chosenSubject);
          setTotalTopics(total > 0 ? total : 12);
        } catch {
          setTotalTopics(12);
        }

        // To-Dos: subscribe only while user is signed in
        const todosCol = collection(db, 'users', user.uid, 'todos');
        const qy = query(todosCol, orderBy('createdAt', 'asc'));
        unsubTodos = onSnapshot(
          qy,
          (snap) => {
            const list: TodoItem[] = [];
            snap.forEach((d) => {
              const data = d.data() as any;
              list.push({ id: d.id, text: String(data.text ?? '').toUpperCase() });
            });
            setTodos(list);
          },
          () => {
            show('Could not load your To-Do list. Permissions or network issue.', 'error', 3000);
          },
        );

        // ===== Subject-specific progress listener with global fallback =====
        try {
          const subjSlug = toSlug(chosenSubject);
          const pRef = doc(db, 'users', user.uid, 'progressBySubject', subjSlug);
          unsubProgress = onSnapshot(
            pRef,
            async (pSnap) => {
              const d = pSnap.data() as any;
              if (d) {
                setStats({
                  summariesStudied: d?.summariesStudied ?? 0,
                  chaptersCovered: d?.chaptersCovered ?? 0,
                  testsCompleted: d?.testsCompleted ?? 0,
                });
              } else {
                // global fallback if subject doc doesn't exist yet
                const gRef = doc(db, 'users', user.uid, 'progress', 'default');
                try {
                  const gSnap = await getDoc(gRef);
                  const g = gSnap.data() as any;
                  setStats({
                    summariesStudied: g?.summariesStudied ?? 0,
                    chaptersCovered: g?.chaptersCovered ?? 0,
                    testsCompleted: g?.testsCompleted ?? 0,
                  });
                } catch {
                  setStats({ summariesStudied: 0, chaptersCovered: 0, testsCompleted: 0 });
                }
              }
            },
            (err) => {
              console.log('Progress snapshot error:', err);
            },
          );
        } catch (e) {
          console.log('progress listener setup failed:', e);
        }

        // ===== Subject/grade/curriculum-aware dynamic bits =====

        // Recent activities (5 most recent: tests/summaries/chapters)
        (async () => {
          try {
            const acts: ActivityItem[] = [];

            // Results (tests)
            const resultsCol = collection(db, 'users', user.uid, 'results');
            const resQ = query(resultsCol, orderBy('createdAt', 'desc'));
            const resSnap = await getDocs(resQ);
            resSnap.forEach((d) => {
              const r = d.data() as any;
              const subj = cleanSubject(r?.subject ?? '');
              if (subj && subj !== cleanSubject(chosenSubject)) return;
              const title = String(r?.paper ?? 'TEST').toUpperCase();
              const scr = typeof r?.score === 'number' ? r.score : undefined;
              acts.push({
                id: `res-${d.id}`,
                text: `COMPLETED ${title}`,
                score: typeof scr === 'number' ? scr : undefined,
                showArrow: true,
              });
            });

            // Summaries
            const sumsCol = collection(db, 'users', user.uid, 'summaries');
            const sumsQ = query(sumsCol, orderBy('generatedAt', 'desc'));
            const sumsSnap = await getDocs(sumsQ);
            sumsSnap.forEach((d) => {
              const s = d.data() as any;
              const subj = cleanSubject(s?.subject ?? '');
              if (subj && subj !== cleanSubject(chosenSubject)) return;
              const ch = String(s?.chapter ?? '').trim() || '1';
              acts.push({
                id: `sum-${d.id}`,
                text: `READ ${cleanSubject(subj || chosenSubject)} SUMMARY - CHAPTER ${ch}`,
              });
            });

            // Chapters covered (optional collection: users/{uid}/chaptersProgress)
            try {
              const chCol = collection(db, 'users', user.uid, 'chaptersProgress');
              const chQ = query(chCol, orderBy('updatedAt', 'desc'));
              const chSnap = await getDocs(chQ);
              chSnap.forEach((d) => {
                const c = d.data() as any;
                const subj = cleanSubject(c?.subject ?? '');
                if (subj && subj !== cleanSubject(chosenSubject)) return;
                const ch = String(c?.chapter ?? '').trim() || '1';
                acts.push({
                  id: `chap-${d.id}`,
                  text: `COVERED CHAPTER ${ch} – ${cleanSubject(subj || chosenSubject)}`,
                });
              });
            } catch {
              // optional, ignore
            }

            acts.sort((a, b) => (a.id > b.id ? -1 : 1));
            setRecentActivities(acts.slice(0, 5));
          } catch {
            setRecentActivities([]);
          }
        })();

        // Weak areas (derive from latest results breakdown)
        (async () => {
          try {
            const resultsCol = collection(db, 'users', user.uid, 'results');
            const resQ = query(resultsCol, orderBy('createdAt', 'desc'));
            const resSnap = await getDocs(resQ);

            const lows: { topic: string; score: number; subject: string }[] = [];
            resSnap.forEach((d) => {
              const r = d.data() as any;
              const subj = cleanSubject(r?.subject ?? '');
              if (subj && subj !== cleanSubject(chosenSubject)) return;

              if (Array.isArray(r?.breakdown)) {
                r.breakdown.forEach((b: any) => {
                  const topic = String(b?.topic ?? '').trim();
                  const score = typeof b?.score === 'number' ? b.score : 100;
                  if (topic && score <= 65) lows.push({ topic, score, subject: subj || chosenSubject });
                });
              } else if (typeof r?.score === 'number' && r.score <= 60) {
                lows.push({ topic: 'Overall', score: r.score, subject: subj || chosenSubject });
              }
            });

            lows.sort((a, b) => a.score - b.score);
            const top2 = lows.map((x) => x.topic.toUpperCase()).filter(Boolean);
            setWeakAreas(top2.slice(0, 2));
          } catch {
            setWeakAreas([]);
          }
        })();

        // Upcoming tests (AI-ish suggestion from weak areas / recent chapters)
        (async () => {
          try {
            const suggs: string[] = [];

            // From weak areas
            weakAreas.forEach((w) => {
              suggs.push(`PRACTICE MINI-TEST: ${w}`);
            });

            // If still empty, suggest from recent summaries chapters
            if (suggs.length === 0) {
              const sumsCol = collection(db, 'users', user.uid, 'summaries');
              const sumsQ = query(sumsCol, orderBy('generatedAt', 'desc'));
              const sumsSnap = await getDocs(sumsQ);
              const seen = new Set<string>();
              sumsSnap.forEach((d) => {
                const s = d.data() as any;
                const subj = cleanSubject(s?.subject ?? '');
                if (subj && subj !== cleanSubject(chosenSubject)) return;
                const ch = String(s?.chapter ?? '').trim();
                if (!ch) return;
                const label = `REVISION TEST: CHAPTER ${ch}`;
                if (!seen.has(label)) {
                  seen.add(label);
                  suggs.push(label);
                }
              });
            }

            setUpcomingTests(suggs.slice(0, 3));
          } catch {
            setUpcomingTests([]);
          }
        })();
      } catch (e) {
        const fallback =
          (auth.currentUser?.displayName?.split(' ')?.[0] ?? '') ||
          (auth.currentUser?.email?.split('@')?.[0] ?? '');
        setFirstName(fallback);
      }
    });

    return () => {
      if (unsubTodos) unsubTodos();
      if (unsubProgress) unsubProgress();
      if (unsubSuggested) unsubSuggested();
      unsubAuth();
    };
  }, [show]); // keep stable; avoid re-subscribing when weakAreas changes

  // Rebuild subject-specific data when subject changes manually from dropdown
  useEffect(() => {
    (async () => {
      const user = auth.currentUser;
      if (!user) return;

      // refresh topic total for subject switch
      try {
        const total = await getTopicTotal(curriculum, grade, subject);
        setTotalTopics(total > 0 ? total : 12);
      } catch {
        setTotalTopics(12);
      }

      // Refresh progress snapshot for this subject (quick fetch; live listener is in auth block)
      try {
        const subjSlug = toSlug(subject);
        const pRef = doc(db, 'users', user.uid, 'progressBySubject', subjSlug);
        const pSnap = await getDoc(pRef);
        const d = pSnap.data() as any;
        if (d) {
          setStats({
            summariesStudied: d?.summariesStudied ?? 0,
            chaptersCovered: d?.chaptersCovered ?? 0,
            testsCompleted: d?.testsCompleted ?? 0,
          });
        } else {
          const gRef = doc(db, 'users', user.uid, 'progress', 'default');
          const gSnap = await getDoc(gRef);
          const g = gSnap.data() as any;
          setStats({
            summariesStudied: g?.summariesStudied ?? 0,
            chaptersCovered: g?.chaptersCovered ?? 0,
            testsCompleted: g?.testsCompleted ?? 0,
          });
        }
      } catch {
        setStats({ summariesStudied: 0, chaptersCovered: 0, testsCompleted: 0 });
      }

      // Refresh weak areas + upcoming tests for this subject
      try {
        const resultsCol = collection(db, 'users', user.uid, 'results');
        const resQ = query(resultsCol, orderBy('createdAt', 'desc'));
        const resSnap = await getDocs(resQ);

        const lows: { topic: string; score: number; subject: string }[] = [];
        resSnap.forEach((d) => {
          const r = d.data() as any;
          const subj = cleanSubject(r?.subject ?? '');
          if (subj && subj !== cleanSubject(subject)) return;

          if (Array.isArray(r?.breakdown)) {
            r.breakdown.forEach((b: any) => {
              const topic = String(b?.topic ?? '').trim();
              const score = typeof b?.score === 'number' ? b.score : 100;
              if (topic && score <= 65) lows.push({ topic, score, subject: subj || subject });
            });
          } else if (typeof r?.score === 'number' && r.score <= 60) {
            lows.push({ topic: 'Overall', score: r.score, subject: subj || subject });
          }
        });

        lows.sort((a, b) => a.score - b.score);
        const top2 = lows.map((x) => x.topic.toUpperCase()).filter(Boolean);
        setWeakAreas(top2.slice(0, 2));
      } catch {
        setWeakAreas([]);
      }

      try {
        const suggs: string[] = [];
        // build from the freshly computed weakAreas (not the stale state)
        weakAreas.forEach((w) => suggs.push(`PRACTICE MINI-TEST: ${w}`));
        if (suggs.length === 0) {
          const sumsCol = collection(db, 'users', user.uid, 'summaries');
          const sumsQ = query(sumsCol, orderBy('generatedAt', 'desc'));
          const sumsSnap = await getDocs(sumsQ);
          const seen = new Set<string>();
          sumsSnap.forEach((d) => {
            const s = d.data() as any;
            const subj = cleanSubject(s?.subject ?? '');
            if (subj && subj !== cleanSubject(subject)) return;
            const ch = String(s?.chapter ?? '').trim();
            if (!ch) return;
            const label = `REVISION TEST: CHAPTER ${ch}`;
            if (!seen.has(label)) {
              seen.add(label);
              suggs.push(label);
            }
          });
        }
        setUpcomingTests(suggs.slice(0, 3));
      } catch {
        setUpcomingTests([]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject]);

  // To-Do actions
  const handleAddTodo = async () => {
    setShowAddModal(true);
  };

  const saveTodo = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const text = newTodoText.trim();
    if (!text) {
      setShowAddModal(false);
      setNewTodoText('');
      return;
    }

    try {
      const todosCol = collection(db, 'users', user.uid, 'todos');
      await addDoc(todosCol, {
        text,
        createdAt: serverTimestamp(),
        completed: false,
      });
      setShowAddModal(false);
      setNewTodoText('');
      show('A new To-Do was added successfully.');
    } catch (e) {
      show('Could not add your To-Do right now.', 'error', 2800);
    }
  };

  const completeTodo = async (todoId: string) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'todos', todoId));
      show('Marked as completed.');
    } catch (e) {
      show('Could not complete the To-Do.', 'error', 2600);
    }
  };

  const deleteTodo = async (todoId: string) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'todos', todoId));
      show('To-Do deleted.');
    } catch (e) {
      show('Could not delete the To-Do.', 'error', 2600);
    }
  };

  const completeSuggested = async (id: string) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await applySuggestedTodo(user.uid, id);
      show('Added to your To-Do list. Progress updated!', 'success', 2200);
    } catch {
      show('Could not apply suggestion right now.', 'error', 2600);
    }
  };

  const deleteSuggested = async (id: string) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await removeSuggestedTodo(user.uid, id);
      show('Suggestion removed.', 'success', 1600);
    } catch {
      show('Could not remove the suggestion.', 'error', 2600);
    }
  };

  const headingText = firstName
    ? `WELCOME BACK, ${firstName.toUpperCase()}`
    : 'WELCOME BACK';

  const swooshLeft =
    headingW > 0 ? headingX + headingW / 2 - SWOOSH_W / 2 - 30 : '20%';

  // 🔵 Build the dynamic bar text
  const completed = Math.max(0, Math.min(stats.chaptersCovered || 0, totalTopics || 0));
  const total = Math.max(0, totalTopics || 0);
  const barText = `YOU HAVE COMPLETED ${completed}/${total} ${subject.toUpperCase()} TOPICS`;

  // Actions for cards (no visual changes)
  const startSelectedUpcoming = () => {
    navigation.navigate('PracticeTests');
  };
  const practiceSelectedWeakArea = () => {
    navigation.navigate('PracticeTests');
  };

  // Build RecentActivities array for the card (already constrained to 5 in state)
  const recentItems = useMemo(() => {
    return recentActivities.map((it) => ({ ...it }));
  }, [recentActivities]);

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
            <Pressable onPress={() => navigation.navigate('Dashboard')} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={[s.tabText, s.dashboardTab]}>DASHBOARD</Text>
            </Pressable>
          </View>

          {/* 🔵 TOP-RIGHT BLUE BLOCKS */}
          <View style={s.topRightWrap}>
            <View style={s.row}>
              <View style={[s.pill, s.curriculumPill]}>
                <Text style={s.pillTop}>CURRICULUM</Text>
                <Text style={s.pillMain} numberOfLines={1}>
                  {String(curriculum).toUpperCase()}
                </Text>
              </View>

              <View style={[s.pill, s.gradePill]}>
                <Text style={s.pillTop}>GRADE</Text>
                <Text style={s.pillMain} numberOfLines={1}>
                  {String(grade).toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={[s.pill, s.subjectPill]}>
              <Pressable
                onPress={() => setShowSubjectDrop(true)}
                hitSlop={6}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <View style={{ flexShrink: 1, paddingRight: 8 }}>
                  <Text style={s.pillTop}>SUBJECT</Text>
                  <Text style={s.pillMain} numberOfLines={1}>
                    {subject}
                  </Text>
                </View>
                <Text style={s.chev}>▾</Text>
              </Pressable>

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
                            // fetch new total when subject changes
                            getTopicTotal(curriculum, grade, subj)
                              .then((t) => setTotalTopics(t > 0 ? t : 12))
                              .catch(() => setTotalTopics(12));
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
            <Image
              source={require('../../assets/swoosh-yellow.png')}
              style={[s.swoosh, { left: headingW > 0 ? headingX + headingW / 2 - SWOOSH_W / 2 - 30 : '20%' }]}
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
                  {/* LEFT */}
                  <View style={s.leftCol}>
                    <ProgressBlock
                      {...({
                        stats, // live for selected subject
                      } as any)}
                    />

                    <View style={{ marginTop: 0 }}>
                      <ProgressSummaryBar text={barText} width={420} />
                    </View>

                    <View style={s.smallCardsRow}>
                      <UpcomingTestsCard
                        suggestions={upcomingTests}
                        onStart={startSelectedUpcoming}
                      />
                      <FeedbackCard
                        areas={weakAreas}
                        onView={practiceSelectedWeakArea}
                      />
                    </View>
                  </View>

                  {/* RIGHT */}
                  <View style={s.rightCol}>
                    <ToDoBlock
                      items={[
                        ...suggestedTodos.map<TodoItem>((t) => ({
                          ...t,
                          onComplete: () => completeSuggested(t.id),
                          onDelete: () => deleteSuggested(t.id),
                        })),
                        ...todos.map((t) => ({
                          ...t,
                          onPress: () => {},
                          onLongPress: () => completeTodo(t.id),
                          onDelete: () => deleteTodo(t.id),
                        })),
                      ]}
                      onAdd={handleAddTodo}
                    />

                    <View style={s.recentSpacer}>
                      <RecentActivitiesCard items={recentItems} />
                    </View>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </ImageBackground>
      </View>

      {/* Add To-Do Modal */}
      <Modal
        transparent
        visible={showAddModal}
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={s.ddBackdrop}>
          <View style={s.ddSheet}>
            <Text style={s.ddTitle}>Add a To-Do</Text>

            <View
              style={{
                borderWidth: 1,
                borderColor: '#D1D5DB',
                borderRadius: 12,
                paddingHorizontal: 12,
                backgroundColor: '#FFFFFF',
                marginBottom: 12,
              }}
            >
              <TextInput
                value={newTodoText}
                onChangeText={setNewTodoText}
                placeholder="Type here…"
                placeholderTextColor="#9CA3AF"
                style={{
                  fontFamily: 'AlumniSans_500Medium',
                  fontSize: 16,
                  color: '#1F2937',
                  paddingVertical: 10,
                }}
                autoFocus
                returnKeyType="done"
              />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
              <Pressable
                style={{ height: 44, paddingHorizontal: 16, borderRadius: 10, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' }}
                onPress={() => {
                  setShowAddModal(false);
                  setNewTodoText('');
                }}
              >
                <Text style={{ color: '#1F2937', fontFamily: 'Antonio_700Bold', fontSize: 16 }}>Cancel</Text>
              </Pressable>

              <Pressable
                style={{ height: 44, paddingHorizontal: 16, borderRadius: 10, backgroundColor: '#2763F6', alignItems: 'center', justifyContent: 'center' }}
                onPress={saveTodo}
              >
                <Text style={{ color: '#FFFFFF', fontFamily: 'Antonio_700Bold', fontSize: 16 }}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  practiseOpenTab: { opacity: 0.8, marginTop: 20 },
  resultsTab: { opacity: 0.8, marginTop: 45 },
  profileTab: { opacity: 0.8, marginTop: 72 },
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
    width: SWOOSH_W,
    height: 100,
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
  bigBlockScroll: {
    flex: 1,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  leftCol: {
    maxWidth: 430,
    flexShrink: 0,
  },
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
    marginTop: 12,
  },
});
