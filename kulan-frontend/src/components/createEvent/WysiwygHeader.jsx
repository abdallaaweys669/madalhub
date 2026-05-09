import React from 'react';
import { ActivityIndicator, ImageBackground, Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles as eventStyles } from '@/constants/eventDetails_styles/eventDetails.styles';
import { CoverPlaceholder } from '@/components/event/CoverPlaceholder';
import { DEFAULT_COVER_GRADIENT } from '@/api/events';
import { resolveApiAssetUrl } from '@/utils/mediaUrl';

export default function WysiwygHeader({
  coverPath,
  title,
  onBack,
  onPickCover,
  coverUploading = false,
  onOpenSettings,
}) {
  const insets = useSafeAreaInsets();
  const coverUri = coverPath ? resolveApiAssetUrl(coverPath) : null;

  return (
    <View style={[eventStyles.headerWrapper, { height: 280, paddingTop: 0 }]}>
      {coverUri ? (
        <ImageBackground source={{ uri: coverUri }} style={[eventStyles.headerImage, { height: '100%' }]} resizeMode="cover">
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.55)']} locations={[0.4, 1]} style={eventStyles.headerGradient} />
        </ImageBackground>
      ) : (
        <View style={[eventStyles.headerImage, { height: '100%' }]}>
          <CoverPlaceholder
            letter={title || 'Event'}
            gradient={DEFAULT_COVER_GRADIENT}
            borderRadius={0}
            style={{ flex: 1 }}
            letterSize={54}
          />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.55)']} locations={[0.4, 1]} style={eventStyles.headerGradient} />
        </View>
      )}

      <View style={[eventStyles.headerActionsRow, { top: insets.top + 8 }]}>
        <Pressable onPress={onBack} style={eventStyles.iconButton}>
          <Feather name="arrow-left" size={20} color="#FFFFFF" />
        </Pressable>
        <Pressable onPress={onOpenSettings} style={eventStyles.iconButton}>
          <Feather name="settings" size={18} color="#FFFFFF" />
        </Pressable>
      </View>

      {!coverUri ? (
        <Pressable
          onPress={onPickCover}
          style={{
            position: 'absolute',
            alignSelf: 'center',
            top: '42%',
            marginTop: -30,
            minWidth: 190,
            borderRadius: 16,
            backgroundColor: 'rgba(13,17,28,0.5)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.28)',
            paddingVertical: 12,
            paddingHorizontal: 18,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {coverUploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 7,
                }}
              >
                <Feather name="image" size={18} color="#fff" />
              </View>
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>Upload Cover</Text>
              <Text style={{ color: 'rgba(255,255,255,0.82)', fontSize: 12, marginTop: 2 }}>Tap to choose photo</Text>
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
