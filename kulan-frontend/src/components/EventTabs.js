import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '@/constants/home.styles'; // Using alias for styles

// Define the props the component will accept
interface EventTabsProps {
  activeTab: string;
  onTabPress: (tabName: string) => void;
  tabs: string[];
}

const EventTabs: React.FC<EventTabsProps> = ({ activeTab, onTabPress, tabs }) => {
  return (
    <View style={styles.tabsContainer}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, activeTab === tab && styles.activeTab]}
          onPress={() => onTabPress(tab)}
        >
          <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default EventTabs;