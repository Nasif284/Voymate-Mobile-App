import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Country, State, City } from 'country-state-city';
import { OnboardingStackParamList } from '../../../navigation/types';
import { theme } from '../../../config/theme';
import { Button } from '../../../components/ui/Button';
import { useHaptics } from '../../../hooks/useHaptics';
import { useAuthStore } from '../../../store/authStore';
import { apiClient } from '../../../api/client';
import { ENDPOINTS } from '../../../api/endpoints';
import { SearchableSelectModal, SelectOption } from '../../../components/ui/SearchableSelectModal';
import {
  Camera,
  Image as ImageIcon,
  Check,
  AlertCircle,
  MapPin,
  Globe,
  ArrowLeft,
  Plus,
  Sparkles,
  User,
  Heart,
  Navigation as LocationIcon,
  ChevronDown,
} from 'lucide-react-native';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'ProfileDetails'>;

const TOTAL_SUBSTEPS = 5;

const GENDER_OPTIONS = [
  { label: 'Male', value: 'MALE' },
  { label: 'Female', value: 'FEMALE' },
  { label: 'Non-binary', value: 'NON_BINARY' },
] as const;

const POPULAR_SKILLS = [
  'Photography',
  'Navigation',
  'Driving',
  'Camping',
  'Cooking',
  'First Aid',
  'Hiking',
  'Budgeting',
];

const POPULAR_LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Hindi',
  'Arabic',
  'Japanese',
  'Malayalam',
];

const BIO_PROMPTS = [
  'Chasing sunrises & hidden trails ⛰️',
  'Always hunting for local street food 🍜',
  'Slow traveler who loves coffee & history ☕',
];

export const ProfileDetailsScreen: React.FC<Props> = ({ navigation }) => {
  // Current Micro-Step (0: Photos, 1: Bio, 2: Basics, 3: Location, 4: Skills & Languages)
  const [currentSubStep, setCurrentSubStep] = useState(0);

  // Photos
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [coverUri, setCoverUri] = useState<string | null>(null);

  // Bio
  const [bio, setBio] = useState('');

  // Personal Basics
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'NON_BINARY'>('MALE');
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');

  // Location
  const [selectedCountryCode, setSelectedCountryCode] = useState('');
  const [selectedStateCode, setSelectedStateCode] = useState('');
  const [nationality, setNationality] = useState('');
  const [stateName, setStateName] = useState('');
  const [cityName, setCityName] = useState('');
  const [locating, setLocating] = useState(false);

  // Location Modals
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [stateModalVisible, setStateModalVisible] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);

  // Country, State, City Options
  const countryOptions = useMemo<SelectOption[]>(() => {
    return Country.getAllCountries().map((c) => ({
      label: `${c.flag ? `${c.flag} ` : ''}${c.name}`,
      value: c.isoCode,
      sublabel: c.name,
    }));
  }, []);

  const stateOptions = useMemo<SelectOption[]>(() => {
    if (!selectedCountryCode) return [];
    return State.getStatesOfCountry(selectedCountryCode).map((s) => ({
      label: s.name,
      value: s.isoCode,
      sublabel: s.isoCode,
    }));
  }, [selectedCountryCode]);

  const cityOptions = useMemo<SelectOption[]>(() => {
    if (!selectedCountryCode || !selectedStateCode) return [];
    return City.getCitiesOfState(selectedCountryCode, selectedStateCode).map((c) => ({
      label: c.name,
      value: c.name,
    }));
  }, [selectedCountryCode, selectedStateCode]);

  // Handle "Use Current Location"
  const handleUseCurrentLocation = async () => {
    try {
      setLocating(true);
      haptics.selection();
      setErrorMessage(null);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        haptics.error();
        Alert.alert(
          'Location Permission Required',
          'Please allow Voymate to access your location in your phone settings to auto-fill your hometown.'
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const res = await apiClient.post(ENDPOINTS.LOCATION.REVERSE_GEOCODE, {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      const locData = res.data?.data;
      if (locData) {
        haptics.success();
        const code = locData.countryCode || '';
        const found = Country.getCountryByCode(code);
        const resolvedCountry = found
          ? `${found.flag ? `${found.flag} ` : ''}${found.name}`
          : locData.country || code;

        setSelectedCountryCode(code);
        setNationality(resolvedCountry);

        const states = code ? State.getStatesOfCountry(code) : [];
        const matchedState = states.find(
          (s) =>
            s.isoCode.toUpperCase() === locData.stateCode?.toUpperCase() ||
            s.name.toLowerCase() === locData.state?.toLowerCase()
        );

        const resStateCode = matchedState?.isoCode || locData.stateCode || '';
        const resStateName = matchedState?.name || locData.state || '';

        setSelectedStateCode(resStateCode);
        setStateName(resStateName);

        const resCity = locData.district || locData.city || '';
        setCityName(resCity);
      }
    } catch (err: any) {
      haptics.error();
      const message =
        err.response?.data?.message ||
        'Could not detect location. Please pick your country, region, and city below.';
      setErrorMessage(message);
    } finally {
      setLocating(false);
    }
  };

  const handleSelectCountry = (opt: SelectOption) => {
    setSelectedCountryCode(opt.value);
    setNationality(opt.label);
    setSelectedStateCode('');
    setStateName('');
    setCityName('');
  };

  const handleSelectState = (opt: SelectOption) => {
    setSelectedStateCode(opt.value);
    setStateName(opt.label);
    setCityName('');
  };

  const handleSelectCity = (opt: SelectOption) => {
    setCityName(opt.label);
  };

  // Skills & Languages
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['Navigation', 'Photography']);
  const [customSkill, setCustomSkill] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['English']);
  const [customLanguage, setCustomLanguage] = useState('');

  // Submission & Validation
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const monthRef = useRef<any>(null);
  const yearRef = useRef<any>(null);

  const setOnboarding = useAuthStore((state) => state.setOnboarding);
  const haptics = useHaptics();

  // Pick Avatar
  const handlePickAvatar = async () => {
    try {
      haptics.selection();
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        setAvatarUri(res.assets[0].uri);
        haptics.light();
        if (errorMessage) setErrorMessage(null);
      }
    } catch {
      Alert.alert('Permission Denied', 'Please allow camera roll access to upload photos.');
    }
  };

  // Pick Cover Photo
  const handlePickCover = async () => {
    try {
      haptics.selection();
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        setCoverUri(res.assets[0].uri);
        haptics.light();
        if (errorMessage) setErrorMessage(null);
      }
    } catch {
      Alert.alert('Permission Denied', 'Please allow camera roll access to upload photos.');
    }
  };

  // Step Forward
  const handleNextSubStep = () => {
    haptics.selection();
    setErrorMessage(null);

    // Validation for Sub-step 0 (Photos)
    if (currentSubStep === 0) {
      if (!avatarUri || !coverUri) {
        haptics.error();
        setErrorMessage('Please upload both a profile photo and cover banner to continue.');
        return;
      }
    }

    // Validation for Sub-step 1 (Bio)
    if (currentSubStep === 1) {
      if (bio.trim().length < 20) {
        haptics.error();
        setErrorMessage('Please write at least 20 characters in your bio.');
        return;
      }
    }

    // Validation for Sub-step 2 (Basics: Gender & DOB)
    if (currentSubStep === 2) {
      const d = parseInt(dobDay, 10);
      const m = parseInt(dobMonth, 10);
      const y = parseInt(dobYear, 10);
      if (!d || !m || !y || d < 1 || d > 31 || m < 1 || m > 12 || y < 1920 || y > 2008) {
        haptics.error();
        setErrorMessage('Please enter a valid birth date (18+ years required).');
        return;
      }
    }

    // Validation for Sub-step 3 (Location)
    if (currentSubStep === 3) {
      if (!nationality.trim() || !stateName.trim() || !cityName.trim()) {
        haptics.error();
        setErrorMessage('Please complete your country, state/region, and city.');
        return;
      }
    }

    // Move to next
    if (currentSubStep < TOTAL_SUBSTEPS - 1) {
      setCurrentSubStep((prev) => prev + 1);
    }
  };

  // Step Backward
  const handleBack = () => {
    haptics.selection();
    setErrorMessage(null);
    if (currentSubStep > 0) {
      setCurrentSubStep((prev) => prev - 1);
    } else {
      navigation.goBack();
    }
  };

  // Final Submit
  const handleFinalSubmit = async () => {
    if (selectedSkills.length === 0) {
      haptics.error();
      setErrorMessage('Please select at least one travel skill.');
      return;
    }
    if (selectedLanguages.length === 0) {
      haptics.error();
      setErrorMessage('Please select at least one language.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      const d = parseInt(dobDay, 10);
      const m = parseInt(dobMonth, 10);
      const y = parseInt(dobYear, 10);
      // Format as full ISO-8601 DateTime string expected by Prisma (e.g. "2003-01-27T00:00:00.000Z")
      const dobDate = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
      const dobIsoString = dobDate.toISOString();

      // Resolve ISO 2-letter country code for Prisma countryCode relation
      let resolvedCountryCode = selectedCountryCode.trim().toUpperCase();
      if (!resolvedCountryCode || resolvedCountryCode.length > 3) {
        const matched = Country.getAllCountries().find(
          (c) => nationality.toLowerCase().includes(c.name.toLowerCase()) || c.isoCode === resolvedCountryCode
        );
        resolvedCountryCode = matched?.isoCode || 'IN';
      }

      const formData = new FormData();
      formData.append('about', bio.trim());
      formData.append('dateOfBirth', dobIsoString);
      formData.append('nationality', resolvedCountryCode);
      formData.append('state', stateName.trim());
      formData.append('city', cityName.trim());
      formData.append('gender', gender);
      formData.append('travelSkills', JSON.stringify(selectedSkills));
      formData.append('languages', JSON.stringify(selectedLanguages));

      // Append Avatar File
      const avatarName = avatarUri!.split('/').pop() || 'avatar.jpg';
      const avatarExt = avatarName.split('.').pop()?.toLowerCase() || 'jpg';
      formData.append('image', {
        uri: avatarUri!,
        name: avatarName,
        type: `image/${avatarExt === 'png' ? 'png' : 'jpeg'}`,
      } as any);

      // Append Cover File
      const coverName = coverUri!.split('/').pop() || 'cover.jpg';
      const coverExt = coverName.split('.').pop()?.toLowerCase() || 'jpg';
      formData.append('coverImage', {
        uri: coverUri!,
        name: coverName,
        type: `image/${coverExt === 'png' ? 'png' : 'jpeg'}`,
      } as any);

      await apiClient.post(ENDPOINTS.ONBOARDING.PROFILE, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      haptics.success();
      setOnboarding(3, false);
      navigation.navigate('TravelStyle');
    } catch (err: any) {
      haptics.error();
      const message =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Could not save your profile. Please check your information.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  // Skill toggling
  const toggleSkill = (skill: string) => {
    haptics.selection();
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleAddCustomSkill = () => {
    const clean = customSkill.trim();
    if (clean && !selectedSkills.includes(clean)) {
      haptics.light();
      setSelectedSkills([...selectedSkills, clean]);
      setCustomSkill('');
    }
  };

  // Language toggling
  const toggleLanguage = (lang: string) => {
    haptics.selection();
    if (selectedLanguages.includes(lang)) {
      setSelectedLanguages(selectedLanguages.filter((l) => l !== lang));
    } else {
      setSelectedLanguages([...selectedLanguages, lang]);
    }
  };

  const handleAddCustomLanguage = () => {
    const clean = customLanguage.trim();
    if (clean && !selectedLanguages.includes(clean)) {
      haptics.light();
      setSelectedLanguages([...selectedLanguages, clean]);
      setCustomLanguage('');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.container}>
          {/* Top Header Bar */}
          <View style={styles.topNav}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.7}
            >
              <ArrowLeft size={20} color={theme.colors.textPrimary} strokeWidth={2} />
            </TouchableOpacity>

            <View style={styles.substepIndicator}>
              <Text style={styles.substepText}>
                Profile • {currentSubStep + 1} of {TOTAL_SUBSTEPS}
              </Text>
            </View>

            <View style={{ width: 40 }} />
          </View>

          {/* Segmented Progress Dashes */}
          <View style={styles.segmentedProgressBar}>
            {Array.from({ length: TOTAL_SUBSTEPS }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.segmentDash,
                  index <= currentSubStep && styles.segmentDashActive,
                ]}
              />
            ))}
          </View>

          {/* Error Banner */}
          {errorMessage ? (
            <View style={styles.errorBanner}>
              <AlertCircle size={16} color={theme.colors.error} style={styles.bannerIcon} />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* FOCUSED MICRO-STEPS */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* SUB-STEP 0: PHOTOS */}
            {currentSubStep === 0 && (
              <View style={styles.subStepContainer}>
                <View style={styles.header}>
                  <Text style={styles.title}>Add your photos</Text>
                  <Text style={styles.subtitle}>
                    Profiles with both a cover banner and clear face photo connect 4x faster with travel buddies.
                  </Text>
                </View>

                {/* Profile Showcase Card */}
                <View style={styles.showcaseCard}>
                  {/* Cover Banner */}
                  <TouchableOpacity
                    style={styles.coverBox}
                    onPress={handlePickCover}
                    activeOpacity={0.85}
                  >
                    {coverUri ? (
                      <Image source={{ uri: coverUri }} style={styles.coverImage} />
                    ) : (
                      <View style={styles.coverPlaceholder}>
                        <View style={styles.coverIconCircle}>
                          <ImageIcon size={22} color={theme.colors.primary} />
                        </View>
                        <Text style={styles.coverPrompt}>Upload Cover Banner</Text>
                        <Text style={styles.coverSubtext}>Landscape 16:9 photo</Text>
                      </View>
                    )}
                    <View style={styles.coverBadge}>
                      <Camera size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                      <Text style={styles.coverBadgeText}>{coverUri ? 'Change' : 'Add Cover'}</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Overlapping Avatar */}
                  <View style={styles.avatarWrapper}>
                    <TouchableOpacity
                      onPress={handlePickAvatar}
                      activeOpacity={0.85}
                      style={styles.avatarTouchArea}
                    >
                      <View style={styles.avatarImageContainer}>
                        {avatarUri ? (
                          <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                        ) : (
                          <View style={styles.avatarPlaceholder}>
                            <User size={38} color={theme.colors.textMuted} />
                          </View>
                        )}
                      </View>
                      <View style={styles.cameraBadge}>
                        <Camera size={15} color="#FFFFFF" strokeWidth={2.2} />
                      </View>
                    </TouchableOpacity>
                  </View>

                  {/* Caption & Status Below */}
                  <View style={styles.showcaseMeta}>
                    <Text style={styles.showcaseTitle}>
                      {avatarUri && coverUri ? 'Looking great!' : 'Your Traveler Visuals'}
                    </Text>
                    <Text style={styles.showcaseSubtitle}>
                      {!coverUri && !avatarUri
                        ? 'Tap the banner and circle above to pick your photos'
                        : !coverUri
                        ? 'Now add a cover banner to complete your look'
                        : !avatarUri
                        ? 'Now tap the circle to add your face photo'
                        : 'Both photos ready. Tap Continue below.'}
                    </Text>

                    {/* Quick status pills */}
                    <View style={styles.statusPillsRow}>
                      <View style={[styles.statusPill, coverUri ? styles.statusPillDone : null]}>
                        {coverUri ? (
                          <Check size={12} color="#FFFFFF" strokeWidth={3} />
                        ) : (
                          <ImageIcon size={12} color={theme.colors.textMuted} />
                        )}
                        <Text style={[styles.statusPillText, coverUri ? styles.statusPillTextDone : null]}>
                          Cover {coverUri ? 'Added' : 'Pending'}
                        </Text>
                      </View>
                      <View style={[styles.statusPill, avatarUri ? styles.statusPillDone : null]}>
                        {avatarUri ? (
                          <Check size={12} color="#FFFFFF" strokeWidth={3} />
                        ) : (
                          <User size={12} color={theme.colors.textMuted} />
                        )}
                        <Text style={[styles.statusPillText, avatarUri ? styles.statusPillTextDone : null]}>
                          Avatar {avatarUri ? 'Added' : 'Pending'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* SUB-STEP 1: BIO */}
            {currentSubStep === 1 && (
              <View style={styles.subStepContainer}>
                <View style={styles.header}>
                  <Text style={styles.title}>Tell your story</Text>
                  <Text style={styles.subtitle}>
                    What kind of adventures do you love? What's your travel vibe?
                  </Text>
                </View>

                {/* Bio Text Area */}
                <View style={styles.bioBox}>
                  <TextInput
                    style={styles.bioInput}
                    placeholder="Tell other travelers about your favorite destinations, what you love doing, or dream bucket list trips..."
                    placeholderTextColor={theme.colors.textMuted}
                    multiline
                    numberOfLines={5}
                    maxLength={500}
                    value={bio}
                    onChangeText={(val) => {
                      setBio(val);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    autoFocus
                  />
                  <View style={styles.bioCounterRow}>
                    <Text style={[styles.bioCounter, bio.length < 20 ? styles.bioCounterWarn : styles.bioCounterOk]}>
                      {bio.length}/500 {bio.length < 20 ? '(min 20 required)' : '✓'}
                    </Text>
                  </View>
                </View>

                {/* Quick Inspiration Prompts */}
                <Text style={[styles.fieldLabel, { marginTop: 20 }]}>Inspiration Prompts</Text>
                <View style={styles.promptList}>
                  {BIO_PROMPTS.map((prompt) => (
                    <TouchableOpacity
                      key={prompt}
                      style={styles.promptPill}
                      onPress={() => {
                        haptics.light();
                        setBio((prev) => (prev ? `${prev}\n${prompt}` : prompt));
                      }}
                      activeOpacity={0.7}
                    >
                      <Sparkles size={14} color={theme.colors.primary} style={{ marginRight: 6 }} />
                      <Text style={styles.promptText}>{prompt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* SUB-STEP 2: BASICS (Gender & DOB) */}
            {currentSubStep === 2 && (
              <View style={styles.subStepContainer}>
                <View style={styles.header}>
                  <Text style={styles.title}>A bit about you</Text>
                  <Text style={styles.subtitle}>
                    This helps us curate authentic, age-appropriate solo-traveler connections.
                  </Text>
                </View>

                {/* Gender */}
                <Text style={styles.fieldLabel}>How do you identify?</Text>
                <View style={styles.genderRow}>
                  {GENDER_OPTIONS.map((g) => {
                    const isSelected = gender === g.value;
                    return (
                      <TouchableOpacity
                        key={g.value}
                        style={[
                          styles.genderCard,
                          isSelected && styles.genderCardSelected,
                        ]}
                        onPress={() => {
                          haptics.selection();
                          setGender(g.value);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.genderLabel,
                            isSelected && styles.genderLabelSelected,
                          ]}
                        >
                          {g.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Birthday */}
                <Text style={[styles.fieldLabel, { marginTop: 28 }]}>Date of Birth</Text>
                <View style={styles.dobContainer}>
                  <View style={styles.dobCell}>
                    <TextInput
                      style={styles.dobInputField}
                      placeholder="DD"
                      placeholderTextColor={theme.colors.textMuted}
                      keyboardType="number-pad"
                      maxLength={2}
                      value={dobDay}
                      onChangeText={(val) => {
                        setDobDay(val);
                        if (val.length === 2) monthRef.current?.focus();
                      }}
                    />
                  </View>
                  <Text style={styles.dobSlash}>/</Text>
                  <View style={styles.dobCell}>
                    <TextInput
                      ref={monthRef}
                      style={styles.dobInputField}
                      placeholder="MM"
                      placeholderTextColor={theme.colors.textMuted}
                      keyboardType="number-pad"
                      maxLength={2}
                      value={dobMonth}
                      onChangeText={(val) => {
                        setDobMonth(val);
                        if (val.length === 2) yearRef.current?.focus();
                      }}
                    />
                  </View>
                  <Text style={styles.dobSlash}>/</Text>
                  <View style={[styles.dobCell, { flex: 1.5 }]}>
                    <TextInput
                      ref={yearRef}
                      style={styles.dobInputField}
                      placeholder="YYYY"
                      placeholderTextColor={theme.colors.textMuted}
                      keyboardType="number-pad"
                      maxLength={4}
                      value={dobYear}
                      onChangeText={setDobYear}
                    />
                  </View>
                </View>
                <Text style={styles.helperText}>You must be at least 18 years old to join Voymate.</Text>
              </View>
            )}

            {/* SUB-STEP 3: LOCATION */}
            {currentSubStep === 3 && (
              <View style={styles.subStepContainer}>
                <View style={styles.header}>
                  <Text style={styles.title}>Where is home?</Text>
                  <Text style={styles.subtitle}>
                    Let other travelers know where you're starting your journeys from.
                  </Text>
                </View>

                {/* Use Current Location Quick Action */}
                <TouchableOpacity
                  style={styles.currentLocationButton}
                  onPress={handleUseCurrentLocation}
                  disabled={locating}
                  activeOpacity={0.8}
                >
                  <View style={styles.currentLocationIconBox}>
                    {locating ? (
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                    ) : (
                      <LocationIcon size={18} color={theme.colors.primary} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.currentLocationTitle}>
                      {locating ? 'Detecting your location...' : 'Use current location'}
                    </Text>
                    <Text style={styles.currentLocationSubtext}>
                      Auto-detects country, region & city via GPS
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or select from list</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Country Dropdown */}
                <View style={styles.locationGroup}>
                  <Text style={styles.fieldLabel}>Country / Nationality</Text>
                  <TouchableOpacity
                    style={styles.dropdownSelector}
                    onPress={() => setCountryModalVisible(true)}
                    activeOpacity={0.7}
                  >
                    <Globe size={18} color={theme.colors.textMuted} style={styles.selectorIcon} />
                    <Text
                      style={[
                        styles.selectorValue,
                        !nationality && styles.selectorPlaceholder,
                      ]}
                      numberOfLines={1}
                    >
                      {nationality || 'Select your country'}
                    </Text>
                    <ChevronDown size={18} color={theme.colors.textMuted} />
                  </TouchableOpacity>

                  {/* State Dropdown */}
                  <Text style={[styles.fieldLabel, { marginTop: 16 }]}>State / Region</Text>
                  <TouchableOpacity
                    style={[
                      styles.dropdownSelector,
                      !selectedCountryCode && styles.dropdownDisabled,
                    ]}
                    onPress={() => {
                      if (!selectedCountryCode) {
                        haptics.error();
                        setErrorMessage('Please select a country first.');
                        return;
                      }
                      setStateModalVisible(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <MapPin size={18} color={theme.colors.textMuted} style={styles.selectorIcon} />
                    <Text
                      style={[
                        styles.selectorValue,
                        !stateName && styles.selectorPlaceholder,
                      ]}
                      numberOfLines={1}
                    >
                      {stateName || (selectedCountryCode ? 'Select region / state' : 'Select country first')}
                    </Text>
                    <ChevronDown size={18} color={theme.colors.textMuted} />
                  </TouchableOpacity>

                  {/* City Dropdown */}
                  <Text style={[styles.fieldLabel, { marginTop: 16 }]}>City</Text>
                  <TouchableOpacity
                    style={[
                      styles.dropdownSelector,
                      !stateName && styles.dropdownDisabled,
                    ]}
                    onPress={() => {
                      if (!stateName) {
                        haptics.error();
                        setErrorMessage('Please select a region or state first.');
                        return;
                      }
                      setCityModalVisible(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <MapPin size={18} color={theme.colors.textMuted} style={styles.selectorIcon} />
                    <Text
                      style={[
                        styles.selectorValue,
                        !cityName && styles.selectorPlaceholder,
                      ]}
                      numberOfLines={1}
                    >
                      {cityName || (stateName ? 'Select or type city' : 'Select state first')}
                    </Text>
                    <ChevronDown size={18} color={theme.colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* SUB-STEP 4: SKILLS & LANGUAGES */}
            {currentSubStep === 4 && (
              <View style={styles.subStepContainer}>
                <View style={styles.header}>
                  <Text style={styles.title}>Skills & Languages</Text>
                  <Text style={styles.subtitle}>
                    What travel superpowers do you bring, and what languages do you speak?
                  </Text>
                </View>

                {/* Skills Section */}
                <Text style={styles.fieldLabel}>Travel Skills (Tap to select)</Text>
                <View style={styles.chipsWrap}>
                  {POPULAR_SKILLS.map((skill) => {
                    const isSelected = selectedSkills.includes(skill);
                    return (
                      <TouchableOpacity
                        key={skill}
                        style={[styles.chip, isSelected && styles.chipSelected]}
                        onPress={() => toggleSkill(skill)}
                        activeOpacity={0.7}
                      >
                        {isSelected && <Check size={14} color="#FFFFFF" style={{ marginRight: 4 }} />}
                        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                          {skill}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Custom Skill Input */}
                <View style={styles.addCustomRow}>
                  <TextInput
                    style={styles.customInput}
                    placeholder="Add custom skill..."
                    placeholderTextColor={theme.colors.textMuted}
                    value={customSkill}
                    onChangeText={setCustomSkill}
                    onSubmitEditing={handleAddCustomSkill}
                  />
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={handleAddCustomSkill}
                    activeOpacity={0.7}
                  >
                    <Plus size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                {/* Languages Section */}
                <Text style={[styles.fieldLabel, { marginTop: 24 }]}>Languages</Text>
                <View style={styles.chipsWrap}>
                  {POPULAR_LANGUAGES.map((lang) => {
                    const isSelected = selectedLanguages.includes(lang);
                    return (
                      <TouchableOpacity
                        key={lang}
                        style={[styles.chip, isSelected && styles.chipSelected]}
                        onPress={() => toggleLanguage(lang)}
                        activeOpacity={0.7}
                      >
                        {isSelected && <Check size={14} color="#FFFFFF" style={{ marginRight: 4 }} />}
                        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                          {lang}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Custom Language Input */}
                <View style={styles.addCustomRow}>
                  <TextInput
                    style={styles.customInput}
                    placeholder="Add another language..."
                    placeholderTextColor={theme.colors.textMuted}
                    value={customLanguage}
                    onChangeText={setCustomLanguage}
                    onSubmitEditing={handleAddCustomLanguage}
                  />
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={handleAddCustomLanguage}
                    activeOpacity={0.7}
                  >
                    <Plus size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Floating Bottom Action Bar */}
          <View style={styles.bottomBar}>
            {currentSubStep < TOTAL_SUBSTEPS - 1 ? (
              <Button
                title="Continue"
                variant="primary"
                size="lg"
                onPress={handleNextSubStep}
                style={styles.actionButton}
              />
            ) : (
              <Button
                title="Save Profile & Continue"
                variant="primary"
                size="lg"
                loading={loading}
                disabled={loading}
                onPress={handleFinalSubmit}
                style={styles.actionButton}
              />
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Country Selection Modal */}
      <SearchableSelectModal
        visible={countryModalVisible}
        title="Select Country"
        placeholder="Search country..."
        items={countryOptions}
        selectedValue={selectedCountryCode}
        onSelect={handleSelectCountry}
        onClose={() => setCountryModalVisible(false)}
      />

      {/* State Selection Modal */}
      <SearchableSelectModal
        visible={stateModalVisible}
        title="Select State or Region"
        placeholder="Search state/region..."
        items={stateOptions}
        selectedValue={selectedStateCode}
        allowCustom={true}
        onSelect={handleSelectState}
        onClose={() => setStateModalVisible(false)}
      />

      {/* City Selection Modal */}
      <SearchableSelectModal
        visible={cityModalVisible}
        title="Select City"
        placeholder="Search city or type custom..."
        items={cityOptions}
        selectedValue={cityName}
        allowCustom={true}
        onSelect={handleSelectCity}
        onClose={() => setCityModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 84, 64, 0.08)',
    ...theme.shadows.subtle,
  },
  substepIndicator: {
    alignItems: 'center',
  },
  substepText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  segmentedProgressBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 6,
    marginVertical: 12,
  },
  segmentDash: {
    flex: 1,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: 'rgba(0, 84, 64, 0.1)',
  },
  segmentDashActive: {
    backgroundColor: theme.colors.primary,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 110,
  },
  subStepContainer: {
    paddingTop: 10,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 6,
    lineHeight: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 10,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.errorLight,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(186, 26, 26, 0.12)',
  },
  bannerIcon: {
    marginRight: 8,
  },
  errorBannerText: {
    flex: 1,
    color: theme.colors.error,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 17,
  },
  showcaseCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: 'rgba(0, 84, 64, 0.08)',
    overflow: 'visible',
    paddingBottom: 22,
    ...theme.shadows.subtle,
  },
  coverBox: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: 'rgba(0, 84, 64, 0.05)',
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverPrompt: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
    marginTop: 6,
  },
  coverSubtext: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  coverBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  coverBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  avatarWrapper: {
    alignSelf: 'center',
    marginTop: -50,
    zIndex: 10,
  },
  avatarTouchArea: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  avatarImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EBF3EF',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.card,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
    elevation: 5,
  },
  showcaseMeta: {
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 20,
  },
  showcaseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  showcaseSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 17,
  },
  statusPillsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 84, 64, 0.06)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  statusPillDone: {
    backgroundColor: theme.colors.primary,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  statusPillTextDone: {
    color: '#FFFFFF',
  },
  bioBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: 'rgba(0, 84, 64, 0.1)',
    padding: 16,
    ...theme.shadows.subtle,
  },
  bioInput: {
    fontSize: 15,
    color: theme.colors.textPrimary,
    minHeight: 120,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  bioCounterRow: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  bioCounter: {
    fontSize: 11,
    fontWeight: '600',
  },
  bioCounterOk: {
    color: theme.colors.textMuted,
  },
  bioCounterWarn: {
    color: theme.colors.error,
  },
  promptList: {
    gap: 8,
  },
  promptPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 84, 64, 0.08)',
    ...theme.shadows.subtle,
  },
  promptText: {
    fontSize: 13,
    color: theme.colors.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  genderCard: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.2,
    borderColor: 'rgba(0, 84, 64, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.subtle,
  },
  genderCardSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  genderLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  genderLabelSelected: {
    color: '#FFFFFF',
  },
  dobContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dobCell: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(0, 84, 64, 0.1)',
    height: 54,
    justifyContent: 'center',
    ...theme.shadows.subtle,
  },
  dobInputField: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  dobSlash: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  helperText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 10,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 84, 64, 0.15)',
    ...theme.shadows.subtle,
  },
  currentLocationIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  currentLocationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  currentLocationSubtext: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0, 84, 64, 0.08)',
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locationGroup: {
    marginTop: 4,
  },
  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(0, 84, 64, 0.1)',
    paddingHorizontal: 16,
    height: 54,
    ...theme.shadows.subtle,
  },
  dropdownDisabled: {
    opacity: 0.55,
    backgroundColor: 'rgba(0, 84, 64, 0.03)',
  },
  selectorIcon: {
    marginRight: 12,
  },
  selectorValue: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  selectorPlaceholder: {
    color: theme.colors.textMuted,
    fontWeight: '400',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.2,
    borderColor: 'rgba(0, 84, 64, 0.12)',
    ...theme.shadows.subtle,
  },
  chipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.textPrimary,
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  addCustomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customInput: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(0, 84, 64, 0.1)',
    paddingHorizontal: 14,
    height: 46,
    fontSize: 13,
    color: theme.colors.textPrimary,
    ...theme.shadows.subtle,
  },
  addButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.subtle,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 84, 64, 0.06)',
  },
  actionButton: {
    borderRadius: 16,
    height: 54,
    ...theme.shadows.card,
  },
});
