import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const Header = () => {
  const { signOut } = useAuth();
  const route = useRoute();
  const navigation = useNavigation();

  const getBreadcrumbs = () => {
    const paths = route.name.split('/');
    return paths.map((path, index) => ({
      name: path,
      isLast: index === paths.length - 1
    }));
  };

  const canGoBack = navigation.canGoBack();

  return (
    <View style={styles.header}>
      <View style={styles.leftSection}>
        {canGoBack && (
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
        )}
        <View style={styles.breadcrumbs}>
          {getBreadcrumbs().map((crumb, index) => (
            <React.Fragment key={index}>
              <TouchableOpacity
                onPress={() => !crumb.isLast && navigation.navigate(crumb.name)}
                disabled={crumb.isLast}
              >
                <Text style={[
                  styles.breadcrumbText,
                  crumb.isLast && styles.activeBreadcrumb
                ]}>
                  {crumb.name}
                </Text>
              </TouchableOpacity>
              {!crumb.isLast && (
                <Text style={styles.breadcrumbSeparator}>{'>'}</Text>
              )}
            </React.Fragment>
          ))}
        </View>
      </View>
      <View style={styles.rightSection}>
        <TouchableOpacity onPress={signOut} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 15,
    paddingHorizontal: 20,
    elevation: 4,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 10,
    padding: 2,
  },
  breadcrumbs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breadcrumbText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  activeBreadcrumb: {
    color: '#fff',
    fontWeight: '500',
  },
  breadcrumbSeparator: {
    color: 'rgba(255, 255, 255, 0.6)',
    marginHorizontal: 5,
    fontSize: 14,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 5,
    marginLeft: 10,
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default Header; 