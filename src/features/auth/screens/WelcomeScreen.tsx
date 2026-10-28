import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../navigation/types';
import { theme } from '../../../config/theme';
import { Button } from '../../../components/ui/Button';
import { Compass, ShieldCheck, Users, MapPin } from 'lucide-react-native';

type WelcomeScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'Welcome'
>;

interface WelcomeScreenProps {
  navigation: WelcomeScreenNavigationProp;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        {/* Top Hero Brand Section */}
        <View style={styles.brandHero}>
          <View style={styles.iconCircle}>
            <Compass size={36} color={theme.colors.primary} />
          </View>
          <Text style={styles.brandEyebrow}>WELCOME TO VOYMATE</Text>
          <Text style={styles.headline}>Never travel alone again.</Text>
          <Text style={styles.subheadline}>
            Connect with verified solo travelers who share your destination, dates, and spirit of adventure.
          </Text>
        </View>

        {/* Feature Highlights Grid */}
        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <View style={styles.featureIconBox}>
              <Users size={18} color={theme.colors.primary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Smart Compatibility</Text>
              <Text style={styles.featureDescription}>
                Match by dates, budget bracket, and travel pace.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIconBox}>
              <MapPin size={18} color={theme.colors.primary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Nearby Discovery</Text>
              <Text style={styles.featureDescription}>
                Find fellow travelers currently in the same city.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIconBox}>
              <ShieldCheck size={18} color={theme.colors.primary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Verified & Safe</Text>
              <Text style={styles.featureDescription}>
                Identity-verified profiles with P2P audio & video calling.
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.footerActions}>
          <Button
            title="Create an Account"
            variant="primary"
            size="lg"
            onPress={() => navigation.navigate('Signup')}
            style={styles.signupButton}
          />

          <Button
            title="I already have an account"
            variant="secondary"
            size="lg"
            onPress={() => navigation.navigate('Login')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    justifyContent: 'space-between',
  },
  brandHero: {
    marginTop: theme.spacing.md,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  brandEyebrow: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    letterSpacing: 2,
    marginBottom: 6,
  },
  headline: {
    fontSize: theme.typography.sizes.display,
    fontWeight: theme.typography.weights.black,
    color: theme.colors.textPrimary,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  subheadline: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginTop: theme.spacing.md,
  },
  featureList: {
    marginVertical: theme.spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  featureIconBox: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
    marginTop: 2,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
  },
  featureDescription: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textMuted,
    marginTop: 2,
    lineHeight: 18,
  },
  footerActions: {
    marginBottom: theme.spacing.sm,
  },
  signupButton: {
    marginBottom: theme.spacing.md,
  },
});
