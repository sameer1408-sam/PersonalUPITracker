/**
 * MINIMAL TEST BUILD - Finding crash source
 * Zero custom imports, zero native modules
 */

import React from 'react';
import {View, Text, StyleSheet, SafeAreaView, StatusBar} from 'react-native';

const App = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F1A" />
      <View style={styles.center}>
        <Text style={styles.title}>UPI Tracker</Text>
        <Text style={styles.subtitle}>App loaded successfully!</Text>
        <Text style={styles.info}>If you can see this, the app is working.</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1A',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#4ADE80',
    marginBottom: 20,
  },
  info: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
  },
});

export default App;
