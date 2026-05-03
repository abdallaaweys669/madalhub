import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import OnboardingHeader from '@/features/onboarding/components/OnboardingHeader';
import Chip from '@/features/onboarding/components/Chip';
import styles from "@/constants/onboardingStyles/styles";
import onboardingApi from "@/api/onboarding";
import useAuth from '@/auth/useAuth';

export default function Interests() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useAuth();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/onboarding/WelcomeIntro');
  };
  const [interests, setInterests] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    const fetchInterests = async () => {
      try {
        const interestsList = await onboardingApi.getInterests();
        setInterests(interestsList);
      } catch (error) {
        setApiError("Could not load interests. Please try again later.");
        console.error("Fetch interests error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInterests();
  }, []);

  const toggle = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleFinish = async () => {
    if (selectedIds.length === 0) return;

    setIsSubmitting(true);
    setApiError("");

    try {
      await onboardingApi.updateInterests(selectedIds);
      await completeOnboarding();
      router.replace("/(tabs)");
    } catch (error) {
      setApiError("Failed to save interests. Please try again.");
      console.error("Interests update error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;
    }

    if (apiError && interests.length === 0) {
      return <Text style={[styles.errorText, { textAlign: 'center', marginTop: 50 }]}>{apiError}</Text>;
    }

    return (
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {interests.map((item) => (
          <Chip
            key={item.id}
            label={item.name}
            selected={selectedIds.includes(item.id)}
            onPress={() => toggle(item.id)}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <OnboardingHeader step={4} total={4} onBack={handleBack} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
      >
        <Text style={styles.title}>What are you interested in?</Text>
        <Text style={styles.subtitle}>Select your interests</Text>

        {apiError && interests.length > 0 ? <Text style={styles.errorText}>{apiError}</Text> : null}
        
        {renderContent()}

      </ScrollView>

      <View
        style={{
          paddingHorizontal: 24,
          paddingBottom: Math.max(24, insets.bottom + 16),
          backgroundColor: '#FFFFFF',
        }}
      >
        <Pressable
          disabled={selectedIds.length === 0 || isSubmitting}
          onPress={handleFinish}
          style={[
            styles.button,
            { opacity: selectedIds.length > 0 && !isSubmitting ? 1 : 0.4, marginTop: 0 },
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Finish</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
