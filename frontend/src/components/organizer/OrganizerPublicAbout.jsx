import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import VerificationBadgeWhite from '@/assets/verification badge white mode.svg';
import OrganizerSocialIconRow from '@/components/organizer/OrganizerSocialIconRow';
import { formatCount } from '@/components/organizer/OrganizerProfileChrome';
import { COLORS } from '@/theme/colors';
import { formatSocialLinkDisplay, getFilledOrganizerSocialLinks } from '@/utils/socialLinks';

const COLLAPSED_LINES = 5;

function descriptionNeedsToggle(text) {
  const value = String(text ?? '').trim();
  if (!value) return false;
  if (value.length > 220) return true;
  return value.split('\n').length > COLLAPSED_LINES;
}

function AboutSectionTitle({ children }) {
  return (
    <Text
      allowFontScaling={false}
      style={{
        color: COLORS.textPrimary,
        fontSize: 13,
        fontWeight: '800',
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        marginBottom: 10,
      }}
    >
      {children}
    </Text>
  );
}

function ExpandableAboutText({ text }) {
  const [expanded, setExpanded] = useState(false);
  const showToggle = useMemo(() => descriptionNeedsToggle(text), [text]);

  return (
    <View>
      <Text
        allowFontScaling={false}
        numberOfLines={expanded || !showToggle ? undefined : COLLAPSED_LINES}
        style={{ color: COLORS.textSecondary, fontSize: 15, lineHeight: 24 }}
      >
        {text}
      </Text>
      {showToggle ? (
        <Pressable
          onPress={() => setExpanded((prev) => !prev)}
          hitSlop={8}
          style={{ marginTop: 8, alignSelf: 'flex-start' }}
        >
          <Text style={{ color: COLORS.primary, fontSize: 14, fontWeight: '700' }}>
            {expanded ? 'Show less' : 'Read more'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function ContactRow({
  icon,
  iconColor = COLORS.primary,
  iconBg = COLORS.primarySoft,
  label,
  value,
  hint,
  onPress,
}) {
  const content = (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: iconBg,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <Feather name={icon} size={18} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          allowFontScaling={false}
          style={{ color: COLORS.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8 }}
        >
          {label}
        </Text>
        <Text
          allowFontScaling={false}
          numberOfLines={2}
          style={{ color: COLORS.textPrimary, fontSize: 15, fontWeight: '600', marginTop: 2 }}
        >
          {value}
        </Text>
        {hint ? (
          <Text style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 3 }}>{hint}</Text>
        ) : null}
      </View>
      {onPress ? <Feather name="chevron-right" size={16} color={COLORS.textMuted} /> : null}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.82 : 1 })}
      accessibilityRole="link"
    >
      {content}
    </Pressable>
  );
}

function buildActivitySummary(profile) {
  const events = Number(profile?.eventsCount || 0);
  const attendees = Number(profile?.attendeesTotal || 0);
  const upcoming = Number(profile?.upcomingEventsCount || 0);

  const parts = [];
  if (events > 0) {
    parts.push(`${formatCount(events)} event${events === 1 ? '' : 's'} hosted`);
  }
  if (attendees > 0) {
    parts.push(`${formatCount(attendees)} attendee${attendees === 1 ? '' : 's'}`);
  }
  if (upcoming > 0) {
    parts.push(`${formatCount(upcoming)} upcoming`);
  }

  return parts.join(' · ');
}

export default function OrganizerPublicAbout({
  profile,
  isVerified,
  onContactEmail,
  onOpenWebsite,
  onBrowseEvents,
}) {
  const aboutDescription = String(profile?.organizationDescription || '').trim();
  const organizerTypeLabel = String(profile?.organizerTypeLabel || '').trim();
  const locationLabel = String(profile?.location || '').trim();
  const emailRaw = String(profile?.email || '').trim();
  const websiteRaw = String(profile?.website || '').trim();
  const websiteDisplay = formatSocialLinkDisplay(websiteRaw);
  const hasEmail = emailRaw.includes('@');
  const hasWebsite = Boolean(websiteRaw);
  const hasSocial = getFilledOrganizerSocialLinks(profile).length > 0;
  const activitySummary = buildActivitySummary(profile);
  const displayName = profile?.displayName || profile?.organizationName || 'This organizer';

  const hasContactSection = hasEmail || hasWebsite || locationLabel;
  const showTrustRow = isVerified || organizerTypeLabel;

  return (
    <View style={{ marginBottom: 16 }}>
      {showTrustRow ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {isVerified ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 999,
                backgroundColor: '#ECFDF3',
                borderWidth: 1,
                borderColor: '#BBF7D0',
              }}
            >
              <VerificationBadgeWhite width={14} height={14} />
              <Text style={{ color: '#15803D', fontSize: 12, fontWeight: '700' }}>Verified organizer</Text>
            </View>
          ) : null}
          {organizerTypeLabel ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 999,
                backgroundColor: COLORS.primarySoft,
                borderWidth: 1,
                borderColor: COLORS.primaryBorder,
              }}
            >
              <Feather name="briefcase" size={13} color={COLORS.primary} />
              <Text style={{ color: COLORS.textPrimary, fontSize: 12, fontWeight: '700' }}>
                {organizerTypeLabel}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <View
        style={{
          backgroundColor: COLORS.card,
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: COLORS.border,
          marginBottom: 14,
        }}
      >
        <AboutSectionTitle>About</AboutSectionTitle>
        {aboutDescription ? (
          <ExpandableAboutText text={aboutDescription} />
        ) : (
          <Text style={{ color: COLORS.textSecondary, fontSize: 15, lineHeight: 23 }}>
            {displayName} hasn&apos;t shared their story yet. Check the Events tab to see what they&apos;re hosting.
          </Text>
        )}
        {activitySummary ? (
          <View
            style={{
              marginTop: 14,
              paddingTop: 14,
              borderTopWidth: 1,
              borderTopColor: COLORS.border,
            }}
          >
            <Text style={{ color: COLORS.textMuted, fontSize: 12, fontWeight: '700', marginBottom: 4 }}>
              ON MADALHUB
            </Text>
            <Text style={{ color: COLORS.textPrimary, fontSize: 14, fontWeight: '600', lineHeight: 21 }}>
              {activitySummary}
            </Text>
          </View>
        ) : null}
      </View>

      {hasContactSection ? (
        <View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 8,
            borderWidth: 1,
            borderColor: COLORS.border,
            marginBottom: hasSocial ? 14 : 0,
          }}
        >
          <AboutSectionTitle>Contact</AboutSectionTitle>
          <Text style={{ color: COLORS.textSecondary, fontSize: 13, lineHeight: 19, marginBottom: 4 }}>
            Send a direct message or visit their site.
          </Text>
          {hasEmail ? (
            <ContactRow
              icon="mail"
              iconColor="#2563EB"
              iconBg="#EFF6FF"
              label="Email"
              value={emailRaw}
              hint="Opens your email app with a MadalHub intro"
              onPress={onContactEmail}
            />
          ) : null}
          {hasWebsite ? (
            <ContactRow
              icon="globe"
              label="Website"
              value={websiteDisplay}
              hint="Visit their official site"
              onPress={onOpenWebsite}
            />
          ) : null}
          {locationLabel ? (
            <ContactRow icon="map-pin" label="Based in" value={locationLabel} />
          ) : null}
        </View>
      ) : null}

      {hasSocial ? (
        <View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 14,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <AboutSectionTitle>Connect</AboutSectionTitle>
          <Text style={{ color: COLORS.textSecondary, fontSize: 13, lineHeight: 19, marginBottom: 8 }}>
            Follow or message on social media.
          </Text>
          <OrganizerSocialIconRow profile={profile} centered={false} style={{ marginTop: 0 }} />
        </View>
      ) : null}

      {onBrowseEvents ? (
        <Pressable
          onPress={onBrowseEvents}
          style={({ pressed }) => ({
            marginTop: 14,
            minHeight: 48,
            borderRadius: 14,
            backgroundColor: COLORS.primary,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <Text style={{ color: COLORS.card, fontWeight: '800', fontSize: 15 }}>Browse events</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
