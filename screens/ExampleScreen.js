import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import RefreshableScrollView from '../components/RefreshableScrollView';

const ExampleScreen = () => {
  const [items, setItems] = useState([
    { id: 1, title: 'Item 1' },
    { id: 2, title: 'Item 2' },
    { id: 3, title: 'Item 3' },
  ]);

  // Simulates an API call that takes 1.5 seconds to complete
  const handleRefresh = async () => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate updating the data
    setItems(prevItems => [
      ...prevItems,
      { id: prevItems.length + 1, title: `Item ${prevItems.length + 1}` }
    ]);
  };

  return (
    <RefreshableScrollView
      onRefresh={handleRefresh}
      style={styles.container}
    >
      {items.map(item => (
        <View key={item.id} style={styles.itemContainer}>
          <Text style={styles.itemText}>{item.title}</Text>
        </View>
      ))}
    </RefreshableScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  itemContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemText: {
    fontSize: 16,
  },
});

export default ExampleScreen; 