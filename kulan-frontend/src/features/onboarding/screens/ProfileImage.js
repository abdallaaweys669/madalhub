import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  ActivityIndicator,
  Animated,
  Modal,
  StyleSheet,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import useGuardedRouter from "@/hooks/useGuardedRouter";
import OnboardingHeader from "@/features/onboarding/components/OnboardingHeader";
import WelcomeAnimatedBackground from "@/features/auth/components/welcome/WelcomeAnimatedBackground";
import useOnboardingAnimation from "@/features/onboarding/hooks/useOnboardingAnimation";
import AppPopup from "@/components/common/AppPopup";
import onboardingApi from "@/api/onboarding";
import useAuth from "@/auth/useAuth";
import { mergeAuthenticatedUserFromMe } from "@/auth/mergeAuthenticatedUserFromMe";
import { logApiError } from "@/api/logApiError";

function getInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}

function PhotoActionSheet({ visible, onCamera, onLibrary, onClose, insets }) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={sheet.overlay} onPress={onClose}>
        <Pressable style={[sheet.panel, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>

          <View style={sheet.handle} />
          <Text style={sheet.panelTitle}>Add a profile photo</Text>

          <Pressable style={sheet.option} onPress={onCamera}>
            <View style={sheet.optionIcon}>
              <Ionicons name="camera-outline" size={22} color="#FF7B3F" />
            </View>
            <Text style={sheet.optionText}>Take a photo</Text>
            <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
          </Pressable>

          <View style={sheet.divider} />

          <Pressable style={sheet.option} onPress={onLibrary}>
            <View style={sheet.optionIcon}>
              <Ionicons name="images-outline" size={22} color="#FF7B3F" />
            </View>
            <Text style={sheet.optionText}>Choose from library</Text>
            <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
          </Pressable>

          <Pressable style={sheet.cancelBtn} onPress={onClose}>
            <Text style={sheet.cancelText}>Cancel</Text>
          </Pressable>

        </Pressable>
      </Pressable>
    </Modal>
  );
}

const sheet = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  panel: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E0E0E0",
    alignSelf: "center",
    marginBottom: 16,
  },
  panelTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#AAA",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    gap: 14,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFF5F0",
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#F0F0F0",
    marginLeft: 54,
  },
  cancelBtn: {
    marginTop: 10,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#F7F7F7",
    borderRadius: 14,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#555",
  },
});

export default function ProfileImage() {
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();
  const { user, setUser } = useAuth();

  const [imageUri, setImageUri] = useState(null);
  const [imageAsset, setImageAsset] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [errorPopup, setErrorPopup] = useState(false);
  const [permissionPopup, setPermissionPopup] = useState(false);

  const { fade, slideUp } = useOnboardingAnimation();

  const initials = getInitials(user?.name || user?.fullName || "");

  const handleBack = () => {
    router.replace("/onboarding/Interests");
  };

  const openPicker = async (fromCamera = false) => {
    setSheetVisible(false);
    try {
      let result;
      if (fromCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          setPermissionPopup(true);
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") return;
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: 'images',
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }
      if (!result.canceled && result.assets?.[0]?.uri) {
        setImageAsset(result.assets[0]);
        setImageUri(result.assets[0].uri);
      }
    } catch (e) {
      logApiError(e, "ImagePicker");
    }
  };

  const handleContinue = async () => {
    if (!imageUri) {
      router.replace("/onboarding/OnboardingReady");
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedUri = imageAsset?.uri || imageUri;
      const uriTail = typeof selectedUri === "string" ? selectedUri.split("/").pop()?.split("?")[0] : "";
      const filename = imageAsset?.fileName || (uriTail && String(uriTail).trim()) || `member-profile-${Date.now()}.jpg`;
      const ext = filename.includes(".") ? filename.split(".").pop()?.toLowerCase() : "jpg";
      const mime = imageAsset?.mimeType || (ext === "png" ? "image/png" : "image/jpeg");
      const file = { uri: selectedUri, name: filename, type: mime };

      const formData = new FormData();
      formData.append("file", file);

      await onboardingApi.uploadMemberProfileImage(formData);
      await mergeAuthenticatedUserFromMe(setUser);
      router.replace("/onboarding/OnboardingReady");
    } catch (error) {
      logApiError(error, "POST onboarding/member/profile-image");
      setErrorPopup(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <WelcomeAnimatedBackground />

      <PhotoActionSheet
        visible={sheetVisible}
        insets={insets}
        onCamera={() => openPicker(true)}
        onLibrary={() => openPicker(false)}
        onClose={() => setSheetVisible(false)}
      />

      <AppPopup
        visible={errorPopup}
        variant="warning"
        title="Upload failed"
        message="We couldn't upload your photo right now. You can add it later from your profile."
        primaryLabel="Continue anyway"
        onPrimary={() => {
          setErrorPopup(false);
          router.replace("/onboarding/OnboardingReady");
        }}
        secondaryLabel="Try again"
        onSecondary={() => setErrorPopup(false)}
      />

      <AppPopup
        visible={permissionPopup}
        variant="warning"
        title="Camera access needed"
        message="Please enable camera access for Kulan in your device settings to take a photo."
        primaryLabel="OK"
        onPrimary={() => setPermissionPopup(false)}
      />

      <OnboardingHeader
        step={5}
        total={5}
        onBack={handleBack}
        showSkip
        onSkip={() => router.replace("/onboarding/OnboardingReady")}
      />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fade,
            transform: [{ translateY: slideUp }],
            paddingBottom: Math.max(24, insets.bottom + 16),
          },
        ]}
      >
        <Text style={styles.title}>Your face, your identity</Text>
        <Text style={styles.subtitle}>
          A photo makes your profile feel real and builds trust with event organizers and attendees.
        </Text>

        <Pressable style={styles.avatarWrap} onPress={() => setSheetVisible(true)}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.avatar} />
          ) : (
            <View style={styles.initialsCircle}>
              <Text style={styles.initialsText}>{initials || "?"}</Text>
            </View>
          )}
          <View style={styles.cameraBtn}>
            <Ionicons name="camera" size={18} color="#FFFFFF" />
          </View>
        </Pressable>

        <Text style={styles.tapHint}>Tap to add a photo</Text>

        <View style={styles.footer}>
          <Pressable
            style={[styles.button, isSubmitting && { opacity: 0.6 }]}
            disabled={isSubmitting}
            onPress={handleContinue}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {imageUri ? "Continue" : "Skip for now"}
              </Text>
            )}
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    color: "#222",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    color: "#888",
    marginBottom: 36,
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  avatarWrap: {
    position: "relative",
    marginBottom: 10,
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: "#FF7B3F",
  },
  initialsCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#FFE3D1",
    borderWidth: 3,
    borderColor: "#FF7B3F",
    alignItems: "center",
    justifyContent: "center",
  },
  initialsText: {
    fontSize: 48,
    fontWeight: "700",
    color: "#FF7B3F",
  },
  cameraBtn: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FF7B3F",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
  },
  tapHint: {
    fontSize: 13,
    color: "#AAA",
    marginBottom: 36,
  },
  footer: {
    width: "100%",
    marginTop: "auto",
  },
  button: {
    width: "100%",
    backgroundColor: "#FF7B3F",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "700",
  },
});
