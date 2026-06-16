import React, { useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { MemberInitialAvatar } from '@/components/member/MemberInitialAvatar';
import { buildProfileImageUri } from '@/utils/mediaUrl';

type ProfileImageUser = {
  profileImg?: string | null;
  profile_img?: string | null;
  avatarUrl?: string | null;
  avatar_url?: string | null;
};

type MemberProfileAvatarProps = {
  user?: ProfileImageUser | null;
  name: string;
  size?: number;
  borderColor?: string;
  borderWidth?: number;
  style?: StyleProp<ViewStyle>;
  hidePhoto?: boolean;
};

/** Member profile photo with initials fallback (home header, profile screen, etc.). */
export function MemberProfileAvatar({
  user,
  name,
  size = 88,
  borderColor = '#FFFFFF',
  borderWidth = 3,
  style,
  hidePhoto = false,
}: MemberProfileAvatarProps) {
  const [loadFailed, setLoadFailed] = useState(false);
  const avatarUri = useMemo(
    () => (hidePhoto ? undefined : buildProfileImageUri(user)),
    [hidePhoto, user?.profileImg, user?.profile_img, user?.avatarUrl, user?.avatar_url],
  );

  useEffect(() => {
    setLoadFailed(false);
  }, [avatarUri]);

  if (avatarUri && !loadFailed) {
    return (
      <Image
        source={{ uri: avatarUri }}
        style={[
          styles.photo,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor,
            borderWidth,
          },
          style,
        ]}
        resizeMode="cover"
        onError={() => setLoadFailed(true)}
        accessibilityLabel={`${name} profile photo`}
      />
    );
  }

  return (
    <MemberInitialAvatar
      name={name}
      size={size}
      borderColor={borderColor}
      borderWidth={borderWidth}
      style={style}
    />
  );
}

const styles = StyleSheet.create({
  photo: {
    backgroundColor: '#E5E7EB',
  },
});
