// src/screens/LoginScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, Image, ImageBackground, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../App';

import { signInWithEmail, resetPassword } from '../services/authService';
import { humanAuthError } from '../utils/firebaseErrors';
import { useNotice } from '../contexts/NoticeProvider';
import { useAuth } from '../contexts/AuthProvider';

export default function LoginScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { user, loading } = useAuth();
  const { show } = useNotice();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user || loading) return;
    const state: any = (navigation as any)?.getState?.();
    const routeNames: string[] = state?.routeNames ?? [];
    if (routeNames.includes('Dashboard')) {
      navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
    }
  }, [user, loading, navigation]);

  const onLogin = async () => {
    if (!email.trim() || !password) {
      show('Please enter your email and password.', 'error');
      return;
    }
    try {
      setSubmitting(true);
      await signInWithEmail(email.trim(), password);
      show('Welcome back!', 'success');
    } catch (e: any) {
      const msg = humanAuthError(e?.code) || 'Could not sign in. Please try again.';
      show(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const onForgot = async () => {
    const target = email.trim();
    if (!target) {
      show('Enter your email above first.', 'error');
      return;
    }
    try {
      await resetPassword(target);
      show('Reset link sent. Check your inbox (or spam).', 'success');
    } catch (e: any) {
      const msg = humanAuthError(e?.code) || 'Could not send reset email.';
      show(msg, 'error');
    }
  };

  return (
    <View style={s.page}>
      <View style={s.imageWrapper}>
        {/* Left rail art overlay */}
        <Image source={require('../../assets/SignupTab-1.png')} style={s.logintab} resizeMode="contain" />

        {/* Tabs at top-left */}
        <View style={s.tabTextWrapper}>
          <Text style={[s.tabText, s.activeTab]}>LOG IN</Text>
          <Pressable
            onPress={() => navigation.navigate('SignUp')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={[s.tabText, s.inactiveTab]}>SIGN UP</Text>
          </Pressable>
        </View>

        {/* Corner logo */}
        <Image source={require('../../assets/curza-logo.png')} style={s.cornerLogo} resizeMode="contain" />

        {/* Background */}
        <ImageBackground
          source={require('../../assets/LoginTab-1.png')}
          style={s.card}
          imageStyle={s.cardImage}
          resizeMode="cover"
        >
          <View style={s.cardInner}>
            <ScrollView contentContainerStyle={s.scroll}>
              <Image source={require('../../assets/swoosh-yellow.png')} style={s.swoosh} resizeMode="contain" />
              <Image source={require('../../assets/dot-white.png')} style={s.dot} resizeMode="contain" />

              <View style={s.formWrap}>
                <Text style={s.heading}>WELCOME BACK</Text>
                <Text style={s.sub}>Log in to continue your learning journey.</Text>

                <Text style={s.label}>Email</Text>
                <TextInput
                  placeholder="Your Email"
                  placeholderTextColor="white"
                  style={s.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />

                <Text style={s.label}>Password</Text>
                <TextInput
                  placeholder="Your Password"
                  placeholderTextColor="white"
                  style={s.input}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />

                {/* Forgot password link */}
                <View style={{ alignItems: 'flex-end', marginTop: 4 }}>
                  <Pressable onPress={onForgot} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={{ color: '#E5E7EB', textDecorationLine: 'underline' }}>
                      Forgot password?
                    </Text>
                  </Pressable>
                </View>

                <Pressable style={s.cta} onPress={onLogin} disabled={submitting || loading}>
                  <Text style={s.ctaText}>{submitting ? 'Signing in…' : 'Log In'}</Text>
                </Pressable>

                <Text style={s.signupHint}>
                  Don’t have an account?{' '}
                  <Text style={s.signupHint2} onPress={() => navigation.navigate('SignUp')}>Sign up</Text>
                </Text>
              </View>
            </ScrollView>
          </View>
        </ImageBackground>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#0B1220', justifyContent: 'center', alignItems: 'center' },
  imageWrapper: {
    width: '94%', height: '95%', marginVertical: 10, borderRadius: 40, overflow: 'hidden',
    shadowColor: '#0B1220', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
    position: 'relative',
  },
  tabText: {
    fontFamily: 'AlumniSans_500Medium', fontSize: 20, marginLeft: -20, letterSpacing: 1, marginBottom: 18,
    textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2, color: 'white',
  },
  tabTextWrapper: { position: 'absolute', top: '22%', left: '4.5%', alignItems: 'center', zIndex: 12, elevation: 6 },
  activeTab: { fontWeight: 'bold', marginTop: 37 },
  inactiveTab: { opacity: 0.85, marginTop: -140 },
  logintab: { position: 'absolute', height: '100%', width: '100%', zIndex: 1 },
  card: { flex: 1, borderRadius: 40, overflow: 'hidden', position: 'relative', zIndex: 1 },
  cardInner: { flex: 1, borderRadius: 40, padding: 28, marginLeft: 210, marginRight: 14 },
  cardImage: { borderRadius: 40, resizeMode: 'cover' },
  scroll: { paddingBottom: 44 },
  swoosh: { position: 'absolute', top: 0, left: '0%', width: 380, height: 90, transform: [{ rotateZ: '-2deg' }], opacity: 0.9, zIndex: 1 },
  dot: { position: 'absolute', top: 75, left: 300, width: 28, height: 28, zIndex: 1, opacity: 0.95 },
  formWrap: {
    width: 410,
    maxWidth: '86%',
    alignSelf: 'flex-start',
  },
  heading: {
    fontFamily: 'Antonio_700Bold', color: 'white', fontSize: 48, letterSpacing: 0.5, marginBottom: 8, zIndex: 2,
    marginTop: 12, textShadowColor: 'rgba(0,0,0,0.22)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2,
  },
  sub: { fontFamily: 'AlumniSans_500Medium', color: '#E5E7EB', fontSize: 22, lineHeight: 28, marginBottom: 18, maxWidth: 560, marginTop: 18, opacity: 0.95 },
  label: { color: '#E5E7EB', fontFamily: 'AlumniSans_500Medium', marginBottom: 6, fontSize: 17, letterSpacing: 0.2 },
  input: {
    width: '100%',
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
  cta: {
    width: '100%',
    backgroundColor: '#FACC15',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    shadowColor: '#0B1220',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    height: 48,
  },
  ctaText: { color: '#1F2937', fontFamily: 'Antonio_700Bold', fontSize: 16, letterSpacing: 0.3 },
  signupHint: { color: '#E5E7EB', marginTop: 20, fontFamily: 'AlumniSans_500Medium', fontSize: 20, alignSelf: 'flex-start', opacity: 0.95 },
  signupHint2: { color: '#FACC15', marginTop: 20, fontFamily: 'AlumniSans_500Medium', fontSize: 20, alignSelf: 'flex-start', opacity: 0.95 },
  cornerLogo: { position: 'absolute', bottom: 40, left: -55, height: 130, opacity: 0.9, zIndex: 10 },
});
