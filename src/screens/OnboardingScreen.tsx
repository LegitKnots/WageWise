import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, User, Bell, Wallet, CheckCircle } from 'lucide-react-native';
import { useUser } from 'context/user';
import { useTheme } from 'context/ThemeContext';
import { COLORS } from 'constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationService from 'services/NotificationService';

const ONBOARDING_KEY = '@app:onboarding_completed';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  component: React.ComponentType<OnboardingStepProps>;
}

interface OnboardingStepProps {
  onNext: () => void;
  onSkip: () => void;
}

// Step 1: Welcome
function WelcomeStep({ onNext }: OnboardingStepProps) {
  const { colors } = useTheme();
  
  return (
    <View style={styles.stepContainer}>
      <View style={[styles.iconContainer, { backgroundColor: colors.primaryMuted }]}>
        <Wallet size={64} color={colors.primary} />
      </View>
      <Text style={[styles.stepTitle, { color: colors.text }]}>Welcome to WageWise</Text>
      <Text style={[styles.stepDescription, { color: colors.textMuted }]}>
        Track your earnings, manage your paychecks, and gain insights into your income patterns.
      </Text>
      <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={onNext}>
        <Text style={styles.primaryButtonText}>Get Started</Text>
        <ChevronRight size={20} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
}

// Step 2: Personal Info
function PersonalInfoStep({ onNext, onSkip }: OnboardingStepProps) {
  const { colors } = useTheme();
  const { updateFirstName, updateLastName } = useUser();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const handleNext = async () => {
    if (firstName.trim()) {
      await updateFirstName(firstName.trim());
    }
    if (lastName.trim()) {
      await updateLastName(lastName.trim());
    }
    onNext();
  };

  return (
    <View style={styles.stepContainer}>
      <View style={[styles.iconContainer, { backgroundColor: colors.primaryMuted }]}>
        <User size={64} color={colors.primary} />
      </View>
      <Text style={[styles.stepTitle, { color: colors.text }]}>What's your name?</Text>
      <Text style={[styles.stepDescription, { color: colors.textMuted }]}>
        This helps personalize your experience.
      </Text>
      
      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.textMuted }]}>First Name</Text>
          <TextInput
            style={[styles.textInput, { 
              backgroundColor: colors.card, 
              borderColor: colors.border, 
              color: colors.text 
            }]}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Enter your first name"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="words"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Last Name</Text>
          <TextInput
            style={[styles.textInput, { 
              backgroundColor: colors.card, 
              borderColor: colors.border, 
              color: colors.text 
            }]}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Enter your last name"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="words"
          />
        </View>
      </View>

      <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={handleNext}>
        <Text style={styles.primaryButtonText}>Continue</Text>
        <ChevronRight size={20} color={COLORS.white} />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.secondaryButton} onPress={onSkip}>
        <Text style={[styles.secondaryButtonText, { color: colors.textMuted }]}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );
}

// Step 3: Notifications
function NotificationsStep({ onNext, onSkip }: OnboardingStepProps) {
  const { colors } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const handleToggleNotifications = async () => {
    try {
      if (!notificationsEnabled) {
        const granted = await NotificationService.requestPermissions();
        if (granted) {
          setNotificationsEnabled(true);
        } else {
          Alert.alert(
            'Notifications Disabled',
            'You can enable notifications later in Settings.',
            [{ text: 'OK' }]
          );
        }
      } else {
        setNotificationsEnabled(false);
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
    }
  };

  return (
    <View style={styles.stepContainer}>
      <View style={[styles.iconContainer, { backgroundColor: colors.primaryMuted }]}>
        <Bell size={64} color={colors.primary} />
      </View>
      <Text style={[styles.stepTitle, { color: colors.text }]}>Stay on top of your pay</Text>
      <Text style={[styles.stepDescription, { color: colors.textMuted }]}>
        Get notified about upcoming paydays and important updates.
      </Text>
      
      <View style={[styles.notificationCard, { 
        backgroundColor: colors.card, 
        borderColor: colors.border 
      }]}>
        <View style={styles.notificationHeader}>
          <Text style={[styles.notificationTitle, { color: colors.text }]}>Payday Reminders</Text>
          <TouchableOpacity
            style={[
              styles.toggle,
              { backgroundColor: notificationsEnabled ? colors.primary : colors.border }
            ]}
            onPress={handleToggleNotifications}
          >
            <View
              style={[
                styles.toggleThumb,
                notificationsEnabled && styles.toggleThumbActive
              ]}
            />
          </TouchableOpacity>
        </View>
        <Text style={[styles.notificationDescription, { color: colors.textMuted }]}>
          Receive notifications before your payday to help you plan ahead.
        </Text>
      </View>

      <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={onNext}>
        <Text style={styles.primaryButtonText}>Continue</Text>
        <ChevronRight size={20} color={COLORS.white} />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.secondaryButton} onPress={onSkip}>
        <Text style={[styles.secondaryButtonText, { color: colors.textMuted }]}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );
}

// Step 4: Complete
function CompleteStep({ onNext }: OnboardingStepProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.stepContainer}>
      <View style={[styles.iconContainer, { backgroundColor: colors.primaryMuted }]}>
        <CheckCircle size={64} color={COLORS.success} />
      </View>
      <Text style={[styles.stepTitle, { color: colors.text }]}>You're all set!</Text>
      <Text style={[styles.stepDescription, { color: colors.textMuted }]}>
        Start tracking your earnings and take control of your financial future.
      </Text>
      
      <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={onNext}>
        <Text style={styles.primaryButtonText}>Get Started</Text>
        <ChevronRight size={20} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
}

// Onboarding steps configuration
const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome',
    description: 'Get started with WageWise',
    icon: Wallet,
    component: WelcomeStep,
  },
  {
    id: 'personal',
    title: 'Personal Info',
    description: 'Tell us about yourself',
    icon: User,
    component: PersonalInfoStep,
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Stay updated',
    icon: Bell,
    component: NotificationsStep,
  },
  {
    id: 'complete',
    title: 'Complete',
    description: 'Ready to go',
    icon: CheckCircle,
    component: CompleteStep,
  },
];

export default function OnboardingScreen({ navigation }: { navigation: any }) {
  const { colors } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });
    } else {
      completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      navigation.replace('TabNavigator');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      navigation.replace('TabNavigator'); // Still proceed even if storage fails
    }
  };

  const CurrentStepComponent = ONBOARDING_STEPS[currentStep]?.component;

  if (!CurrentStepComponent) {
    return null; // Handle case where currentStep is invalid
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <CurrentStepComponent onNext={handleNext} onSkip={handleSkip} />
      </ScrollView>
      
      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          {ONBOARDING_STEPS.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                { backgroundColor: colors.border },
                index <= currentStep && { backgroundColor: colors.primary }
              ]}
            />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
    paddingBottom: 120, // Extra padding to push content up when keyboard appears
  },
  stepContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 500,
    paddingVertical: 20, // Extra padding for keyboard
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
  },
  stepDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    maxWidth: 300,
  },
  formContainer: {
    width: '100%',
    maxWidth: 300,
    marginBottom: 40,
    paddingBottom: 20, // Extra padding for keyboard
  },
  inputGroup: {
    marginBottom: 24, // Increased spacing between inputs
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16, // Increased padding for better touch target
    paddingHorizontal: 16,
    fontSize: 16,
    minHeight: 52, // Minimum height for better accessibility
  },
  notificationCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
    borderWidth: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.white,
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  notificationDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: COLORS.transparent,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: 'center',
  },
  progressBar: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export { ONBOARDING_KEY };