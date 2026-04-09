/**
 * DailySummaryCard — Shows total spent today with a modern gradient card
 */

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../theme/colors';

const DailySummaryCard = ({total = 0, transactionCount = 0}) => {
  const formattedTotal = total.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return (
    <View style={styles.card}>
      <View style={styles.cardInner}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.iconContainer}>
            <Icon name="wallet-outline" size={22} color={colors.accent} />
          </View>
          <Text style={styles.headerText}>Today's Spending</Text>
        </View>

        {/* Amount */}
        <View style={styles.amountRow}>
          <Text style={styles.currencySymbol}>₹</Text>
          <Text style={styles.amountText}>{formattedTotal}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footerRow}>
          <Icon name="receipt" size={14} color={colors.textSecondary} />
          <Text style={styles.footerText}>
            {transactionCount} transaction{transactionCount !== 1 ? 's' : ''} today
          </Text>
        </View>

        {/* Decorative accent line */}
        <View style={styles.accentLine} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardInner: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: '300',
    color: colors.accent,
    marginRight: 4,
  },
  amountText: {
    fontSize: 42,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -1,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  accentLine: {
    position: 'absolute',
    bottom: 0,
    left: 24,
    right: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.accent,
    opacity: 0.4,
  },
});

export default DailySummaryCard;
