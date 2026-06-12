import React, { type ComponentProps, useEffect, useMemo, useRef, useState } from 'react';
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

import {
  DEFAULT_EXPLORE_DATE_FILTER,
  type ExploreDateFilter,
} from '@/components/explore/exploreDateFilters';
import { clearExploreModalFilters, countExploreModalFilters } from '@/components/explore/exploreFilterUtils';

export type ExploreFilters = {
  quickPick: 'Trending now' | 'Starting soon' | null;
  date: ExploreDateFilter;
  type: 'Any' | 'Online' | 'In-person';
  format: 'Any' | 'meetup' | 'panel' | 'seminar' | 'workshop' | 'talk' | 'bootcamp';
  price: 'Any' | 'Free' | 'Paid';
  location: 'Near me' | 'In my city' | 'Anywhere';
  quickPickRule: 'sortByAttendees' | 'withinTwoHours' | null;
};

const DEFAULT_FILTERS: ExploreFilters = {
  quickPick: null,
  date: DEFAULT_EXPLORE_DATE_FILTER,
  type: 'Any',
  format: 'Any',
  price: 'Any',
  location: 'Anywhere',
  quickPickRule: null,
};

const BRAND = '#FF7B3F';

type FilterModalProps = {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: ExploreFilters) => void | Promise<void>;
  initialFilters?: ExploreFilters;
};

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type ChipOption<T extends string> = {
  value: T;
  label: string;
  icon?: IoniconName;
};

const LOCATION_OPTIONS: ChipOption<ExploreFilters['location']>[] = [
  { value: 'Anywhere', label: 'Anywhere', icon: 'earth-outline' },
  { value: 'Near me', label: 'Near me', icon: 'locate-outline' },
  { value: 'In my city', label: 'In my city', icon: 'business-outline' },
];

const PRICE_OPTIONS: ChipOption<ExploreFilters['price']>[] = [
  { value: 'Any', label: 'Any price' },
  { value: 'Free', label: 'Free' },
  { value: 'Paid', label: 'Paid' },
];

const TYPE_OPTIONS: ChipOption<ExploreFilters['type']>[] = [
  { value: 'Any', label: 'Any' },
  { value: 'In-person', label: 'In-person', icon: 'location-outline' },
  { value: 'Online', label: 'Online', icon: 'videocam-outline' },
];

const FORMAT_OPTIONS: ChipOption<ExploreFilters['format']>[] = [
  { value: 'Any', label: 'Any format' },
  { value: 'meetup', label: 'Meetup' },
  { value: 'talk', label: 'Talk' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'seminar', label: 'Seminar' },
  { value: 'panel', label: 'Panel' },
  { value: 'bootcamp', label: 'Bootcamp' },
];

const QUICK_OPTIONS: ChipOption<NonNullable<ExploreFilters['quickPick']>>[] = [
  { value: 'Trending now', label: 'Trending', icon: 'flame-outline' },
  { value: 'Starting soon', label: 'Starting soon', icon: 'flash-outline' },
];

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function FilterChip<T extends string>({
  label,
  icon,
  selected,
  onPress,
}: {
  label: string;
  icon?: IoniconName;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected ? styles.chipActive : styles.chipIdle,
        pressed ? styles.chipPressed : null,
      ]}
    >
      {icon ? (
        <Ionicons name={icon} size={15} color={selected ? '#C2410C' : '#6B7280'} />
      ) : null}
      <Text style={[styles.chipText, selected && styles.chipTextActive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function FilterChipRow<T extends string>({
  options,
  value,
  onChange,
  scrollable = false,
}: {
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  scrollable?: boolean;
}) {
  const row = (
    <View style={[styles.chipRow, scrollable && styles.chipRowScroll]}>
      {options.map((option) => (
        <FilterChip
          key={option.value}
          label={option.label}
          icon={option.icon}
          selected={value === option.value}
          onPress={() => onChange(option.value)}
        />
      ))}
    </View>
  );

  if (!scrollable) return row;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipRowScrollContent}
    >
      {options.map((option) => (
        <FilterChip
          key={option.value}
          label={option.label}
          icon={option.icon}
          selected={value === option.value}
          onPress={() => onChange(option.value)}
        />
      ))}
    </ScrollView>
  );
}

function ToggleChip({
  label,
  icon,
  selected,
  onPress,
}: {
  label: string;
  icon?: IoniconName;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.toggleChip,
        selected ? styles.toggleChipActive : styles.toggleChipIdle,
        pressed ? styles.chipPressed : null,
      ]}
    >
      {icon ? (
        <Ionicons name={icon} size={16} color={selected ? '#C2410C' : '#6B7280'} />
      ) : null}
      <Text style={[styles.toggleText, selected && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function FilterModal({
  visible,
  onClose,
  onApply,
  initialFilters,
}: FilterModalProps) {
  const initial = useMemo(() => initialFilters ?? DEFAULT_FILTERS, [initialFilters]);
  const [filters, setFilters] = useState<ExploreFilters>(initial);
  const sheetAnim = useRef(new Animated.Value(420)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

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
      sheetAnim.setValue(420);
      overlayAnim.setValue(0);
    }
  }, [initial, overlayAnim, sheetAnim, visible]);

  const activeFilterCount = useMemo(() => countExploreModalFilters(filters), [filters]);

  const patchFilters = (patch: Partial<ExploreFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...patch,
      quickPickRule: null,
    }));
  };

  const handleClearAll = () => setFilters((prev) => clearExploreModalFilters(prev));

  const handleApply = async () => {
    const quickPickRule =
      filters.quickPick === 'Trending now'
        ? 'sortByAttendees'
        : filters.quickPick === 'Starting soon'
          ? 'withinTwoHours'
          : null;

    await onApply({ ...filters, quickPickRule });
    onClose();
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
            <View style={styles.titleRow}>
              <Text style={styles.title}>Filters</Text>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Close filters"
              >
                <Ionicons name="close" size={22} color="#4B5563" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            <FilterSection title="Where">
              <FilterChipRow
                options={LOCATION_OPTIONS}
                value={filters.location}
                onChange={(location) => patchFilters({ location, quickPick: null })}
              />
            </FilterSection>

            <FilterSection title="Price">
              <FilterChipRow
                options={PRICE_OPTIONS}
                value={filters.price}
                onChange={(price) => patchFilters({ price, quickPick: null })}
              />
            </FilterSection>

            <FilterSection title="Online or in-person">
              <FilterChipRow
                options={TYPE_OPTIONS}
                value={filters.type}
                onChange={(type) => patchFilters({ type, quickPick: null })}
              />
            </FilterSection>

            <FilterSection title="Format">
              <FilterChipRow
                options={FORMAT_OPTIONS}
                value={filters.format}
                onChange={(format) => patchFilters({ format, quickPick: null })}
                scrollable
              />
            </FilterSection>

            <FilterSection title="Popular">
              <View style={styles.toggleRow}>
                {QUICK_OPTIONS.map((option) => (
                  <ToggleChip
                    key={option.value}
                    label={option.label}
                    icon={option.icon}
                    selected={filters.quickPick === option.value}
                    onPress={() =>
                      patchFilters({
                        quickPick:
                          filters.quickPick === option.value ? null : option.value,
                      })
                    }
                  />
                ))}
              </View>
            </FilterSection>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleClearAll}
              style={styles.resetButton}
              accessibilityRole="button"
              accessibilityLabel="Reset filters"
            >
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleApply}
              style={styles.applyButton}
              activeOpacity={0.9}
              accessibilityRole="button"
              accessibilityLabel="Show filtered events"
            >
              <Text style={styles.applyText}>
                {activeFilterCount > 0 ? `Show results (${activeFilterCount})` : 'Show results'}
              </Text>
            </TouchableOpacity>
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
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  backdropTouch: {
    flex: 1,
  },
  sheet: {
    maxHeight: '78%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    paddingTop: 10,
    paddingBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F2',
  },
  dragHandle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#D1D5DB',
    marginBottom: 12,
  },
  titleRow: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1C1C1E',
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  content: {
    flexGrow: 0,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#374151',
    marginBottom: 10,
    letterSpacing: -0.1,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipRowScroll: {
    flexWrap: 'nowrap',
  },
  chipRowScrollContent: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
    minHeight: 38,
  },
  chipIdle: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  chipActive: {
    backgroundColor: '#FFFBF7',
    borderColor: BRAND,
  },
  chipPressed: {
    opacity: 0.88,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  chipTextActive: {
    color: '#C2410C',
    fontWeight: '800',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    minHeight: 52,
  },
  toggleChipIdle: {
    backgroundColor: '#FAFAFA',
    borderColor: '#E5E7EB',
  },
  toggleChipActive: {
    backgroundColor: '#FFF7ED',
    borderColor: BRAND,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F0F0F2',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resetButton: {
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  resetText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  applyButton: {
    flex: 1,
    backgroundColor: BRAND,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  applyText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
