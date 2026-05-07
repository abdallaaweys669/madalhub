import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import EventRoster from '@/components/eventDetail/EventRoster';
import { styles as eventStyles } from '@/constants/eventDetails_styles/eventDetails.styles';

export default function WysiwygRoster({
  roster,
  template,
  onPressAdd,
  onPressPerson,
}) {
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 12 }}>
        <Text style={[eventStyles.sectionTitle, { marginTop: 0, marginBottom: 0 }]}>Program Lineup</Text>
      </View>
      <Text style={{ color: '#6B7280', marginBottom: 10 }}>Add speakers, panelists, moderators, keynote, or host profiles.</Text>
      {template === 'panel' ? (
        <Text style={{ color: '#6B7280', marginBottom: 10 }}>Panel requires at least two panelists and one moderator.</Text>
      ) : null}
      <EventRoster 
        roster={roster} 
        onPersonPress={onPressPerson} 
        ListFooterComponent={
          <Pressable
            onPress={onPressAdd}
            style={{
              width: 64,
              height: 64,
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: '#FDBA74',
              borderRadius: 32,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="add-outline" size={32} color="#EA580C" />
          </Pressable>
        }
      />
    </View>
  );
}
