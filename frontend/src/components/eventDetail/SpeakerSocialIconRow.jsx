import React from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { getFilledSocialLinksFromRecord, toOpenableUrl } from '@/utils/socialLinks';

function SocialIcon({ field }) {
  if (field.iconPack === 'FontAwesome5') {
    return (
      <FontAwesome5
        name={field.iconName}
        size={18}
        color={field.brandColor}
        brand={Boolean(field.brand)}
      />
    );
  }

  return <Feather name={field.iconName} size={18} color={field.brandColor} />;
}

export default function SpeakerSocialIconRow({ person, style }) {
  const links = getFilledSocialLinksFromRecord(person);
  if (!links.length) return null;

  const openLink = (url) => {
    const openUrl = toOpenableUrl(url);
    if (openUrl) void Linking.openURL(openUrl);
  };

  return (
    <View style={[styles.row, style]}>
      {links.map((link) => (
        <Pressable
          key={link.key}
          onPress={() => openLink(link.url)}
          style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
          accessibilityRole="link"
          accessibilityLabel={`Open ${link.label}`}
        >
          <SocialIcon field={link} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 14,
  },
  chip: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.96 }],
  },
});
