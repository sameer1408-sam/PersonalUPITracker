/**
 * AddManualModal — Manually add a transaction (amount + category)
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

const AddManualModal = ({visible, onSave, onDismiss}) => {
  const [amountText, setAmountText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [customCategory, setCustomCategory] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [errors, setErrors] = useState({});
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      setAmountText('');
      setSelectedCategory(null);
      setCustomCategory('');
      setUseCustom(false);
      setErrors({});

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
  }, [visible, fadeAnim, slideAnim]);

  const handleChipPress = (name) => {
    setSelectedCategory(name);
    setUseCustom(false);
    setErrors((prev) => ({...prev, category: ''}));
  };

  const handleSave = () => {
    const newErrors = {};

    // Validate amount
    const cleaned = amountText.replace(/,/g, '');
    const amount = parseFloat(cleaned);
    if (!cleaned || isNaN(amount) || amount <= 0) {
      newErrors.amount = 'Enter a valid amount';
    }

    // Validate category
    let finalCategory = '';
    if (useCustom) {
      finalCategory = customCategory.trim();
    } else if (selectedCategory) {
      finalCategory = selectedCategory;
    }
    if (!finalCategory) {
      newErrors.category = 'Select or type a category';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    Keyboard.dismiss();
    onSave?.(amount, finalCategory);
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
            style={[styles.modal, {transform: [{translateY: slideAnim}]}]}>
            {/* Handle */}
            <View style={styles.header}>
              <View style={styles.handleBar} />
              <View style={styles.titleRow}>
                <Icon name="plus-circle" size={22} color={colors.primary} />
                <Text style={styles.title}>Add Transaction</Text>
              </View>
            </View>

            {/* Amount Input */}
            <View style={styles.field}>
              <Text style={styles.label}>Amount</Text>
              <View style={[
                styles.amountInputWrapper,
                errors.amount && styles.inputError,
              ]}>
                <Text style={styles.currencyPrefix}>₹</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  value={amountText}
                  onChangeText={(text) => {
                    // Allow only numbers, commas, and one dot
                    const filtered = text.replace(/[^0-9.,]/g, '');
                    setAmountText(filtered);
                    setErrors((prev) => ({...prev, amount: ''}));
                  }}
                  keyboardType="numeric"
                  returnKeyType="next"
                />
              </View>
              {errors.amount ? (
                <Text style={styles.errorText}>{errors.amount}</Text>
              ) : null}
            </View>

            {/* Category Chips */}
            <View style={styles.field}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.chipsContainer}>
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.name && !useCustom;
                  const chipColor = CATEGORY_COLORS[cat.name];
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
                        size={16}
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
              <TextInput
                style={[styles.customInput, useCustom && styles.customInputActive]}
                placeholder="Or type a custom category..."
                placeholderTextColor={colors.textMuted}
                value={customCategory}
                onChangeText={(text) => {
                  setCustomCategory(text);
                  if (!useCustom) {
                    setSelectedCategory(null);
                    setUseCustom(true);
                  }
                  setErrors((prev) => ({...prev, category: ''}));
                }}
                onFocus={() => {
                  setSelectedCategory(null);
                  setUseCustom(true);
                }}
                maxLength={50}
              />
              {errors.category ? (
                <Text style={styles.errorText}>{errors.category}</Text>
              ) : null}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={handleDismiss}
                activeOpacity={0.7}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSave}
                activeOpacity={0.7}>
                <Icon name="check" size={18} color={colors.white} />
                <Text style={styles.saveText}>Add</Text>
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
    paddingBottom: 12,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderLight,
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingHorizontal: 14,
  },
  inputError: {
    borderColor: colors.danger,
  },
  currencyPrefix: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.accent,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    height: 52,
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 5,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  customInput: {
    height: 44,
    backgroundColor: colors.surfaceLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  customInputActive: {
    borderColor: colors.primary,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 4,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: {
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
  saveText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
});

export default AddManualModal;
