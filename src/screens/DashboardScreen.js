/**
 * DashboardScreen — Main screen with summary, transactions, FAB, and SMS integration
 *
 * Features:
 * - Daily summary card at top
 * - Transaction list with pull-to-refresh
 * - Floating action button for manual add
 * - SMS listener integration with queued modals
 * - Permission status indicator
 */

import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DailySummaryCard from '../components/DailySummaryCard';
import TransactionList from '../components/TransactionList';
import CategoryModal from '../components/CategoryModal';
import AddManualModal from '../components/AddManualModal';
import {
  initDB,
  insertTransaction,
  getTodayTransactions,
  getTodayTotal,
  deleteTransaction,
  getTodayDate,
} from '../services/Database';
import {requestSmsPermission, startSmsListener} from '../services/SmsService';
import colors from '../theme/colors';

const DashboardScreen = () => {
  // Data state
  const [transactions, setTransactions] = useState([]);
  const [todayTotal, setTodayTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Modal state
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState(null);

  // SMS queue — prevents multiple modals
  const smsQueueRef = useRef([]);
  const isProcessingRef = useRef(false);

  // Permission state
  const [smsPermission, setSmsPermission] = useState(null); // null = checking, true/false

  /**
   * Load transactions from database
   */
  const loadData = useCallback(() => {
    try {
      const txns = getTodayTransactions();
      const total = getTodayTotal();
      setTransactions(txns);
      setTodayTotal(total);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }, []);

  /**
   * Pull-to-refresh handler
   */
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  }, [loadData]);

  /**
   * Process next item in SMS queue
   */
  const processQueue = useCallback(() => {
    if (isProcessingRef.current || smsQueueRef.current.length === 0) {
      return;
    }

    isProcessingRef.current = true;
    const next = smsQueueRef.current.shift();
    setPendingTransaction(next);
    setCategoryModalVisible(true);
  }, []);

  /**
   * Handle incoming UPI SMS transaction
   */
  const handleSmsTransaction = useCallback(
    ({amount, smsHash, suggestedCategory}) => {
      // Queue the transaction
      smsQueueRef.current.push({amount, smsHash, suggestedCategory});
      // Try processing immediately
      processQueue();
    },
    [processQueue],
  );

  /**
   * Initialize app: database, permissions, SMS listener
   */
  useEffect(() => {
    // Init database
    try {
      initDB();
    } catch (error) {
      console.error('Database init failed:', error);
    }

    // Load initial data
    loadData();

    // Request SMS permission and start listener
    let smsCleanup = null;

    (async () => {
      const {granted, neverAskAgain} = await requestSmsPermission();
      setSmsPermission(granted);

      if (granted) {
        smsCleanup = startSmsListener(handleSmsTransaction);
      } else if (neverAskAgain) {
        // User permanently denied — show info
        console.log('SMS permission permanently denied. Manual mode only.');
      }
    })();

    return () => {
      if (smsCleanup) {
        smsCleanup();
      }
    };
  }, [loadData, handleSmsTransaction]);

  /**
   * Save category from SMS prompt modal
   */
  const handleCategorySave = useCallback(
    (category) => {
      if (pendingTransaction) {
        const {amount, smsHash} = pendingTransaction;
        const today = getTodayDate();
        insertTransaction(amount, category, today, smsHash);
        loadData();
      }

      setCategoryModalVisible(false);
      setPendingTransaction(null);
      isProcessingRef.current = false;

      // Process next in queue (with slight delay for animation)
      setTimeout(() => processQueue(), 300);
    },
    [pendingTransaction, loadData, processQueue],
  );

  /**
   * Dismiss SMS prompt modal
   */
  const handleCategoryDismiss = useCallback(() => {
    setCategoryModalVisible(false);
    setPendingTransaction(null);
    isProcessingRef.current = false;

    // Process next in queue
    setTimeout(() => processQueue(), 300);
  }, [processQueue]);

  /**
   * Save manual transaction
   */
  const handleManualSave = useCallback(
    (amount, category) => {
      const today = getTodayDate();
      insertTransaction(amount, category, today, null);
      setAddModalVisible(false);
      loadData();
    },
    [loadData],
  );

  /**
   * Delete a transaction
   */
  const handleDelete = useCallback(
    (id) => {
      Alert.alert(
        'Delete Transaction',
        'Are you sure you want to remove this transaction?',
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              deleteTransaction(id);
              loadData();
            },
          },
        ],
      );
    },
    [loadData],
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.background}
        translucent={false}
      />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>UPI Tracker</Text>
          <Text style={styles.subtitle}>Personal Expense Tracker</Text>
        </View>
        <View style={styles.headerRight}>
          {/* SMS Permission indicator */}
          <View style={[
            styles.statusBadge,
            smsPermission ? styles.statusActive : styles.statusInactive,
          ]}>
            <Icon
              name={smsPermission ? 'message-text-outline' : 'message-off-outline'}
              size={14}
              color={smsPermission ? colors.accent : colors.textMuted}
            />
            <Text style={[
              styles.statusText,
              {color: smsPermission ? colors.accent : colors.textMuted},
            ]}>
              {smsPermission === null ? '...' : smsPermission ? 'Auto' : 'Manual'}
            </Text>
          </View>
        </View>
      </View>

      {/* Summary Card */}
      <DailySummaryCard
        total={todayTotal}
        transactionCount={transactions.length}
      />

      {/* Transaction List */}
      <TransactionList
        transactions={transactions}
        onDelete={handleDelete}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      {/* FAB — Add Manual Transaction */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setAddModalVisible(true)}
        activeOpacity={0.8}>
        <Icon name="plus" size={28} color={colors.white} />
      </TouchableOpacity>

      {/* Category Modal (SMS prompt) */}
      <CategoryModal
        visible={categoryModalVisible}
        amount={pendingTransaction?.amount}
        suggestedCategory={pendingTransaction?.suggestedCategory}
        onSave={handleCategorySave}
        onDismiss={handleCategoryDismiss}
      />

      {/* Add Manual Modal */}
      <AddManualModal
        visible={addModalVisible}
        onSave={handleManualSave}
        onDismiss={() => setAddModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  appName: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  statusActive: {
    backgroundColor: colors.accent + '15',
  },
  statusInactive: {
    backgroundColor: colors.surfaceLight,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});

export default DashboardScreen;
