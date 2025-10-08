import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Image, ImageBackground } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../App';

export default function DashboardScreen() {
  const [centre, setCentre] = useState(false);
  const [terms, setTerms] = useState(false);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  return (
    <View style={s.page}>
      <View style={s.imageWrapper}>
        {/* Left rail artwork (make them NOT capture touches) */}
        <Image source={require('../../assets/DashboardTab.png')}  style={s.logintab} resizeMode="contain" />
        <Image source={require('../../assets/SummariesTab.png')} style={s.logintab} resizeMode="contain" />
        <Image source={require('../../assets/ResultsTab.png')}   style={s.logintab} resizeMode="contain" />
        <Image source={require('../../assets/ProfileTab.png')}   style={s.logintab} resizeMode="contain" />

        {/* Clickable text labels, each with its own position */}
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
          source={require('../../assets/PractiseOpenTab.png')}
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
              <Image source={require('../../assets/swoosh-yellow.png')} style={s.swoosh} resizeMode="contain" />
              <Image source={require('../../assets/dot-blue.png')} style={s.dot} resizeMode="contain" />
              <Text style={s.heading}>PRACTISE WITH WRITING TESTS</Text>
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

  // Individual vertical positions (tweak these to align with your art)
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
  logintab: {
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
    left: '25%',
    width: 380,
    height: 90,
    transform: [{ rotateZ: '-2deg' }],
    opacity: 0.9,
    zIndex: 2,
  },
  dot: {
    position: 'absolute',
    top: 0,
    left: 460,
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
