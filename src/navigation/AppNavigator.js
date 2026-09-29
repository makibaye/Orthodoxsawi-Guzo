import React from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import HomeScreen from '../screens/HomeScreen';
import ToursListScreen from '../screens/ToursListScreen';
import PaymentScreen from '../screens/PaymentScreen';
import TripDetails from '../screens/TripDetails';
import MockPaymentScreen from '../screens/MockpaymentScreen';
import { colors } from '../styles/theme';
import { onboardingSlides } from '../constants/onboarding';
import { onboardingStyles } from '../styles/onboardingStyles';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Tours') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'MockPayment') {
            iconName = focused ? 'card' : 'card-outline';
          }
          return <Icon name={iconName} size={size + 2} color={color} />;
        },
        tabBarActiveTintColor: colors.white,
        tabBarInactiveTintColor: colors.primary,
        tabBarActiveBackgroundColor: colors.primary,
        tabBarInactiveBackgroundColor: colors.background,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 8,
          marginBottom: 30,
          paddingTop: 6,
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          elevation: 10,
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -4 },
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          overflow: 'hidden',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: colors.primary,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 20,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'ዋና ገጽ' }}
      />
      <Tab.Screen
        name="Tours"
        component={ToursListScreen}
        options={{ tabBarLabel: 'ገዳማት' }}
      />
      <Tab.Screen
        name="MockPayment"
        component={MockPaymentScreen}
        options={{ tabBarLabel: 'ክፍያ' }}
      />
    </Tab.Navigator>
  );
}

const ONBOARDING_DONE_KEY = '@orthodoxawi_onboarding_done';

function OnboardingScreen({ navigation }) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const slide = onboardingSlides[activeIndex];
  const isLastSlide = activeIndex === onboardingSlides.length - 1;

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_DONE_KEY, 'true');
    } catch (error) {
      console.log('Error saving onboarding state:', error);
    }
    navigation.replace('MainTabs');
  };

  return (
    <View style={onboardingStyles.onboardingContainer}>
      <ScrollView contentContainerStyle={onboardingStyles.onboardingScroll}>
        <Image
          source={slide.image}
          style={onboardingStyles.onboardingImage}
          resizeMode="contain"
        />

        <Text style={onboardingStyles.onboardingTitle}>{slide.title}</Text>
        <Text style={onboardingStyles.onboardingDescription}>{slide.description}</Text>
      </ScrollView>

      <View style={onboardingStyles.onboardingActions}>
        <Pressable
          onPress={async () => {
            try {
              await AsyncStorage.setItem(ONBOARDING_DONE_KEY, 'true');
            } catch (error) {
              console.log('Error saving onboarding state:', error);
            }
            navigation.replace('MainTabs');
          }}
          style={onboardingStyles.skipButton}
        >
          <Text style={onboardingStyles.skipText}>Skip</Text>
        </Pressable>

        <Pressable
          onPress={async () => {
            if (isLastSlide) {
              await completeOnboarding();
              return;
            }
            setActiveIndex((prev) => prev + 1);
          }}
          style={onboardingStyles.nextButton}
        >
          <Text style={onboardingStyles.nextText}>{isLastSlide ? 'Get Started' : 'Next'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function SplashScreen() {
  return (
    <View style={onboardingStyles.splashContainer}>
      <Image source={require('../../Asset/logo.jpeg')} style={onboardingStyles.logo} resizeMode="contain" />
    </View>
  );
}

export default function AppNavigator() {
  const [isSplashVisible, setIsSplashVisible] = React.useState(true);
  const [initialRoute, setInitialRoute] = React.useState('Onboarding');

  React.useEffect(() => {
    const loadInitialRoute = async () => {
      try {
        const onboardingDone = await AsyncStorage.getItem(ONBOARDING_DONE_KEY);
        setInitialRoute(onboardingDone === 'true' ? 'MainTabs' : 'Onboarding');
      } catch (error) {
        console.log('Error reading onboarding state:', error);
        setInitialRoute('Onboarding');
      } finally {
        setTimeout(() => setIsSplashVisible(false), 2200);
      }
    };

    loadInitialRoute();

    return () => {
      clearTimeout(() => setIsSplashVisible(false));
    };
  }, []);

  if (isSplashVisible) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen
          name="TripDetails"
          component={TripDetails}
          options={{
            headerShown: false,
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="Payment"
          component={PaymentScreen}
          options={{
            headerShown: false,
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
            
      </Stack.Navigator>
    </NavigationContainer>
  );
}
