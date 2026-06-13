import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = Math.min(SCREEN_W - 48, 340);
const SLIDE_W = CARD_W;
const LOGO_PAD = 16;
const LOGO_SIZE = CARD_W - LOGO_PAD * 2;
const THUMB_SIZE = 48;

function SponsorLogo({ sponsor, size, borderRadius = 18, padding = 20 }) {
  const inner = size - padding * 2;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
        padding,
      }}
    >
      {sponsor.image ? (
        <Image
          source={sponsor.image}
          style={{ width: inner, height: inner }}
          resizeMode="contain"
          accessibilityLabel={sponsor.name}
        />
      ) : (
        <Feather name="briefcase" size={Math.round(size * 0.22)} color="#CBD5E1" />
      )}
    </View>
  );
}

function SponsorSlide({ sponsor }) {
  const name = typeof sponsor.name === 'string' && sponsor.name.trim() ? sponsor.name.trim() : 'Sponsor';

  return (
    <View style={[styles.slide, { width: SLIDE_W }]}>
      <View style={styles.logoShell}>
        <SponsorLogo sponsor={sponsor} size={LOGO_SIZE} />
      </View>

      <View style={styles.body}>
        <View style={styles.partnerChip}>
          <View style={styles.partnerIconWrap}>
            <Feather name="award" size={12} color="#B45309" />
          </View>
          <Text style={styles.partnerChipText}>Event partner</Text>
        </View>

        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>
      </View>
    </View>
  );
}

/**
 * @param {{ visible: boolean, sponsors: { id: string, name: string, image?: object | null }[], initialIndex?: number, onClose: () => void }} props
 */
export default function SponsorDetailModal({
  visible,
  sponsors = [],
  initialIndex = 0,
  onClose,
}) {
  const insets = useSafeAreaInsets();
  const listRef = useRef(null);
  const thumbRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  const scrollToIndex = useCallback((index, animated = true) => {
    if (index < 0 || index >= sponsors.length) return;
    try {
      listRef.current?.scrollToIndex({ index, animated });
    } catch {
      listRef.current?.scrollToOffset({ offset: SLIDE_W * index, animated });
    }
    try {
      thumbRef.current?.scrollToIndex({ index, animated, viewPosition: 0.5 });
    } catch {
      /* thumbnail list may not be ready */
    }
  }, [sponsors.length]);

  useEffect(() => {
    if (visible) {
      setActiveIndex(initialIndex);
      requestAnimationFrame(() => scrollToIndex(initialIndex, false));
    }
  }, [visible, initialIndex, scrollToIndex]);

  if (!visible || sponsors.length === 0) return null;

  const hasMany = sponsors.length > 1;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />

        <View
          style={[
            styles.card,
            {
              marginTop: insets.top + 20,
              marginBottom: insets.bottom + 20,
            },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerLabel}>Sponsor</Text>
              {hasMany ? (
                <Text style={styles.counter}>
                  {activeIndex + 1} / {sponsors.length}
                </Text>
              ) : null}
            </View>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Feather name="x" size={20} color="#64748B" />
            </Pressable>
          </View>

          <FlatList
            ref={listRef}
            data={sponsors}
            keyExtractor={(item, index) => String(item.id ?? `sponsor-${index}`)}
            horizontal
            pagingEnabled
            decelerationRate="fast"
            bounces={hasMany}
            showsHorizontalScrollIndicator={false}
            style={styles.mainList}
            initialScrollIndex={
              initialIndex > 0 && initialIndex < sponsors.length ? initialIndex : undefined
            }
            getItemLayout={(_, index) => ({ length: SLIDE_W, offset: SLIDE_W * index, index })}
            onScrollToIndexFailed={(info) => {
              requestAnimationFrame(() => scrollToIndex(info.index, false));
            }}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / SLIDE_W);
              if (index >= 0 && index < sponsors.length) {
                setActiveIndex(index);
                try {
                  thumbRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
                } catch {
                  /* thumb list may not be mounted yet */
                }
              }
            }}
            renderItem={({ item }) => <SponsorSlide sponsor={item} />}
          />

          {hasMany ? (
            <>
              <View style={styles.dotsRow}>
                {sponsors.map((item, index) => (
                  <View
                    key={item.id ?? index}
                    style={[styles.dot, index === activeIndex ? styles.dotActive : null]}
                  />
                ))}
              </View>

              <FlatList
                ref={thumbRef}
                data={sponsors}
                keyExtractor={(item, index) => `thumb-${item.id ?? index}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.thumbRow}
                renderItem={({ item, index }) => {
                  const isActive = index === activeIndex;
                  return (
                    <Pressable
                      onPress={() => {
                        setActiveIndex(index);
                        scrollToIndex(index, true);
                      }}
                      style={[styles.thumbWrap, isActive ? styles.thumbWrapActive : null]}
                      accessibilityRole="button"
                      accessibilityLabel={`View ${item.name || 'sponsor'}`}
                      accessibilityState={{ selected: isActive }}
                    >
                      <SponsorLogo sponsor={item} size={THUMB_SIZE} borderRadius={10} padding={8} />
                    </Pressable>
                  );
                }}
              />
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: CARD_W,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    paddingBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: LOGO_PAD,
    paddingTop: 14,
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  counter: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainList: {
    flexGrow: 0,
  },
  slide: {
    alignItems: 'center',
  },
  logoShell: {
    marginHorizontal: LOGO_PAD,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  body: {
    alignItems: 'center',
    paddingHorizontal: LOGO_PAD + 4,
    paddingTop: 14,
    paddingBottom: 4,
  },
  partnerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 10,
  },
  partnerIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#78350F',
    letterSpacing: 0.2,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 26,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: LOGO_PAD,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
  },
  dotActive: {
    width: 18,
    backgroundColor: '#64748B',
  },
  thumbRow: {
    paddingHorizontal: LOGO_PAD,
    paddingTop: 10,
    gap: 8,
  },
  thumbWrap: {
    borderRadius: 12,
    padding: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbWrapActive: {
    borderColor: '#94A3B8',
  },
});
