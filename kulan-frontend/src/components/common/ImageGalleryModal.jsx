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
import { MemberInitialAvatar } from '@/components/member/MemberInitialAvatar';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = Math.min(SCREEN_W - 40, 360);
const MEDIA_H = Math.round(CARD_W * 0.92);

/**
 * @param {{ visible: boolean, items: { id: string, kind?: 'person' | 'sponsor', image?: object | null, title?: string, subtitle?: string, seedName?: string }[], initialIndex?: number, onClose: () => void }} props
 */
export default function ImageGalleryModal({ visible, items = [], initialIndex = 0, onClose }) {
  const insets = useSafeAreaInsets();
  const listRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  const scrollToIndex = useCallback((index, animated = false) => {
    if (!listRef.current || index < 0 || index >= items.length) return;
    try {
      listRef.current.scrollToIndex({ index, animated });
    } catch {
      listRef.current.scrollToOffset({ offset: CARD_W * index, animated });
    }
  }, [items.length]);

  useEffect(() => {
    if (visible) {
      setActiveIndex(initialIndex);
      requestAnimationFrame(() => scrollToIndex(initialIndex, false));
    }
  }, [visible, initialIndex, scrollToIndex]);

  if (!visible || items.length === 0) return null;

  const activeItem = items[activeIndex];
  const headerLabel = activeItem?.kind === 'sponsor' ? 'Sponsor' : 'Speaker';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />

        <View style={[styles.sheet, { marginTop: insets.top + 24, marginBottom: insets.bottom + 16 }]}>
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderLeft}>
              <Text style={styles.sheetTitle}>{headerLabel}</Text>
              {items.length > 1 ? (
                <Text style={styles.sheetCounter}>
                  {activeIndex + 1} / {items.length}
                </Text>
              ) : null}
            </View>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Feather name="x" size={20} color="#64748B" />
            </Pressable>
          </View>

          <FlatList
            ref={listRef}
            data={items}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            decelerationRate="fast"
            snapToInterval={CARD_W}
            snapToAlignment="center"
            disableIntervalMomentum
            bounces={items.length > 1}
            showsHorizontalScrollIndicator={false}
            style={styles.list}
            initialScrollIndex={initialIndex > 0 && initialIndex < items.length ? initialIndex : undefined}
            getItemLayout={(_, index) => ({ length: CARD_W, offset: CARD_W * index, index })}
            onScrollToIndexFailed={(info) => {
              requestAnimationFrame(() => scrollToIndex(info.index, false));
            }}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / CARD_W);
              if (index >= 0 && index < items.length) setActiveIndex(index);
            }}
            renderItem={({ item }) => {
              const isSponsor = item.kind === 'sponsor';
              const seed = item.seedName || item.title || '?';
              const hasPhoto = Boolean(item.image);

              return (
                <View style={[styles.slide, { width: CARD_W }]}>
                  {hasPhoto ? (
                    <View style={styles.mediaBleed}>
                      <Image
                        source={item.image}
                        style={styles.mediaImage}
                        resizeMode="cover"
                      />
                    </View>
                  ) : (
                    <View style={styles.mediaBleed}>
                      <View style={styles.initialFallback}>
                        <MemberInitialAvatar name={seed} size={112} borderWidth={0} />
                      </View>
                    </View>
                  )}

                  <View style={styles.caption}>
                    {item.title ? (
                      <Text style={styles.personName} numberOfLines={2}>
                        {item.title}
                      </Text>
                    ) : null}
                    {item.subtitle ? (
                      <Text style={styles.personRole} numberOfLines={2}>
                        {item.subtitle}
                      </Text>
                    ) : null}
                    {isSponsor && !item.subtitle ? (
                      <Text style={styles.personRole} numberOfLines={1}>
                        Event partner
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            }}
          />

          {items.length > 1 ? (
            <View style={styles.dotsRow}>
              {items.map((item, index) => (
                <View
                  key={item.id}
                  style={[styles.dot, index === activeIndex ? styles.dotActive : null]}
                />
              ))}
            </View>
          ) : null}

          {items.length > 1 ? <Text style={styles.hint}>Swipe for more</Text> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  sheet: {
    width: CARD_W,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    paddingBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  sheetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sheetTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sheetCounter: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF7B3F',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    flexGrow: 0,
  },
  slide: {
    alignItems: 'stretch',
  },
  mediaBleed: {
    width: CARD_W,
    height: MEDIA_H,
    backgroundColor: '#0F172A',
    overflow: 'hidden',
  },
  mediaImage: {
    width: CARD_W,
    height: MEDIA_H,
  },
  initialFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF7ED',
  },
  caption: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 4,
    alignItems: 'center',
  },
  personName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 26,
  },
  personRole: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 16,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
  },
  dotActive: {
    width: 18,
    backgroundColor: '#FF7B3F',
  },
  hint: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
});
