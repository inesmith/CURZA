// App.tsx
import 'react-native-gesture-handler';
import { useCallback, useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Antonio_700Bold } from '@expo-google-fonts/antonio';
import { useFonts as useAlumniFonts, AlumniSans_500Medium } from '@expo-google-fonts/alumni-sans';

import SignUpScreen from './src/screens/SignUpScreen';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ResultDetailScreen from './src/screens/ResultDetailScreen';
import TestRunnerScreen from './src/screens/TestRunnerScreen';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// feature screens
import SummariesScreen from './src/screens/SummariesScreen';
import PracticeTestsScreen from './src/screens/PractiseScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import ProfileSettingsScreen from './src/screens/ProfileScreen';

// NEW
import { AuthProvider, useAuth } from './src/contexts/AuthProvider';
import { NoticeProvider } from './src/contexts/NoticeProvider';

// Call once at module load
SplashScreen.preventAutoHideAsync();

// ---- Shared type used by Results and the Detail screen ----
export type ResultRow = {
  id: string;
  paper: string;
  date: string;
  score: string;
  showArrow?: boolean;
};

// ---- Stack param list (add typed ResultDetail params here) ----
export type RootStackParamList = {
  SignUp: undefined;
  Login: undefined;
  Dashboard: undefined;
  Summaries: undefined;
  PracticeTests: undefined;
  Results: undefined;
  ProfileSettings: undefined;
  ResultDetail: { result: ResultRow };
  TestRunner: {
    mode: 'section' | 'full';
    title: string;
    subject: string;
    totalMarks: number;
    timed?: boolean;
    durationSec?: number;
    // section-specific
    topic?: string;
    count?: number;
    // full-exam-specific
    examType?: string;
    grade?: string | number;
  };
};

// Type the stack with RootStackParamList
const Stack = createStackNavigator<RootStackParamList>();

// ---- Signed-out stack ----
function SignedOutStack() {
  return (
    <Stack.Navigator
      initialRouteName="SignUp"
      screenOptions={{ headerShown: false, animation: 'fade' }}
    >
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

// ---- Signed-in stack ----
function SignedInStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="Summaries" component={SummariesScreen} />
      <Stack.Screen name="PracticeTests" component={PracticeTestsScreen} />
      <Stack.Screen name="Results" component={ResultsScreen} />
      <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} />
      <Stack.Screen name="ResultDetail" component={ResultDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="TestRunner" component={TestRunnerScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

// ---- Gate by auth state ----
function RootNav() {
  const { user, loading } = useAuth();
  if (loading) return null; // keep splash until auth ready
  return user ? <SignedInStack /> : <SignedOutStack />;
}

// ---- App ----
export default function App() {
  // fonts + splash (unchanged)
  const [fontsALoaded] = useFonts({ Antonio_700Bold });
  const [fontsBLoaded] = useAlumniFonts({ AlumniSans_500Medium });
  const [showApp, setShowApp] = useState(false);

  const onReady = useCallback(async () => {
    if (fontsALoaded && fontsBLoaded) {
      await SplashScreen.hideAsync();
      setTimeout(() => setShowApp(true), 1200);
    }
  }, [fontsALoaded, fontsBLoaded]);

  if (!(fontsALoaded && fontsBLoaded)) return null;

  if (!showApp) {
    return (
      <View style={styles.splash} onLayout={onReady}>
        <Image
          source={require('./assets/curza-logo.png')}
          style={styles.icon}
          resizeMode="contain"
        />
        <Text style={styles.title}>CURZA</Text>
      </View>
    );
  }

  return (
    <AuthProvider>
      <NoticeProvider>
        <NavigationContainer>
          <RootNav />
        </NavigationContainer>
      </NoticeProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 160,
    height: 160,
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Antonio_700Bold',
    fontSize: 48,
    letterSpacing: 2,
    color: '#E5E7EB',
  },
});
