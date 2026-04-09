/**
 * CategoryModal — Prompt user to categorize a UPI transaction
 *
 * Features:
 * - "Why did you spend ₹{amount}?" prompt
 * - Quick-select category chips with icons
 * - Auto-suggestion pre-selects a chip if matched
 * - Custom text input (max 50 chars)
 * - Input validation (required, non-empty)
 * - Does NOT allow multiple modals — controlled by parent queue
 */

import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Animated,
  Keyboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../theme/colors';

const CATEGORIES = [
  {name: 'Food', icon: 'food'},
  {name: 'Transport', icon: 'bus'},
  {name: 'Shopping', icon: 'shopping'},
  {name: 'Bills', icon: 'file-document-outline'},
  {name: 'Health', icon: 'hospital-box-outline'},
  {name: 'Other', icon: 'dots-horizontal-circle-outline'},
];

const CATEGORY_COLORS = {
  Food: colors.categoryFood,
  Transport: colors.categoryTransport,
  Shopping: colors.categoryShopping,
  Bills: colors.categoryBills,
  Health: colors.categoryHealth,
  Other: colors.categoryOther,
};

const MAX_CUSTOM_LENGTH = 50;

const CategoryModal = ({
  visible,
  amount,
  suggestedCategory,
  onSave,
  onDismiss,
}) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [customCategory, setCustomCategory] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [error, setError] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      // Auto-select suggestion if available
      if (suggestedCategory && CATEGORIES.some(c => c.name === suggestedCategory)) {
        setSelectedCategory(suggestedCategory);
        setUseCustom(false);
      } else {
        setSelectedCategory(null);
      }
      setCustomCategory('');
      setUseCustom(false);
      setError('');

      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }, [visible, suggestedCategory, fadeAnim, slideAnim]);

  const formattedAmount = (amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  const handleChipPress = (categoryName) => {
    setSelectedCategory(categoryName);
    setUseCustom(false);
    setError('');
    Keyboard.dismiss();
  };

  const handleCustomFocus = () => {
    setSelectedCategory(null);
    setUseCustom(true);
    setError('');
  };

  const handleSave = () => {
    let finalCategory = '';

    if (useCustom) {
      finalCategory = customCategory.trim();
    } else if (selectedCategory) {
      finalCategory = selectedCategory;
    }

    // Validation
    if (!finalCategory) {
      setError('Please select or type a category');
      return;
    }

    if (finalCategory.length > MAX_CUSTOM_LENGTH) {
      setError(`Category must be under ${MAX_CUSTOM_LENGTH} characters`);
      return;
    }

    onSave?.(finalCategory);
  };

  const handleDismiss = () => {
    Keyboard.dismiss();
    onDismiss?.();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleDismiss}>
      <KeyboardAvoidingView style={styles.overlay} behavior="padding">
        <Animated.View style={[styles.overlay, {opacity: fadeAnim}]}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={handleDismiss}
          />
          <Animated.View
            style={[
              styles.modal,
              {transform: [{translateY: slideAnim}]},
            ]}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.handleBar} />
              <View style={styles.amountBadge}>
                <Icon name="cash-minus" size={20} color={colors.danger} />
                <Text style={styles.amountBadgeText}>₹{formattedAmount}</Text>
              </View>
              <Text style={styles.title}>Why did you spend this?</Text>
              {suggestedCategory && (
                <View style={styles.suggestionRow}>
                  <Icon name="lightbulb-outline" size={14} color={colors.warning} />
                  <Text style={styles.suggestionText}>
                    Auto-detected: {suggestedCategory}
                  </Text>
                </View>
              )}
            </View>

            {/* Category Chips */}
            <View style={styles.chipsContainer}>
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.name && !useCustom;
                const chipColor = CATEGORY_COLORS[cat.name] || colors.textSecondary;

                return (
                  <TouchableOpacity
                    key={cat.name}
                    style={[
                      styles.chip,
                      isSelected && {
                        backgroundColor: chipColor + '25',
                        borderColor: chipColor,
                      },
                    ]}
                    onPress={() => handleChipPress(cat.name)}
                    activeOpacity={0.7}>
                    <Icon
                      name={cat.icon}
                      size={18}
                      color={isSelected ? chipColor : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && {color: chipColor, fontWeight: '700'},
                      ]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom Input */}
            <View style={styles.customInputContainer}>
              <Text style={styles.orText}>or type your own</Text>
              <View style={[
                styles.inputWrapper,
                useCustom && styles.inputWrapperActive,
              ]}>
                <Icon
                  name="pencil-outline"
                  size={18}
                  color={useCustom ? colors.primary : colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Coffee, Gift, Groceries..."
                  placeholderTextColor={colors.textMuted}
                  value={customCategory}
                  onChangeText={(text) => {
                    setCustomCategory(text);
                    if (!useCustom) {
                      handleCustomFocus();
                    }
                    setError('');
                  }}
                  onFocus={handleCustomFocus}
                  maxLength={MAX_CUSTOM_LENGTH}
                  returnKeyType="done"
                  onSubmitEditing={handleSave}
                />
                {customCategory.length > 0 && (
                  <Text style={styles.charCount}>
                    {customCategory.length}/{MAX_CUSTOM_LENGTH}
                  </Text>
                )}
              </View>
            </View>

            {/* Error */}
            {error ? (
              <View style={styles.errorContainer}>
                <Icon name="alert-circle-outline" size={14} color={colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.dismissBtn}
                onPress={handleDismiss}
                activeOpacity={0.7}>
                <Text style={styles.dismissText}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  (!selectedCategory && !customCategory.trim()) && styles.saveBtnDisabled,
                ]}
                onPress={handleSave}
                activeOpacity={0.7}>
                <Icon name="check" size={18} color={colors.white} />
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  modal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 32,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.border,
  },
  header: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 16,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderLight,
    marginBottom: 20,
  },
  amountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.danger + '15',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    marginBottom: 12,
  },
  amountBadgeText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.danger,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  suggestionText: {
    fontSize: 12,
    color: colors.warning,
    fontWeight: '500',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 6,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  customInputContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  orText: {
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingHorizontal: 12,
  },
  inputWrapperActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: colors.text,
  },
  charCount: {
    fontSize: 11,
    color: colors.textMuted,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  dismissBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dismissText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  saveBtn: {
    flex: 2,
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    gap: 6,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
});

export default CategoryModal;
