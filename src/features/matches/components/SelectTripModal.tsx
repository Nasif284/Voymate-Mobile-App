import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import { theme } from '../../../config/theme';
import { ActiveTrip } from '../types';
import { X, Luggage, Calendar, Check, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { cn } from '../../../utils/cn';

interface SelectTripModalProps {
  visible: boolean;
  trips: ActiveTrip[];
  selectedTripId?: string;
  onClose: () => void;
  onSelectTrip: (trip: ActiveTrip) => void;
  onPlanNewTrip?: () => void;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
};

export const SelectTripModal: React.FC<SelectTripModalProps> = ({
  visible,
  trips,
  selectedTripId,
  onClose,
  onSelectTrip,
  onPlanNewTrip,
}) => {
  const handleSelect = (trip: ActiveTrip) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectTrip(trip);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 bg-black/50 justify-end">
          <TouchableWithoutFeedback>
            <View className="bg-surface rounded-t-[28px] max-h-[75%] pt-5 pb-8 shadow-floating">
              {/* Header */}
              <View className="flex-row justify-between items-center px-5 pb-4 border-b border-border">
                <View>
                  <Text className="text-lg font-semibold text-text-primary tracking-tight">
                    Your Travel Plans
                  </Text>
                  <Text className="text-xs text-text-muted mt-0.5">
                    Select a trip to view matching companions
                  </Text>
                </View>
                <TouchableOpacity
                  className="p-1.5 bg-surface-subtle rounded-full"
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={18} color={theme.colors.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Trips List */}
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, gap: 10 }}
              >
                {trips.length === 0 ? (
                  <View className="p-8 items-center">
                    <Luggage size={32} color={theme.colors.primary} />
                    <Text className="text-base font-semibold text-text-primary mt-2.5">
                      No Upcoming Trips
                    </Text>
                    <Text className="text-xs text-text-muted text-center mt-1">
                      Create a trip plan to start matching with travel mates.
                    </Text>
                  </View>
                ) : (
                  trips.map((trip) => {
                    const isSelected = trip.id === selectedTripId;
                    const destinationName =
                      trip.destination?.name ||
                      trip.destination?.city ||
                      trip.name;
                    const dateStr =
                      trip.dateFrom && trip.dateTo
                        ? `${formatDate(trip.dateFrom)} - ${formatDate(trip.dateTo)}`
                        : '';

                    return (
                      <TouchableOpacity
                        key={trip.id}
                        className={cn(
                          'flex-row items-center justify-between bg-surface rounded-2xl border border-border p-3.5 shadow-subtle',
                          isSelected && 'bg-primary-mist border-primary'
                        )}
                        onPress={() => handleSelect(trip)}
                        activeOpacity={0.8}
                      >
                        <View className="flex-row items-center flex-1 gap-3">
                          <View
                            className={cn(
                              'w-10 h-10 rounded-full bg-surface-subtle items-center justify-center',
                              isSelected && 'bg-primary'
                            )}
                          >
                            <Luggage
                              size={16}
                              color={isSelected ? theme.colors.white : theme.colors.primary}
                            />
                          </View>
                          <View className="flex-1">
                            <Text className="text-sm font-semibold text-text-primary" numberOfLines={1}>
                              {trip.name || destinationName}
                            </Text>
                            <Text className="text-xs text-text-secondary mt-0.5" numberOfLines={1}>
                              📍 {destinationName}
                            </Text>
                            {dateStr ? (
                              <View className="flex-row items-center gap-1 mt-1">
                                <Calendar size={11} color={theme.colors.textMuted} />
                                <Text className="text-[11px] text-text-muted font-medium">{dateStr}</Text>
                              </View>
                            ) : null}
                          </View>
                        </View>

                        {isSelected && (
                          <View className="flex-row items-center bg-primary py-1 px-2 rounded-lg gap-1">
                            <Check size={13} color={theme.colors.white} />
                            <Text className="text-[10px] font-semibold text-white">Active</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>

              {/* Bottom Action: Plan New Trip */}
              {onPlanNewTrip && (
                <View className="px-5 pt-2.5">
                  <TouchableOpacity
                    className="flex-row items-center justify-center bg-primary py-3.5 rounded-2xl gap-1.5 shadow-card"
                    onPress={() => {
                      onClose();
                      onPlanNewTrip();
                    }}
                    activeOpacity={0.85}
                  >
                    <Plus size={16} color={theme.colors.white} />
                    <Text className="text-sm font-semibold text-white">Create Travel Plan</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
