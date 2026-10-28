import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { X, Lock, Eye, EyeOff } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { profileService } from '../services/profile.service';

interface ResetPasswordModalProps {
  visible: boolean;
  userEmail: string;
  onClose: () => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  visible,
  userEmail,
  onClose,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isLengthValid = newPassword.length >= 8;
  const hasComplexity = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword);

  const handleSubmit = async () => {
    if (!isLengthValid) {
      Alert.alert('Password too short', 'Password must be at least 8 characters long.');
      return;
    }
    if (!hasComplexity) {
      Alert.alert(
        'Weak Password',
        'Password must contain at least one uppercase letter, one lowercase letter, and one number.'
      );
      return;
    }
    if (!passwordsMatch) {
      Alert.alert('Passwords mismatch', 'New password and confirmation do not match.');
      return;
    }

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await profileService.resetPassword(newPassword, userEmail);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Password Updated', 'Your password has been changed successfully.');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        'Could not update password. Please try again.';
      Alert.alert('Error', errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardWrap}
          >
            <View style={styles.card}>
              {/* Close Button */}
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={handleClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={20} color="#151D19" />
              </TouchableOpacity>

              {/* Header Icon & Title */}
              <View style={styles.header}>
                <View style={styles.iconCircle}>
                  <Lock size={22} color="#005440" />
                </View>
                <Text style={styles.title}>Reset Password</Text>
                <Text style={styles.subtitle}>
                  Create a password with at least 8 characters, an uppercase letter, and a number.
                </Text>
              </View>

              {/* Form Fields */}
              <View style={styles.form}>
                {/* New Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>NEW PASSWORD</Text>
                  <View style={styles.inputWrap}>
                    <TextInput
                      style={styles.input}
                      secureTextEntry={!showNewPassword}
                      placeholder="••••••••"
                      placeholderTextColor="#88978E"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      style={styles.eyeBtn}
                      onPress={() => setShowNewPassword((prev) => !prev)}
                    >
                      {showNewPassword ? (
                        <EyeOff size={18} color="#5C6B64" />
                      ) : (
                        <Eye size={18} color="#5C6B64" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
                  <View style={styles.inputWrap}>
                    <TextInput
                      style={styles.input}
                      secureTextEntry={!showConfirmPassword}
                      placeholder="••••••••"
                      placeholderTextColor="#88978E"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      style={styles.eyeBtn}
                      onPress={() => setShowConfirmPassword((prev) => !prev)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} color="#5C6B64" />
                      ) : (
                        <Eye size={18} color="#5C6B64" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {confirmPassword.length > 0 && !passwordsMatch && (
                  <Text style={styles.errorText}>Passwords do not match.</Text>
                )}

                {/* Action Buttons */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={handleClose}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.submitBtn,
                      (!newPassword || !confirmPassword || !passwordsMatch || isSubmitting) &&
                        styles.submitBtnDisabled,
                    ]}
                    onPress={handleSubmit}
                    disabled={!newPassword || !confirmPassword || !passwordsMatch || isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.submitBtnText}>Update Password</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  keyboardWrap: {
    width: '100%',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  closeBtn: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 4,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F5EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#005440',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    color: '#5C6B64',
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 8,
  },
  form: {
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#5C6B64',
    letterSpacing: 0.6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAF8',
    borderWidth: 1,
    borderColor: '#E6EFE9',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#151D19',
    fontWeight: '600',
  },
  eyeBtn: {
    padding: 6,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
    marginTop: -4,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E6EFE9',
    backgroundColor: '#F8FAF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5C6B64',
  },
  submitBtn: {
    flex: 1.5,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#005440',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#005440',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  submitBtnDisabled: {
    opacity: 0.45,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
