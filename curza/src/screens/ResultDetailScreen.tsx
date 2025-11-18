// src/screens/ResultDetailScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Modal,
  Pressable,
  Platform,          // 👈 added
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../App';

// Components
import TopicBreakdownBlock from '../components/TopicBreakdownCard';
import PartialCreditCard from '../components/PartialCreditCard';
import KeyFeedbackTipsCard from '../components/KeyFeedbackTipsCard';

// Firebase
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

// 📄 PDF deps (same libs as SummariesScreen)
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

type Nav = StackNavigationProp<RootStackParamList>;

type TopicBreakdownItem = {
  topic?: string;
  label?: string;
  marksEarned?: number;
  marksTotal?: number;
  percent?: number;
};

type PartialCreditInfo = {
  totalMarksAwarded?: number;
  summary?: string;
  items?: string[];
};

type TipBlock = {
  heading?: string;
  lines: string[];
};

type NavParams = {
  paper?: string;
  date?: string;
  score?: string;
  marksEarned?: number;
  marksTotal?: number;
  outcome?: string;
  breakdown?: TopicBreakdownItem[];
  partialCredit?: PartialCreditInfo | null;
  feedbackSummary?: string | null;
  tipsBlocks?: TipBlock[];
};

const palette = ['#3B82F6', '#FACC15', '#D1D5DB', '#0F172A', '#F59E0B', '#22C55E'];

const derivePctFromParams = (params: NavParams): number | null => {
  if (
    typeof params.marksEarned === 'number' &&
    typeof params.marksTotal === 'number' &&
    params.marksTotal > 0
  ) {
    return Math.round((params.marksEarned / params.marksTotal) * 100);
  }
  if (params.score && params.score.includes('%')) {
    const n = Number(params.score.replace('%', '').trim());
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

const buildBannerText = (
  pct: number | null,
  fallback: string | null | undefined,
): string => {
  if (fallback && fallback.trim().length > 0) return fallback.trim();

  if (pct == null || isNaN(pct)) {
    return 'Your AI marker has analysed this test. Review the breakdown and tips below, then retake a short section test to improve.';
  }

  if (pct >= 80) {
    return 'Outstanding work – you are mastering this paper. Use the topic breakdown to see where you can push for full marks.';
  }
  if (pct >= 60) {
    return 'Good progress – you are on track. Focus your revision on the weaker topics in the breakdown to boost your mark further.';
  }
  if (pct >= 40) {
    return 'This paper was challenging, but there is a solid base. Use the topic breakdown and tips to target your biggest gaps.';
  }
  return 'This attempt was tough – but this is exactly how we learn. Start by revising the lowest-scoring topics and retake a short section test.';
};

// 🔹 Small HTML helper (same idea as Summaries screen)
const escapeHtml = (s: string) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

// 🔹 PDF file name for results
const makePdfName = (paper: string) => {
  const safe = (paper || 'Test')
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '');
  return `${safe || 'Test'}_result.pdf`;
};

// 🔹 Build PDF HTML for the result
const buildResultHtml = (opts: {
  paper: string;
  date: string;
  score: string;
  marksEarned: number;
  marksTotal: number;
  outcome: string;
  pct: number | null;
  breakdown: TopicBreakdownItem[];
  partialCredit: PartialCreditInfo | null;
  tips: TipBlock[];
}) => {
  const {
    paper,
    date,
    score,
    marksEarned,
    marksTotal,
    outcome,
    pct,
    breakdown,
    partialCredit,
    tips,
  } = opts;

  const title = `${paper || 'Test'} – Result`;

  const pctText =
    pct != null && !isNaN(pct) ? `${pct}%` : marksTotal > 0 ? `${marksEarned}/${marksTotal}` : '—';

  const breakdownHtml =
    breakdown && breakdown.length
      ? breakdown
          .map((b, i) => {
            const label = (b.topic || b.label || `Topic ${i + 1}`).toString();
            const earned = b.marksEarned ?? 0;
            const total = b.marksTotal ?? 0;
            const localPct =
              typeof b.percent === 'number'
                ? b.percent
                : total > 0
                ? Math.round((earned / total) * 100)
                : null;

            return `
          <tr>
            <td>${escapeHtml(label)}</td>
            <td style="text-align:center;">${earned}</td>
            <td style="text-align:center;">${total}</td>
            <td style="text-align:center;">${
              localPct != null && !isNaN(localPct) ? `${localPct}%` : '–'
            }</td>
          </tr>`;
          })
          .join('')
      : '';

  const partialHtml = partialCredit
    ? `
      <section class="partial">
        <h2>Partial Credit</h2>
        <p><strong>Total partial marks:</strong> ${
          partialCredit.totalMarksAwarded ?? 0
        }</p>
        ${
          partialCredit.summary
            ? `<p>${escapeHtml(partialCredit.summary)}</p>`
            : ''
        }
        ${
          partialCredit.items && partialCredit.items.length
            ? `<ul>${partialCredit.items
                .map((it) => `<li>${escapeHtml(it)}</li>`)
                .join('')}</ul>`
            : ''
        }
      </section>
    `
    : '';

  const tipsHtml =
    tips && tips.length
      ? `
      <section class="tips">
        <h2>Key Feedback & Tips</h2>
        ${tips
          .map(
            (b) => `
          <div class="tip-block">
            ${
              b.heading
                ? `<h3>${escapeHtml(b.heading)}</h3>`
                : ''
            }
            <ul>
              ${b.lines
                .map((ln) => `<li>${escapeHtml(ln)}</li>`)
                .join('')}
            </ul>
          </div>
        `,
          )
          .join('')}
      </section>
    `
      : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charSet="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
        Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', 'Antonio', 'Alumni Sans',
        Arial, sans-serif;
      color: #111827;
      margin: 24px;
    }
    header { text-align: center; margin-bottom: 16px; }
    h1 { font-size: 22px; margin: 0 0 8px; }
    .meta { font-size: 12px; color: #374151; }
    h2 { font-size: 16px; margin: 16px 0 6px; }
    h3 { font-size: 13px; margin: 10px 0 6px; color: #111827; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0 12px;
      font-size: 12px;
    }
    th, td {
      border: 1px solid #E5E7EB;
      padding: 4px 6px;
    }
    th {
      background: #F3F4F6;
      text-align: left;
    }
    .partial, .tips {
      page-break-inside: avoid;
      border-top: 1px solid #E5E7EB;
      padding-top: 8px;
      margin-top: 12px;
    }
    .tip-block { margin-bottom: 8px; }
    footer {
      margin-top: 18px;
      font-size: 11px;
      color: #6B7280;
      text-align: center;
    }
  </style>
</head>
<body>
  <header>
    <h1>${escapeHtml(title)}</h1>
    <div class="meta">
      ${escapeHtml(date || 'Date not set')}
      • Score: ${escapeHtml(pctText)}
      • Outcome: ${escapeHtml(outcome || '—')}
    </div>
  </header>

  <section>
    <h2>Overall Result</h2>
    <p><strong>Score:</strong> ${escapeHtml(score || '—')}</p>
    <p><strong>Marks:</strong> ${marksEarned} / ${marksTotal}</p>
    ${
      pct != null && !isNaN(pct)
        ? `<p><strong>Percentage:</strong> ${pct}%</p>`
        : ''
    }
  </section>

  ${
    breakdownHtml
      ? `<section>
    <h2>Topic Breakdown</h2>
    <table>
      <thead>
        <tr>
          <th>Topic</th>
          <th>Marks earned</th>
          <th>Total marks</th>
          <th>%</th>
        </tr>
      </thead>
      <tbody>
        ${breakdownHtml}
      </tbody>
    </table>
  </section>`
      : ''
  }

  ${partialHtml}
  ${tipsHtml}

  <footer>© ${new Date().getFullYear()} Curza – Test results generated in-app</footer>
</body>
</html>`;
};

// 🔹 Same save helper logic as SummariesScreen
const savePdfFile = async (pdfUri: string, filename: string) => {
  try {
    if (Platform.OS === 'android') {
      const FS: any = FileSystem as any;
      const perm = await FS.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (perm.granted) {
        const base64 = await FileSystem.readAsStringAsync(pdfUri, {
          encoding: 'base64',
        });
        const fileUri = await FS.StorageAccessFramework.createFileAsync(
          perm.directoryUri,
          filename,
          'application/pdf',
        );
        await FileSystem.writeAsStringAsync(fileUri, base64, {
          encoding: 'base64',
        });
        return { savedUri: fileUri, mode: 'saf' as const };
      }
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfUri, {
          mimeType: 'application/pdf',
          dialogTitle: filename,
        });
        return { savedUri: pdfUri, mode: 'share' as const };
      }
      return { savedUri: pdfUri, mode: 'cache' as const };
    } else if (Platform.OS === 'ios') {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfUri, {
          UTI: 'com.adobe.pdf',
          mimeType: 'application/pdf',
          dialogTitle: filename,
        });
        return { savedUri: pdfUri, mode: 'share' as const };
      }
      return { savedUri: pdfUri, mode: 'cache' as const };
    } else {
      // Web / other
      return { savedUri: pdfUri, mode: 'web' as const };
    }
  } catch (e) {
    console.log('savePdfFile error:', e);
    throw e;
  }
};

export default function ResultDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<any>();

  const {
    paper = 'REVIEW YOUR TEST',
    date = '—',
    score = '—',
    marksEarned = 0,
    marksTotal = 0,
    outcome = '—',
    breakdown = [],
    partialCredit = null,
    feedbackSummary = null,
    tipsBlocks = [],
  } = (route.params || {}) as NavParams;

  //  Top-right pills
  const [curriculum, setCurriculum] = useState('CAPS');
  const [grade, setGrade] = useState<number | string>('12');
  const [subject, setSubject] = useState('Mathematics');
  const [showSubjectDrop, setShowSubjectDrop] = useState(false);
  const [subjects, setSubjects] = useState<string[]>([]);

  const [downloadModalVisible, setDownloadModalVisible] = useState(false);

  const normalizeCurriculum = (value: any): string => {
    const raw = String(value ?? '')
      .toLowerCase()
      .replace(/[_-]+/g, ' ')
      .trim();
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
        w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w,
      )
      .join(' ');

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        const profile = snap.exists() ? (snap.data() as any) : undefined;

        if (profile?.curriculum)
          setCurriculum(normalizeCurriculum(profile.curriculum));
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
        // keep defaults
      }
    });
    return () => unsub();
  }, []);

  // Build topic breakdown chart data
  const topicChartData = useMemo(() => {
    if (!Array.isArray(breakdown) || breakdown.length === 0) return undefined;

    return breakdown.map((b, idx) => {
      const label = (b.topic || b.label || `Topic ${idx + 1}`).toString();
      let scorePct: number;

      if (typeof b.percent === 'number') {
        scorePct = Math.round(Math.max(0, Math.min(100, b.percent)));
      } else if (
        typeof b.marksEarned === 'number' &&
        typeof b.marksTotal === 'number' &&
        b.marksTotal > 0
      ) {
        scorePct = Math.round(
          (b.marksEarned / b.marksTotal) * 100,
        );
      } else if (typeof b.marksEarned === 'number') {
        scorePct = Math.max(
          0,
          Math.min(100, Math.round(b.marksEarned)),
        );
      } else {
        scorePct = 0;
      }

      return {
        label,
        score: scorePct,
        color: palette[idx % palette.length],
      };
    });
  }, [breakdown]);

  const pct = derivePctFromParams({
    paper,
    date,
    score,
    marksEarned,
    marksTotal,
    outcome,
    breakdown,
    partialCredit,
    feedbackSummary,
    tipsBlocks,
  });

  const bannerText = buildBannerText(pct, feedbackSummary);

  const partialMarks =
    typeof partialCredit?.totalMarksAwarded === 'number'
      ? partialCredit.totalMarksAwarded
      : 0;

  const partialItems =
    partialCredit?.items && partialCredit.items.length
      ? partialCredit.items
      : [];

  const partialSummary = partialCredit?.summary;

  const tipsForCard: TipBlock[] =
    Array.isArray(tipsBlocks) && tipsBlocks.length
      ? tipsBlocks
      : [
          {
            heading: 'NEXT STEPS',
            lines: [
              'Use the topic breakdown to spot your weakest areas.',
              'Redo a short section test focusing ONLY on those topics.',
            ],
          },
        ];

  // 🔹 "Download PDF" – now same behaviour as SummariesScreen
  const handleDownloadPdf = async () => {
    try {
      const html = buildResultHtml({
        paper,
        date,
        score,
        marksEarned,
        marksTotal,
        outcome,
        pct,
        breakdown,
        partialCredit,
        tips: tipsForCard,
      });

      const file = await Print.printToFileAsync({ html }); // { uri }
      const filename = makePdfName(paper);
      await savePdfFile(file.uri, filename);

      // Show your existing success modal
      setDownloadModalVisible(true);
    } catch (e) {
      console.log('Download PDF error:', e);
      // If it fails, you may later add an error modal/toast here
    }
  };

  return (
    <View style={s.page}>
      <View style={s.imageWrapper}>
        {/* Left rail artwork */}
        <Image
          source={require('../../assets/DashboardTab.png')}
          style={s.tab}
          resizeMode="contain"
        />
        <Image
          source={require('../../assets/SummariesTab.png')}
          style={s.tab}
          resizeMode="contain"
        />
        <Image
          source={require('../../assets/PractiseTab.png')}
          style={s.tab}
          resizeMode="contain"
        />
        <Image
          source={require('../../assets/ProfileTab.png')}
          style={s.tab}
          resizeMode="contain"
        />

        {/* Corner logo */}
        <Image
          source={require('../../assets/curza-logo.png')}
          style={s.cornerLogo}
          resizeMode="contain"
        />

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
            <Pressable
              onPress={() => navigation.navigate('Summaries')}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={[s.tabText, s.summariesTab]}>SUMMARIES</Text>
            </Pressable>
          </View>

          <View style={[s.tabTextWrapper, s.posPractice]}>
            <Pressable
              onPress={() => navigation.navigate('PracticeTests')}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={[s.tabText, s.practiseOpenTab]}>
                PRACTISE TESTS
              </Text>
            </Pressable>
          </View>

          <View
            style={[s.tabTextWrapper, s.posResults, { zIndex: 7 }]}
          >
            <Pressable
              onPress={() => navigation.navigate('Results')}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={[s.tabText, s.resultsTab]}>RESULTS</Text>
            </Pressable>
          </View>

          <View style={[s.tabTextWrapper, s.posProfile]}>
            <Pressable
              onPress={() =>
                navigation.navigate('ProfileSettings')
              }
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={[s.tabText, s.profileTab]}>
                PROFILE & SETTINGS
              </Text>
            </Pressable>
          </View>

          {/* 🔵 Top-right pills*/}
          <View style={s.topRightWrap}>
            <View style={s.row}>
              <View style={[s.pill, s.curriculumPill]}>
                <Text style={s.pillTop}>CURRICULUM</Text>
                <Text style={s.pillMain}>
                  {String(curriculum).toUpperCase()}
                </Text>
              </View>

              <View style={[s.pill, s.gradePill]}>
                <Text style={s.pillTop}>GRADE</Text>
                <Text style={s.pillMain}>
                  {String(grade).toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          {/* ===== Content ===== */}
          <View style={s.cardInner}>
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

            {/* Page title = selected test */}
            <Text style={s.heading}>{paper}</Text>

            {/* Scrollable block */}
            <View style={s.bigBlock}>
              <ScrollView
                style={s.bigBlockScroll}
                contentContainerStyle={{
                  paddingBottom: 20,
                  paddingRight: 6,
                }}
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

                {/* AI-ish feedback banner */}
                <View style={s.feedbackBanner}>
                  <Text style={s.feedbackText}>{bannerText}</Text>
                </View>

                {/* Buttons & Topic Breakdown */}
                <View style={s.rowInline}>
                  <View style={s.actionsCol}>
                    <View style={s.actionsRow}>
                      <Pressable
                        style={s.actionBtn}
                        onPress={() => {
                          // TODO: wire to a "review questions" view when ready
                          console.log('Review Questions pressed');
                        }}
                      >
                        <Text style={s.actionText}>
                          Review Questions
                        </Text>
                      </Pressable>

                      <Pressable
                        style={s.actionBtn}
                        onPress={() => {
                          // TODO: Wire this to trigger a section test with weakest topic
                          console.log('Retake Section 10Q pressed');
                        }}
                      >
                        <Text style={s.actionText}>
                          Retake Section 10Q
                        </Text>
                      </Pressable>

                      <Pressable
                        style={s.actionBtn}
                        onPress={handleDownloadPdf}
                      >
                        <Text style={s.actionText}>
                          Download PDF
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  <View style={s.breakdownCol}>
                    <TopicBreakdownBlock topics={topicChartData} />
                  </View>
                </View>

                {/* Partial Credit & Key Feedback*/}
                <View style={s.twoSmallCardsRow}>
                  <PartialCreditCard
                    marks={partialMarks}
                    summary={
                      partialSummary ??
                      'You received marks for correct steps even when final answers were incorrect.'
                    }
                    items={partialItems}
                  />
                  <KeyFeedbackTipsCard blocks={tipsForCard} />
                </View>
              </ScrollView>
            </View>
          </View>

          {/* Download success modal (kept as you had it) */}
          <Modal
            transparent
            animationType="fade"
            visible={downloadModalVisible}
            onRequestClose={() => setDownloadModalVisible(false)}
          >
            <View style={s.modalBackdrop}>
              <View style={s.modalCard}>
                <Text style={s.modalTitle}>PDF downloaded</Text>
                <Text style={s.modalText}>
                  Your test result PDF has been prepared. Check your
                  downloads / share destination.
                </Text>
                <Pressable
                  style={s.modalBtn}
                  onPress={() => setDownloadModalVisible(false)}
                >
                  <Text style={s.modalBtnText}>OK</Text>
                </Pressable>
              </View>
            </View>
          </Modal>
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
    borderRadius: 16,
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

  dashboardTab: {
    fontWeight: 'bold',
    marginTop: -115,
  },

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
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    zIndex: 1,
  },

  cardInner: {
    flex: 1,
    borderRadius: 16,
    padding: 28,
    marginLeft: 210,
    marginRight: 14,
  },

  cardImage: {
    borderRadius: 16,
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
    borderRadius: 16,
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
    borderRadius: 16,
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
    borderRadius: 16,
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
    borderRadius: 16,
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
    marginTop: -175,
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    paddingVertical: 22,
    paddingHorizontal: 22,
    width: '100%',
    maxWidth: 420,
  },
  modalTitle: {
    color: '#FACC15',
    fontFamily: 'Antonio_700Bold',
    fontSize: 20,
    marginBottom: 8,
  },
  modalText: {
    color: '#F9FAFB',
    fontFamily: 'AlumniSans_500Medium',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 18,
  },
  modalBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#FACC15',
  },
  modalBtnText: {
    color: '#111827',
    fontFamily: 'Antonio_700Bold',
    fontSize: 16,
  },
});
