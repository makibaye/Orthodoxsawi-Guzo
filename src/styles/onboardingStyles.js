import { Dimensions, StyleSheet } from 'react-native';
import { colors } from './theme';

const { width } = Dimensions.get('window');

export const onboardingStyles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  onboardingContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  onboardingScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
  },
  onboardingImage: {
    width: width * 0.7,
    height: width * 0.7,
    marginBottom: 26,
    borderRadius: 28,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 26,
  },
  dotInactive: {
    backgroundColor: colors.accent,
  },
  onboardingTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  onboardingDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.muted,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  onboardingActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 12,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  skipText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  nextButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
  },
  nextText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
});
