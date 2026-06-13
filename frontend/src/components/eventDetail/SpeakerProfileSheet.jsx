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
import { resolveApiAssetUrl } from '@/utils/mediaUrl';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = Math.min(SCREEN_W - 48, 340);
const SLIDE_W = CARD_W;
const PHOTO_PAD = 16;
const PHOTO_SIZE = CARD_W - PHOTO_PAD * 2;
const THUMB_SIZE = 48;

const ROLE_LABELS = {
  speaker: 'Speaker',
  panelist: 'Panelist',
  moderator: 'Moderator',
  keynote: 'Keynote speaker',
  host: 'Host',
};

function formatRoleLabel(role) {
  if (typeof role !== 'string' || !role.trim()) return 'Speaker';
  const key = role.trim().toLowerCase();
  return ROLE_LABELS[key] ?? role.trim().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function SpeakerPhoto({ person, size, borderRadius = 18 }) {
  const uri = resolveApiAssetUrl(person.photoUrl);

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius }}
        resizeMode="cover"
        accessibilityLabel={person.displayName}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius,
        backgroundColor: '#FFF7ED',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <MemberInitialAvatar
        name={person.displayName || 'Speaker'}
        size={Math.round(size * 0.3)}
        borderWidth={0}
      />
    </View>
  );
}

function SpeakerSlide({ person }) {
  const subtitle = typeof person.title === 'string' ? person.title.trim() : '';
  const roleLabel = formatRoleLabel(person.role);

  return (
    <View style={[styles.slide, { width: SLIDE_W }]}>
      <View style={styles.photoShell}>
        <SpeakerPhoto person={person} size={PHOTO_SIZE} />
      </View>

      <View style={styles.body}>
        <View style={styles.roleChip}>
          <Feather name="mic" size={11} color="#FF7B3F" />
          <Text style={styles.roleChipText}>{roleLabel}</Text>
        </View>

        <Text style={styles.name} numberOfLines={2}>
          {person.displayName}
        </Text>

        {subtitle ? (
          <Text style={styles.title} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/**
 * @param {{ visible: boolean, roster: object[], initialIndex?: number, onClose: () => void }} props
 */
export default function SpeakerProfileSheet({
  visible,
  roster = [],
  initialIndex = 0,
  onClose,
}) {
  const insets = useSafeAreaInsets();
  const listRef = useRef(null);
  const thumbRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  const scrollToIndex = useCallback((index, animated = true) => {
    if (index < 0 || index >= roster.length) return;
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
  }, [roster.length]);

  useEffect(() => {
    if (visible) {
      setActiveIndex(initialIndex);
      requestAnimationFrame(() => scrollToIndex(initialIndex, false));
    }
  }, [visible, initialIndex, scrollToIndex]);

  if (!visible || roster.length === 0) return null;

  const hasMany = roster.length > 1;

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
              <Text style={styles.headerLabel}>Featured speaker</Text>
              {hasMany ? (
                <Text style={styles.counter}>
                  {activeIndex + 1} / {roster.length}
                </Text>
              ) : null}
            </View>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Feather name="x" size={20} color="#64748B" />
            </Pressable>
          </View>

          <FlatList
            ref={listRef}
            data={roster}
            keyExtractor={(person, index) => String(person.id ?? `${person.displayName}-${index}`)}
            horizontal
            pagingEnabled
            decelerationRate="fast"
            bounces={hasMany}
            showsHorizontalScrollIndicator={false}
            style={styles.mainList}
            initialScrollIndex={
              initialIndex > 0 && initialIndex < roster.length ? initialIndex : undefined
            }
            getItemLayout={(_, index) => ({ length: SLIDE_W, offset: SLIDE_W * index, index })}
            onScrollToIndexFailed={(info) => {
              requestAnimationFrame(() => scrollToIndex(info.index, false));
            }}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / SLIDE_W);
              if (index >= 0 && index < roster.length) {
                setActiveIndex(index);
                try {
                  thumbRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
                } catch {
                  /* thumb list may not be mounted yet */
                }
              }
            }}
            renderItem={({ item }) => <SpeakerSlide person={item} />}
          />

          {hasMany ? (
            <>
              <View style={styles.dotsRow}>
                {roster.map((person, index) => (
                  <View
                    key={person.id ?? index}
                    style={[styles.dot, index === activeIndex ? styles.dotActive : null]}
                  />
                ))}
              </View>

              <FlatList
                ref={thumbRef}
                data={roster}
                keyExtractor={(person, index) => `thumb-${person.id ?? index}`}
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
                      accessibilityLabel={`View ${item.displayName}`}
                      accessibilityState={{ selected: isActive }}
                    >
                      <SpeakerPhoto person={item} size={THUMB_SIZE} borderRadius={10} />
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
    paddingHorizontal: PHOTO_PAD,
    paddingTop: 14,
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FF7B3F',
    letterSpacing: 0.6,
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
  photoShell: {
    marginHorizontal: PHOTO_PAD,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFE8D9',
    shadowColor: '#FF7B3F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  body: {
    alignItems: 'center',
    paddingHorizontal: PHOTO_PAD + 4,
    paddingTop: 14,
    paddingBottom: 4,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#FFF7ED',
    marginBottom: 8,
  },
  roleChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF7B3F',
    letterSpacing: 0.3,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 26,
  },
  title: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: PHOTO_PAD,
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
  thumbRow: {
    paddingHorizontal: PHOTO_PAD,
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
    borderColor: '#FF7B3F',
  },
});
