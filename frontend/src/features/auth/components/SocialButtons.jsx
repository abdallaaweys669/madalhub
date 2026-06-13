import React from 'react';
import { View, Pressable, Image } from 'react-native';

export default function SocialButtons() {
  return (
    <View style={{ marginTop: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
        <Pressable>
          <Image source={require('@/assets/facebook.png')} style={{ width: 36, height: 36 }} />
        </Pressable>

        <Pressable>
          <Image source={require('@/assets/google.png')} style={{ width: 36, height: 36 }} />
        </Pressable>

        <Pressable>
          <Image source={require('@/assets/apple.png')} style={{ width: 36, height: 36 }} />
        </Pressable>
      </View>
    </View>
  );
}
