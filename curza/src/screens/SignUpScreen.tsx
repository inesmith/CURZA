// src/screens/SignUpScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView, Image, ImageBackground,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = { Login: undefined; SignUp: undefined };

import { signUpWithEmail } from '../services/authService'; // ✅ NEW

export default function SignUpScreen() {
  const [centre, setCentre] = useState(false);
  const [terms, setTerms] = useState(false);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // ✅ NEW
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCreate = async () => {
    if (!terms) { setError('Please accept the terms & conditions.'); return; }
    try {
      setError(null);
      setSubmitting(true);
      await signUpWithEmail(email.trim(), password, fullName.trim() || undefined);
      // Auth guard will navigate to Dashboard stack automatically
    } catch (e: any) {
      setError(e?.message ?? 'Sign up failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={s.page}>
      <View style={s.imageWrapper}>
        <Image source={require('../../assets/logintab.png')} style={s.logintab} resizeMode="contain" />
        <View style={s.tabTextWrapper}>
          <Pressable onPress={() => navigation.navigate('Login')} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={[s.tabText, s.inactiveTab]}>LOG IN</Text>
          </Pressable>
        </View>

        <Image source={require('../../assets/curza-logo.png')} style={s.cornerLogo} resizeMode="contain" />

        <ImageBackground source={require('../../assets/signup.png')} style={s.card} imageStyle={s.cardImage} resizeMode="cover">
          <View style={s.tabTextWrapper}>
            <Text style={[s.tabText, s.activeTab]}>SIGN UP</Text>
          </View>

          <View style={s.cardInner}>
            <ScrollView contentContainerStyle={s.scroll}>
              <Image source={require('../../assets/swoosh-yellow.png')} style={s.swoosh} resizeMode="contain" />
              <Image source={require('../../assets/dot-white.png')} style={s.dot} resizeMode="contain" />

              <Text style={s.heading}>CREATE YOUR CURZA ACCOUNT</Text>
              <Text style={s.sub}>Set up your profile and start learning smarter, with tools {'\n'}built for your curriculum.</Text>

              <View style={s.grid}>
                <View style={s.col}>
                  <Text style={s.label}>Full Name</Text>
                  <TextInput placeholder="Your Name & Surname" placeholderTextColor="#C7D2FE" style={s.input}
                    value={fullName} onChangeText={setFullName} />

                  <Text style={s.label}>ID Number</Text>
                  <TextInput placeholder="Your ID Number" placeholderTextColor="#C7D2FE" style={s.input} keyboardType="number-pad" />

                  <Text style={s.label}>Email</Text>
                  <TextInput placeholder="Your Email" placeholderTextColor="#C7D2FE" style={s.input}
                    keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />

                  <Text style={s.label}>Password</Text>
                  <TextInput placeholder="Your Password" placeholderTextColor="#C7D2FE" style={s.input}
                    secureTextEntry value={password} onChangeText={setPassword} />

                  <Text style={s.label}>Curriculum</Text>
                  <TextInput placeholder="CAPS" placeholderTextColor="#C7D2FE" style={s.input} />

                  <Text style={s.label}>Grade</Text>
                  <TextInput placeholder="12" placeholderTextColor="#C7D2FE" style={s.input} />
                </View>

                <View style={s.col}>
                  <Text style={s.label}>Language</Text>
                  <TextInput placeholder="English" placeholderTextColor="#C7D2FE" style={s.input} />

                  <Text style={s.label}>Subjects</Text>
                  <TextInput placeholder="4 Selected" placeholderTextColor="#C7D2FE" style={s.input} />

                  <Pressable style={s.checkRow} onPress={() => setCentre(v => !v)}>
                    <View style={[s.checkbox, centre && s.checkboxOn]} />
                    <Text style={s.checkText}>I am using this at a learning centre.</Text>
                  </Pressable>

                  <Pressable style={s.checkRow} onPress={() => setTerms(v => !v)}>
                    <View style={[s.checkbox, terms && s.checkboxOn]} />
                    <Text style={s.checkText}>I agree to all terms & conditions.</Text>
                  </Pressable>

                  {/* ✅ Create account with Firebase */}
                  <Pressable style={s.cta} onPress={onCreate} disabled={submitting}>
                    <Text style={s.ctaText}>{submitting ? 'Creating…' : 'Create Account'}</Text>
                  </Pressable>

                  {!!error && (
                    <Text style={{ color: '#fecaca', marginTop: 10, textAlign: 'center' }}>
                      {error}
                    </Text>
                  )}

                  <Text style={s.loginHint}>
                    Already have an account? <Text style={s.loginLink} onPress={() => navigation.navigate('Login')}>Log in</Text>
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </ImageBackground>
      </View>
    </View>
  );
}

const BLUE = '#2563EB';
const INPUT = '#3B82F6';

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

  // Sign Up / Log In text overlay
  tabTextWrapper: {
    position: 'absolute',
    top: '22%',
    left: '4.5%',
    alignItems: 'center',
    zIndex: 5,                    
  },
  tabText: {
    fontFamily: 'AlumniSans_500Medium',
    fontSize: 20,
    marginLeft: -20,
    letterSpacing: 1,
    marginBottom: 18,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  activeTab: { color: '#E5E7EB', fontWeight: 'bold', marginTop: -60 },
  inactiveTab: { color: '#E5E7EB', opacity: 0.8, marginTop: 37 },

  logintab: {
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

  scroll: { paddingBottom: 44 },

  swoosh: {
    position: 'absolute',
    top: 0,
    left: '23%',
    width: 380,
    height: 90,
    transform: [{ rotateZ: '-2deg' }],
    opacity: 0.9,
    zIndex: 1,
  },
  dot: {
    position: 'absolute',
    top: 75,
    left: 460,
    width: 28,
    height: 28,
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
    marginTop: 18,
    opacity: 0.95,
  },

  grid: { flexDirection: 'row', gap: 18 },
  col: { flex: 1 },

  label: {
    color: '#E5E7EB',
    fontFamily: 'AlumniSans_500Medium',
    marginBottom: 6,
    fontSize: 17,
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: 'rgba(59,130,246,0.92)',
    borderColor: '#60A5FA',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: 'white',
    fontFamily: 'AlumniSans_500Medium',
    marginBottom: 12,
    fontSize: 17,
  },

  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 38,
    marginBottom: 20,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: 'white', backgroundColor: 'transparent',
  },
  checkboxOn: { backgroundColor: '#E5E7EB' },
  checkText: { color: '#E5E7EB', fontFamily: 'AlumniSans_500Medium', fontSize: 20 },

  cta: {
    backgroundColor: '#FACC15',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 32,
    shadowColor: '#0B1220',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    height: 48,
  },
  ctaText: {
    color: '#1F2937',
    fontFamily: 'Antonio_700Bold',
    fontSize: 16,
    letterSpacing: 0.3,
  },

  loginHint: {
    color: '#E5E7EB',
    marginTop: 20,
    fontFamily: 'AlumniSans_500Medium',
    fontSize: 20,
    alignSelf: 'center',
    opacity: 0.95,
  },
  loginLink: { color: '#FACC15', fontFamily: 'AlumniSans_500Medium', fontSize: 20 },

  cornerLogo: {
  position: 'absolute',
  bottom: 40,
  left: -55,
  height: 130,
  opacity: 0.9, // optional, for a softer look
  zIndex: 10,
  },

});