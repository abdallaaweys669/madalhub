import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import AppPopup from '@/components/common/AppPopup';
import { PROFILE_IMAGE_HINT } from '../constants/verificationCopy';

const ORANGE = '#FF7B3F';
const ORANGE_DEEP = '#E85D1A';
const MAX_BYTES = 5 * 1024 * 1024;

function FormatChip({ label }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

function ChooseSheet({ visible, onChoose, onClose, insets }) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={sheet.overlay} onPress={onClose}>
        <Pressable style={[sheet.panel, { paddingBottom: Math.max(insets.bottom, 16) + 10 }]} onPress={() => {}}>
          <View style={sheet.handle} />
          <Text style={sheet.panelTitle}>Organization logo</Text>
          <Text style={sheet.panelSub}>Pick a clear square image — your logo or brand mark.</Text>

          <Pressable style={sheet.option} onPress={onChoose}>
            <LinearGradient
              colors={['#FFF5EE', '#FFEFE5']}
              style={sheet.optionIcon}
            >
              <Ionicons name="images-outline" size={22} color={ORANGE} />
            </LinearGradient>
            <View style={sheet.optionCopy}>
              <Text style={sheet.optionText}>Choose from gallery</Text>
              <Text style={sheet.optionHint}>JPG or PNG, up to 5 MB</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </Pressable>

          <Pressable style={sheet.cancelBtn} onPress={onClose}>
            <Text style={sheet.cancelText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function VerificationProfileImageStep({ imageUri, onPick }) {
  const insets = useSafeAreaInsets();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [popup, setPopup] = useState(null);

  const closePopup = () => setPopup(null);

  const showPopup = ({ variant = 'warning', title, message }) => {
    setPopup({ variant, title, message });
  };

  const pickFromLibrary = async () => {
    setSheetOpen(false);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showPopup({
        variant: 'warning',
        title: 'Gallery access needed',
        message: 'Allow photo library access so you can choose your organization logo.',
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.88,
    });

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > MAX_BYTES) {
      showPopup({
        variant: 'warning',
        title: 'Image too large',
        message: 'Please choose a logo under 5 MB.',
      });
      return;
    }

    onPick({
      uri: asset.uri,
      name: asset.fileName || `logo-${Date.now()}.jpg`,
      mimeType: asset.mimeType || 'image/jpeg',
    });
  };

  const openChooser = () => setSheetOpen(true);

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={['#FFFBF8', '#FFF7F2', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <Pressable
          style={({ pressed }) => [styles.logoPressable, pressed && styles.pressed]}
          onPress={openChooser}
          accessibilityRole="button"
          accessibilityLabel={imageUri ? 'Change organization logo' : 'Choose organization logo'}
        >
          <LinearGradient
            colors={['#FFB088', ORANGE, ORANGE_DEEP]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoRing}
          >
            <View style={styles.logoInner}>
              {imageUri ? (
                <>
                  <Image source={{ uri: imageUri }} style={styles.preview} />
                  <View style={styles.previewOverlay} />
                  <View style={styles.changePill}>
                    <Ionicons name="swap-horizontal-outline" size={14} color="#FFFFFF" />
                    <Text style={styles.changePillText}>Change logo</Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.emptyIconWrap}>
                    <LinearGradient
                      colors={['#FFFFFF', '#FFF5EE']}
                      style={styles.emptyIconPlate}
                    >
                      <Ionicons name="storefront-outline" size={38} color={ORANGE} />
                    </LinearGradient>
                  </View>
                  <Text style={styles.emptyTitle}>Add your logo</Text>
                  <Text style={styles.emptySub}>Tap to choose from gallery</Text>
                </>
              )}
            </View>
          </LinearGradient>
        </Pressable>

        <View style={styles.formatRow}>
          <FormatChip label="JPG" />
          <FormatChip label="PNG" />
          <FormatChip label="Max 5 MB" />
        </View>
      </LinearGradient>

      <Pressable
        style={({ pressed }) => [styles.chooseBtn, pressed && styles.pressed]}
        onPress={openChooser}
        accessibilityRole="button"
      >
        <LinearGradient
          colors={[ORANGE, ORANGE_DEEP]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.chooseBtnGradient}
        >
          <Ionicons name="images-outline" size={20} color="#FFFFFF" />
          <Text style={styles.chooseBtnText}>
            {imageUri ? 'Choose a different logo' : 'Choose from gallery'}
          </Text>
        </LinearGradient>
      </Pressable>

      <View style={styles.hintBanner}>
        <View style={styles.hintIconWrap}>
          <Ionicons name="sparkles" size={16} color={ORANGE} />
        </View>
        <Text style={styles.hintText}>{PROFILE_IMAGE_HINT}</Text>
      </View>

      <ChooseSheet
        visible={sheetOpen}
        onChoose={pickFromLibrary}
        onClose={() => setSheetOpen(false)}
        insets={insets}
      />

      {popup ? (
        <AppPopup
          visible
          variant={popup.variant}
          title={popup.title}
          message={popup.message}
          primaryLabel="OK"
          onPrimary={closePopup}
          onClose={closePopup}
        />
      ) : null}
    </View>
  );
}

const LOGO_SIZE = 168;
const RING = 4;

const styles = StyleSheet.create({
  wrap: {
    gap: 16,
  },
  heroCard: {
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 123, 63, 0.12)',
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  logoPressable: {
    alignItems: 'center',
  },
  logoRing: {
    width: LOGO_SIZE + RING * 2,
    height: LOGO_SIZE + RING * 2,
    borderRadius: (LOGO_SIZE + RING * 2) / 2,
    padding: RING,
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 8,
  },
  logoInner: {
    flex: 1,
    borderRadius: LOGO_SIZE / 2,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  preview: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.08)',
  },
  changePill: {
    position: 'absolute',
    bottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  changePillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyIconWrap: {
    marginBottom: 10,
  },
  emptyIconPlate: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 123, 63, 0.15)',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.2,
  },
  emptySub: {
    marginTop: 4,
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  formatRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 123, 63, 0.18)',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9A3412',
    letterSpacing: 0.2,
  },
  chooseBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  chooseBtnGradient: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  chooseBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  hintBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FFFBF8',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 123, 63, 0.16)',
  },
  hintIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFF0E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: '#475569',
    fontWeight: '500',
    paddingTop: 6,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
});

const sheet = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
  },
  panel: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 18,
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  panelSub: {
    marginTop: 6,
    marginBottom: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#64748B',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 14,
    marginTop: 4,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCopy: {
    flex: 1,
    gap: 2,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  optionHint: {
    fontSize: 13,
    color: '#94A3B8',
  },
  cancelBtn: {
    marginTop: 8,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
  },
});
