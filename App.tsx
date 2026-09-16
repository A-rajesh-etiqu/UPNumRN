import "./global.css";
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useFonts } from 'expo-font';
import { Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { Inter_400Regular, Inter_500Medium, Inter_700Bold } from '@expo-google-fonts/inter';

import AuthProvider from './src/providers/AuthProvider';
import { navigationRef } from './src/navigation/RootNavigation';
import { useAuthStore } from './src/store/auth.store';

// Screens
import IndexScreen from './src/screens/index';
// Auth
import LoginScreen from './src/screens/auth/login';
import SignupScreen from './src/screens/auth/signup';
import OtpScreen from './src/screens/auth/otp';
import VerifyUPIScreen from './src/screens/auth/verify-upi';
import ForgotPasswordScreen from './src/screens/auth/forgot-password';
// Admin
import AdminScreen from './src/screens/admin/index';
import AdminLayout from './src/screens/admin/_layout';
// Tabs
import DashboardScreen from './src/screens/tabs/dashboard/index';
import TransactionsScreen from './src/screens/tabs/transactions/index';
import CustomersScreen from './src/screens/tabs/customers/index';
import SettingsScreen from './src/screens/tabs/settings/index';
import ProfileScreen from './src/screens/tabs/profile/index';
// Other
import PaymentScreen from './src/screens/payment';
import PaymentSuccessScreen from './src/screens/payment-success';
import SubscriptionIndexScreen from './src/screens/tabs/subscription/index';
import SubscriptionHistoryScreen from './src/screens/tabs/subscription/history';
import AiInsightsScreen from './src/screens/tabs/dashboard/ai-insights';

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
      <AuthStack.Screen name="/auth/verify-upi" component={VerifyUPIScreen} />
      <AuthStack.Screen name="/auth/forgot-password" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

import { useWindowDimensions, View } from 'react-native';
import Sidebar from './src/components/layout/Sidebar';
import { useAppTheme } from './src/theme';

function TabNavigator() {
  const { user } = useAuthStore();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const { colors } = useAppTheme();
  
  return (
    <View style={{ flex: 1, flexDirection: isDesktop ? 'row' : 'column', backgroundColor: colors.background }}>
      {isDesktop && <Sidebar />}
      <View style={{ flex: 1 }}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarStyle: { display: isDesktop ? 'none' : 'flex' },
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
          <Tab.Screen name="/tabs/profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile', tabBarItemStyle: { display: 'none' }, tabBarButton: () => null }} />
          <Tab.Screen name="/tabs/subscription" component={SubscriptionIndexScreen} options={{ tabBarLabel: 'Subscriptions', tabBarItemStyle: { display: 'none' }, tabBarButton: () => null }} />
          <Tab.Screen name="/tabs/subscription/history" component={SubscriptionHistoryScreen} options={{ tabBarLabel: 'Billing History', tabBarItemStyle: { display: 'none' }, tabBarButton: () => null }} />
          <Tab.Screen name="/tabs/dashboard/ai-insights" component={AiInsightsScreen} options={{ tabBarLabel: 'AI Insights', tabBarItemStyle: { display: 'none' }, tabBarButton: () => null }} />
        </Tab.Navigator>
      </View>
    </View>
  );
}

const AdminRoute = () => (
  <AdminLayout>
    <AdminScreen />
  </AdminLayout>
);

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

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
                <Stack.Screen name="/admin" component={AdminRoute} />
                <Stack.Screen name="/payment" component={PaymentScreen} />
                <Stack.Screen name="/payment-success" component={PaymentSuccessScreen} />
              </Stack.Navigator>
            </NavigationContainer>
          </AuthProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
