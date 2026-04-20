/**
 * SMS Service — Permission handling, SMS event listening, and queue management
 *
 * Features:
 * - Checks and requests RECEIVE_SMS permission
 * - Graceful degradation on permission denial (manual-only mode)
 * - Subscribes to native SmsListenerModule events
 * - Filters with strict UPI validation
 * - Prevents duplicate processing via smsHash
 * - Queues incoming transactions to avoid modal overlap
 */

import {NativeModules, NativeEventEmitter, PermissionsAndroid, Platform} from 'react-native';
import {isUpiTransaction, extractAmount, generateSmsHash, suggestCategory} from './SmsParser';
import {isDuplicate} from './Database';

const {SmsListenerModule} = NativeModules;

/**
 * Check if SMS permissions are already granted
 * @returns {Promise<boolean>}
 */
export async function checkSmsPermission() {
  if (Platform.OS !== 'android') return false;
  
  const receiveGranted = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
  );
  const readGranted = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.READ_SMS,
  );
  
  return receiveGranted && readGranted;
}

/**
 * Request SMS permissions from the user
 * @returns {Promise<{granted: boolean, neverAskAgain: boolean}>}
 */
export async function requestSmsPermission() {
  if (Platform.OS !== 'android') {
    return {granted: false, neverAskAgain: false};
  }

  try {
    // Check if already granted
    const receiveGranted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
    );
    const readGranted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.READ_SMS,
    );

    if (receiveGranted && readGranted) {
      return {granted: true, neverAskAgain: false};
    }

    // Request permissions
    const result = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
      PermissionsAndroid.PERMISSIONS.READ_SMS,
    ]);

    const receiveResult = result[PermissionsAndroid.PERMISSIONS.RECEIVE_SMS];
    const readResult = result[PermissionsAndroid.PERMISSIONS.READ_SMS];

    if (
      receiveResult === PermissionsAndroid.RESULTS.GRANTED &&
      readResult === PermissionsAndroid.RESULTS.GRANTED
    ) {
      return {granted: true, neverAskAgain: false};
    }

    if (
      receiveResult === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN ||
      readResult === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
    ) {
      return {granted: false, neverAskAgain: true};
    }

    return {granted: false, neverAskAgain: false};
  } catch (error) {
    console.error('Permission request error:', error);
    return {granted: false, neverAskAgain: false};
  }
}

/**
 * Start listening for UPI SMS events
 *
 * @param {function} onTransaction - Callback: ({amount, smsHash, suggestedCategory}) => void
 * @returns {function|null} - Cleanup function to stop listening, or null if not started
 */
export function startSmsListener(onTransaction) {
  if (Platform.OS !== 'android' || !SmsListenerModule) {
    console.warn('SMS Listener not available on this platform');
    return null;
  }

  let smsEmitter;
  try {
    smsEmitter = new NativeEventEmitter(SmsListenerModule);
  } catch (error) {
    console.error('Failed to create SMS event emitter:', error);
    return null;
  }

  const subscription = smsEmitter.addListener('onSMSReceived', (event) => {
    try {
      const {sender, body} = event;

      if (!body) {
        return;
      }

      // Strict UPI validation
      if (!isUpiTransaction(body)) {
        return;
      }

      // Extract and validate amount
      const amount = extractAmount(body);
      if (amount === null) {
        return;
      }

      // Generate hash for dedup
      const smsHash = generateSmsHash(sender, body);

      // Check for duplicate in database
      if (isDuplicate(smsHash)) {
        console.log('Duplicate SMS detected, skipping:', smsHash);
        return;
      }

      // Auto-suggest category
      const suggested = suggestCategory(body);

      // Invoke callback with transaction data
      onTransaction({
        amount,
        smsHash,
        suggestedCategory: suggested,
      });
    } catch (error) {
      // Never crash on invalid SMS
      console.error('SMS processing error:', error);
    }
  });

  // Return cleanup function
  return () => {
    subscription.remove();
  };
}
