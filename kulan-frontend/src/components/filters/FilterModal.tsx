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
import { LinearGradient } from 'expo-linear-gradient';

export type ExploreFilters = {
  quickPick: 'Trending now' | 'Starting soon' | null;
  date: 'Any time' | 'Upcoming' | 'Today' | 'Tomorrow' | 'This weekend' | 'Next week';
  type: 'Any' | 'Online' | 'In-person';
  format: 'Any' | 'meetup' | 'panel' | 'seminar' | 'workshop' | 'talk' | 'bootcamp';
  price: 'Any' | 'Free' | 'Paid';
  location: 'Near me' | 'In my city' | 'Anywhere';
  quickPickRule: 'sortByAttendees' | 'withinTwoHours' | null;
};

const DEFAULT_FILTERS: ExploreFilters = {
  quickPick: null,
  date: 'Any time',
  type: 'Any',
  format: 'Any',
  price: 'Any',
  location: 'Anywhere',
  quickPickRule: null,
};

type FilterModalProps = {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: ExploreFilters) => void | Promise<void>;
  initialFilters?: ExploreFilters;
};

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const QUICK_OPTIONS = [
  {
    value: 'Trending now',
    label: 'Trending now',
    description: 'Events people are joining most.',
    icon: 'flame-outline',
  },
  {
    value: 'Starting soon',
    label: 'Starting soon',
    description: 'Events happening in the next 48 hours.',
    icon: 'flash-outline',
  },
] as const;

const DATE_OPTIONS = [
  { value: 'Any time', label: 'Any time', icon: 'calendar-outline' },
  { value: 'Upcoming', label: 'Upcoming', icon: 'arrow-up-circle-outline' },
  { value: 'Today', label: 'Today', icon: 'today-outline' },
  { value: 'Tomorrow', label: 'Tomorrow', icon: 'sunny-outline' },
  { value: 'This weekend', label: 'This weekend', icon: 'cafe-outline' },
  { value: 'Next week', label: 'Next week', icon: 'calendar-number-outline' },
] as const;

const TYPE_OPTIONS = [
  { value: 'Any', label: 'Any', icon: 'apps-outline' },
  { value: 'Online', label: 'Online', icon: 'videocam-outline' },
  { value: 'In-person', label: 'In-person', icon: 'location-outline' },
] as const;

const FORMAT_OPTIONS = [
  { value: 'Any', label: 'Any format', icon: 'albums-outline' },
  { value: 'seminar', label: 'Seminar', icon: 'school-outline' },
  { value: 'workshop', label: 'Workshop', icon: 'construct-outline' },
  { value: 'panel', label: 'Panel', icon: 'people-outline' },
  { value: 'talk', label: 'Talk', icon: 'mic-outline' },
  { value: 'bootcamp', label: 'Bootcamp', icon: 'barbell-outline' },
  { value: 'meetup', label: 'Meetup', icon: 'cafe-outline' },
] as const;

const PRICE_OPTIONS = [
  { value: 'Any', label: 'Any', icon: 'options-outline' },
  { value: 'Free', label: 'Free', icon: 'checkmark-circle-outline' },
  { value: 'Paid', label: 'Paid', icon: 'cash-outline' },
] as const;

const LOCATION_OPTIONS = [
  {
    value: 'Near me',
    label: 'Near me',
    description: 'Use your current location and event map pins.',
    icon: 'locate-outline',
  },
  {
    value: 'In my city',
    label: 'In my city',
    description: 'Show events around your saved city.',
    icon: 'business-outline',
  },
  {
    value: 'Anywhere',
    label: 'Anywhere',
    description: 'Browse all available events.',
    icon: 'earth-outline',
  },
] as const;

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function OptionCard({
  label,
  description,
  icon,
  selected,
  onPress,
}: {
  label: string;
  description: string;
  icon: IoniconName;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionCard,
        selected ? styles.optionCardActive : styles.optionCardInactive,
        pressed ? styles.optionCardPressed : null,
      ]}
    >
      <View style={[styles.optionIcon, selected ? styles.optionIconActive : null]}>
        <Ionicons name={icon} size={18} color={selected ? '#FF7A00' : '#64748B'} />
      </View>
      <View style={styles.optionTextWrap}>
        <Text style={[styles.optionTitle, selected ? styles.optionTitleActive : null]}>{label}</Text>
        <Text style={styles.optionDescription}>{description}</Text>
      </View>
      {selected ? <Ionicons name="checkmark-circle" size={20} color="#FF7A00" /> : null}
    </Pressable>
  );
}

function PillOption({
  label,
  icon,
  selected,
  onPress,
}: {
  label: string;
  icon: IoniconName;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pillOption,
        selected ? styles.pillOptionActive : styles.pillOptionInactive,
        pressed ? { opacity: 0.86 } : null,
      ]}
    >
      <Ionicons name={icon} size={15} color={selected ? '#FF7A00' : '#64748B'} />
      <Text style={[styles.pillText, selected ? styles.pillTextActive : null]}>{label}</Text>
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

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.quickPick) count += 1;
    if (filters.date !== DEFAULT_FILTERS.date) count += 1;
    if (filters.type !== DEFAULT_FILTERS.type) count += 1;
    if (filters.format !== DEFAULT_FILTERS.format) count += 1;
    if (filters.price !== DEFAULT_FILTERS.price) count += 1;
    if (filters.location !== DEFAULT_FILTERS.location) count += 1;
    return count;
  }, [filters]);

  const handleApply = async () => {
    const quickPickRule =
      filters.quickPick === 'Trending now'
        ? 'sortByAttendees'
        : filters.quickPick === 'Starting soon'
          ? 'withinTwoHours'
          : null;

    await onApply({
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
            <View style={styles.titleTextWrap}>
              <Text style={styles.title}>Find the right event</Text>
              <Text style={styles.subtitle}>Choose date, location, type, and price.</Text>
            </View>
            {activeFilterCount > 0 ? (
              <View style={styles.countPill}>
                <Text style={styles.countPillText}>{activeFilterCount}</Text>
              </View>
            ) : null}
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
            <LinearGradient
              colors={['#FFF7ED', '#FFFFFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.helperCard}
            >
              <View style={styles.helperIcon}>
                <Ionicons name="options-outline" size={18} color="#FF7A00" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.helperTitle}>Filter only what matters</Text>
                <Text style={styles.helperText}>Start broad, then narrow by time, place, type, or price.</Text>
              </View>
            </LinearGradient>

            <View style={styles.section}>
              <SectionHeader title="Quick picks" subtitle="Fast shortcuts for common searches." />
              <View style={styles.quickGrid}>
                {QUICK_OPTIONS.map((option) => (
                  <OptionCard
                    key={option.value}
                    label={option.label}
                    description={option.description}
                    icon={option.icon}
                    selected={filters.quickPick === option.value}
                    onPress={() =>
                      setFilters((prev) => ({
                        ...prev,
                        quickPick: prev.quickPick === option.value ? null : option.value,
                        quickPickRule: null,
                        date: DEFAULT_FILTERS.date,
                      }))
                    }
                  />
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <SectionHeader title="When" subtitle="Pick the time window that feels right." />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRail}>
                {DATE_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() =>
                      setFilters((prev) => ({
                        ...prev,
                        quickPick: null,
                        quickPickRule: null,
                        date: option.value,
                      }))
                    }
                    style={({ pressed }) => [
                      styles.dateCard,
                      filters.date === option.value ? styles.dateCardActive : styles.dateCardInactive,
                      pressed ? { opacity: 0.86 } : null,
                    ]}
                  >
                    <Ionicons
                      name={option.icon}
                      size={18}
                      color={filters.date === option.value ? '#FF7A00' : '#64748B'}
                    />
                    <Text style={[styles.dateText, filters.date === option.value ? styles.dateTextActive : null]}>
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View style={styles.section}>
              <SectionHeader title="Where" subtitle="Choose how close the events should be." />
              <View style={styles.optionStack}>
                {LOCATION_OPTIONS.map((option) => (
                  <OptionCard
                    key={option.value}
                    label={option.label}
                    description={option.description}
                    icon={option.icon}
                    selected={filters.location === option.value}
                    onPress={() =>
                      setFilters((prev) => ({
                        ...prev,
                        quickPick: null,
                        quickPickRule: null,
                        location: option.value,
                      }))
                    }
                  />
                ))}
              </View>
              {filters.location === 'Near me' ? (
                <Text style={styles.locationHint}>Nearby works best for events that saved an exact map pin.</Text>
              ) : null}
            </View>

            <View style={styles.section}>
              <SectionHeader title="Event details" subtitle="Choose format, delivery, and ticket price." />
              <View style={styles.segmentCard}>
                <Text style={styles.segmentLabel}>Event format</Text>
                <View style={styles.pillRow}>
                  {FORMAT_OPTIONS.map((option) => (
                    <PillOption
                      key={option.value}
                      label={option.label}
                      icon={option.icon}
                      selected={filters.format === option.value}
                      onPress={() =>
                        setFilters((prev) => ({
                          ...prev,
                          quickPick: null,
                          quickPickRule: null,
                          format: option.value,
                        }))
                      }
                    />
                  ))}
                </View>
                <View style={styles.segmentDivider} />
                <Text style={styles.segmentLabel}>Event type</Text>
                <View style={styles.pillRow}>
                  {TYPE_OPTIONS.map((option) => (
                    <PillOption
                      key={option.value}
                      label={option.label}
                      icon={option.icon}
                      selected={filters.type === option.value}
                      onPress={() =>
                        setFilters((prev) => ({
                          ...prev,
                          quickPick: null,
                          quickPickRule: null,
                          type: option.value,
                        }))
                      }
                    />
                  ))}
                </View>
                <View style={styles.segmentDivider} />
                <Text style={styles.segmentLabel}>Price</Text>
                <View style={styles.pillRow}>
                  {PRICE_OPTIONS.map((option) => (
                    <PillOption
                      key={option.value}
                      label={option.label}
                      icon={option.icon}
                      selected={filters.price === option.value}
                      onPress={() =>
                        setFilters((prev) => ({
                          ...prev,
                          quickPick: null,
                          quickPickRule: null,
                          price: option.value,
                        }))
                      }
                    />
                  ))}
                </View>
              </View>
            </View>
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

            <Animated.View style={[styles.applyButtonWrap, { transform: [{ scale: applyScale }] }]}>
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
                  <Text style={styles.applyText}>
                    Apply {activeFilterCount > 0 ? `${activeFilterCount} ` : ''}filters
                  </Text>
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
    gap: 10,
  },
  titleTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
  },
  subtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 3,
    fontWeight: '600',
  },
  countPill: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countPillText: {
    color: '#EA580C',
    fontSize: 13,
    fontWeight: '900',
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
    paddingBottom: 22,
  },
  helperCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#FED7AA',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  helperIcon: {
    width: 40,
    height: 40,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FED7AA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helperTitle: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '900',
  },
  helperText: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
    fontWeight: '600',
  },
  section: {
    marginBottom: 22,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '900',
  },
  sectionSubtitle: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
    fontWeight: '600',
  },
  quickGrid: {
    gap: 10,
  },
  optionStack: {
    gap: 10,
  },
  optionCard: {
    minHeight: 74,
    borderRadius: 20,
    borderWidth: 1,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionCardActive: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FF7A00',
    shadowColor: '#FF7A00',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 2,
  },
  optionCardInactive: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E5E7EB',
  },
  optionCardPressed: {
    opacity: 0.9,
  },
  optionIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconActive: {
    borderColor: '#FED7AA',
  },
  optionTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  optionTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '900',
  },
  optionTitleActive: {
    color: '#C2410C',
  },
  optionDescription: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 3,
    fontWeight: '600',
  },
  dateRail: {
    gap: 10,
    paddingRight: 8,
  },
  dateCard: {
    width: 112,
    minHeight: 72,
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  dateCardActive: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FF7A00',
  },
  dateCardInactive: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E5E7EB',
  },
  dateText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '800',
  },
  dateTextActive: {
    color: '#C2410C',
  },
  segmentCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
  },
  segmentLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 9,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pillOption: {
    flexGrow: 1,
    minWidth: 92,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  pillOptionActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FF7A00',
    shadowColor: '#FF7A00',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 1,
  },
  pillOptionInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  pillText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '800',
  },
  pillTextActive: {
    color: '#C2410C',
  },
  segmentDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 14,
  },
  horizontalRow: {
    paddingRight: 6,
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  locationCards: {
    gap: 10,
  },
  locationCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationCardActive: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FF7A00',
    shadowColor: '#FF7A00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  locationCardInactive: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  locationCardPressed: {
    opacity: 0.88,
  },
  locationIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationIconActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FED7AA',
  },
  locationTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  locationTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  locationTitleActive: {
    color: '#C2410C',
  },
  locationDescription: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  locationHint: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#EEF1F4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  clearButton: {
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  clearText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#8B93A1',
  },
  applyButtonWrap: {
    flex: 1,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

