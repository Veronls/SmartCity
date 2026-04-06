import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import WeekCalendar from "../components/WeekCalendar";
import PlannerEventCard from "../components/PlannerEventCard";
import AddEventModal from "../components/AddEventModal";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../components/ThemeContext";
import {
  addWeeks,
  formatDateKey,
  getStartOfWeek,
  getWeekDates,
  sortEventsByTime,
} from "../services/calendarUtils";
import {
  addPlannerEvent,
  cacheWeekPlannerEntries,
  deletePlannerEvent,
  getCachedWeekPlannerEntries,
  getPlannerEntry,
  getSavedPlacesForPlanner,
  getWeekPlannerEntries,
  updateJournal,
  updatePlannerEvent,
} from "../services/plannerService";
import { fetchForecastForDate } from "../services/weatherService";
import { getRecommendation } from "../services/recommendationService";
import useLocation from "../hooks/useLocation";

export default function PlannerScreen() {
  const { location } = useLocation();

  const [weekBaseDate, setWeekBaseDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekEntries, setWeekEntries] = useState({});
  const [loading, setLoading] = useState(true);
  const [weekSwitching, setWeekSwitching] = useState(false);

  const [dayEntry, setDayEntry] = useState(null);
  const [dayWeather, setDayWeather] = useState(null);

  const [journalText, setJournalText] = useState("");
  const [journalPhotos, setJournalPhotos] = useState([]);

  const [savedPlaces, setSavedPlaces] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [savingJournal, setSavingJournal] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);

  const weekDates = useMemo(() => getWeekDates(weekBaseDate), [weekBaseDate]);
  const selectedDateKey = formatDateKey(selectedDate);
  const hasLoadedInitially = useRef(false);
  const manualDateJumpRef = useRef(false);
  
  

  useEffect(() => {
    async function loadWeekData() {
      try {
        const isInitialLoad = !hasLoadedInitially.current;

        if (isInitialLoad) {
          setLoading(true);
        } else {
          setWeekSwitching(true);
        }

        const cached = await getCachedWeekPlannerEntries(weekDates);
        if (cached) {
          setWeekEntries(cached);
        }

        const fresh = await getWeekPlannerEntries(weekDates);
        setWeekEntries(fresh);
        await cacheWeekPlannerEntries(weekDates, fresh);

        hasLoadedInitially.current = true;
      } catch (error) {
        console.log("Planner week load error:", error.message);
      } finally {
        setLoading(false);
        setWeekSwitching(false);
      }
    }

    loadWeekData();
  }, [weekBaseDate]);

  useEffect(() => {
    async function loadDayData() {
      try {
        const entry =
          weekEntries[selectedDateKey] || (await getPlannerEntry(selectedDate));
        setDayEntry(entry);
        setJournalText(entry.journalText || "");
        setJournalPhotos(entry.journalPhotos || []);
      } catch (error) {
        console.log("Planner day load error:", error.message);
      }
    }

    loadDayData();
  }, [weekEntries, selectedDateKey, selectedDate]);

  async function loadSavedPlaces() {
    try {
      const places = await getSavedPlacesForPlanner();
      setSavedPlaces(places);
    } catch (error) {
      console.log("Planner saved places load error:", error.message);
    }
  }

  useEffect(() => {
    loadSavedPlaces();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSavedPlaces();
    }, []),
  );

  useEffect(() => {
    if (modalVisible) {
      loadSavedPlaces();
    }
  }, [modalVisible]);

  useEffect(() => {
    async function loadWeatherForSelectedDay() {
      try {
        if (!location?.coords) {
          setDayWeather(null);
          return;
        }

        const forecast = await fetchForecastForDate(
          location.coords.latitude,
          location.coords.longitude,
          selectedDate,
        );

        setDayWeather(forecast);
      } catch (error) {
        console.log("Planner weather load error:", error.message);
        setDayWeather(null);
      }
    }

    loadWeatherForSelectedDay();
  }, [location, selectedDate]);

  useEffect(() => {
    if (manualDateJumpRef.current) {
      manualDateJumpRef.current = false;
      return;
    }

    const newWeekDates = getWeekDates(weekBaseDate);
    const currentDayIndex =
      selectedDate.getDay() === 0 ? 6 : selectedDate.getDay() - 1;
    setSelectedDate(newWeekDates[currentDayIndex]);
  }, [weekBaseDate]);

  function handleCalendarChange(event, pickedDate) {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    if (!pickedDate) return;

    manualDateJumpRef.current = true;
    setSelectedDate(pickedDate);
    setWeekBaseDate(getStartOfWeek(pickedDate));
  }

  async function handleAddOrUpdateEvent(event) {
    try {
      let updated;

      if (editingEvent) {
        updated = await updatePlannerEvent(selectedDate, event);
      } else {
        updated = await addPlannerEvent(selectedDate, event);
      }

      setWeekEntries((prev) => ({
        ...prev,
        [selectedDateKey]: updated,
      }));

      setDayEntry(updated);
      setEditingEvent(null);
      setModalVisible(false);
    } catch (error) {
      Alert.alert("Save failed", error.message);
    }
  }

  async function handleDeleteEvent(eventId) {
    try {
      const updated = await deletePlannerEvent(selectedDate, eventId);

      setWeekEntries((prev) => ({
        ...prev,
        [selectedDateKey]: updated,
      }));

      setDayEntry(updated);
    } catch (error) {
      Alert.alert("Delete failed", error.message);
    }
  }

  async function handleSaveJournal() {
    try {
      setSavingJournal(true);

      const updated = await updateJournal(
        selectedDate,
        journalText,
        journalPhotos,
      );

      setWeekEntries((prev) => ({
        ...prev,
        [selectedDateKey]: updated,
      }));

      setDayEntry(updated);
      Alert.alert("Saved", "Journal saved successfully.");
    } catch (error) {
      Alert.alert("Save failed", error.message);
    } finally {
      setSavingJournal(false);
    }
  }

  async function handlePickJournalPhoto() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled) {
        setJournalPhotos((prev) => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      Alert.alert("Photo error", error.message);
    }
  }

  async function handleTakeJournalPhoto() {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Permission denied", "Camera access is required.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled) {
        setJournalPhotos((prev) => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      Alert.alert("Camera error", error.message);
    }
  }

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 40 }} size="large" />;
  }

  const sortedEvents = sortEventsByTime(dayEntry?.events || []);
  const recommendation =
    dayWeather && selectedDate
      ? getRecommendation(dayWeather.condition, dayWeather.temp, selectedDate)
      : null;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>Weekly Planner</Text>
            <Text style={styles.selectedDateText}>
              {selectedDate.toLocaleDateString([], {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </Text>
          </View>

          <View style={styles.titleActions}>
            {weekSwitching ? <ActivityIndicator size="small" /> : null}

            <TouchableOpacity
              style={styles.calendarButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.calendarButtonText}>
                <Image
                  source={require("../images/calender.png")}
                  style={styles.calendarIcon}
                />
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {showDatePicker && (
          <View style={styles.datePickerOverlay}>
            <View style={styles.datePickerContainer}>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "default"}
                onChange={handleCalendarChange}
              />

              {/* Close button (important for iOS) */}
              {Platform.OS === "ios" && (
                <TouchableOpacity
                  style={styles.closePickerButton}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.closePickerText}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        <WeekCalendar
          weekDates={weekDates}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onPreviousWeek={() => setWeekBaseDate((prev) => addWeeks(prev, -1))}
          onNextWeek={() => setWeekBaseDate((prev) => addWeeks(prev, 1))}
        />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Day Overview</Text>

          {dayWeather ? (
            <>
              <Text style={styles.weatherLine}>
                {dayWeather.city} • {Math.round(dayWeather.temp)}°C •{" "}
                {dayWeather.condition}
              </Text>
              <Text style={styles.description}>{dayWeather.description}</Text>
            </>
          ) : (
            <Text style={styles.description}>Forecast not available.</Text>
          )}

          {recommendation ? (
            <>
              <Text style={styles.sectionLabel}>Suggested clothing</Text>
              <Text style={styles.bodyText}>{recommendation.clothing}</Text>

              <Text style={styles.sectionLabel}>Suggested activity</Text>
              <Text style={styles.bodyText}>{recommendation.activity}</Text>

              <Text style={styles.sectionLabel}>Mood</Text>
              <Text style={styles.bodyText}>{recommendation.mood}</Text>
            </>
          ) : (
            <Text style={styles.bodyText}>
              Forecast-based recommendations are not available for this day.
            </Text>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Daily Timeline</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              setEditingEvent(null);
              setModalVisible(true);
            }}
          >
            <Text style={styles.addButtonText}>Add Event</Text>
          </TouchableOpacity>
        </View>

        {sortedEvents.length ? (
          sortedEvents.map((event) => (
            <PlannerEventCard
              key={event.id}
              event={event}
              onEdit={(item) => {
                setEditingEvent(item);
                setModalVisible(true);
              }}
              onDelete={handleDeleteEvent}
            />
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No events planned yet.</Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Daily Journal</Text>

          <TextInput
            style={styles.journalInput}
            placeholder="Write about your day..."
            placeholderTextColor="#777"
            multiline
            value={journalText}
            onChangeText={setJournalText}
          />

          <View style={styles.journalButtonRow}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handlePickJournalPhoto}
            >
              <Text style={styles.secondaryButtonText}>Pick Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleTakeJournalPhoto}
            >
              <Text style={styles.secondaryButtonText}>Camera</Text>
            </TouchableOpacity>
          </View>

          {journalPhotos.length ? (
            <FlatList
              horizontal
              data={journalPhotos}
              keyExtractor={(item, index) => `${item}_${index}`}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, marginTop: 12 }}
              renderItem={({ item }) => (
                <Image source={{ uri: item }} style={styles.journalPhoto} />
              )}
            />
          ) : null}

          <TouchableOpacity
            style={styles.saveJournalButton}
            onPress={handleSaveJournal}
            disabled={savingJournal}
          >
            <Text style={styles.saveJournalButtonText}>
              {savingJournal ? "Saving..." : "Save Journal"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <AddEventModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingEvent(null);
        }}
        onSave={handleAddOrUpdateEvent}
        savedPlaces={savedPlaces}
        editingEvent={editingEvent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },
  container: {
    padding: 16,
    paddingTop: 40,
    paddingBottom: 30,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  titleActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  selectedDateText: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  calendarButton: {
    backgroundColor: "black",
    borderRadius: 12,
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarButtonText: {
    fontSize: 20,
    color: "white",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  weatherLine: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  description: {
    color: "#666",
    marginBottom: 8,
    textTransform: "capitalize",
  },
  sectionLabel: {
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 4,
  },
  bodyText: {
    color: "#333",
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  addButton: {
    backgroundColor: "#222",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addButtonText: {
    color: "white",
    fontWeight: "700",
  },
  emptyCard: {
    backgroundColor: "#ececec",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  emptyText: {
    color: "#666",
  },
  journalInput: {
    minHeight: 120,
    backgroundColor: "#f3f3f3",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlignVertical: "top",
    color: "#222",
  },
  journalButtonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  secondaryButton: {
    backgroundColor: "#ececec",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    fontWeight: "600",
    color: "#222",
  },
  journalPhoto: {
    width: 110,
    height: 110,
    borderRadius: 12,
  },
  saveJournalButton: {
    backgroundColor: "#222",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  saveJournalButtonText: {
    color: "white",
    fontWeight: "700",
  },
  calendarIcon: {
    width: 32,
    height: 32,
    paddingTop: 5,
  },
  datePickerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },

  datePickerContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    width: "90%",
    alignItems: "center",
  },

  closePickerButton: {
    marginTop: 10,
    backgroundColor: "#222",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },

  closePickerText: {
    color: "white",
    fontWeight: "600",
  },
});
