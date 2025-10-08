import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Image, ImageBackground } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../App';

export default function DashboardScreen() {
  const [centre, setCentre] = useState(false);
  const [terms, setTerms] = useState(false);
  const [showDrop, setShowDrop] = useState(false); // ⬅️ toggle for dropdown + tab look
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

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
            style={s.dropTab}          // sits above rail art, below text
            resizeMode="contain"
          />
        )}

        {/* Clickable text labels */}
        <View style={[s.tabTextWrapper, s.posSummaries]}>
          <Pressable
            onPress={() => setShowDrop(v => !v)}                 // tap again to open/close & change look
            hitSlop={{ top:12, bottom:12, left:12, right:12 }}
          >
            <Text style={[s.tabText, showDrop ? s.summariesActive : s.summariesTab]}>
              SUMMARIES
            </Text>
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
              <Text style={[s.tabText, s.dashboardTab]}>Dashboard</Text>
            </Pressable>
          </View>

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
