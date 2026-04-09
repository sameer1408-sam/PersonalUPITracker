/**
 * TransactionList — FlatList of transactions with empty state
 */

import React from 'react';
import {View, Text, FlatList, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import TransactionItem from './TransactionItem';
import colors from '../theme/colors';

const EmptyState = () => (
  <View style={styles.emptyContainer}>
    <View style={styles.emptyIconContainer}>
      <Icon name="receipt" size={48} color={colors.textMuted} />
    </View>
    <Text style={styles.emptyTitle}>No transactions yet</Text>
    <Text style={styles.emptySubtitle}>
      UPI transactions will appear here automatically,{'\n'}
      or tap + to add one manually.
    </Text>
  </View>
);

const TransactionList = ({transactions = [], onDelete, onRefresh, refreshing}) => {
  const renderItem = ({item}) => (
    <TransactionItem transaction={item} onDelete={onDelete} />
  );

  const keyExtractor = (item) => String(item.id);

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Icon name="history" size={18} color={colors.textSecondary} />
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{transactions.length}</Text>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={transactions}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListEmptyComponent={EmptyState}
        contentContainerStyle={
          transactions.length === 0 ? styles.emptyList : styles.listContent
        }
        showsVerticalScrollIndicator={false}
        onRefresh={onRefresh}
        refreshing={refreshing || false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    flex: 1,
  },
  badge: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default TransactionList;
