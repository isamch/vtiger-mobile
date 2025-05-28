import React, { useState } from 'react';
import { ScrollView, RefreshControl } from 'react-native';

/**
 * A reusable ScrollView component with pull-to-refresh functionality.
 * 
 * @param {Object} props
 * @param {Function} props.onRefresh - Optional callback function that returns a Promise to reload data
 * @param {React.ReactNode} props.children - Child components to render inside the ScrollView
 * @param {Object} props.scrollViewProps - Additional props to pass to the ScrollView component
 */
const RefreshableScrollView = ({ onRefresh, children, ...scrollViewProps }) => {
  // State to track whether the view is currently refreshing
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Handles the refresh action when user pulls down
   */
  const handleRefresh = async () => {
    if (!onRefresh) return;

    try {
      setRefreshing(true);
      await onRefresh();
    } catch (error) {
      console.error('Error during refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScrollView
      {...scrollViewProps}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          // Optional props for customizing the refresh control
          colors={['#2196F3']} // Android
          tintColor="#2196F3" // iOS
        />
      }
    >
      {children}
    </ScrollView>
  );
};

export default RefreshableScrollView; 