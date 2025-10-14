// src/screens/DashboardScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Image, ImageBackground } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../App';
import { useResponsive } from '../ui/responsive';

// Firebase
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const SWOOSH_W = 380; // must match s.swoosh.width

export default function DashboardScreen() {
  const [firstName, setFirstName] = useState<string>('');
  const [headingW, setHeadingW] = useState(0);
  const [headingX, setHeadingX] = useState(0);
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
        const profileFullName = snap.exists() ? (snap.data()?.fullName as string | undefined) : undefined;

        const name =
          getFirst(profileFullName) ||
          getFirst(user.displayName) ||
          getFirst(user.email) ||
          '';

        setFirstName(name);
      } catch {
        const fallback =
          getFirst(user.displayName) ||
          getFirst(user.email) ||
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
  // left = textX + textW/2 - swooshW/2
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
              <Text style={[s.tabText, s.dashboardTab]}>Dashboard</Text>
            </Pressable>
          </View>

          <View style={s.cardInner}>
            <ScrollView contentContainerStyle={s.scroll}>
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

  scroll: { paddingBottom: 44 },

  swoosh: {
    position: 'absolute',
    top: 0,
    width: SWOOSH_W,
    height: 90,
    transform: [{ rotateZ: '-2deg' }],
    opacity: 0.9,
    zIndex: 2,
  },
  dot: {
    position: 'absolute',
    top: 50,
    left: -8,
    height: '35%',
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

  cornerLogo: {
    position: 'absolute',
    bottom: 40,
    left: -55,
    height: 130,
    opacity: 0.9,
    zIndex: 10,
  },
});
