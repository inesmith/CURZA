// src/screens/TestRunnerScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  ImageBackground,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../App';

type Nav = StackNavigationProp<RootStackParamList>;

type Params = {
  mode: 'section' | 'full';
  title: string;          // Topic or Paper name
  subject: string;
  totalMarks: number;     // from AI
  timed?: boolean;        // if true -> countdown
  durationSec?: number;   // required when timed=true
  // You can pass any structure you’ll render in the content area:
  // blocks?: Array<{ id: string; heading: string; marks?: number; html?: string }>
};

const SWOOSH_W = 380;

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
    totalMarks = 0,
    timed = false,
    durationSec = 0,
  } = (route.params || {}) as Params;

  // Header layout for swoosh centering
  const [headingW, setHeadingW] = useState(0);
  const [headingX, setHeadingX] = useState(0);
  const swooshLeft = useMemo(
    () => (headingW > 0 ? headingX + headingW / 2 - SWOOSH_W / 2 - 30 : '20%'),
    [headingW, headingX],
  );

  // Timer
  const [paused, setPaused] = useState(false);
  const [ended, setEnded] = useState(false);
  // If timed: start from durationSec and count down; else: start from 0 and count up
  const [seconds, setSeconds] = useState<number>(timed ? Math.max(0, durationSec) : 0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
            // time up — lock test
            setEnded(true);
            return 0;
          }
          return prev - 1;
        }
        // stopwatch mode
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

  // Grey content “test body” — replace with your renderer
  const Content = (
    <View style={styles.paperInner}>
      {/* Example question header bar */}
      <View style={styles.questionHeader}>
        <Text style={styles.qTitle}>QUESTION 1</Text>
        <Text style={styles.qMarks}>20 MARKS</Text>
      </View>

      {/* Placeholder body; swap with your actual test blocks */}
      <View style={styles.placeholderBlock}>
        <Text style={styles.placeholderText}>
          Your generated test content goes here. Render questions, inputs, and diagrams inside this
          scroll area.
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.page}>
      <View style={styles.imageWrapper}>
        {/* Left rail artwork (same stack visuals you’ve used elsewhere) */}
        <Image source={require('../../assets/DashboardTab.png')} style={styles.tab} resizeMode="contain" />
        <Image source={require('../../assets/SummariesTab.png')} style={styles.tab} resizeMode="contain" />
        <Image source={require('../../assets/PractiseTab.png')} style={styles.tab} resizeMode="contain" />
        <Image source={require('../../assets/ResultsTab.png')} style={styles.tab} resizeMode="contain" />
        <Image source={require('../../assets/ProfileTab.png')} style={styles.tab} resizeMode="contain" />

        {/* Corner logo */}
        <Image source={require('../../assets/curza-logo.png')} style={styles.cornerLogo} resizeMode="contain" />

        {/* Main background */}
        <ImageBackground
          source={require('../../assets/PractiseOpenTab.png')}
          style={styles.card}
          imageStyle={styles.cardImage}
          resizeMode="cover"
        >
          {/* DASHBOARD link (like other screens) */}
          <View style={[styles.tabTextWrapper, styles.posSummaries]}>
            <Pressable onPress={() => navigation.navigate('Dashboard' as never)} hitSlop={12}>
              <Text style={[styles.tabText, styles.dashboardTab]}>DASHBOARD</Text>
            </Pressable>
          </View>

          {/* Header with swoosh + dot + title */}
          <View style={styles.cardInner}>
            <Image source={require('../../assets/swoosh-yellow.png')} style={[styles.swoosh, { left: swooshLeft }]} resizeMode="contain" />
            <Image source={require('../../assets/dot-blue.png')} style={styles.dot} resizeMode="contain" />

            <Text
              style={styles.heading}
              onLayout={(e) => {
                const { x, width } = e.nativeEvent.layout;
                setHeadingX(x);
                setHeadingW(width);
              }}
            >
              {String(title || 'TEST')}
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
                contentContainerStyle={{ padding: 16 }}
                showsVerticalScrollIndicator
                scrollEnabled={!paused && !ended}
                // Disable touches inside while paused/ended
                pointerEvents={paused || ended ? 'none' : 'auto'}
              >
                {Content}
              </ScrollView>

              {(paused || ended) && (
                <View style={styles.overlay}>
                  <Text style={styles.overlayText}>{ended ? 'TIME UP' : 'PAUSED'}</Text>
                </View>
              )}
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
  posSummaries: { top: '22%' },
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

  cornerLogo: { position: 'absolute', bottom: 40, left: -55, height: 130, opacity: 0.9, zIndex: 10 },

  card: { flex: 1, borderRadius: 40, overflow: 'hidden', position: 'relative', zIndex: 1 },
  cardInner: { flex: 1, borderRadius: 40, padding: 28, marginLeft: 210, marginRight: 14 },
  cardImage: { borderRadius: 40, resizeMode: 'cover' },

  swoosh: {
    position: 'absolute',
    top: 20,
    width: SWOOSH_W,
    height: 100,
    transform: [{ rotateZ: '-2deg' }],
    opacity: 0.9,
    zIndex: 2,
  },
  dot: { position: 'absolute', top: 80, left: 10, height: '7%', zIndex: 1, opacity: 0.95 },

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
    borderRadius: 14,
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
    borderRadius: 18,
    height: 620,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  bigBlockScroll: { flex: 1 },

  // Example paper content
  paperInner: {
    backgroundColor: 'rgba(17,24,39,0.25)',
    borderRadius: 16,
    padding: 12,
  },
  questionHeader: {
    backgroundColor: '#FACC15',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    shadowColor: '#0B1220',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  qTitle: { color: '#1F2937', fontFamily: 'Antonio_700Bold', fontSize: 16, letterSpacing: 0.4 },
  qMarks: { color: '#1F2937', fontFamily: 'Antonio_700Bold', fontSize: 14, letterSpacing: 0.4 },
  placeholderBlock: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
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
});
