import React from 'react';
import { FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CategoryFormatSheet({
  visible,
  mode = 'category',
  onClose,
  categories,
  categorySearch,
  onChangeCategorySearch,
  selectedCategoryId,
  onSelectCategory,
  templates,
  selectedTemplate,
  onSelectTemplate,
  eduSubtypes,
  selectedEduSubtype,
  onSelectEduSubtype,
  primary,
  primarySoft,
}) {
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
            maxHeight: '80%',
          }}
        >
          <View style={{ alignSelf: 'center', width: 48, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', marginBottom: 12 }} />
          <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 16 }}>
            {mode === 'format' ? 'Select event format' : 'Select category'}
          </Text>

          {mode === 'format' ? (
            <View>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                {templates.map((item) => {
                  const active = item.key === selectedTemplate;
                  return (
                    <Pressable
                      key={item.key}
                      onPress={() => {
                        onSelectTemplate(item.key);
                        if (item.key !== 'education') onClose();
                      }}
                      style={{
                        flex: 1,
                        borderWidth: 1.5,
                        borderColor: active ? primary : '#E5E7EB',
                        borderRadius: 12,
                        backgroundColor: active ? primarySoft : '#fff',
                        paddingVertical: 14,
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Ionicons name={item.icon} size={22} color={active ? primary : '#6B7280'} />
                      <Text style={{ fontWeight: '700', color: active ? primary : '#111827' }}>{item.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {selectedTemplate === 'education' ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {eduSubtypes.map((item) => {
                    const active = selectedEduSubtype === item.key;
                    return (
                      <Pressable
                        key={item.key}
                        onPress={() => {
                          onSelectEduSubtype(item.key);
                          onClose();
                        }}
                        style={{
                          borderWidth: 1,
                          borderColor: active ? primary : '#E5E7EB',
                          borderRadius: 999,
                          backgroundColor: active ? primarySoft : '#fff',
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                        }}
                      >
                        <Text style={{ color: active ? primary : '#111827', fontWeight: '600' }}>{item.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </View>
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
                renderItem={({ item }) => {
                  const selected = String(selectedCategoryId) === String(item.id);
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
                      }}
                    >
                      <Text style={{ color: selected ? primary : '#111827', fontWeight: '600', fontSize: 15 }}>{item.name}</Text>
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
