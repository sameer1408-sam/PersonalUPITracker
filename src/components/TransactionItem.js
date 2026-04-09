/**
 * TransactionItem — Single transaction row with category icon, amount, and delete
 */

import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../theme/colors';

// Category → icon + color mapping
const CATEGORY_CONFIG = {
  Food: {icon: 'food', color: colors.categoryFood},
  Transport: {icon: 'bus', color: colors.categoryTransport},
  Shopping: {icon: 'shopping', color: colors.categoryShopping},
  Bills: {icon: 'file-document-outline', color: colors.categoryBills},
  Health: {icon: 'hospital-box-outline', color: colors.categoryHealth},
  Other: {icon: 'dots-horizontal-circle-outline', color: colors.categoryOther},
};

const TransactionItem = ({transaction, onDelete}) => {
  const {id, amount, category, created_at} = transaction;

  // Get config for category (fallback to Other)
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.Other;

  // Format time from created_at
  const formatTime = (dateStr) => {
    try {
      if (!dateStr) {
        return '';
      }
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return '';
      }
      const hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes} ${ampm}`;
    } catch {
      return '';
    }
  };

  const formattedAmount = amount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  const timeStr = formatTime(created_at);

  return (
    <View style={styles.container}>
      {/* Category Icon */}
      <View style={[styles.iconContainer, {backgroundColor: config.color + '20'}]}>
        <Icon name={config.icon} size={22} color={config.color} />
      </View>

      {/* Category & Time */}
      <View style={styles.info}>
        <Text style={styles.category} numberOfLines={1}>
          {category}
        </Text>
        {timeStr ? (
          <Text style={styles.time}>{timeStr}</Text>
        ) : null}
      </View>

      {/* Amount */}
      <View style={styles.amountContainer}>
        <Text style={styles.amount}>- ₹{formattedAmount}</Text>
      </View>

      {/* Delete Button */}
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => onDelete?.(id)}
        hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
        <Icon name="close-circle-outline" size={20} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  category: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  time: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  amountContainer: {
    marginRight: 8,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.danger,
  },
  deleteBtn: {
    padding: 4,
  },
});

export default TransactionItem;
