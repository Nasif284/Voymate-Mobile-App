import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { OnboardingStackParamList } from '../../../navigation/types';
import { theme } from '../../../config/theme';
import { Button } from '../../../components/ui/Button';
import { useHaptics } from '../../../hooks/useHaptics';
import {
  useSetOnboardingProfile,
  useReverseGeocode,
} from '../hooks/onboarding.hooks';
import { useGeoCountries, useGeoStates, useGeoCities } from '../../../services/places/geo.service';
import { SearchableSelectModal, SelectOption } from '../../../components/ui/SearchableSelectModal';
import { cn } from '../../../utils/cn';
import {
  Camera,
  Check,
  AlertCircle,
  MapPin,
  Globe,
  ArrowLeft,
  Plus,
  Sparkles,
  User,
  Navigation as LocationIcon,
  ChevronDown,
  RefreshCw,
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

const DEFAULT_COVERS = [
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80',
];

const BIO_TEMPLATES = [
  'Solo backpacker chasing mountain sunrises, hidden cafes, and spontaneous adventures. Looking for fun travel mates!',
  'Foodie & culture enthusiast exploring local street food, art, and vibrant city nightlife. Let us plan a trip together!',
  'Photographer & road-trip lover always searching for offbeat trails, sunsets, and great music on the road.',
];

export const ProfileDetailsScreen: React.FC<Props> = ({ navigation }) => {
  // Current Micro-Step (0: Photos, 1: Bio, 2: Basics, 3: Location, 4: Skills & Languages)
  const [currentSubStep, setCurrentSubStep] = useState(0);

  // Photos (Cover pre-filled with an Unsplash travel landscape)
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [coverIndex, setCoverIndex] = useState(() => Math.floor(Math.random() * DEFAULT_COVERS.length));
  const [coverUri, setCoverUri] = useState<string>(() => DEFAULT_COVERS[Math.floor(Math.random() * DEFAULT_COVERS.length)]);
  const [isCustomCover, setIsCustomCover] = useState(false);

  // Bio (Pre-filled to remove blank page syndrome)
  const [bio, setBio] = useState('Solo backpacker chasing mountain sunrises, hidden cafes, and spontaneous adventures. Looking for fun travel mates!');

  // Personal Basics
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'NON_BINARY'>('MALE');
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');

  // Location (Pre-filled with India by default)
  const [selectedCountryCode, setSelectedCountryCode] = useState('IN');
  const [selectedStateCode, setSelectedStateCode] = useState('');
  const [nationality, setNationality] = useState('🇮🇳 India');
  const [stateName, setStateName] = useState('');
  const [cityName, setCityName] = useState('');

  // Location Modals
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [stateModalVisible, setStateModalVisible] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);

  // Country, State, City Options (Fetched via Backend Geo-Catalog + TanStack Query)
  const { data: countryOptions = [] } = useGeoCountries();
  const { data: stateOptions = [] } = useGeoStates(selectedCountryCode);
  const { data: cityOptions = [] } = useGeoCities(selectedCountryCode, selectedStateCode);

  // Skills & Languages
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['Navigation', 'Photography']);
  const [customSkill, setCustomSkill] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['English']);
  const [customLanguage, setCustomLanguage] = useState('');

  // Submission & Validation
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const monthRef = useRef<any>(null);
  const yearRef = useRef<any>(null);

  const haptics = useHaptics();
  const reverseGeocodeMutation = useReverseGeocode({
    onSuccess: (locData) => {
      const code = locData.countryCode || '';
      const matchedCountry = countryOptions.find((c) => c.value.toUpperCase() === code.toUpperCase());
      const resolvedCountry = matchedCountry?.label || locData.country || code;

      setSelectedCountryCode(code);
      setNationality(resolvedCountry);

      const resStateCode = locData.stateCode || '';
      const resStateName = locData.state || '';

      setSelectedStateCode(resStateCode);
      setStateName(resStateName);

      const resCity = locData.district || locData.city || '';
      setCityName(resCity);
    },
    onError: (msg) => setErrorMessage(msg),
  });
  const locating = reverseGeocodeMutation.isPending;

  const setProfileMutation = useSetOnboardingProfile({
    onSuccess: () => {
      navigation.navigate('TravelStyle');
    },
    onError: (msg) => setErrorMessage(msg),
  });
  const loading = setProfileMutation.isPending;

  // Handle "Use Current Location"
  const handleUseCurrentLocation = () => {
    haptics.selection();
    setErrorMessage(null);
    reverseGeocodeMutation.mutate();
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

  // Pick Custom Cover Photo
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
        setIsCustomCover(true);
        haptics.light();
        if (errorMessage) setErrorMessage(null);
      }
    } catch {
      Alert.alert('Permission Denied', 'Please allow camera roll access to upload photos.');
    }
  };

  // Shuffle Unsplash Cover
  const handleShuffleCover = () => {
    haptics.selection();
    const nextIdx = (coverIndex + 1) % DEFAULT_COVERS.length;
    setCoverIndex(nextIdx);
    setCoverUri(DEFAULT_COVERS[nextIdx]);
    setIsCustomCover(false);
  };

  // Step Forward
  const handleNextSubStep = () => {
    haptics.selection();
    setErrorMessage(null);

    // Validation for Sub-step 0 (Photos) — Only require Avatar
    if (currentSubStep === 0) {
      if (!avatarUri) {
        haptics.error();
        setErrorMessage('Please add a profile photo to introduce yourself.');
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
  const handleFinalSubmit = () => {
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
      const matched = countryOptions.find(
        (c) =>
          nationality.toLowerCase().includes((c.sublabel || c.label).toLowerCase()) ||
          c.value.toUpperCase() === resolvedCountryCode
      );
      resolvedCountryCode = matched?.value || 'IN';
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

    // Append Cover File (if custom gallery pick) or Default Unsplash URL
    if (isCustomCover && coverUri) {
      const coverName = coverUri.split('/').pop() || 'cover.jpg';
      const coverExt = coverName.split('.').pop()?.toLowerCase() || 'jpg';
      formData.append('coverImage', {
        uri: coverUri,
        name: coverName,
        type: `image/${coverExt === 'png' ? 'png' : 'jpeg'}`,
      } as any);
    } else if (coverUri) {
      formData.append('defaultCoverUrl', coverUri);
    }

    setProfileMutation.mutate(formData);
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
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        className="flex-1"
      >
        <View className="flex-1">
          {/* Top Header Bar */}
          <View className="flex-row items-center justify-between px-5 pt-2.5 pb-2">
            <TouchableOpacity
              className="w-10 h-10 rounded-full bg-surface items-center justify-center border border-border-subtle shadow-subtle"
              onPress={handleBack}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.7}
            >
              <ArrowLeft size={20} color={theme.colors.textPrimary} strokeWidth={2} />
            </TouchableOpacity>

            <View className="items-center">
              <Text className="text-[13px] font-semibold text-text-muted">
                Profile • {currentSubStep + 1} of {TOTAL_SUBSTEPS}
              </Text>
            </View>

            <View className="w-10" />
          </View>

          {/* Segmented Progress Dashes */}
          <View className="flex-row px-5 gap-1.5 my-3">
            {Array.from({ length: TOTAL_SUBSTEPS }).map((_, index) => (
              <View
                key={index}
                className={cn(
                  'flex-1 h-[3.5px] rounded-full bg-border-subtle',
                  index <= currentSubStep && 'bg-primary'
                )}
              />
            ))}
          </View>

          {/* Error Banner */}
          {errorMessage ? (
            <View className="flex-row items-center bg-error-light py-2.5 px-3.5 rounded-xl mx-5 mb-2.5 border border-error/20">
              <AlertCircle size={16} color={theme.colors.error} className="mr-2" />
              <Text className="flex-1 text-error text-[13px] font-medium leading-[17px]">
                {errorMessage}
              </Text>
            </View>
          ) : null}

          {/* FOCUSED MICRO-STEPS */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 110 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* SUB-STEP 0: PHOTOS */}
            {currentSubStep === 0 && (
              <View className="pt-2.5">
                <View className="mb-6">
                  <Text className="text-[26px] font-medium text-text-primary tracking-tight">
                    Add your photos
                  </Text>
                  <Text className="text-sm text-text-secondary mt-1.5 leading-5">
                    Profiles with both a cover banner and clear face photo connect 4x faster with travel buddies.
                  </Text>
                </View>

                {/* Profile Showcase Card */}
                <View className="bg-surface rounded-[22px] border border-border-subtle overflow-visible pb-5 shadow-subtle">
                  {/* Cover Banner */}
                  <View className="w-full h-[150px] rounded-t-[20px] bg-surface-subtle overflow-hidden relative items-center justify-center">
                    <Image
                      source={{ uri: coverUri }}
                      className="w-full h-full"
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      transition={150}
                    />

                    {/* Shuffle Preset Cover Button */}
                    <TouchableOpacity
                      onPress={handleShuffleCover}
                      className="absolute top-3 left-3 bg-black/65 py-1 px-2.5 rounded-full flex-row items-center gap-1.5"
                      activeOpacity={0.8}
                    >
                      <RefreshCw size={12} color={theme.colors.white} />
                      <Text className="text-white text-[11px] font-semibold">Shuffle Cover</Text>
                    </TouchableOpacity>

                    {/* Pick Custom Cover Button */}
                    <TouchableOpacity
                      onPress={handlePickCover}
                      className="absolute top-3 right-3 bg-black/65 py-1 px-2.5 rounded-full flex-row items-center gap-1.5"
                      activeOpacity={0.8}
                    >
                      <Camera size={12} color={theme.colors.white} />
                      <Text className="text-white text-[11px] font-semibold">
                        {isCustomCover ? 'Change Custom' : 'Upload Own'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Overlapping Avatar */}
                  <View className="self-center -mt-[50px] z-10">
                    <TouchableOpacity
                      onPress={handlePickAvatar}
                      activeOpacity={0.85}
                      className="relative w-[100px] h-[100px]"
                    >
                      <View className="w-[100px] h-[100px] rounded-full bg-surface-subtle border-4 border-white overflow-hidden items-center justify-center shadow-card">
                        {avatarUri ? (
                          <Image
                            source={{ uri: avatarUri }}
                            className="w-full h-full"
                            contentFit="cover"
                            cachePolicy="memory-disk"
                            transition={150}
                          />
                        ) : (
                          <View className="items-center justify-center">
                            <User size={38} color={theme.colors.textMuted} />
                          </View>
                        )}
                      </View>
                      <View className="absolute bottom-0 right-0 bg-primary w-8 h-8 rounded-full items-center justify-center border-2 border-white shadow-md">
                        <Camera size={15} color={theme.colors.white} strokeWidth={2.2} />
                      </View>
                    </TouchableOpacity>
                  </View>

                  {/* Caption & Status Below */}
                  <View className="items-center mt-3 px-5">
                    <Text className="text-base font-semibold text-text-primary">
                      {avatarUri ? 'Looking fantastic!' : 'Add Your Profile Photo'}
                    </Text>
                    <Text className="text-xs text-text-secondary text-center mt-1 leading-[17px]">
                      {avatarUri
                        ? 'Profile photo set! Tap Continue below or change your cover above.'
                        : 'Tap the circle above to add your face photo. Cover banner is ready.'}
                    </Text>

                    {/* Quick status pills */}
                    <View className="flex-row gap-2.5 mt-3.5">
                      <View className="flex-row items-center gap-1.5 bg-primary py-1.5 px-3 rounded-xl">
                        <Check size={12} color={theme.colors.white} strokeWidth={3} />
                        <Text className="text-[11px] font-semibold text-white">
                          Cover {isCustomCover ? 'Custom' : 'Preset'}
                        </Text>
                      </View>
                      <View className={cn(
                        'flex-row items-center gap-1.5 bg-surface-subtle py-1.5 px-3 rounded-xl',
                        avatarUri && 'bg-primary'
                      )}>
                        {avatarUri ? (
                          <Check size={12} color={theme.colors.white} strokeWidth={3} />
                        ) : (
                          <User size={12} color={theme.colors.textMuted} />
                        )}
                        <Text className={cn(
                          'text-[11px] font-semibold text-text-muted',
                          avatarUri && 'text-white'
                        )}>
                          Avatar {avatarUri ? 'Added' : 'Required'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* SUB-STEP 1: BIO */}
            {currentSubStep === 1 && (
              <View className="pt-2.5">
                <View className="mb-6">
                  <Text className="text-[26px] font-medium text-text-primary tracking-tight">
                    About You
                  </Text>
                  <Text className="text-sm text-text-secondary mt-1.5 leading-5">
                    Write a short bio or pick a template below. You can always edit this later.
                  </Text>
                </View>

                {/* Bio Text Area */}
                <View className="bg-surface rounded-[18px] border border-border p-4 shadow-subtle">
                  <TextInput
                    className="text-[15px] text-text-primary min-h-[110px] leading-[22px]"
                    placeholder="Tell other travelers about your favorite destinations, what you love doing, or dream bucket list trips..."
                    placeholderTextColor={theme.colors.textMuted}
                    multiline
                    numberOfLines={4}
                    maxLength={500}
                    value={bio}
                    onChangeText={(val) => {
                      setBio(val);
                      if (errorMessage) setErrorMessage(null);
                    }}
                  />
                  <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-border-subtle">
                    <TouchableOpacity
                      onPress={() => {
                        haptics.selection();
                        setBio('');
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      activeOpacity={0.7}
                    >
                      <Text className="text-[11px] font-semibold text-primary">Clear</Text>
                    </TouchableOpacity>
                    <Text className={cn(
                      'text-[11px] font-semibold',
                      bio.length < 20 ? 'text-error' : 'text-text-muted'
                    )}>
                      {bio.length}/500 {bio.length < 20 ? '(min 20 required)' : '✓'}
                    </Text>
                  </View>
                </View>

                {/* 1-Tap Ready Templates */}
                <Text className="text-sm font-semibold text-text-primary mb-2.5 mt-5">
                  1-Tap Bio Templates
                </Text>
                <View className="gap-2.5">
                  {BIO_TEMPLATES.map((template, idx) => (
                    <TouchableOpacity
                      key={idx}
                      className={cn(
                        'flex-row items-start bg-surface py-3 px-3.5 rounded-2xl border shadow-subtle',
                        bio === template ? 'border-primary bg-surface-subtle' : 'border-border'
                      )}
                      onPress={() => {
                        haptics.light();
                        setBio(template);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      activeOpacity={0.7}
                    >
                      <Sparkles size={14} color={theme.colors.primary} style={{ marginRight: 8, marginTop: 2 }} />
                      <Text className="text-xs text-text-primary font-medium flex-1 leading-[18px]">
                        "{template}"
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* SUB-STEP 2: BASICS (Gender & DOB) */}
            {currentSubStep === 2 && (
              <View className="pt-2.5">
                <View className="mb-6">
                  <Text className="text-[26px] font-medium text-text-primary tracking-tight">
                    A bit about you
                  </Text>
                  <Text className="text-sm text-text-secondary mt-1.5 leading-5">
                    This helps us curate authentic, age-appropriate solo-traveler connections.
                  </Text>
                </View>

                {/* Gender */}
                <Text className="text-sm font-semibold text-text-primary mb-2.5">
                  How do you identify?
                </Text>
                <View className="flex-row gap-2.5">
                  {GENDER_OPTIONS.map((g) => {
                    const isSelected = gender === g.value;
                    return (
                      <TouchableOpacity
                        key={g.value}
                        className={cn(
                          'flex-1 py-3.5 rounded-2xl bg-surface border border-border items-center justify-center shadow-subtle',
                          isSelected && 'bg-primary border-primary'
                        )}
                        onPress={() => {
                          haptics.selection();
                          setGender(g.value);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          className={cn(
                            'text-sm font-semibold text-text-secondary',
                            isSelected && 'text-white'
                          )}
                        >
                          {g.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Birthday */}
                <Text className="text-sm font-semibold text-text-primary mb-2.5 mt-7">
                  Date of Birth
                </Text>
                <View className="flex-row items-center gap-2">
                  <View className="flex-1 bg-surface rounded-2xl border border-border h-[54px] justify-center shadow-subtle">
                    <TextInput
                      className="text-base font-semibold text-text-primary text-center"
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
                  <Text className="text-xl font-semibold text-text-muted">/</Text>
                  <View className="flex-1 bg-surface rounded-2xl border border-border h-[54px] justify-center shadow-subtle">
                    <TextInput
                      ref={monthRef}
                      className="text-base font-semibold text-text-primary text-center"
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
                  <Text className="text-xl font-semibold text-text-muted">/</Text>
                  <View className="flex-[1.5] bg-surface rounded-2xl border border-border h-[54px] justify-center shadow-subtle">
                    <TextInput
                      ref={yearRef}
                      className="text-base font-semibold text-text-primary text-center"
                      placeholder="YYYY"
                      placeholderTextColor={theme.colors.textMuted}
                      keyboardType="number-pad"
                      maxLength={4}
                      value={dobYear}
                      onChangeText={setDobYear}
                    />
                  </View>
                </View>
                <Text className="text-xs text-text-muted mt-2.5">
                  You must be at least 18 years old to join Voymate.
                </Text>
              </View>
            )}

            {/* SUB-STEP 3: LOCATION */}
            {currentSubStep === 3 && (
              <View className="pt-2.5">
                <View className="mb-6">
                  <Text className="text-[26px] font-medium text-text-primary tracking-tight">
                    Where is home?
                  </Text>
                  <Text className="text-sm text-text-secondary mt-1.5 leading-5">
                    Let other travelers know where you're starting your journeys from.
                  </Text>
                </View>

                {/* Use Current Location Quick Action */}
                <TouchableOpacity
                  className="flex-row items-center bg-surface py-3.5 px-4 rounded-2xl border border-border shadow-subtle"
                  onPress={handleUseCurrentLocation}
                  disabled={locating}
                  activeOpacity={0.8}
                >
                  <View className="w-[38px] h-[38px] rounded-full bg-surface-subtle items-center justify-center mr-3.5">
                    {locating ? (
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                    ) : (
                      <LocationIcon size={18} color={theme.colors.primary} />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-[15px] font-semibold text-primary">
                      {locating ? 'Detecting your location...' : 'Use current location'}
                    </Text>
                    <Text className="text-xs text-text-muted mt-0.5">
                      Auto-detects country, region & city via GPS
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Divider */}
                <View className="flex-row items-center my-4 gap-3 py-1">
                  <View className="flex-1 h-[1px] bg-border-subtle" />
                  <Text className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                    or select from list
                  </Text>
                  <View className="flex-1 h-[1px] bg-border-subtle" />
                </View>

                {/* Country Dropdown */}
                <View className="mt-1">
                  <Text className="text-sm font-semibold text-text-primary mb-2.5">Country / Nationality</Text>
                  <TouchableOpacity
                    className="flex-row items-center bg-surface rounded-2xl border border-border px-4 h-[54px] shadow-subtle"
                    onPress={() => setCountryModalVisible(true)}
                    activeOpacity={0.7}
                  >
                    <Globe size={18} color={theme.colors.textMuted} className="mr-3" />
                    <Text
                      className={cn(
                        'flex-1 text-[15px] text-text-primary font-medium',
                        !nationality && 'text-text-muted font-normal'
                      )}
                      numberOfLines={1}
                    >
                      {nationality || 'Select your country'}
                    </Text>
                    <ChevronDown size={18} color={theme.colors.textMuted} />
                  </TouchableOpacity>

                  {/* State Dropdown */}
                  <Text className="text-sm font-semibold text-text-primary mb-2.5 mt-4">State / Region</Text>
                  <TouchableOpacity
                    className={cn(
                      'flex-row items-center bg-surface rounded-2xl border border-border px-4 h-[54px] shadow-subtle',
                      !selectedCountryCode && 'opacity-55 bg-surface-subtle'
                    )}
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
                    <MapPin size={18} color={theme.colors.textMuted} className="mr-3" />
                    <Text
                      className={cn(
                        'flex-1 text-[15px] text-text-primary font-medium',
                        !stateName && 'text-text-muted font-normal'
                      )}
                      numberOfLines={1}
                    >
                      {stateName || (selectedCountryCode ? 'Select region / state' : 'Select country first')}
                    </Text>
                    <ChevronDown size={18} color={theme.colors.textMuted} />
                  </TouchableOpacity>

                  {/* City Dropdown */}
                  <Text className="text-sm font-semibold text-text-primary mb-2.5 mt-4">City</Text>
                  <TouchableOpacity
                    className={cn(
                      'flex-row items-center bg-surface rounded-2xl border border-border px-4 h-[54px] shadow-subtle',
                      !stateName && 'opacity-55 bg-surface-subtle'
                    )}
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
                    <MapPin size={18} color={theme.colors.textMuted} className="mr-3" />
                    <Text
                      className={cn(
                        'flex-1 text-[15px] text-text-primary font-medium',
                        !cityName && 'text-text-muted font-normal'
                      )}
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
              <View className="pt-2.5">
                <View className="mb-6">
                  <Text className="text-[26px] font-medium text-text-primary tracking-tight">
                    Skills & Languages
                  </Text>
                  <Text className="text-sm text-text-secondary mt-1.5 leading-5">
                    Select your travel skills and the languages you speak.
                  </Text>
                </View>

                {/* Skills Section */}
                <Text className="text-sm font-semibold text-text-primary mb-2.5">
                  Travel Skills (Tap to select)
                </Text>
                <View className="flex-row flex-wrap gap-2 mb-3">
                  {POPULAR_SKILLS.map((skill) => {
                    const isSelected = selectedSkills.includes(skill);
                    return (
                      <TouchableOpacity
                        key={skill}
                        className={cn(
                          'flex-row items-center py-2.5 px-4 rounded-full bg-surface border border-border shadow-subtle',
                          isSelected && 'bg-primary border-primary'
                        )}
                        onPress={() => toggleSkill(skill)}
                        activeOpacity={0.7}
                      >
                        {isSelected && <Check size={14} color={theme.colors.white} style={{ marginRight: 4 }} />}
                        <Text className={cn(
                          'text-[13px] font-medium text-text-primary',
                          isSelected && 'text-white font-semibold'
                        )}>
                          {skill}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Custom Skill Input */}
                <View className="flex-row items-center gap-2">
                  <TextInput
                    className="flex-1 bg-surface rounded-xl border border-border px-3.5 h-[46px] text-[13px] text-text-primary shadow-subtle"
                    placeholder="Add custom skill..."
                    placeholderTextColor={theme.colors.textMuted}
                    value={customSkill}
                    onChangeText={setCustomSkill}
                    onSubmitEditing={handleAddCustomSkill}
                  />
                  <TouchableOpacity
                    className="w-[46px] h-[46px] rounded-xl bg-primary items-center justify-center shadow-subtle"
                    onPress={handleAddCustomSkill}
                    activeOpacity={0.7}
                  >
                    <Plus size={16} color={theme.colors.white} />
                  </TouchableOpacity>
                </View>

                {/* Languages Section */}
                <Text className="text-sm font-semibold text-text-primary mb-2.5 mt-6">
                  Languages
                </Text>
                <View className="flex-row flex-wrap gap-2 mb-3">
                  {POPULAR_LANGUAGES.map((lang) => {
                    const isSelected = selectedLanguages.includes(lang);
                    return (
                      <TouchableOpacity
                        key={lang}
                        className={cn(
                          'flex-row items-center py-2.5 px-4 rounded-full bg-surface border border-border shadow-subtle',
                          isSelected && 'bg-primary border-primary'
                        )}
                        onPress={() => toggleLanguage(lang)}
                        activeOpacity={0.7}
                      >
                        {isSelected && <Check size={14} color={theme.colors.white} style={{ marginRight: 4 }} />}
                        <Text className={cn(
                          'text-[13px] font-medium text-text-primary',
                          isSelected && 'text-white font-semibold'
                        )}>
                          {lang}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Custom Language Input */}
                <View className="flex-row items-center gap-2">
                  <TextInput
                    className="flex-1 bg-surface rounded-xl border border-border px-3.5 h-[46px] text-[13px] text-text-primary shadow-subtle"
                    placeholder="Add another language..."
                    placeholderTextColor={theme.colors.textMuted}
                    value={customLanguage}
                    onChangeText={setCustomLanguage}
                    onSubmitEditing={handleAddCustomLanguage}
                  />
                  <TouchableOpacity
                    className="w-[46px] h-[46px] rounded-xl bg-primary items-center justify-center shadow-subtle"
                    onPress={handleAddCustomLanguage}
                    activeOpacity={0.7}
                  >
                    <Plus size={16} color={theme.colors.white} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Floating Bottom Action Bar */}
          <View className="absolute bottom-0 left-0 right-0 bg-background px-6 pt-3 pb-6 border-t border-border-subtle">
            {currentSubStep < TOTAL_SUBSTEPS - 1 ? (
              <Button
                title="Continue"
                variant="primary"
                size="lg"
                onPress={handleNextSubStep}
                className="rounded-2xl h-[54px] shadow-card"
              />
            ) : (
              <Button
                title="Save Profile & Continue"
                variant="primary"
                size="lg"
                loading={loading}
                disabled={loading}
                onPress={handleFinalSubmit}
                className="rounded-2xl h-[54px] shadow-card"
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
