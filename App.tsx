import "./global.css";
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Ionicons from 'react-native-vector-icons/Ionicons';

import AuthProvider from './src/providers/AuthProvider';
import { navigationRef } from './src/navigation/RootNavigation';
import { useAuthStore } from './src/store/auth.store';

// Screens
import IndexScreen from './src/screens/index';
// Auth
import LoginScreen from './src/screens/auth/login';
import SignupScreen from './src/screens/auth/signup';
import OtpScreen from './src/screens/auth/otp';
// Tabs
import DashboardScreen from './src/screens/tabs/dashboard/index';
import TransactionsScreen from './src/screens/tabs/transactions/index';
import CustomersScreen from './src/screens/tabs/customers/index';
import SettingsScreen from './src/screens/tabs/settings/index';
import ProfileScreen from './src/screens/tabs/profile/index';
// Other
import PaymentScreen from './src/screens/payment';
import PaymentSuccessScreen from './src/screens/payment-success';
import SubscriptionScreen from './src/screens/subscription';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const AuthStack = createNativeStackNavigator();

const queryClient = new QueryClient();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="/auth/login" component={LoginScreen} />
      <AuthStack.Screen name="/auth/signup" component={SignupScreen} />
      <AuthStack.Screen name="/auth/otp" component={OtpScreen} />
    </AuthStack.Navigator>
  );
}

function TabNavigator() {
  const { user } = useAuthStore();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'home';
          if (route.name === '/tabs/dashboard') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === '/tabs/transactions') iconName = focused ? 'list' : 'list-outline';
          else if (route.name === '/tabs/customers') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === '/tabs/settings') iconName = focused ? 'settings' : 'settings-outline';
          else if (route.name === '/tabs/profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="/tabs/dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="/tabs/transactions" component={TransactionsScreen} options={{ tabBarLabel: 'Transactions' }} />
      {user?.userType === 'BUSINESS' && (
        <Tab.Screen name="/tabs/customers" component={CustomersScreen} options={{ tabBarLabel: 'Customers' }} />
      )}
      <Tab.Screen name="/tabs/settings" component={SettingsScreen} options={{ tabBarLabel: 'Settings' }} />
      <Tab.Screen name="/tabs/profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <AuthProvider>
            <NavigationContainer ref={navigationRef}>
              <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="/" component={IndexScreen} />
                <Stack.Screen name="/auth" component={AuthNavigator} />
                <Stack.Screen name="/tabs" component={TabNavigator} />
                <Stack.Screen name="/payment" component={PaymentScreen} />
                <Stack.Screen name="/payment-success" component={PaymentSuccessScreen} />
                <Stack.Screen name="/subscription" component={SubscriptionScreen} />
              </Stack.Navigator>
            </NavigationContainer>
          </AuthProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
