import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../theme/colors';
import {requestSmsPermission} from '../services/SmsService';

const WelcomeScreen = ({onComplete}) => {
  const [isChecking, setIsChecking] = useState(true);

  // Check if permissions are already granted on mount
  useEffect(() => {
    const checkPermissions = async () => {
      if (Platform.OS === 'android') {
        try {
          const receiveGranted = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
          );
          const readGranted = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.READ_SMS,
          );

          if (receiveGranted && readGranted) {
            // Already have permissions, skip welcome screen
            onComplete();
            return;
          }
        } catch (error) {
          console.error('Error checking permissions:', error);
        }
      }
      setIsChecking(false);
    };

    checkPermissions();
  }, [onComplete]);

  const handleGrantPermission = async () => {
    const {granted} = await requestSmsPermission();
    // Proceed regardless of whether they granted or denied,
    // since the app can function in manual mode.
    onComplete();
  };

  const handleSkip = () => {
    // Proceed without requesting
    onComplete();
  };

  if (isChecking) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Icon name="message-text-outline" size={80} color={colors.primary} />
        </View>
        
        <Text style={styles.title}>Welcome to{'\n'}UPI Tracker</Text>
        
        <Text style={styles.description}>
          To automatically track your UPI expenses, this app needs access to read incoming SMS messages from your bank.
        </Text>
        
        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <Icon name="check-circle" size={24} color={colors.accent} />
            <Text style={styles.featureText}>Auto-detect UPI payments</Text>
          </View>
          <View style={styles.featureItem}>
            <Icon name="shield-check" size={24} color={colors.accent} />
            <Text style={styles.featureText}>Everything stays on your device</Text>
          </View>
          <View style={styles.featureItem}>
            <Icon name="pencil-outline" size={24} color={colors.accent} />
            <Text style={styles.featureText}>Manual tracking also available</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={handleGrantPermission}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Grant SMS Access & Start</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.secondaryButton} 
          onPress={handleSkip}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonText}>Skip (Manual Mode Only)</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 40,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  featureList: {
    width: '100%',
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  footer: {
    padding: 30,
    paddingBottom: Platform.OS === 'ios' ? 10 : 30,
    gap: 15,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
});

export default WelcomeScreen;
