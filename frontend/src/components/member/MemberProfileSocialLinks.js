import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { getFilledSocialLinks, toOpenableUrl } from '@/utils/socialLinks';

function SocialLinkIcon({ field }) {
  if (field.iconPack === 'FontAwesome5') {
    return (
      <FontAwesome5
        name={field.iconName}
        size={22}
        color={field.brandColor}
        brand={Boolean(field.brand)}
      />
    );
  }

  return <Feather name={field.iconName} size={22} color={field.brandColor} />;
}

export function MemberProfileSocialLinks({ user, colors, readOnly = false }) {
  const links = getFilledSocialLinks(user);
  if (!links.length) return null;

  const handleOpen = (url) => {
    const openUrl = toOpenableUrl(url);
    if (!openUrl) return;
    void Linking.openURL(openUrl);
  };

  return (
    <View style={[styles.section, { borderTopColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Social & web</Text>
      <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
        {readOnly
          ? 'Links this member chose to share.'
          : 'Optional links you added in Edit profile.'}
      </Text>

      {links.map((link) => (
        <TouchableOpacity
          key={link.key}
          style={[styles.row, { borderTopColor: colors.border }]}
          onPress={() => handleOpen(link.url)}
          activeOpacity={0.75}
        >
          <View style={styles.iconSlot}>
            <SocialLinkIcon field={link} />
          </View>
          <View style={styles.textCol}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{link.label}</Text>
            <Text style={[styles.value, { color: colors.text }]} numberOfLines={1}>
              {link.displayUrl}
            </Text>
          </View>
          <Feather name="external-link" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    paddingTop: 22,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 15,
  },
  sectionSubtitle: {
    marginTop: -8,
    marginBottom: 14,
    fontSize: 13,
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  iconSlot: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  value: {
    marginTop: 3,
    fontSize: 16,
    fontWeight: '700',
  },
});
