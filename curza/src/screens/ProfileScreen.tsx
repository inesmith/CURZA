// src/screens/ProfileSettingsScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
export default function ProfileSettingsScreen() {
  return (
    <View style={s.page}>
      <Text style={s.title}>Profile & Settings</Text>
      <Text style={s.sub}>Manage profile, language, subjects, and centre mode.</Text>
    </View>
  );
}
const s = StyleSheet.create({
  page:{ flex:1, backgroundColor:'#0B1220', alignItems:'center', justifyContent:'center', padding:24 },
  title:{ color:'#F3F4F6', fontSize:32, fontFamily:'Antonio_700Bold', marginBottom:8 },
  sub:{ color:'#CBD5E1', fontSize:16, textAlign:'center' },
});
