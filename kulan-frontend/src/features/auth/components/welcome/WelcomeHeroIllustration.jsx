import React from 'react';
import { StyleSheet, View } from 'react-native';

import MemberSvg from '@/assets/member.svg';
import OrganizerSvg from '@/assets/organizer.svg';

const WELCOME_HERO = {
  member: MemberSvg,
  organizer: OrganizerSvg,
};

const HERO_LABELS = {
  member: 'Members connecting at local events',
  organizer: 'Organizer managing events',
};

export default function WelcomeHeroIllustration({ role, width, height }) {
  const Hero = WELCOME_HERO[role];

  return (
    <View
      style={[styles.frame, { width, height }]}
      accessibilityLabel={HERO_LABELS[role]}
    >
      <Hero width={width} height={height} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});
