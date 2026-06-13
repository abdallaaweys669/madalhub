import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles as eventStyles } from '@/constants/eventDetails_styles/eventDetails.styles';
import { resolveApiAssetUrl } from '@/utils/mediaUrl';

export default function WysiwygHeader({
  coverPath,
  onBack,
  onPickCover,
  coverUploading = false,
  onOpenSettings,
}) {
  const insets = useSafeAreaInsets();
  const coverUri = coverPath ? resolveApiAssetUrl(coverPath) : null;
  const plusPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (coverUri) return undefined;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(plusPulse, {
          toValue: 1.14,
          duration: 850,
          useNativeDriver: true,
        }),
        Animated.timing(plusPulse, {
          toValue: 1,
          duration: 850,
          useNativeDriver: true,
        }),
        Animated.delay(1200),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [coverUri, plusPulse]);

  return (
    <View style={[eventStyles.headerWrapper, coverUri ? styles.imageHeader : styles.emptyHeader]}>
      {coverUri ? (
        <ImageBackground source={{ uri: coverUri }} style={[eventStyles.headerImage, { height: '100%' }]} resizeMode="cover">
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.55)']} locations={[0.4, 1]} style={eventStyles.headerGradient} />
        </ImageBackground>
      ) : (
        <View style={styles.emptyBackdrop}>
          <LinearGradient
            colors={['#FFF7ED', '#F8FAFC', '#EEF2FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={[styles.blurCircle, styles.blurCircleLeft]} />
          <View style={[styles.blurCircle, styles.blurCircleRight]} />
        </View>
      )}

      <View style={[eventStyles.headerActionsRow, { top: insets.top + 8 }]}>
        <Pressable onPress={onBack} style={[eventStyles.iconButton, !coverUri && styles.lightIconButton]}>
          <Feather name="arrow-left" size={20} color={coverUri ? '#FFFFFF' : '#111827'} />
        </Pressable>
        <Pressable onPress={onOpenSettings} style={[eventStyles.iconButton, !coverUri && styles.lightIconButton]}>
          <Feather name="settings" size={18} color={coverUri ? '#FFFFFF' : '#111827'} />
        </Pressable>
      </View>

      {!coverUri ? (
        <Pressable
          onPress={onPickCover}
          style={[styles.coverDropZone, { top: insets.top + 64 }]}
        >
          {coverUploading ? (
            <ActivityIndicator color="#FF7A00" />
          ) : (
            <>
              <View style={styles.coverCenterContent}>
                <View style={styles.uploadIconWrap}>
                  <View style={styles.uploadIcon}>
                    <Feather name="image" size={25} color="#EA580C" />
                  </View>
                  <Animated.View
                    style={[
                      styles.uploadPlusBadge,
                      {
                        transform: [{ scale: plusPulse }],
                        opacity: plusPulse.interpolate({
                          inputRange: [1, 1.14],
                          outputRange: [1, 0.88],
                        }),
                      },
                    ]}
                  >
                    <Feather name="plus" size={12} color="#FFFFFF" />
                  </Animated.View>
                </View>

                <Text style={styles.uploadTitle}>Add event cover</Text>
                <Text style={styles.uploadSubtitle}>Tap anywhere here to choose a clear event photo.</Text>

                <View style={styles.uploadMetaPill}>
                  <Feather name="crop" size={13} color="#64748B" />
                  <Text style={styles.uploadMetaText}>Recommended 1200 x 630</Text>
                </View>
              </View>
            </>
          )}
        </Pressable>
      ) : (
        <Pressable
          onPress={onPickCover}
          style={{
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: 14,
            borderRadius: 14,
            backgroundColor: 'rgba(0,0,0,0.4)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.2)',
            paddingVertical: 11,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {coverUploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Feather name="edit-2" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Change Cover</Text>
            </>
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  imageHeader: {
    height: 280,
    paddingTop: 0,
  },
  emptyHeader: {
    height: 310,
    paddingTop: 0,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
  },
  emptyBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F8FAFC',
  },
  blurCircle: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    opacity: 0.7,
  },
  blurCircleLeft: {
    left: -68,
    top: 40,
    backgroundColor: '#FFEDD5',
  },
  blurCircleRight: {
    right: -72,
    top: 92,
    backgroundColor: '#DBEAFE',
  },
  lightIconButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  coverDropZone: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 210,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FDE7D0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.1,
    shadowRadius: 26,
    elevation: 8,
    overflow: 'hidden',
  },
  coverCenterContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  uploadIconWrap: {
    position: 'relative',
    marginBottom: 2,
  },
  uploadIcon: {
    width: 58,
    height: 58,
    borderRadius: 21,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  uploadPlusBadge: {
    position: 'absolute',
    right: -5,
    bottom: -3,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF7A00',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF7A00',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadTitle: {
    color: '#111827',
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginTop: 14,
  },
  uploadSubtitle: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 5,
    textAlign: 'center',
  },
  uploadMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  uploadMetaText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
});
