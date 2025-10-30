import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView, Image, ImageBackground, TextInput, Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../App';

// Firebase
import { getAuth, onAuthStateChanged, signOut, deleteUser } from 'firebase/auth';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { db } from '../../firebase';

import { useNotice } from "../contexts/NoticeProvider";

export default function ProfileScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { show } = useNotice();

  // --- Profile state (read-only / editable display) ---
  const [fullName, setFullName] = useState<string>('');
  const [idNumber, setIdNumber] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [curriculum, setCurriculum] = useState<string>('CAPS');
  const [grade, setGrade] = useState<string | number>('12');
  const [language, setLanguage] = useState<string>('English');
  const [subjects, setSubjects] = useState<string[]>([]);

  const [editMode, setEditMode] = useState(false);
  const userIdRef = useRef<string | null>(null);
  const originalRef = useRef<any>(null); // to restore on cancel

  // 🔴 Deactivate/Delete modals state
  const [showActionModal, setShowActionModal] = useState(false);                 // choose Delete or Deactivate
  const [pendingAction, setPendingAction] = useState<'delete' | 'deactivate' | null>(null);
  const [showReasonModal, setShowReasonModal] = useState(false);                 // ask "why"
  const [reasonText, setReasonText] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);               // final confirmation
  const [busy, setBusy] = useState(false);

  // ✅ Subjects selection modal (checkbox list)
  const [showSubjectsModal, setShowSubjectsModal] = useState(false);
  const [tempSubjects, setTempSubjects] = useState<string[]>([]);

  // Helpers
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
      .map(w => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
      .join(' ');

  // Grade-aware subjects list (simple, sensible defaults)
  const getSubjectOptions = (curr: string, g: string | number): string[] => {
    const gg = Number(g);
    // Core lists (South Africa common CAPS/IEB subjects)
    const core10to12 = [
      'English', 'Afrikaans', 'isiZulu', 'Mathematics', 'Mathematical Literacy', 'Life Orientation',
      'Physical Sciences', 'Life Sciences', 'Geography', 'History',
      'Accounting', 'Business Studies', 'Economics',
      'Computer Applications Technology', 'Information Technology',
      'Visual Arts', 'Design', 'Dramatic Arts', 'Music',
      'Tourism', 'Hospitality Studies',
      'Agricultural Sciences',
    ];
    const core8to9 = [
      'English', 'Afrikaans', 'isiZulu', 'Mathematics',
      'Natural Sciences', 'Social Sciences', 'Technology',
      'Economic & Management Sciences', 'Creative Arts', 'Life Orientation',
    ];
    if (gg >= 10) return core10to12;
    if (gg >= 8) return core8to9;
    // fallback
    return core10to12;
  };

  // Load user data
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      userIdRef.current = user.uid;

      setEmail(user.email ?? '');
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        const profile = snap.exists() ? (snap.data() as any) : undefined;

        const _fullName = profile?.fullName || user.displayName || '';
        const _idNumber = profile?.idNumber || '';
        const _curriculum = profile?.curriculum ? normalizeCurriculum(profile.curriculum) : 'CAPS';
        const _grade = profile?.grade ?? '12';
        const _language = profile?.language ? titleCase(profile.language) : 'English';
        const subs: any[] = profile?.subjects || profile?.selectedSubjects || profile?.subjectsChosen || [];
        const _subjects = Array.isArray(subs) ? subs.map(titleCase).filter(Boolean) : [];

        setFullName(_fullName);
        setIdNumber(_idNumber);
        setCurriculum(_curriculum);
        setGrade(_grade);
        setLanguage(_language);
        setSubjects(_subjects);

        originalRef.current = {
          fullName: _fullName,
          idNumber: _idNumber,
          curriculum: _curriculum,
          grade: _grade,
          language: _language,
          subjects: _subjects,
          email: user.email ?? '',
        };
      } catch {
        // ignore errors
      }
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(getAuth());
      navigation.navigate('Login');
    } catch (e) {
      console.log('Logout error:', e);
    }
  };

  const handleDeactivatePress = () => {
    setPendingAction(null);
    setReasonText('');
    setShowActionModal(true);
  };

  const handleChooseAction = (a: 'delete' | 'deactivate') => {
    setPendingAction(a);
    setShowActionModal(false);
    setShowReasonModal(true);
  };

  const proceedFromReason = () => {
    setShowReasonModal(false);
    setShowConfirmModal(true);
  };

  const performDeactivate = async () => {
    try {
      setBusy(true);
      const uid = userIdRef.current;
      if (!uid) return;
      await updateDoc(doc(db, 'users', uid), {
        status: 'deactivated',
        deactivatedAt: serverTimestamp(),
        deactivateReason: reasonText || null,
      });
      setBusy(false);
      setShowConfirmModal(false);
      show('Your account has been successfully deactivated.');
      await signOut(getAuth());
      navigation.navigate('Login');
    } catch (e) {
      setBusy(false);
      setShowConfirmModal(false);
      show('Something went wrong while deactivating. Please try again.', 'error', 2800);
    }
  };

  const performDelete = async () => {
    try {
      setBusy(true);
      const auth = getAuth();
      const user = auth.currentUser;
      const uid = userIdRef.current;
      if (!user || !uid) return;

      await deleteDoc(doc(db, 'users', uid));
      await addDoc(collection(db, 'account_deletion_audit'), { uid, reason: reasonText, at: serverTimestamp() });
      await deleteUser(user);

      setBusy(false);
      setShowConfirmModal(false);
      show('Your account has been successfully deleted.');
      navigation.navigate('Login');
    } catch (e) {
      setBusy(false);
      setShowConfirmModal(false);
      show('Could not delete your account. You may need to re-authenticate.', 'error', 3200);
    }
  };

  const handleEditToggle = () => {
    if (!editMode) {
      originalRef.current = {
        fullName, idNumber, email, curriculum, grade, language, subjects: [...subjects],
      };
    }
    setEditMode(v => !v);
  };

  const handleCancel = () => {
    const o = originalRef.current;
    if (o) {
      setFullName(o.fullName);
      setIdNumber(o.idNumber);
      setEmail(o.email);
      setCurriculum(o.curriculum);
      setGrade(o.grade);
      setLanguage(o.language);
      setSubjects(Array.isArray(o.subjects) ? o.subjects : []);
    }
    setEditMode(false);
  };

  const handleSave = async () => {
    try {
      const uid = userIdRef.current;
      if (!uid) return;

      const cleanSubjects = (Array.isArray(subjects) ? subjects : String(subjects).split(','))
        .map(titleCase)
        .map(s => s.trim())
        .filter(Boolean);

      await updateDoc(doc(db, 'users', uid), {
        fullName,
        idNumber,
        email,
        curriculum,
        grade,
        language,
        subjects: cleanSubjects,
        updatedAt: serverTimestamp(),
      });

      setSubjects(cleanSubjects);
      setEditMode(false);
      show('Profile saved successfully.');
    } catch (e) {
      show('Could not save profile changes. Please try again.', 'error', 2800);
    }
  };

  // ===== Subjects modal handlers =====
  const openSubjectsModal = () => {
    setTempSubjects(subjects);
    setShowSubjectsModal(true);
  };

  const toggleTempSubject = (name: string) => {
    setTempSubjects(prev =>
      prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]
    );
  };

  const applySubjectsModal = () => {
    // keep title case and trimmed
    const cleaned = tempSubjects.map(titleCase).map(s => s.trim()).filter(Boolean);
    setSubjects(cleaned);
    setShowSubjectsModal(false);
  };

  return (
    <View style={s.page}>
      <View style={s.imageWrapper}>
        {/* Left rail artwork */}
        <Image source={require('../../assets/DashboardTab.png')}  style={s.tab} resizeMode="contain" />
        <Image source={require('../../assets/SummariesTab.png')} style={s.tab} resizeMode="contain" />
        <Image source={require('../../assets/PractiseTab.png')}   style={s.tab} resizeMode="contain" />
        <Image source={require('../../assets/ResultsTab.png')}   style={s.tab} resizeMode="contain" />

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
          source={require('../../assets/ProfileOpenTab.png')}
          style={s.card}
          imageStyle={s.cardImage}
          resizeMode="cover"
        >
          <View style={[s.tabTextWrapper, s.posSummaries]}>
            <Pressable onPress={() => navigation.navigate('Dashboard')} hitSlop={{ top:12, bottom:12, left:12, right:12 }}>
              <Text style={[s.tabText, s.dashboardTab]}>DASHBOARD</Text>
            </Pressable>
          </View>

          {/* Top-right pill area (same slot/size as grade pill) */}
          <View style={s.topRightWrap}>
            {editMode ? (
              <View style={s.row}>
                <Pressable style={[s.pill, s.gradePill]} onPress={handleCancel} hitSlop={6}>
                  <Text style={s.pillMain}>CANCEL</Text>
                </Pressable>
                <Pressable style={[s.pill, s.gradePill]} onPress={handleSave} hitSlop={6}>
                  <Text style={s.pillMain}>SAVE</Text>
                </Pressable>
              </View>
            ) : (
              <View style={s.row}>
                <Pressable style={[s.pill, s.gradePill]} onPress={handleEditToggle} hitSlop={6}>
                  <Text style={s.pillMain}>EDIT</Text>
                </Pressable>
              </View>
            )}
          </View>

          <View style={s.cardInner}>
            {/* Static header */}
            <Image source={require('../../assets/swoosh-yellow.png')} style={s.swoosh} resizeMode="contain" />
            <Image source={require('../../assets/dot-blue.png')} style={s.dot} resizeMode="contain" />
            <Text style={s.heading}>PROFILE & SETTINGS</Text>

            {/* Scrollable block */}
            <View style={s.bigBlock}>
              <ScrollView
                style={s.bigBlockScroll}
                contentContainerStyle={{ paddingBottom: 20, paddingRight: 6 }}
                showsVerticalScrollIndicator
              >
                <View style={s.formRow}>
                  {/* LEFT COLUMN */}
                  <View style={s.leftCol}>
                    <Text style={s.label}>Full Name</Text>
                    {editMode ? (
                      <TextInput
                        value={fullName}
                        onChangeText={setFullName}
                        style={s.inputBoxEditable}
                        placeholder="Full Name"
                        placeholderTextColor="rgba(243,244,246,0.6)"
                      />
                    ) : (
                      <View style={s.inputBox}><Text style={s.inputText}>{fullName || '—'}</Text></View>
                    )}

                    <Text style={[s.label, { marginTop: 16 }]}>ID Number</Text>
                    {editMode ? (
                      <TextInput
                        value={idNumber}
                        onChangeText={setIdNumber}
                        style={s.inputBoxEditable}
                        keyboardType="number-pad"
                        placeholder="ID Number"
                        placeholderTextColor="rgba(243,244,246,0.6)"
                      />
                    ) : (
                      <View style={s.inputBox}><Text style={s.inputText}>{idNumber || '—'}</Text></View>
                    )}

                    <Text style={[s.label, { marginTop: 16 }]}>Email</Text>
                    {editMode ? (
                      <TextInput
                        value={email}
                        onChangeText={setEmail}
                        style={s.inputBoxEditable}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        placeholder="Email"
                        placeholderTextColor="rgba(243,244,246,0.6)"
                      />
                    ) : (
                      <View style={s.inputBox}><Text style={s.inputText}>{email || '—'}</Text></View>
                    )}

                    <Text style={[s.label, { marginTop: 16 }]}>Curriculum</Text>
                    {editMode ? (
                      <TextInput
                        value={curriculum}
                        onChangeText={(v) => setCurriculum(normalizeCurriculum(v))}
                        style={s.inputBoxEditable}
                        placeholder="CAPS / IEB / Cambridge / IB"
                        placeholderTextColor="rgba(243,244,246,0.6)"
                      />
                    ) : (
                      <View style={s.inputBox}><Text style={s.inputText}>{curriculum}</Text></View>
                    )}

                    <Text style={[s.label, { marginTop: 16 }]}>Grade</Text>
                    {editMode ? (
                      <TextInput
                        value={String(grade)}
                        onChangeText={(v) => setGrade(v)}
                        style={s.inputBoxEditable}
                        keyboardType="number-pad"
                        placeholder="Grade"
                        placeholderTextColor="rgba(243,244,246,0.6)"
                      />
                    ) : (
                      <View style={s.inputBox}><Text style={s.inputText}>{String(grade)}</Text></View>
                    )}

                    <Text style={[s.label, { marginTop: 16 }]}>Language</Text>
                    {editMode ? (
                      <TextInput
                        value={language}
                        onChangeText={(v) => setLanguage(titleCase(v))}
                        style={s.inputBoxEditable}
                        placeholder="English / Afrikaans / isiZulu..."
                        placeholderTextColor="rgba(243,244,246,0.6)"
                      />
                    ) : (
                      <View style={s.inputBox}><Text style={s.inputText}>{language}</Text></View>
                    )}
                  </View>

                  {/* RIGHT COLUMN */}
                  <View style={s.rightCol}>
                    <Text style={s.label}>Subjects Selected</Text>
                    {editMode ? (
                      <Pressable onPress={openSubjectsModal} style={[s.inputBoxEditable, { height: 48, justifyContent: 'center' }]}>
                        <Text style={s.inputText}>
                          {subjects.length ? subjects.join(', ') : 'Select subjects'}
                        </Text>
                      </Pressable>
                    ) : (
                      <View style={s.subjectsBox}>
                        {subjects.length > 0 ? (
                          subjects.map((subj) => (
                            <Text key={subj} style={s.subjectItem}>{subj}</Text>
                          ))
                        ) : (
                          <Text style={s.subjectItem}>—</Text>
                        )}
                      </View>
                    )}

                    {!editMode && (
                      <>
                        <Pressable style={s.deactivateBtn} onPress={handleDeactivatePress}>
                          <Text style={s.deactivateText}>Delete / Deactivate Account</Text>
                        </Pressable>

                        <Pressable style={s.logoutBtn} onPress={handleLogout}>
                          <Text style={s.logoutText}>Log Out</Text>
                        </Pressable>
                      </>
                    )}
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>

          {/* =====================  MODALS  ===================== */}

          {/* Subjects multi-select (checkbox) */}
          <Modal transparent visible={showSubjectsModal} animationType="fade" onRequestClose={() => setShowSubjectsModal(false)}>
            <View style={s.modalBackdrop}>
              <View style={s.modalSheet}>
                <Text style={s.modalTitle}>Select your subjects</Text>
                <Text style={s.modalText}>
                  {Number(grade) >= 10 ? 'Choose your FET subjects (Gr 10–12)' : 'Choose your GET subjects (Gr 8–9)'}
                </Text>

                <ScrollView style={{ maxHeight: 360 }}>
                  {getSubjectOptions(curriculum, grade).map(name => {
                    const checked = tempSubjects.includes(name);
                    return (
                      <Pressable key={name} onPress={() => toggleTempSubject(name)} style={s.checkRow}>
                        <View style={[s.checkbox, checked && s.checkboxOn]} />
                        <Text style={s.checkText}>{name}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <View style={s.modalRow}>
                  <Pressable style={[s.modalBtn, s.modalBtnSecondary]} onPress={() => setShowSubjectsModal(false)}>
                    <Text style={s.modalBtnTextSecondary}>Cancel</Text>
                  </Pressable>
                  <Pressable style={[s.modalBtn, s.modalBtnPrimary]} onPress={applySubjectsModal}>
                    <Text style={s.modalBtnText}>Apply</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>

          {/* 1) Choose Delete or Deactivate */}
          <Modal transparent visible={showActionModal} animationType="fade" onRequestClose={() => setShowActionModal(false)}>
            <View style={s.modalBackdrop}>
              <View style={s.modalSheet}>
                <Text style={s.modalTitle}>Account options</Text>
                <Text style={s.modalText}>Would you like to delete your account or deactivate it?</Text>
                <View style={s.modalRow}>
                  <Pressable style={[s.modalBtn, s.modalBtnSecondary]} onPress={() => setShowActionModal(false)}>
                    <Text style={s.modalBtnTextSecondary}>Cancel</Text>
                  </Pressable>
                  <Pressable style={[s.modalBtn, s.modalBtnWarn]} onPress={() => handleChooseAction('deactivate')}>
                    <Text style={s.modalBtnText}>Deactivate</Text>
                  </Pressable>
                  <Pressable style={[s.modalBtn, s.modalBtnDanger]} onPress={() => handleChooseAction('delete')}>
                    <Text style={s.modalBtnText}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>

          {/* 2) Reason capture */}
          <Modal transparent visible={showReasonModal} animationType="fade" onRequestClose={() => setShowReasonModal(false)}>
            <View style={s.modalBackdrop}>
              <View style={s.modalSheet}>
                <Text style={s.modalTitle}>
                  {pendingAction === 'delete' ? 'Delete account' : 'Deactivate account'}
                </Text>
                <Text style={s.modalText}>Please tell us why (optional):</Text>
                <TextInput
                  value={reasonText}
                  onChangeText={setReasonText}
                  style={s.modalInput}
                  multiline
                  placeholder="Type your reason..."
                  placeholderTextColor="rgba(31,41,55,0.5)"
                />
                <View style={s.modalRow}>
                  <Pressable style={[s.modalBtn, s.modalBtnSecondary]} onPress={() => setShowReasonModal(false)}>
                    <Text style={s.modalBtnTextSecondary}>Cancel</Text>
                  </Pressable>
                  <Pressable style={[s.modalBtn, s.modalBtnPrimary]} onPress={proceedFromReason}>
                    <Text style={s.modalBtnText}>Continue</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>

          {/* 3) Final confirmation */}
          <Modal transparent visible={showConfirmModal} animationType="fade" onRequestClose={() => setShowConfirmModal(false)}>
            <View style={s.modalBackdrop}>
              <View style={s.modalSheet}>
                <Text style={s.modalTitle}>
                  {pendingAction === 'delete' ? 'Are you absolutely sure?' : 'Confirm deactivation'}
                </Text>
                {pendingAction === 'delete' ? (
                  <Text style={s.modalText}>
                    Deleting will permanently remove your data. This action cannot be undone.
                  </Text>
                ) : (
                  <Text style={s.modalText}>
                    You can log back in at any time to reactivate your account. Until then, your profile remains inactive.
                  </Text>
                )}
                <View style={s.modalRow}>
                  <Pressable disabled={busy} style={[s.modalBtn, s.modalBtnSecondary]} onPress={() => setShowConfirmModal(false)}>
                    <Text style={s.modalBtnTextSecondary}>Cancel</Text>
                  </Pressable>
                  {pendingAction === 'delete' ? (
                    <Pressable disabled={busy} style={[s.modalBtn, s.modalBtnDanger]} onPress={performDelete}>
                      <Text style={s.modalBtnText}>{busy ? 'Deleting…' : 'Delete'}</Text>
                    </Pressable>
                  ) : (
                    <Pressable disabled={busy} style={[s.modalBtn, s.modalBtnWarn]} onPress={performDeactivate}>
                      <Text style={s.modalBtnText}>{busy ? 'Updating…' : 'Proceed'}</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </View>
          </Modal>

          {/* =================== / MODALS =================== */}
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

  tabTextWrapper: { position: 'absolute', left: '4.5%', alignItems: 'center', zIndex: 5 },
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

  tab: { position: 'absolute', height: '100%', width: '100%', zIndex: 1 },

  card: { flex: 1, borderRadius: 40, overflow: 'hidden', position: 'relative', zIndex: 1 },
  cardInner: { flex: 1, borderRadius: 40, padding: 28, marginLeft: 210, marginRight: 14 },
  cardImage: { borderRadius: 40, resizeMode: 'cover' },

  swoosh: {
    position: 'absolute',
    top: 15,
    left: '8%',
    width: 380,
    height: 105,
    transform: [{ rotateZ: '-2deg' }],
    opacity: 0.9,
    zIndex: 2,
  },
  dot: { position: 'absolute', top: 10, left: 360, height: '7%', zIndex: 1, opacity: 0.95 },

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

  cornerLogo: { position: 'absolute', bottom: 40, left: -55, height: 130, opacity: 0.9, zIndex: 10 },

  // 🔵 Top-right pill area (matches other screens)
  topRightWrap: {
    position: 'absolute',
    top: 22,
    right: 26,
    zIndex: 7,
    width: 240,
  },
  row: {
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'flex-end',
    marginTop: 15,
  },
  pill: {
    flexGrow: 0,
    backgroundColor: '#2763F6',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradePill: { width: 110, height: 55 },
  pillMain: {
    color: '#FFFFFF',
    fontFamily: 'Antonio_700Bold',
    fontSize: 18,
    letterSpacing: 0.3,
    marginTop: 2,
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

  formRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 18,
  },
  leftCol: { flexShrink: 0, minWidth: 430 },
  rightCol: { flex: 1, minWidth: 300 },

  // Typography request: labels 18, text 16
  label: {
    color: '#FFFFFF',
    fontFamily: 'AlumniSans_500Medium',
    fontSize: 18,
    marginBottom: 6,
  },

  // Read-only box
  inputBox: {
    height: 44,
    borderRadius: 12,
    backgroundColor: 'none',
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAB308',
    shadowColor: '#0B1220',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  inputText: {
    color: '#F3F4F6',
    fontFamily: 'Antonio_700Bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },

  // Editable input (matches box style)
  inputBoxEditable: {
    height: 44,
    borderRadius: 12,
    backgroundColor: 'none',
    paddingHorizontal: 16,
    color: '#F3F4F6',
    fontFamily: 'Antonio_700Bold',
    fontSize: 16,
    letterSpacing: 0.5,
    borderWidth: 1,
    borderColor: '#EAB308',
    shadowColor: '#0B1220',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

  subjectsBox: {
    minHeight: 140,
    borderRadius: 12,
    backgroundColor: 'none',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#EAB308',
    shadowColor: '#0B1220',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  subjectItem: {
    color: '#F3F4F6',
    fontFamily: 'Antonio_700Bold',
    fontSize: 16,
    letterSpacing: 0.5,
    lineHeight: 30,
  },

  deactivateBtn: {
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(148,163,184,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  deactivateText: {
    color: '#F3F4F6',
    fontFamily: 'Antonio_700Bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },

  logoutBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFD247',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  logoutText: {
    color: '#1F2937',
    fontFamily: 'Antonio_700Bold',
    fontSize: 16,
  },

  // ===== Modals =====
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalSheet: {
    width: '100%',
    maxWidth: 560,
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#0B1220',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  modalTitle: {
    fontFamily: 'Antonio_700Bold',
    fontSize: 22,
    color: '#1F2937',
    marginBottom: 8,
  },
  modalText: {
    fontFamily: 'AlumniSans_500Medium',
    fontSize: 16,
    color: '#374151',
    marginBottom: 12,
  },
  modalInput: {
    minHeight: 110,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: 'AlumniSans_500Medium',
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  modalBtn: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnPrimary: { backgroundColor: '#2763F6' },
  modalBtnWarn:    { backgroundColor: '#3B82F6' },
  modalBtnDanger:  { backgroundColor: '#EF4444' },
  modalBtnSecondary: { backgroundColor: '#E5E7EB' },
  modalBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Antonio_700Bold',
    fontSize: 16,
  },
  modalBtnTextSecondary: {
    color: '#1F2937',
    fontFamily: 'Antonio_700Bold',
    fontSize: 16,
  },

  // Checkbox row (subjects modal)
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  checkbox: {
    width: 24, height: 24, borderRadius: 6,
    backgroundColor: 'rgba(31,41,55,0.08)',
    borderWidth: 2, borderColor: 'rgba(31,41,55,0.35)',
    marginRight: 10,
  },
  checkboxOn: { backgroundColor: '#EAB308', borderColor: '#EAB308' },
  checkText: {
    fontFamily: 'Antonio_700Bold',
    fontSize: 16,
    color: '#1F2937',
  },
});
