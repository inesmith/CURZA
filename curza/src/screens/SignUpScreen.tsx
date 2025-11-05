// src/screens/SignUpScreen.tsx
import React, { useMemo, useState, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView, Image, ImageBackground,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = { Login: undefined; SignUp: undefined };

import { signUpWithEmail } from '../services/authService';
import { humanAuthError } from "../utils/firebaseErrors";
import { useNotice } from "../contexts/NoticeProvider";

// dropdown components
import Select, { Option } from "../ui/Select";
// NOTE: MultiSelect import removed (no longer used)

// data folder
import { CURRICULUMS } from "../data/curriculums";  
import { LANGUAGES } from "../data/languages";       
import { SUBJECTS } from "../data/subjects";      

// Firestore
import { getAuth } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

export default function SignUpScreen() {
  const [centre, setCentre] = useState(false);
  const [terms, setTerms] = useState(false);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState(''); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null); 

  const { show } = useNotice();

  const toOptions = (arr: string[]): Option[] =>
    arr.map((label) => ({
      label,
      value: label
        .toLowerCase()
        .replace(/[()]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, ''),
    }));

  const dedupeByLabel = (arr: string[]) => Array.from(new Set(arr));

  // language-specific subjects 
  const LANG_SPECIFIC = [
    "English Home Language",
    "English First Additional Language",
    "Afrikaans Home Language",
    "Afrikaans First Additional Language",
  ];

  // options for other pickers
  const CURRICULA: Option[] = useMemo(() => toOptions(CURRICULUMS), []);
  const GRADES: Option[] = useMemo(
    () => Array.from({ length: 6 }, (_, i) => {
      const g = 7 + i;
      return { value: String(g), label: `Grade ${g}` } as Option;
    }),
    []
  );
  const LANGS: Option[] = useMemo(() => toOptions(LANGUAGES), []);

  // subjects by phase, merged with HL/FAL
  const JUNIOR_SUBJECT_OPTIONS = useMemo(() => {
    const merged = dedupeByLabel([...LANG_SPECIFIC, ...SUBJECTS.junior]);
    return toOptions(merged);
  }, []);
  const SENIOR_SUBJECT_OPTIONS = useMemo(() => {
    const merged = dedupeByLabel([...LANG_SPECIFIC, ...SUBJECTS.senior]);
    return toOptions(merged);
  }, []);

  // Controlled selections
  const [curriculum, setCurriculum] = useState<string | null>(null);
  const [grade, setGrade] = useState<string | null>(null);
  const [language, setLanguage] = useState<string | null>(null);

  // Keep array shape for persistence (now single-select)
  const [subjects, setSubjects] = useState<string[]>([]);

  const isJunior = useMemo(() => {
    const n = parseInt(grade || '', 10);
    return Number.isFinite(n) ? n < 10 : false;
  }, [grade]);

  const SUBJECT_OPTIONS = useMemo(() => {
    return isJunior ? JUNIOR_SUBJECT_OPTIONS : SENIOR_SUBJECT_OPTIONS;
  }, [isJunior, JUNIOR_SUBJECT_OPTIONS, SENIOR_SUBJECT_OPTIONS]);

  // when switching to Grade 7–9, drop any senior-only selections
  useEffect(() => {
    if (!isJunior) return;
    const juniorSet = new Set(JUNIOR_SUBJECT_OPTIONS.map(s => s.value));
    setSubjects(prev => prev.filter(v => juniorSet.has(v)));
  }, [isJunior, JUNIOR_SUBJECT_OPTIONS]);

  // Build Subject list: Mathematics enabled (black), others disabled (grey)
  // Build Subject list: Mathematics first (enabled/black), others disabled/grey
const SUBJECT_SINGLE_LIST: Option[] = useMemo(() => {
  const mathVal = 'mathematics';

  // map once so we can partition while preserving original order for non-math
  const mapped = SUBJECT_OPTIONS.map((o) => {
    const isMath = o.value === mathVal || o.label.toLowerCase() === 'mathematics';
    return {
      ...o,
      value: isMath ? mathVal : o.value, // canonicalize
      disabled: !isMath,                 // only Math selectable
    };
  });

  const math = mapped.find(o => o.value === mathVal)
    ?? { label: 'Mathematics', value: mathVal, disabled: false };

  const others = mapped.filter(o => o.value !== mathVal);

  return [math, ...others]; // Mathematics at the top
}, [SUBJECT_OPTIONS]);


  const selectedSubject = subjects[0] ?? null;

  const onCreate = async () => {
    if (!terms) {
      const msg = "Please agree to the terms & conditions.";
      setError(msg);
      show(msg, "error");
      return;
    }
    if (!curriculum || !grade || !language || subjects.length === 0) {
      show("Please complete Curriculum, Grade, Language and Subjects.", "error");
      return;
    }

    try {
      setError(null);
      setSubmitting(true);

      // 1) Auth sign up (sends verification inside authService)
      await signUpWithEmail(email.trim(), password, fullName.trim() || undefined);

      // 2) Persist profile to Firestore (merge-safe)
      const auth = getAuth();
      const uid = auth.currentUser?.uid;

      if (uid) {
        await setDoc(
          doc(db, 'users', uid),
          {
            fullName: fullName.trim(),
            idNumber: idNumber.trim() || null,
            email: email.trim().toLowerCase(),
            curriculum,
            grade: parseInt(grade!, 10),
            language,
            subjects,
            centre,
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      show("Account created! We’ve sent you a verification email — please verify to log in.", "success");
    } catch (e: any) {
      const msg = humanAuthError(e?.code) || "Something went wrong. Please try again.";
      setError(msg);
      show(msg, "error");
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
                  <TextInput
                    placeholder="Your Name & Surname"
                    placeholderTextColor="white"
                    style={s.input}
                    value={fullName}
                    onChangeText={setFullName}
                  />

                  <Text style={s.label}>ID Number</Text>
                  <TextInput
                    placeholder="Your ID Number"
                    placeholderTextColor="white"
                    style={s.input}
                    keyboardType="number-pad"
                    value={idNumber}
                    onChangeText={setIdNumber}
                  />

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

                  {/* Dropdowns */}
                  <Text style={s.label}>Grade</Text>
                  <Select
                    placeholder="Select Your Grade"
                    value={grade}
                    onChange={setGrade}
                    options={GRADES}
                    style={s.input}
                    textStyle={{ color: 'white' }}
                  />

                  <Text style={s.label}>Curriculum</Text>
                  <Select
                    placeholder="Select Your Curriculum"
                    value={curriculum}
                    onChange={setCurriculum}
                    options={CURRICULA}
                    style={s.input}
                    textStyle={{ color: 'white' }}
                  />
                </View>

                <View style={s.col}>
                  <Text style={s.label}>Language</Text>
                  <Select
                    placeholder="Select Your Language"
                    value={language}
                    onChange={setLanguage}
                    options={LANGS}
                    style={s.input}
                    textStyle={{ color: 'white' }}
                  />

                  {/* Subjects: single-select; only Mathematics enabled */}
                  <Text style={s.label}>Subjects</Text>
                  <Select
                    placeholder="Select Subject"
                    value={selectedSubject}
                    onChange={(val) => setSubjects([val])}
                    options={SUBJECT_SINGLE_LIST}
                    style={s.input}
                    textStyle={{ color: 'white' }}
                  />

                  <Pressable style={s.checkRow} onPress={() => setCentre(v => !v)}>
                    <View style={[s.checkbox, centre && s.checkboxOn]} />
                    <Text style={s.checkText}>I am using this at a learning centre.</Text>
                  </Pressable>

                  <Pressable style={s.checkRow} onPress={() => setTerms(v => !v)}>
                    <View style={[s.checkbox, terms && s.checkboxOn]} />
                    <Text style={s.checkText}>I agree to all terms & conditions.</Text>
                  </Pressable>

                  <Pressable style={s.cta} onPress={onCreate} disabled={submitting}>
                    <Text style={s.ctaText}>{submitting ? 'Creating…' : 'Create Account'}</Text>
                  </Pressable>

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
  activeTab: { color: '#E5E7EB', fontWeight: 'bold', marginTop: -62 },
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
    backgroundColor: '#FACC15', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 32, shadowColor: '#0B1220', shadowOpacity: 0.22, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, height: 48, },
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
    opacity: 0.9,
    zIndex: 10,
  },
});
