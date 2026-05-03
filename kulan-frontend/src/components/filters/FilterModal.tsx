import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { FilterButtonGroup } from '@/components/filters/FilterButtonGroup';
import { FilterChip } from '@/components/filters/FilterChip';
import { FilterSection } from '@/components/filters/FilterSection';

export type ExploreFilters = {
  quickPick: 'Trending now' | 'Starting soon' | null;
  date: 'Any time' | 'Upcoming' | 'Today' | 'Tomorrow' | 'This weekend' | 'Next week';
  type: 'Any' | 'Online' | 'In-person';
  price: 'Any' | 'Free' | 'Paid';
  location: 'Near me' | 'In my city' | 'Anywhere';
  quickPickRule: 'sortByAttendees' | 'withinTwoHours' | null;
};

const DEFAULT_FILTERS: ExploreFilters = {
  quickPick: null,
  date: 'Any time',
  type: 'Any',
  price: 'Any',
  location: 'Anywhere',
  quickPickRule: null,
};

type FilterModalProps = {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: ExploreFilters) => void;
  initialFilters?: ExploreFilters;
};

export function FilterModal({
  visible,
  onClose,
  onApply,
  initialFilters,
}: FilterModalProps) {
  const initial = useMemo(() => initialFilters ?? DEFAULT_FILTERS, [initialFilters]);
  const [filters, setFilters] = useState<ExploreFilters>(initial);
  const sheetAnim = useRef(new Animated.Value(360)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const applyScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setFilters(initial);
      Animated.parallel([
        Animated.timing(sheetAnim, {
          toValue: 0,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      sheetAnim.setValue(360);
      overlayAnim.setValue(0);
    }
  }, [initial, overlayAnim, sheetAnim, visible]);

  const handleClearAll = () => setFilters(DEFAULT_FILTERS);

  const handleApply = () => {
    const quickPickRule =
      filters.quickPick === 'Trending now'
        ? 'sortByAttendees'
        : filters.quickPick === 'Starting soon'
          ? 'withinTwoHours'
          : null;

    onApply({
      ...filters,
      quickPickRule,
    });
    onClose();
  };

  const onApplyPressIn = () => {
    Animated.spring(applyScale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
  };

  const onApplyPressOut = () => {
    Animated.spring(applyScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
          <Pressable style={styles.backdropTouch} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetAnim }] }]}>
          <View style={styles.header}>
            <View style={styles.dragHandle} />
          </View>

          <View style={styles.titleRow}>
            <Text style={styles.title}>Filter Events</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Close filter modal"
            >
              <Ionicons name="close" size={21} color="#4B5563" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            <FilterSection title="Quick picks">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalRow}
              >
                <FilterChip
                  label="Trending now"
                  icon="flame-outline"
                  variant="quickPick"
                  selected={filters.quickPick === 'Trending now'}
                  onPress={() =>
                    setFilters((prev) => ({
                      ...prev,
                      quickPick:
                        prev.quickPick === 'Trending now' ? null : 'Trending now',
                    }))
                  }
                />
                <FilterChip
                  label="Starting soon"
                  icon="flash-outline"
                  variant="quickPick"
                  selected={filters.quickPick === 'Starting soon'}
                  onPress={() =>
                    setFilters((prev) => ({
                      ...prev,
                      quickPick:
                        prev.quickPick === 'Starting soon' ? null : 'Starting soon',
                    }))
                  }
                />
              </ScrollView>
            </FilterSection>

            <FilterSection title="Date">
              <View style={styles.wrapRow}>
                {(
                  ['Any time', 'Upcoming', 'Today', 'Tomorrow', 'This weekend', 'Next week'] as const
                ).map((option) => (
                  <FilterChip
                    key={option}
                    label={option}
                    selected={filters.date === option}
                    onPress={() =>
                      setFilters((prev) => ({
                        ...prev,
                        quickPick: null,
                        quickPickRule: null,
                        date: option,
                      }))
                    }
                  />
                ))}
              </View>
            </FilterSection>

            <FilterSection title="Event Type">
              <FilterButtonGroup
                options={[
                  { value: 'Any', label: 'Any' },
                  { value: 'Online', label: 'Online', icon: 'videocam-outline' },
                  { value: 'In-person', label: 'In-person', icon: 'location-outline' },
                ]}
                value={filters.type}
                onChange={(next) =>
                  setFilters((prev) => ({
                    ...prev,
                    quickPick: null,
                    quickPickRule: null,
                    type: next as ExploreFilters['type'],
                  }))
                }
              />
            </FilterSection>

            <FilterSection title="Price">
              <View style={styles.wrapRow}>
                {(
                  [
                    { label: 'Any', icon: 'options-outline' },
                    { label: 'Free', icon: 'checkmark-circle-outline' },
                    { label: 'Paid', icon: 'cash-outline' },
                  ] as const
                ).map((option) => (
                  <FilterChip
                    key={option.label}
                    label={option.label}
                    icon={option.icon}
                    selected={filters.price === option.label}
                    onPress={() =>
                      setFilters((prev) => ({
                        ...prev,
                        quickPick: null,
                        quickPickRule: null,
                        price: option.label,
                      }))
                    }
                  />
                ))}
              </View>
            </FilterSection>

            <FilterSection title="Location">
              <View style={styles.wrapRow}>
                <FilterChip
                  label="Near me"
                  icon="locate-outline"
                  selected={filters.location === 'Near me'}
                  onPress={() =>
                    setFilters((prev) => ({
                      ...prev,
                      quickPick: null,
                      quickPickRule: null,
                      location: 'Near me',
                    }))
                  }
                />
                <FilterChip
                  label="In my city"
                  icon="business-outline"
                  selected={filters.location === 'In my city'}
                  onPress={() =>
                    setFilters((prev) => ({
                      ...prev,
                      quickPick: null,
                      quickPickRule: null,
                      location: 'In my city',
                    }))
                  }
                />
                <FilterChip
                  label="Anywhere"
                  icon="earth-outline"
                  selected={filters.location === 'Anywhere'}
                  onPress={() =>
                    setFilters((prev) => ({
                      ...prev,
                      quickPick: null,
                      quickPickRule: null,
                      location: 'Anywhere',
                    }))
                  }
                />
              </View>
              {filters.location === 'Near me' ? (
                <Text style={styles.locationHint}>Using your location</Text>
              ) : null}
            </FilterSection>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleClearAll}
              style={styles.clearButton}
              accessibilityRole="button"
              accessibilityLabel="Clear all filters"
            >
              <Text style={styles.clearText}>Clear all</Text>
            </TouchableOpacity>

            <Animated.View style={{ transform: [{ scale: applyScale }] }}>
              <TouchableOpacity
                onPress={handleApply}
                onPressIn={onApplyPressIn}
                onPressOut={onApplyPressOut}
                style={styles.applyButton}
                accessibilityRole="button"
                accessibilityLabel="Apply filters"
              >
                <LinearGradient
                  colors={['#FF7A00', '#FF9A3D']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.applyGradient}
                >
                  <Text style={styles.applyText}>Apply filters</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  backdropTouch: {
    flex: 1,
  },
  sheet: {
    height: '82%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    paddingTop: 10,
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#D1D5DB',
  },
  titleRow: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  horizontalRow: {
    paddingRight: 6,
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  locationHint: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '500',
    color: '#8B93A1',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#EEF1F4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clearButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  clearText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#8B93A1',
  },
  applyButton: {
    borderRadius: 20,
    shadowColor: '#FF7A00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  applyGradient: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  applyText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

