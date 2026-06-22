import React, { useMemo } from 'react';
import { FlatList, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { resolveInterestIcon, toFilledCategoryIcon } from '@/components/explore/exploreCategoryIcons';

export default function CategoryFormatSheet({
  visible,
  mode = 'category',
  onClose,
  categories,
  categorySearch,
  onChangeCategorySearch,
  selectedCategoryId,
  onSelectCategory,
  eventFormats,
  selectedEventFormat,
  onSelectEventFormat,
  primary,
  primarySoft,
}) {
  const groupedFormats = useMemo(() => {
    const groups = new Map();
    (eventFormats || []).forEach((item) => {
      const group = item.group || 'Other';
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push(item);
    });
    return Array.from(groups.entries());
  }, [eventFormats]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.42)' }} onPress={onClose}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            marginTop: 'auto',
            backgroundColor: '#fff',
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            padding: 16,
            maxHeight: '85%',
          }}
        >
          <View style={{ alignSelf: 'center', width: 48, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', marginBottom: 12 }} />
          <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 16 }}>
            {mode === 'format' ? 'Select event type' : 'Select category'}
          </Text>

          {mode === 'format' ? (
            <ScrollView style={{ maxHeight: 420 }} keyboardShouldPersistTaps="handled">
              {groupedFormats.map(([group, items]) => (
                <View key={group} style={{ marginBottom: 14 }}>
                  <Text style={{ color: '#6B7280', fontWeight: '700', fontSize: 12, marginBottom: 8, textTransform: 'uppercase' }}>
                    {group}
                  </Text>
                  <View style={{ gap: 8 }}>
                    {items.map((item) => {
                      const active = item.key === selectedEventFormat;
                      return (
                        <Pressable
                          key={item.key}
                          onPress={() => {
                            onSelectEventFormat(item.key);
                            onClose();
                          }}
                          style={{
                            borderWidth: 1.5,
                            borderColor: active ? primary : '#E5E7EB',
                            borderRadius: 12,
                            backgroundColor: active ? primarySoft : '#fff',
                            paddingVertical: 12,
                            paddingHorizontal: 14,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 10,
                          }}
                        >
                          <Ionicons name={item.icon} size={20} color={active ? primary : '#6B7280'} />
                          <Text style={{ fontWeight: '700', color: active ? primary : '#111827', flex: 1 }}>{item.label}</Text>
                          {active ? <Ionicons name="checkmark-circle" size={20} color={primary} /> : null}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={{ flexShrink: 1 }}>
              <TextInput
                value={categorySearch}
                onChangeText={onChangeCategorySearch}
                placeholder="Search categories..."
                placeholderTextColor="#9CA3AF"
                style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 10 }}
              />
              <FlatList
                data={categories}
                keyExtractor={(item) => String(item.id)}
                keyboardShouldPersistTaps="handled"
                style={{ maxHeight: 260 }}
                renderItem={({ item, index }) => {
                  const selected = String(selectedCategoryId) === String(item.id);
                  const iconName = toFilledCategoryIcon(resolveInterestIcon(item, index));
                  return (
                    <Pressable
                      onPress={() => {
                        onSelectCategory(item);
                        onClose();
                      }}
                      style={{
                        borderRadius: 10,
                        paddingHorizontal: 12,
                        paddingVertical: 14,
                        marginBottom: 4,
                        backgroundColor: selected ? primarySoft : '#fff',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: selected ? '#FFEDD5' : '#F3F4F6',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Ionicons name={iconName} size={16} color={selected ? primary : '#6B7280'} />
                        </View>
                        <Text style={{ color: selected ? primary : '#111827', fontWeight: '600', fontSize: 15, flex: 1 }}>
                          {item.name}
                        </Text>
                      </View>
                      {selected ? <Ionicons name="checkmark-circle" size={20} color={primary} /> : null}
                    </Pressable>
                  );
                }}
              />
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
