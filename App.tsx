import React from 'react';
import { useColorScheme } from 'react-native';
import { NavigationContainer, DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { 
  PaperProvider, 
  MD3DarkTheme, 
  MD3LightTheme, 
  adaptNavigationTheme 
} from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import ScanScreen from './src/screens/ScanScreen';
import DetailScreen from './src/screens/DetailScreen';

const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
});

const CombinedDefaultTheme = {
  ...MD3LightTheme,
  version: 3,
  colors: {
    ...MD3LightTheme.colors,
    ...LightTheme.colors,
    primary: '#4F46E5',
  },
};

const CombinedDarkTheme = {
  ...MD3DarkTheme,
  version: 3,
  colors: {
    ...MD3DarkTheme.colors,
    ...DarkTheme.colors,
    primary: '#6366F1',
  },
};

const Stack = createNativeStackNavigator();

export default function App() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? CombinedDarkTheme : CombinedDefaultTheme;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <NavigationContainer theme={theme}>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
            <Stack.Navigator 
              initialRouteName="Scan"
              screenOptions={{
                headerStyle: { backgroundColor: theme.colors.primary },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: '700' },
              }}
            >
              <Stack.Screen 
                name="Scan" 
                component={ScanScreen} 
                options={{ title: 'Scan Barcode' }} 
              />
              <Stack.Screen 
                name="Detail" 
                component={DetailScreen} 
                options={{ title: 'Item Details' }} 
              />
            </Stack.Navigator>
          </NavigationContainer>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
