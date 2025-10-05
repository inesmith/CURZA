import 'react-native-gesture-handler';
import { useCallback } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Antonio_700Bold } from '@expo-google-fonts/antonio';

// Keep native splash on until we finish loading
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({ Antonio_700Bold });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null; // native splash still shown

  return (
    <View style={styles.splash} onLayout={onLayoutRootView}>
      <Image
        source={require('./assets/curza-logo.png')}
        style={styles.icon}
        resizeMode="contain"
      />
      <Text style={styles.title}>CURZA</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#1F2937', // your exact color
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 160,   // tweak for tablet
    height: 160,
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Antonio_700Bold',
    fontSize: 48, // looks great on iPad
    letterSpacing: 2,
    color: '#E5E7EB' // light grey against #1F2937
  },
});
