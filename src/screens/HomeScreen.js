import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import useLocation from "../hooks/useLocation";
import { fetchWeather } from "../services/weatherService";
import { getLastWeather } from "../services/localStorage";
import { getRecommendation } from "../services/recommendationService";

export default function HomeScreen() {
  const { location, errorMsg } = useLocation();
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWeather() {
      if (!location && !errorMsg) return;

      try {
        if (location?.coords) {
          const data = await fetchWeather(
            location.coords.latitude,
            location.coords.longitude,
          );
          setWeather(data);
        } else {
          const cached = await getLastWeather();
          if (cached) setWeather(cached);
        }
      } catch (error) {
        console.log("Weather load error:", error.message);
        const cached = await getLastWeather();
        if (cached) setWeather(cached);
      } finally {
        setLoading(false);
      }
    }

    loadWeather();
  }, [location, errorMsg]);

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 40 }} size="large" />;
  }

  const recommendation = weather
    ? getRecommendation(weather.condition, weather.temp)
    : null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Smart City</Text>

      {errorMsg ? <Text>{errorMsg}</Text> : null}

      {weather ? (
        <>
          <View style={styles.card}>
            <Text style={styles.city}>{weather.city}</Text>
            <Text style={styles.temp}>{Math.round(weather.temp)}°C</Text>
            <Text style={styles.condition}>{weather.condition}</Text>
            <Text style={styles.description}>{weather.description}</Text>
          </View>

          {recommendation && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Today’s Recommendation</Text>
              <Text style={styles.label}>What to wear:</Text>
              <Text>{recommendation.clothing}</Text>

              <Text style={styles.label}>What to do:</Text>
              <Text>{recommendation.activity}</Text>
            </View>
          )}
        </>
      ) : (
        <Text>No weather data yet.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
    backgroundColor: "#f7f7f7",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  city: {
    fontSize: 24,
    fontWeight: "700",
  },
  temp: {
    fontSize: 44,
    fontWeight: "700",
    marginVertical: 8,
  },
  condition: {
    fontSize: 18,
    fontWeight: "600",
  },
  description: {
    fontSize: 16,
    color: "#555",
    marginTop: 4,
    textTransform: "capitalize",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  label: {
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 4,
  },
});
