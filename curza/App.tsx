import 'react-native-gesture-handler';
import { useCallback, useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Antonio_700Bold } from '@expo-google-fonts/antonio';
import { useFonts as useAlumniFonts, AlumniSans_500Medium } from '@expo-google-fonts/alumni-sans';

import SignUpScreen from './src/screens/SignUpScreen';
import LoginScreen from './src/screens/LoginScreen';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Call once at module load
SplashScreen.preventAutoHideAsync();

const Stack = createStackNavigator();

function MainNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="SignUp"
        screenOptions={{
          headerShown: false, // your screens already have custom headers
          animation: 'fade',
        }}
      >
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  // Load fonts (expo-google-fonts)
  const [fontsALoaded] = useFonts({ Antonio_700Bold });
  const [fontsBLoaded] = useAlumniFonts({ AlumniSans_500Medium });

  const [showApp, setShowApp] = useState(false);

  const onReady = useCallback(async () => {
    if (fontsALoaded && fontsBLoaded) {
      await SplashScreen.hideAsync();
      // Short delay so your custom splash is visible and feels intentional
      setTimeout(() => setShowApp(true), 1200);
    }
  }, [fontsALoaded, fontsBLoaded]);

  // Block render until fonts are ready
  if (!(fontsALoaded && fontsBLoaded)) return null;

  // Show custom splash until onReady flips showApp
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

  // Main app after splash
  return <MainNavigator />;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { width: 160, height: 160, marginBottom: 16 },
  title: {
    fontFamily: 'Antonio_700Bold',
    fontSize: 48,
    letterSpacing: 2,
    color: '#E5E7EB',
  },
});
